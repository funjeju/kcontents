export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Star, Users, Clock, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminDb } from "@/lib/firebase-admin";
import type { Scenario } from "@/lib/types";

const GENRE_LABELS: Record<string, { ko: string; en: string }> = {
  historical:     { ko: "사극",       en: "Historical" },
  action:         { ko: "액션",       en: "Action" },
  romance:        { ko: "로맨스",     en: "Romance" },
  modern:         { ko: "근현대",     en: "Modern" },
  modern_romance: { ko: "현대 로맨스", en: "Romance" },
  mystery:        { ko: "추리",       en: "Mystery" },
  fantasy:        { ko: "판타지",     en: "Fantasy" },
  idol:           { ko: "아이돌",     en: "Idol" },
  legal:          { ko: "법정",       en: "Legal" },
  strategy:       { ko: "전략",       en: "Strategy" },
  drama:          { ko: "드라마",     en: "Drama" },
};

async function getScenario(id: string): Promise<Scenario | null> {
  try {
    const doc = await adminDb.collection("scenarios").doc(id).get();
    if (!doc.exists) return null;
    return JSON.parse(JSON.stringify({ id: doc.id, ...doc.data() })) as Scenario;
  } catch {
    return null;
  }
}

export default async function ScenarioDetailPage({ params }: { params: { id: string } }) {
  const [scenario, locale, t] = await Promise.all([
    getScenario(params.id),
    getLocale(),
    getTranslations("scenarios"),
  ]);
  if (!scenario) notFound();

  const isEn = locale === "en";
  const loc = (field: { ko?: string; en?: string } | undefined) =>
    field ? (isEn ? (field.en ?? field.ko ?? "") : (field.ko ?? "")) : "";

  const startAge = scenario.cradleConfig?.cradleStartAge ?? 0;
  const endAge = scenario.cradleConfig?.cradleEndAge ?? 0;
  const mainEndAge = scenario.mainStoryEndAge ?? endAge;
  const totalChapters = (endAge - startAge) + (mainEndAge - endAge);
  const cradleYears = endAge - startAge;

  return (
    <div className="min-h-dvh bg-bg">
      {/* Back */}
      <div className="sticky top-0 z-20 bg-bg/90 backdrop-blur-sm border-b border-text/5">
        <div className="max-w-game mx-auto px-screen-x h-14 flex items-center">
          <Link
            href="/scenarios/recommended"
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
          >
            <ChevronLeft size={18} />
            {isEn ? "Back" : "돌아가기"}
          </Link>
        </div>
      </div>

      {/* Cover */}
      <div className="aspect-video bg-bg-card relative overflow-hidden max-w-game mx-auto">
        {scenario.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={scenario.coverImageUrl}
            alt={loc(scenario.title)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl opacity-20">🏯</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
      </div>

      <div className="page-container">
        {/* Title */}
        <div className="mb-5 animate-slide-up">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Array.isArray(scenario.genre) && scenario.genre.map((g) => (
              <Badge key={g} variant="muted">
                {isEn ? (GENRE_LABELS[g]?.en ?? g) : (GENRE_LABELS[g]?.ko ?? g)}
              </Badge>
            ))}
            {scenario.heaviness != null && (
              <Badge variant="maple">
                {isEn ? "Weight" : "무게"} {"●".repeat(scenario.heaviness)}{"○".repeat(5 - scenario.heaviness)}
              </Badge>
            )}
          </div>
          <h1 className="font-serif text-2xl font-bold text-text mb-1">{loc(scenario.title)}</h1>
          <p className="text-text-muted text-sm">{loc(scenario.subtitle)}</p>

          <div className="flex items-center gap-4 mt-3 text-sm text-text-caption">
            {scenario.averageRating != null && (
              <div className="flex items-center gap-1">
                <Star size={13} className="text-accent-gold fill-accent-gold" />
                <span>{scenario.averageRating.toFixed(1)}</span>
              </div>
            )}
            {scenario.totalPlays != null && (
              <div className="flex items-center gap-1">
                <Users size={13} />
                <span>{scenario.totalPlays.toLocaleString()}{isEn ? " players" : "명"}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock size={13} />
              <span>{totalChapters}{isEn ? " ch" : "챕터"}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {(loc(scenario.description)) && (
          <div className="hanji-card p-5 mb-5 animate-fade-in">
            <h2 className="font-serif font-semibold text-text mb-2">
              {t("storyBackground")}
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">{loc(scenario.description)}</p>
          </div>
        )}

        {/* Cradle info */}
        {endAge > 0 && (
          <div className="hanji-card p-5 mb-5">
            <h2 className="font-serif font-semibold text-text mb-3">{t("cradleInfo")}</h2>
            <div className="space-y-2 text-sm text-text-muted">
              <div className="flex items-center gap-2">
                <span className="text-accent-maple text-xs">●</span>
                <span>
                  {isEn
                    ? `Ages ${startAge}–${endAge} (${cradleYears} years) — live your childhood`
                    : `${startAge}세부터 ${endAge}세까지 (${cradleYears}년) — 어린 시절을 살아갑니다`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent-jade text-xs">●</span>
                <span>
                  {isEn
                    ? `Age ${endAge} T-0 Moment — casting is decided`
                    : `${endAge}세 T-0 모먼트 — 캐스팅이 결정됩니다`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent-gold text-xs">●</span>
                <span>
                  {isEn
                    ? `Main Story — ages ${endAge} to ${mainEndAge}`
                    : `Main Story — ${endAge}세부터 ${mainEndAge}세까지`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Casting pool teaser */}
        {Array.isArray(scenario.castingRoles) && scenario.castingRoles.length > 0 && (
          <div className="hanji-card p-5 mb-5">
            <h2 className="font-serif font-semibold text-text mb-3">
              {t("castingPool")}
            </h2>
            <div className="space-y-3">
              {scenario.castingRoles.map((role) => (
                <div key={role.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-bg border border-text/10 flex items-center justify-center shrink-0 text-sm text-text-caption">
                    ?
                  </div>
                  <div>
                    <p className="font-medium text-sm text-text">{loc(role.name)}</p>
                    <p className="text-xs text-text-caption">{t("conditionHidden")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ending teasers */}
        {Array.isArray(scenario.endings) && scenario.endings.length > 0 && (
          <div className="hanji-card p-5 mb-8">
            <h2 className="font-serif font-semibold text-text mb-3">{t("endingPreview")}</h2>
            <div className="space-y-3">
              {scenario.endings.slice(0, 3).map((ending) => (
                <div key={ending.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text">{loc(ending.title)}</p>
                    <p className="text-xs text-text-caption">{loc(ending.shortDescription)}</p>
                  </div>
                  <span className="text-xs text-text-caption whitespace-nowrap">
                    {ending.rarityPercentage?.toFixed(1)}%
                  </span>
                </div>
              ))}
              {scenario.endings.length > 3 && (
                <p className="text-xs text-text-caption italic">
                  {t("moreEndings", { n: scenario.endings.length - 3 })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        <Link href={`/scenarios/${scenario.id}/play`}>
          <Button size="lg" fullWidth className="shadow-paper-md">
            {t("startScenario")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
