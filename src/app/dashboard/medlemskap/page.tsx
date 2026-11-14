import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CheckCircle2, Info } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrganizations, requireUser } from "@/lib/auth";
import { hasAccess, membershipEnforced } from "@/lib/membership";
import type { Organization } from "@/lib/types";
import { isBillingConfigured, syncCheckoutSession } from "@/server/billing";
import { MembershipCard } from "./membership-card";

export const metadata: Metadata = { title: "Medlemskap" };

export default function MembershipPage({ searchParams }: PageProps<"/dashboard/medlemskap">) {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Medlemskap</h1>
        <p className="text-muted-foreground">Medlemskapet gir organisasjonen tilgang til å lage arrangementer.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 rounded-2xl" />}>
        <MembershipLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

async function MembershipLoader({ searchParams }: Pick<PageProps<"/dashboard/medlemskap">, "searchParams">) {
  const [query, { supabase }, initial] = await Promise.all([searchParams, requireUser(), getOrganizations()]);
  let organizations = initial;

  // Back from Stripe Checkout: activate straight away rather than waiting for the webhook.
  const sessionId = first(query.session_id);
  let justPaid: Organization | undefined;
  if (first(query.betalt) === "1" && sessionId && isBillingConfigured()) {
    try {
      const paidFor = await syncCheckoutSession(sessionId);
      // Only confirm for an organization the signed-in user actually belongs to.
      if (paidFor && organizations.some((o) => o.id === paidFor)) {
        const { data } = await supabase.from("organizations").select("*").order("created_at", { ascending: true });
        if (data) organizations = data as Organization[];
        justPaid = organizations.find((o) => o.id === paidFor);
      }
    } catch (error) {
      // The webhook will still activate the membership; the page just shows the current state.
      console.error("Kunne ikke bekrefte betalingen ved retur fra Stripe:", error);
    }
  }

  if (organizations.length === 0) {
    return (
      <Notice>
        Opprett organisasjonen først.{" "}
        <Link href="/dashboard" className="font-medium text-primary hover:underline">
          Gå til oversikten
        </Link>
      </Notice>
    );
  }

  if (!membershipEnforced(organizations)) {
    return <Notice>Medlemskap er ikke tatt i bruk ennå. Alle organisasjoner har full tilgang.</Notice>;
  }

  return (
    <div className="space-y-4">
      {justPaid && hasAccess(justPaid) && (
        <div className="space-y-3 rounded-2xl bg-success-muted p-5">
          <p className="flex items-start gap-2 font-medium">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
            Takk! Betalingen er mottatt, og medlemskapet for {justPaid.name} er aktivt.
          </p>
          <Link href="/dashboard/events/new" className={buttonVariants({ size: "lg" })}>
            Lag et arrangement <ArrowRight />
          </Link>
        </div>
      )}
      {first(query.betalt) === "1" && !justPaid && (
        <Notice>
          Betalingen behandles. Medlemskapet blir aktivt i løpet av kort tid. Last inn siden på nytt om et øyeblikk.
        </Notice>
      )}
      {first(query.avbrutt) === "1" && <Notice>Betalingen ble avbrutt. Ingenting er trukket.</Notice>}

      {organizations.map((organization) => (
        <MembershipCard key={organization.id} organization={organization} showName={organizations.length > 1} />
      ))}
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-2xl bg-card p-4 text-sm ring-1 ring-foreground/10">
      <Info className="mt-0.5 size-4 shrink-0 text-primary" />
      <span>{children}</span>
    </p>
  );
}
