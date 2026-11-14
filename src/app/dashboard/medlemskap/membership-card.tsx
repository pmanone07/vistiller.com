"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { BadgeCheck, CheckCircle2, CreditCard, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MEMBERSHIP, formatAccessDate, membershipState } from "@/lib/membership";
import type { Organization } from "@/lib/types";
import { openBillingPortal, startCheckout } from "./actions";

const INCLUDED = [
  "Ubegrenset antall arrangementer i ett år",
  "Del lenke og QR-kode med alle deltakere",
  "Deltakerne trenger verken konto eller betaling",
];

/** Membership status for one organization, with the button to pay or manage it. */
export function MembershipCard({ organization, showName = true }: { organization: Organization; showName?: boolean }) {
  const [pending, startTransition] = useTransition();
  const state = membershipState(organization);
  const until = organization.access_until ? formatAccessDate(organization.access_until) : null;

  const run = (action: (id: string) => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      // On success the action redirects to Stripe, so we only get a result back on failure.
      const result = await action(organization.id);
      if (result && !result.ok) toast.error(result.error);
    });

  const pay = (label: string) => (
    <Button size="xl" className="w-full sm:w-auto" disabled={pending} onClick={() => run(startCheckout)}>
      {pending ? <Loader2 className="animate-spin" /> : <CreditCard />} {label}
    </Button>
  );
  const manage = (label: string) => (
    <Button variant="outline" size="lg" disabled={pending} onClick={() => run(openBillingPortal)}>
      {pending ? <Loader2 className="animate-spin" /> : <CreditCard />} {label}
    </Button>
  );

  return (
    <section className="space-y-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      {showName && <h2 className="font-semibold">{organization.name}</h2>}

      {state === "active" && (
        <>
          <p className="flex items-start gap-2 text-sm">
            <BadgeCheck className="mt-0.5 size-5 shrink-0 text-success" />
            <span>
              <span className="font-medium">Aktivt medlemskap.</span> Fornyes automatisk {until} for {MEMBERSHIP.priceNok} kr.
            </span>
          </p>
          {manage("Administrer eller si opp")}
        </>
      )}

      {state === "ending" && (
        <>
          <p className="flex items-start gap-2 text-sm">
            <BadgeCheck className="mt-0.5 size-5 shrink-0 text-success" />
            <span>
              <span className="font-medium">Medlemskapet er sagt opp</span> og gjelder til {until}. Det fornyes ikke.
            </span>
          </p>
          {manage("Administrer medlemskapet")}
        </>
      )}

      {state === "past_due" && (
        <>
          <p className="flex items-start gap-2 text-sm">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warm" />
            <span>
              <span className="font-medium">Fornyelsen kunne ikke belastes.</span> Oppdater betalingskortet for å beholde
              medlemskapet.
            </span>
          </p>
          {manage("Oppdater betalingskort")}
        </>
      )}

      {(state === "none" || state === "expired") && (
        <>
          <div>
            <p className="text-3xl font-bold tracking-tight">
              {MEMBERSHIP.priceNok} kr <span className="text-base font-medium text-muted-foreground">per år</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {state === "expired"
                ? `Medlemskapet utløp ${until}. Arrangementene deres ligger der fortsatt, men dere må fornye for å lage nye.`
                : "Medlemskapet gjelder hele organisasjonen og fornyes automatisk hvert år til dere sier det opp."}
            </p>
          </div>
          <ul className="space-y-1.5 text-sm">
            {INCLUDED.map((line) => (
              <li key={line} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> {line}
              </li>
            ))}
          </ul>
          {pay(state === "expired" ? "Forny medlemskapet" : "Betal og kom i gang")}
          <p className="text-xs text-muted-foreground">Sikker betaling med kort hos Stripe. Si opp når som helst.</p>
        </>
      )}
    </section>
  );
}
