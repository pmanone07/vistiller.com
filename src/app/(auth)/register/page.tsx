import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "../auth-card";
import { RedirectIfSignedIn } from "../redirect-if-signed-in";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Opprett konto" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Opprett konto"
      subtitle="Medlemskap koster 499 kr per år for organisasjonen. Deltakerne betaler ingenting."
      footer={
        <>
          Har du allerede konto?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Logg inn
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <RegisterForm />
    </AuthCard>
  );
}
