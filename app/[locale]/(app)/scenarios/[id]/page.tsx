export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Star, Users, Clock, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminDb } from "@/lib/firebase-admin";
import type { Scenario } from "@/lib/types";

const GENRE_LABELS: Record<string, string> = {
  historical: "사극",
  action: "액션",
  romance: "로맨스",
  modern: "근현대",
  modern_romance: "현대 로맨스",
  mystery: "추리",
  fantasy: "판타지",
  idol: "아이돌",
};

interface Props {
  params: { id: string };
}

async function getScenario(id: string): Promise<Scenario | null> {
  try {
    const doc = await adminDb.collection("scenarios").doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Scenario;
  } catch {
    return null;
  }
}

export default async function ScenarioDetailPage({ params }: Props) {
  const scenario = await getScenario(params.id);
  if (!scenario) notFound();

  const totalChapters =
    (scenario.cradleConfig.cradleEndAge - scenario.cradleConfig.cradleStartAge) +
    (scenario.mainStoryEndAge - scenario.cradleConfig.cradleEndAge);

  const cradleYears =
    scenario.cradleConfig.cradleEndAge - scenario.cradleConfig.cradleStartAge;

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
            돌아가기
          </Link>
        </div>
      </div>

      {/* Cover */}
      <div className="aspect-video bg-bg-card relative overflow-hidden max-w-game mx-auto">
        {scenario.coverImageUrl ? (
          <Image
            src={scenario.coverImageUrl}
            alt={scenario.title.ko}
            fill
            className="object-cover"
            sizes="(max-width: 480px) 100vw, 480px"
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
            {scenario.genre?.map((g) => (
              <Badge key={g} variant="muted">{GENRE_LABELS[g] ?? g}</Badge>
            ))}
            {scenario.heaviness != null && (
              <Badge variant="maple">무게 {"●".repeat(scenario.heaviness)}{"○".repeat(5 - scenario.heaviness)}</Badge>
            )}
          </div>
          <h1 className="font-serif text-2xl font-bold text-text mb-1">{scenario.title.ko}</h1>
          <p className="text-text-muted text-sm">{scenario.subtitle?.ko}</p>

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
                <span>{scenario.totalPlays.toLocaleString()}명</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock size={13} />
              <span>{totalChapters}챕터</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {scenario.description?.ko && (
          <div className="hanji-card p-5 mb-5 animate-fade-in">
            <h2 className="font-serif font-semibold text-text mb-2">이야기 배경</h2>
            <p className="text-sm text-text-muted leading-relaxed">{scenario.description.ko}</p>
          </div>
        )}

        {/* Cradle info */}
        <div className="hanji-card p-5 mb-5">
          <h2 className="font-serif font-semibold text-text mb-3">Pre-Story Cradle</h2>
          <div className="space-y-2 text-sm text-text-muted">
            <div className="flex items-center gap-2">
              <span className="text-accent-maple text-xs">●</span>
              <span>
                {scenario.cradleConfig.cradleStartAge}세부터 {scenario.cradleConfig.cradleEndAge}세까지{" "}
                ({cradleYears}년) — 어린 시절을 살아갑니다
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-accent-jade text-xs">●</span>
              <span>
                {scenario.cradleConfig.cradleEndAge}세 T-0 모먼트 — 캐스팅이 결정됩니다
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-accent-gold text-xs">●</span>
              <span>
                Main Story — {scenario.cradleConfig.cradleEndAge}세부터{" "}
                {scenario.mainStoryEndAge}세까지
              </span>
            </div>
          </div>
        </div>

        {/* Casting pool teaser */}
        {scenario.castingRoles?.length > 0 && (
          <div className="hanji-card p-5 mb-5">
            <h2 className="font-serif font-semibold text-text mb-3">
              당신은 어떤 사람이 될 수 있을까요?
            </h2>
            <div className="space-y-3">
              {scenario.castingRoles.map((role) => (
                <div key={role.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-bg border border-text/10 flex items-center justify-center shrink-0 text-sm text-text-caption">
                    ?
                  </div>
                  <div>
                    <p className="font-medium text-sm text-text">{role.name.ko}</p>
                    <p className="text-xs text-text-caption">조건 미공개</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ending teasers */}
        {scenario.endings?.length > 0 && (
          <div className="hanji-card p-5 mb-8">
            <h2 className="font-serif font-semibold text-text mb-3">가능한 결말 미리보기</h2>
            <div className="space-y-3">
              {scenario.endings.slice(0, 3).map((ending) => (
                <div key={ending.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text">{ending.title.ko}</p>
                    <p className="text-xs text-text-caption">{ending.shortDescription?.ko}</p>
                  </div>
                  <span className="text-xs text-text-caption whitespace-nowrap">
                    {ending.rarityPercentage?.toFixed(1)}%
                  </span>
                </div>
              ))}
              {scenario.endings.length > 3 && (
                <p className="text-xs text-text-caption italic">
                  + {scenario.endings.length - 3}개의 결말이 더 있습니다...
                </p>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        <Link href={`/scenarios/${scenario.id}/play`}>
          <Button size="lg" fullWidth className="shadow-paper-md">
            ▶ 이 시나리오 시작하기
          </Button>
        </Link>
      </div>
    </div>
  );
}
