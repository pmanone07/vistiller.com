"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MEMBERSHIP } from "@/lib/membership";
import { createOrganization } from "./actions";
import { startCheckout } from "./medlemskap/actions";

/** First step after signup: name the organization (team, class, association …). */
export function Onboarding({ defaultName, payment = false }: { defaultName: string; payment?: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result = await createOrganization(name);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (payment) {
        // Straight on to Stripe Checkout; the action redirects there when it succeeds.
        const checkout = await startCheckout(result.data.id);
        if (checkout && !checkout.ok) {
          // The organization exists, so let the organizer pay from the membership page instead.
          toast.error(checkout.error);
          router.push("/dashboard/medlemskap");
        }
        return;
      }
      toast.success("Da er dere i gang!");
      router.push("/dashboard/events/new");
    });
  }

  return (
    <div className="mx-auto max-w-md space-y-6 pt-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-muted">
          <Users className="size-7 text-primary" />
        </div>
        <p className="text-sm font-medium text-primary">Steg 1 av 2</p>
        <h1 className="text-2xl font-bold tracking-tight">Hvem arrangerer?</h1>
        <p className="text-muted-foreground">Navnet på laget, klassen eller foreningen vises øverst på listene dere deler.</p>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="space-y-1.5">
          <Label htmlFor="org-name">Navn på lag, klasse eller forening</Label>
          <Input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="F.eks. FAU Solberg skole"
            maxLength={100}
            required
            autoFocus
            aria-invalid={Boolean(error)}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <Button type="submit" size="xl" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {payment ? "Fortsett til betaling" : "Fortsett"} <ArrowRight />
        </Button>
        {payment && (
          <p className="text-center text-sm text-muted-foreground">
            Medlemskapet koster {MEMBERSHIP.priceLabel} og betales trygt med kort hos Stripe.
          </p>
        )}
      </form>
    </div>
  );
}
