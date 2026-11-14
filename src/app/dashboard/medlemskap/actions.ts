"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { GENERIC_ERROR } from "@/lib/errors";
import { hasAccess } from "@/lib/membership";
import type { ActionResult, Organization } from "@/lib/types";
import { createCheckoutUrl, createPortalUrl, isBillingConfigured } from "@/server/billing";

const NOT_CONFIGURED = "Betaling er ikke satt opp ennå. Prøv igjen senere.";

/** Reads the organization as the signed-in user, so RLS proves membership before any Stripe call. */
async function ownOrganization(organizationId: string) {
  if (!z.uuid().safeParse(organizationId).success) return null;
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("organizations").select("*").eq("id", organizationId).maybeSingle();
  if (error || !data) return null;
  return { organization: data as Organization, user };
}

/** Sends the organizer to Stripe Checkout to buy a yearly membership. Redirects on success. */
export async function startCheckout(organizationId: string): Promise<ActionResult> {
  const own = await ownOrganization(organizationId);
  if (!own) return { ok: false, error: "Fant ikke organisasjonen." };
  if (!isBillingConfigured()) return { ok: false, error: NOT_CONFIGURED };

  const { organization, user } = own;
  // Already paying: never sell a second subscription for the same organization.
  const paying =
    organization.access_until != null &&
    hasAccess(organization) &&
    organization.subscription_status !== "canceled" &&
    !organization.cancel_at_period_end;
  if (paying) return { ok: false, error: "Organisasjonen har allerede et aktivt medlemskap." };

  let url: string;
  try {
    url = await createCheckoutUrl(organization.id, user.email);
  } catch (error) {
    console.error("Kunne ikke starte Stripe Checkout:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
  redirect(url);
}

/** Sends the organizer to Stripe's customer portal (cancel, change card, receipts). Redirects on success. */
export async function openBillingPortal(organizationId: string): Promise<ActionResult> {
  const own = await ownOrganization(organizationId);
  if (!own) return { ok: false, error: "Fant ikke organisasjonen." };
  if (!isBillingConfigured()) return { ok: false, error: NOT_CONFIGURED };

  let url: string | null;
  try {
    url = await createPortalUrl(own.organization.id);
  } catch (error) {
    console.error("Kunne ikke åpne Stripe kundeportal:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
  if (!url) return { ok: false, error: "Organisasjonen har ikke noe medlemskap å administrere." };
  redirect(url);
}
