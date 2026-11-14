import type { Organization } from "@/lib/types";

/** The paid membership an organization needs to create events. */
export const MEMBERSHIP = {
  name: "Medlemskap",
  priceNok: 499,
  priceLabel: "499 kr per år",
} as const;

/** Slack after a period ends, while Stripe collects the renewal. Same as org_has_access() in the database. */
export const ACCESS_GRACE_DAYS = 3;

/**
 * Whether the organization may create events.
 *
 * `access_until` is `undefined` (not `null`) when the database has not got the
 * membership columns yet (20261114000000_membership migration). Then nothing
 * is enforced anywhere, so everyone has access.
 */
export function hasAccess(org: Pick<Organization, "access_until">, now = Date.now()): boolean {
  if (org.access_until === undefined) return true;
  if (!org.access_until) return false;
  return new Date(org.access_until).getTime() + ACCESS_GRACE_DAYS * 86_400_000 > now;
}

/** True when the paywall is switched on in the database. */
export function membershipEnforced(organizations: Pick<Organization, "access_until">[]): boolean {
  return organizations.some((o) => o.access_until !== undefined);
}

export type MembershipState = "none" | "active" | "ending" | "past_due" | "expired";

export function membershipState(
  org: Pick<Organization, "access_until" | "subscription_status" | "cancel_at_period_end">,
  now = Date.now(),
): MembershipState {
  if (!org.access_until) return "none";
  if (!hasAccess(org, now)) return "expired";
  if (org.subscription_status === "past_due") return "past_due";
  if (org.cancel_at_period_end || org.subscription_status === "canceled") return "ending";
  return "active";
}

export function formatAccessDate(iso: string): string {
  return new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Oslo" }).format(
    new Date(iso),
  );
}
