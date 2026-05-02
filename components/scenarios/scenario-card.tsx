import Link from "next/link";
import { Star, Users, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Scenario } from "@/lib/types";

const GENRE_LABELS: Record<string, string> = {
  historical: "사극",
  modern: "근현대",
  modern_romance: "현대 로맨스",
  action: "액션",
  romance: "로맨스",
  mystery: "추리",
  fantasy: "판타지",
  idol: "아이돌",
};

interface ScenarioCardProps {
  scenario: Scenario;
  featured?: boolean;
}

export function ScenarioCard({ scenario, featured }: ScenarioCardProps) {
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
            alt={scenario.title?.ko ?? ""}
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
              {GENRE_LABELS[g] ?? g}
            </Badge>
          ))}
          {scenario.isPremium && <Badge variant="gold">프리미엄</Badge>}
        </div>

        <h3 className="font-serif text-lg font-semibold text-text leading-tight mb-1">
          {scenario.title?.ko}
        </h3>
        <p className="text-sm text-text-muted mb-3">{scenario.subtitle?.ko}</p>
        <p className="text-sm text-text-caption line-clamp-2 leading-relaxed mb-3">
          {scenario.description?.ko}
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
              <span>{scenario.totalPlays.toLocaleString()}명 플레이</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{totalChapters}챕터</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <div className="w-full py-2.5 rounded-button bg-accent-maple/8 text-accent-maple text-sm font-medium text-center group-hover:bg-accent-maple group-hover:text-white transition-all duration-fast">
          이 인생 시작하기 ▶
        </div>
      </div>
    </Link>
  );
}
