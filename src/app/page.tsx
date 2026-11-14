import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Baby,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Eye,
  GraduationCap,
  HeartHandshake,
  ListChecks,
  Music,
  PartyPopper,
  QrCode,
  Share2,
  Smartphone,
  Timer,
  Trophy,
  UserCheck,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { StickyPages, type StickyPageItem } from "@/components/ui/sticky-pages";
import { Logo } from "@/components/logo";
import { ItemProgress } from "@/components/item-progress";
import { BRAND } from "@/lib/brand";
import { ITEM_KINDS, type ItemKind } from "@/lib/kinds";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const DEMO_ITEMS: { name: string; kind: ItemKind; time?: string; allocated: number; target: number; unit: string }[] = [
  { name: "Kaker", kind: "bring", allocated: 4, target: 6, unit: "stk" },
  { name: "Kioskvakt", kind: "shift", time: "10:00–12:00", allocated: 1, target: 2, unit: "personer" },
  { name: "Rydding", kind: "task", allocated: 4, target: 4, unit: "personer" },
];

const STEPS = [
  {
    icon: CalendarPlus,
    title: "Opprett et arrangement",
    text: "Gi det et navn, en dato og et sted. Start tomt eller fra en ferdig mal.",
  },
  {
    icon: ListChecks,
    title: "Legg til oppgaver og bidrag",
    text: "Ting å ta med, oppgaver, vakter med klokkeslett og transport, i én og samme liste.",
  },
  {
    icon: Share2,
    title: "Del lenken med deltakerne",
    text: "Send lenken der dere vanligvis snakker sammen, eller heng opp QR-koden.",
  },
  {
    icon: Eye,
    title: "Følg med på hvem som stiller opp",
    text: "Se hvem som har meldt seg på, hva som gjenstår, og kryss av underveis.",
  },
];

const AUDIENCES = [
  {
    icon: GraduationCap,
    title: "Skoler og FAU",
    text: "Skoleavslutninger, forestillinger, kakesalg, klasseturer og skoledugnader.",
  },
  {
    icon: Trophy,
    title: "Idrettslag",
    text: "Cuper og turneringer, kioskvakter, kjøring til kamper og sesongavslutninger.",
  },
  {
    icon: Music,
    title: "Korps og kultur",
    text: "Loppemarkeder, konserter, festivaler, kafé og uniformsdugnader.",
  },
  {
    icon: Baby,
    title: "Barnehager",
    text: "Sommerfester, foreldrekaffe, dugnader og andre fellesarrangementer.",
  },
  {
    icon: HeartHandshake,
    title: "Dugnad og frivillighet",
    text: "Velforeninger, grendelag, nabolagsdugnader og innsamlingsaksjoner.",
  },
  {
    icon: PartyPopper,
    title: "Andre arrangementer",
    text: "Alt der flere skal bidra: sosiale samlinger, jubileer og lokale arrangementer.",
  },
];

const BENEFITS = [
  {
    icon: UserCheck,
    title: "Ingen konto for deltakere",
    text: "De åpner lenken, velger hva de vil bidra med og skriver inn navnet sitt.",
  },
  {
    icon: QrCode,
    title: "Del med lenke eller QR-kode",
    text: "Én lenke til alle. QR-koden kan lastes ned og henges opp.",
  },
  {
    icon: Smartphone,
    title: "Fungerer på mobil",
    text: "Store knapper og få steg. Kan også installeres som app.",
  },
  {
    icon: ListChecks,
    title: "Full oversikt over bidrag",
    text: "Alle ser hva som er dekket og hva som mangler. Listen stopper når behovet er fylt.",
  },
  {
    icon: Timer,
    title: "Mindre administrasjon",
    text: "Slipp regneark og purringer. Deltakerne kan selv endre eller trekke seg med sin egen lenke.",
  },
];

/** Every page after the first slides up over the previous one, like a card. */
const STACKED = "rounded-t-3xl border-t shadow-[0_-12px_40px_-16px_rgb(0_0_0/0.25)]";

/**
 * The landing page as stacked full-screen pages. Each page must fit the screen
 * (a sticky page cannot scroll), so the layouts are compact on small screens.
 * On screens too short for that, `.sticky-pages-fit` in globals.css turns the
 * stacking off and the pages scroll normally.
 */
const PAGES: StickyPageItem[] = [
  { id: "hero", bg: "bg-background", content: <HeroPage /> },
  { id: "steps", bg: "bg-card", className: STACKED, content: <StepsPage /> },
  { id: "audiences", bg: "bg-background", className: STACKED, content: <AudiencesPage /> },
  { id: "benefits", bg: "bg-card", className: STACKED, content: <BenefitsPage /> },
  { id: "cta", bg: "bg-background", className: STACKED, content: <CallToActionPage /> },
];

export default function HomePage() {
  return (
    <main className="flex-1 overflow-x-clip">
      <StickyPages pages={PAGES} pageHeight="100svh" className="sticky-pages-fit" />
    </main>
  );
}

/** Centers a page's content in the space that is left under any header. */
const pageBody = "mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-6 sm:px-6";

function HeroPage() {
  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Logo />
        <nav className="flex items-center gap-2" aria-label="Hovedmeny">
          <Link href="/login" className={buttonVariants({ variant: "ghost", size: "lg" })}>
            Logg inn
          </Link>
          <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "hidden sm:inline-flex")}>
            Kom i gang
          </Link>
        </nav>
      </header>

      <section className={cn(pageBody, "lg:grid lg:grid-cols-2 lg:items-center lg:gap-12")}>
        <div className="space-y-4 sm:space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-muted px-3 py-1 text-sm font-medium text-primary">
            <HeartHandshake className="size-4" /> {BRAND.slogan}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            Enklere å få alle til å <span className="text-primary">stille opp.</span>
          </h1>
          <p className="max-w-xl text-muted-foreground sm:text-lg">
            Skoleavslutning, fotballcup, loppemarked eller dugnad? Med {BRAND.name} fordeler dere oppgaver og bidrag
            på minutter. Del én lenke og få full oversikt.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className={buttonVariants({ size: "xl" })}>
              Kom i gang <ArrowRight />
            </Link>
            <a href="#slik-fungerer-det" className={buttonVariants({ size: "xl", variant: "outline" })}>
              Se hvordan det fungerer
            </a>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground sm:gap-y-2">
            {["Ingen konto for deltakere", "Ingen app å installere", "Gratis for deltakere, 499 kr per år for arrangøren"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 shrink-0 text-success" /> {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Phone mockup: one list that mixes things to bring, shifts and tasks. Decorative, so only shown where it fits beside the text. */}
        <div className="relative mx-auto hidden w-full max-w-sm lg:block" aria-hidden="true">
          <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-primary/25 via-brand-muted to-warm-muted blur-2xl" />
          <div className="rounded-[2.5rem] border-8 border-foreground/90 bg-background p-4 shadow-2xl">
            <p className="text-xs font-medium text-primary">FAU Solberg skole</p>
            <p className="text-lg font-bold">Sommeravslutning 5B</p>
            <p className="mb-4 text-xs text-muted-foreground">Torsdag 17. juni 2027</p>
            <div className="space-y-3">
              {DEMO_ITEMS.map((item, index) => {
                const done = item.allocated >= item.target;
                const kind = ITEM_KINDS[item.kind];
                const KindIcon = kind.icon;
                return (
                  <div
                    key={item.name}
                    className={cn(
                      "rounded-2xl bg-card p-3 ring-1",
                      done ? "bg-success-muted/60 ring-success/25" : "ring-foreground/10",
                      // On low laptop screens the third example is dropped so the mockup fits the page.
                      index === 2 && "[@media(max-height:719px)]:hidden",
                    )}
                  >
                    <p className="mb-1 flex items-center gap-2 text-[0.7rem] font-medium text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <KindIcon className="size-3" /> {kind.tag}
                      </span>
                      {item.time && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-muted px-1.5 py-0.5 text-primary">
                          <Clock className="size-3" /> {item.time}
                        </span>
                      )}
                    </p>
                    <p className="mb-2 text-sm font-semibold">{item.name}</p>
                    <ItemProgress size="sm" allocated={item.allocated} target={item.target} unit={item.unit} className="text-xs [&_span]:text-xs" />
                    {!done && (
                      <div className="mt-2.5 flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
                        <KindIcon className="size-4" /> {kind.cta}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function PageHeading({ title, text }: { title: string; text: string }) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground sm:mt-2 sm:text-base">{text}</p>
    </div>
  );
}

function StepsPage() {
  return (
    <section id="slik-fungerer-det" className={pageBody}>
      <PageHeading title="Slik fungerer det" text="Fra idé til ferdig liste på noen få minutter." />
      <ol className="mt-5 grid gap-2.5 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, text }, index) => (
          <li key={title} className="flex gap-3 rounded-2xl bg-background p-3 ring-1 ring-foreground/10 sm:block sm:p-6">
            <div className="flex shrink-0 items-center gap-3 sm:mb-4">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-muted sm:size-11">
                <Icon className="size-5 text-primary sm:size-6" />
              </span>
              <span className="hidden text-sm font-semibold text-muted-foreground sm:inline">Steg {index + 1}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground sm:hidden">Steg {index + 1}</p>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground sm:mt-1 sm:text-base">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function AudiencesPage() {
  return (
    <section className={pageBody}>
      <PageHeading title="Passer til" text="Alle steder der mange skal bidra litt hver." />
      <ul className="mt-5 grid gap-2 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {AUDIENCES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3 rounded-2xl bg-card p-2.5 ring-1 ring-foreground/10 sm:block sm:p-5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-warm-muted sm:mb-3 sm:size-11">
              <Icon className="size-5 text-warm sm:size-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold sm:text-base">{title}</h3>
              <p className="text-[0.8rem] leading-snug text-muted-foreground sm:mt-1 sm:text-sm">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BenefitsPage() {
  return (
    <section className={cn(pageBody, "gap-4 sm:gap-10 lg:grid lg:grid-cols-[1fr_1.4fr] lg:items-center")}>
      <div className="space-y-1.5 sm:space-y-4">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Fordeler</h2>
        <p className="text-sm text-muted-foreground sm:text-lg">
          {BRAND.name} er ikke enda en app deltakerne må lære seg. Dere fortsetter å snakke sammen der dere gjør i dag.{" "}
          {BRAND.name} er listen dere lenker til.
        </p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 sm:gap-4">
        {BENEFITS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3 rounded-2xl bg-background p-2.5 ring-1 ring-foreground/10 sm:block sm:p-4">
            <Icon className="mt-0.5 size-5 shrink-0 text-primary sm:mt-0 sm:mb-2" />
            <div className="min-w-0">
              <p className="text-sm font-semibold sm:text-base">{title}</p>
              <p className="text-[0.8rem] leading-snug text-muted-foreground sm:text-sm">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CallToActionPage() {
  return (
    <>
      <section className={pageBody}>
        <div className="mx-auto w-full max-w-4xl rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground shadow-xl shadow-primary/20">
          <h2 className="text-3xl font-bold tracking-tight">{BRAND.slogan}</h2>
          <p className="mx-auto mt-2 max-w-lg text-primary-foreground/85">
            Opprett en liste, del en lenke og la alle velge hvordan de vil bidra.
          </p>
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "xl", variant: "secondary" }), "mt-6 bg-white text-primary hover:bg-white/90")}
          >
            Kom i gang <ArrowRight />
          </Link>
        </div>
      </section>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        {BRAND.name} · {BRAND.slogan}
      </footer>
    </>
  );
}
