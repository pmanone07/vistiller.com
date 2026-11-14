import "server-only";
import Stripe from "stripe";
import { BRAND } from "@/lib/brand";
import { SITE_URL } from "@/lib/env";
import { MEMBERSHIP } from "@/lib/membership";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Stripe billing for the yearly membership. Server only: the Stripe secret key
 * and the Supabase service role never reach the browser.
 *
 * Environment:
 *   STRIPE_SECRET_KEY      – required for checkout and the customer portal
 *   STRIPE_WEBHOOK_SECRET  – required for /api/stripe/webhook
 *   STRIPE_PRICE_ID        – optional; a yearly Price created in the Stripe
 *                            dashboard. Without it the price is sent inline.
 */

export class BillingNotConfiguredError extends Error {
  constructor() {
    super("Stripe er ikke konfigurert. Sett STRIPE_SECRET_KEY.");
  }
}

let stripe: Stripe | null = null;

export function isBillingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new BillingNotConfiguredError();
  stripe ??= new Stripe(key);
  return stripe;
}

const MEMBERSHIP_PATH = "/dashboard/medlemskap";

interface BillingOrganization {
  id: string;
  name: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

async function loadOrganization(organizationId: string): Promise<BillingOrganization | null> {
  const { data, error } = await createAdminClient()
    .from("organizations")
    .select("id, name, stripe_customer_id, stripe_subscription_id")
    .eq("id", organizationId)
    .maybeSingle();
  if (error) throw error;
  return data as BillingOrganization | null;
}

/** The organization's Stripe customer, created the first time it is needed. */
async function ensureCustomer(org: BillingOrganization, email: string | undefined): Promise<string> {
  if (org.stripe_customer_id) return org.stripe_customer_id;
  const customer = await getStripe().customers.create({
    name: org.name,
    email,
    metadata: { organization_id: org.id },
  });
  // Only claim the slot if nobody else did in the meantime (two tabs, two admins).
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organizations")
    .update({ stripe_customer_id: customer.id })
    .eq("id", org.id)
    .is("stripe_customer_id", null)
    .select("stripe_customer_id");
  if (error) throw error;
  if (data && data.length > 0) return customer.id;
  const current = await loadOrganization(org.id);
  return current?.stripe_customer_id ?? customer.id;
}

/**
 * Starts Stripe Checkout for a yearly membership and returns the URL to send
 * the organizer to. The caller must already have verified that the user is a
 * member of the organization.
 */
export async function createCheckoutUrl(organizationId: string, email: string | undefined): Promise<string> {
  const org = await loadOrganization(organizationId);
  if (!org) throw new Error("Fant ikke organisasjonen.");
  const customer = await ensureCustomer(org, email);
  const priceId = process.env.STRIPE_PRICE_ID?.trim();

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: org.id,
    locale: "nb",
    line_items: [
      priceId
        ? { price: priceId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: "nok",
              unit_amount: MEMBERSHIP.priceNok * 100,
              recurring: { interval: "year" },
              // Stripe requires a tax code when Managed Payments is on for the account (SaaS, business use).
              product_data: { name: `${BRAND.name} medlemskap (1 år)`, tax_code: "txcd_10103001" },
            },
          },
    ],
    metadata: { organization_id: org.id },
    subscription_data: { metadata: { organization_id: org.id } },
    success_url: `${SITE_URL}${MEMBERSHIP_PATH}?betalt=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}${MEMBERSHIP_PATH}?avbrutt=1`,
  });
  if (!session.url) throw new Error("Stripe returnerte ingen betalingslenke.");
  return session.url;
}

/** URL to Stripe's customer portal (cancel, change card, receipts), or null if the organization never paid. */
export async function createPortalUrl(organizationId: string): Promise<string | null> {
  const org = await loadOrganization(organizationId);
  if (!org?.stripe_customer_id) return null;
  const session = await getStripe().billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${SITE_URL}${MEMBERSHIP_PATH}`,
    locale: "nb",
  });
  return session.url;
}

/** Statuses where the organization has paid, or Stripe is still retrying the payment. */
const ENTITLED = new Set<Stripe.Subscription.Status>(["active", "trialing", "past_due"]);

function periodEnd(subscription: Stripe.Subscription): number | null {
  const ends = subscription.items.data.map((item) => item.current_period_end).filter((n) => typeof n === "number");
  return ends.length > 0 ? Math.max(...ends) : null;
}

/**
 * Copies a Stripe subscription's state onto its organization. Idempotent, so
 * it is safe to call from the webhook (possibly several times and out of
 * order) and again when the organizer returns from Checkout.
 *
 * Returns false when the subscription does not belong to a known organization.
 */
export async function syncSubscription(subscriptionId: string): Promise<boolean> {
  // Always read the current state from Stripe instead of trusting an event payload that may be stale.
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const organizationId = subscription.metadata?.organization_id;
  if (!organizationId || !/^[0-9a-f-]{36}$/i.test(organizationId)) return false;

  const org = await loadOrganization(organizationId);
  if (!org) return false;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  // The metadata is ours, but never let a subscription pay for an organization it was not bought for.
  if (org.stripe_customer_id !== customerId) return false;

  const entitled = ENTITLED.has(subscription.status);
  // An old or abandoned subscription must not overwrite the one that is currently paying.
  if (!entitled && org.stripe_subscription_id && org.stripe_subscription_id !== subscription.id) return true;
  // A checkout that was never paid: nothing to record.
  if (!entitled && !org.stripe_subscription_id) return true;

  const end = periodEnd(subscription);
  const endsAt = subscription.ended_at ?? subscription.canceled_at;
  const accessUntil = entitled
    ? end
    : // Ended: access stops when the subscription did, never later than the paid period.
      Math.min(end ?? Infinity, endsAt ?? Math.floor(Date.now() / 1000));

  const { error } = await createAdminClient()
    .from("organizations")
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      access_until: accessUntil ? new Date(accessUntil * 1000).toISOString() : null,
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end || subscription.cancel_at),
      plan: entitled ? "pro" : "free",
    })
    .eq("id", org.id);
  if (error) throw error;
  return true;
}

/**
 * Called when the organizer lands back on the membership page after paying.
 * Activates the membership right away instead of waiting for the webhook.
 * Returns the organization the session was for, or null if it is not paid.
 */
export async function syncCheckoutSession(sessionId: string): Promise<string | null> {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return null;
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.status !== "complete" || !session.subscription) return null;
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
  const synced = await syncSubscription(subscriptionId);
  return synced ? (session.client_reference_id ?? null) : null;
}
