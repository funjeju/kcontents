import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "landing" });
  return { title: t("headline") };
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <BottomCTA />
      <FooterSection />
    </div>
  );
}

function HeroSection() {
  const t = useTranslations("landing");
  const tAuth = useTranslations("auth");

  return (
    <section className="relative min-h-dvh flex flex-col items-center justify-center px-screen-x text-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-accent-maple/5 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-bg to-transparent" />
      </div>

      <div className="relative z-10 max-w-sm mx-auto animate-slide-up">
        <div className="mb-6 flex justify-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏯</span>
            <span className="font-serif text-2xl font-bold text-text tracking-tight">
              K-Drama Life
            </span>
          </div>
        </div>

        <h1 className="font-serif text-[2rem] leading-tight font-bold text-text mb-3">
          {t("headline")}
        </h1>

        <p className="text-text-muted text-base leading-relaxed mb-8 whitespace-pre-line">
          {t("sub")}
        </p>

        <Link href="/signup">
          <Button size="lg" fullWidth className="shadow-paper-md">
            ▶ {t("cta")}
          </Button>
        </Link>

        <p className="mt-4 text-sm text-text-caption">
          {tAuth("hasAccount")}{" "}
          <Link href="/login" className="text-accent-maple underline-offset-2 hover:underline">
            {tAuth("goLogin")}
          </Link>
        </p>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-text-caption text-xs flex flex-col items-center gap-1">
        <span>↓</span>
        <ChevronRight size={14} className="rotate-90" />
      </div>
    </section>
  );
}

function FeaturesSection() {
  const t = useTranslations("landing");

  const features = [
    { icon: "🎭", titleKey: "feature1Title", descKey: "feature1Desc" },
    { icon: "⚡", titleKey: "feature2Title", descKey: "feature2Desc" },
    { icon: "🤖", titleKey: "feature3Title", descKey: "feature3Desc" },
  ] as const;

  return (
    <section className="px-screen-x py-section max-w-game mx-auto">
      <h2 className="font-serif text-xl font-semibold text-text mb-6 text-center">
        {t("howTitle")}
      </h2>
      <div className="space-y-4">
        {features.map((f) => (
          <div key={f.titleKey} className="hanji-card p-5 flex gap-4 items-start">
            <span className="text-2xl shrink-0">{f.icon}</span>
            <div>
              <h3 className="font-medium text-text mb-1">{t(f.titleKey)}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{t(f.descKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const t = useTranslations("landing");

  const steps = [
    { titleKey: "step1", descKey: "step1Desc" },
    { titleKey: "step2", descKey: "step2Desc" },
    { titleKey: "step3", descKey: "step3Desc" },
    { titleKey: "step4", descKey: "step4Desc" },
  ] as const;

  return (
    <section className="px-screen-x py-section max-w-game mx-auto">
      <div className="space-y-6">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-4 items-start">
            <div className="shrink-0 w-8 h-8 rounded-full bg-accent-maple/10 text-accent-maple text-sm font-bold flex items-center justify-center">
              {i + 1}
            </div>
            <div className="pt-1">
              <p className="font-medium text-text text-sm">{t(step.titleKey)}</p>
              <p className="text-sm text-text-muted mt-0.5">{t(step.descKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatsSection() {
  const t = useTranslations("landing");

  const stats = [
    { value: "5+", labelKey: "statScenarios" },
    { value: "200+", labelKey: "statEndings" },
    { value: "4.8★", labelKey: "statRating" },
  ] as const;

  return (
    <section className="px-screen-x py-section max-w-game mx-auto">
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.labelKey} className="text-center hanji-card py-4 px-2">
            <div className="font-serif text-2xl font-bold text-accent-maple">{s.value}</div>
            <div className="text-xs text-text-caption mt-1">{t(s.labelKey)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BottomCTA() {
  const t = useTranslations("landing");

  return (
    <section className="px-screen-x py-section max-w-game mx-auto">
      <div className="hanji-card p-6 text-center">
        <h2 className="font-serif text-xl font-semibold text-text mb-2">
          {t("cta")}
        </h2>
        <p className="text-sm text-text-muted mb-5">{t("ctaSub")}</p>
        <Link href="/signup">
          <Button size="lg" fullWidth>
            ▶ {t("cta")}
          </Button>
        </Link>
      </div>
    </section>
  );
}

function FooterSection() {
  const t = useTranslations("settings");

  return (
    <footer className="border-t border-text/5 px-screen-x py-8 max-w-game mx-auto">
      <div className="text-center text-xs text-text-caption space-y-2">
        <p className="font-serif font-medium text-text-muted">K-Drama Life</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <Link href="/terms" className="hover:text-text transition-colors">
            {t("terms")}
          </Link>
          <Link href="/privacy" className="hover:text-text transition-colors">
            {t("privacy")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
