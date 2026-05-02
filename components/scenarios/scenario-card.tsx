"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Star, Users, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Scenario } from "@/lib/types";

const GENRE_LABELS: Record<string, { ko: string; en: string }> = {
  historical:      { ko: "사극",       en: "Historical" },
  modern:          { ko: "근현대",     en: "Modern" },
  modern_romance:  { ko: "현대 로맨스", en: "Romance" },
  action:          { ko: "액션",       en: "Action" },
  romance:         { ko: "로맨스",     en: "Romance" },
  mystery:         { ko: "추리",       en: "Mystery" },
  fantasy:         { ko: "판타지",     en: "Fantasy" },
  idol:            { ko: "아이돌",     en: "Idol" },
  legal:           { ko: "법정",       en: "Legal" },
  strategy:        { ko: "전략",       en: "Strategy" },
  drama:           { ko: "드라마",     en: "Drama" },
};

interface ScenarioCardProps {
  scenario: Scenario;
  featured?: boolean;
}

export function ScenarioCard({ scenario, featured }: ScenarioCardProps) {
  const locale = useLocale();
  const isEn = locale === "en";

  const t = <T extends { ko?: string; en?: string }>(field: T | undefined): string => {
    if (!field) return "";
    if (isEn) return field.en ?? field.ko ?? "";
    return field.ko ?? field.en ?? "";
  };

  const startAge = scenario.cradleConfig?.cradleStartAge ?? 0;
  const endAge = scenario.cradleConfig?.cradleEndAge ?? 0;
  const mainEndAge = scenario.mainStoryEndAge ?? endAge;
  const totalChapters = (endAge - startAge) + (mainEndAge - endAge);
  const heaviness = scenario.heaviness ?? 0;

  return (
    <Link
      href={`/scenarios/${scenario.id}`}
      className={cn(
        "group block rounded-card overflow-hidden bg-bg-card shadow-paper hover:shadow-paper-md transition-all duration-300",
        featured && "ring-1 ring-accent-maple/20"
      )}
    >
      {/* Cover Image */}
      <div className="relative aspect-video bg-bg overflow-hidden">
        {scenario.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={scenario.coverImageUrl}
            alt={t(scenario.title)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-20">🏯</span>
          </div>
        )}

        {/* Heaviness badge */}
        <div className="absolute top-3 right-3">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  i < heaviness ? "bg-accent-maple" : "bg-white/30"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Genre tags */}
        <div className="flex gap-1.5 flex-wrap mb-2">
          {Array.isArray(scenario.genre) && scenario.genre.slice(0, 2).map((g) => (
            <Badge key={g} variant="muted">
              {isEn ? (GENRE_LABELS[g]?.en ?? g) : (GENRE_LABELS[g]?.ko ?? g)}
            </Badge>
          ))}
          {scenario.isPremium && <Badge variant="gold">{isEn ? "Premium" : "프리미엄"}</Badge>}
        </div>

        <h3 className="font-serif text-lg font-semibold text-text leading-tight mb-1">
          {t(scenario.title)}
        </h3>
        <p className="text-sm text-text-muted mb-3">{t(scenario.subtitle)}</p>
        <p className="text-sm text-text-caption line-clamp-2 leading-relaxed mb-3">
          {t(scenario.description)}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-text-caption">
          {scenario.averageRating != null && (
            <div className="flex items-center gap-1">
              <Star size={12} className="text-accent-gold fill-accent-gold" />
              <span>{scenario.averageRating.toFixed(1)}</span>
            </div>
          )}
          {scenario.totalPlays != null && (
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span>{scenario.totalPlays.toLocaleString()}{isEn ? " plays" : "명 플레이"}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{totalChapters}{isEn ? " ch" : "챕터"}</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <div className="w-full py-2.5 rounded-button bg-accent-maple/8 text-accent-maple text-sm font-medium text-center group-hover:bg-accent-maple group-hover:text-white transition-all duration-fast">
          {isEn ? "Start this life ▶" : "이 인생 시작하기 ▶"}
        </div>
      </div>
    </Link>
  );
}
