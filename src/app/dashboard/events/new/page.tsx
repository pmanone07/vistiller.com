import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrganizations } from "@/lib/auth";
import { hasAccess } from "@/lib/membership";
import { MembershipCard } from "../../medlemskap/membership-card";
import { EventForm } from "../event-form";

export const metadata: Metadata = { title: "Nytt arrangement" };

const cardClass = "rounded-2xl bg-card p-5 ring-1 ring-foreground/10";

export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Arrangementer
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Nytt arrangement</h1>
        <p className="text-muted-foreground">Etterpå legger du inn oppgaver og bidrag, og deler lenken.</p>
      </div>
      <Suspense
        fallback={
          <div className={cardClass}>
            <FormSkeleton />
          </div>
        }
      >
        <NewEventForm />
      </Suspense>
    </div>
  );
}

async function NewEventForm() {
  const organizations = await getOrganizations();
  if (organizations.length === 0) redirect("/dashboard");
  const withAccess = organizations.filter((o) => hasAccess(o));
  if (withAccess.length === 0) {
    return (
      <div className="space-y-4">
        <p className="font-medium">Dere trenger et medlemskap for å lage arrangementer.</p>
        {organizations.map((organization) => (
          <MembershipCard key={organization.id} organization={organization} showName={organizations.length > 1} />
        ))}
      </div>
    );
  }
  return (
    <div className={cardClass}>
      <EventForm organizations={withAccess.map(({ id, name }) => ({ id, name }))} />
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
