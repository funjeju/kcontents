"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Star, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatChip } from "@/components/game/stat-bar";
import { useLife } from "@/lib/hooks/use-life";
import { MR_SUNSHINE_SCENARIO } from "@/data/scenarios/mr-sunshine";

interface Props {
  params: { lifeId: string };
}

const SCENARIOS: Record<string, typeof MR_SUNSHINE_SCENARIO> = {
  mr_sunshine: MR_SUNSHINE_SCENARIO,
};

// Mr. Sunshine: 크레이들 12세(1897) → T-0 15세(1900) → 본편
const CHAPTER_AGES = [12, 13, 14, 15, 16, 17, 18, 19];
const CHAPTER_YEARS = [1897, 1898, 1899, 1900, 1901, 1902, 1903, 1904];

export default function LifeReviewPage({ params }: Props) {
  const router = useRouter();
  const { lifeId } = params;

  const { life, loading } = useLife(lifeId);

  const scenario = life ? SCENARIOS[life.scenarioId] : null;
  const castingRole = scenario?.castingRoles.find((r) => r.id === life?.castingRole);
  const ending = scenario?.endings.find((e) => e.id === life?.endingId);

  const characterName = life?.characterName ?? "—";
  const roleName = castingRole?.name.ko ?? "—";
  const endingTitle = ending?.title.ko ?? "—";
  const endingRarity = ending?.rarityPercentage ?? 0;
  const scenarioTitle = scenario?.title.ko ?? "미스터 션샤인 정서";

  const completedChapters = life?.completedChapters ?? [];

  return (
    <div className="min-h-dvh bg-bg pb-10">
      <div className="max-w-game mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-bg/90 backdrop-blur-sm border-b border-text/5">
          <div className="px-screen-x h-14 flex items-center gap-3">
            <Link href="/me">
              <button className="text-text-muted">
                <ChevronLeft size={20} />
              </button>
            </Link>
            <h1 className="font-serif font-semibold text-text">{characterName}의 인생</h1>
            <button
              onClick={() => router.push(`/play/${lifeId}/share`)}
              className="ml-auto text-text-muted"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-text-caption text-sm">불러오는 중...</div>
        ) : (
          <div className="px-screen-x py-6 space-y-5">
            {/* Ending summary */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="hanji-card p-5 border border-accent-maple/20"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-accent-maple/10 border border-accent-maple/20 flex items-center justify-center shrink-0">
                  <span className="font-serif font-bold text-accent-maple text-lg">
                    {characterName[0]}
                  </span>
                </div>
                <div>
                  <h2 className="font-serif font-bold text-text">{characterName}</h2>
                  <p className="text-sm text-accent-maple">{roleName}</p>
                  <p className="text-xs text-text-caption mt-0.5">{scenarioTitle}</p>
                </div>
              </div>
              {life?.isFinished && (
                <div className="mt-4 pt-4 border-t border-text/5">
                  <div className="flex items-center gap-2">
                    <Star size={14} className="text-accent-gold fill-accent-gold" />
                    <p className="font-medium text-text text-sm">{endingTitle}</p>
                    {endingRarity > 0 && (
                      <span className="text-xs text-text-caption">({endingRarity}%)</span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Final stats */}
            {life?.stats && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="hanji-card p-5"
              >
                <p className="text-xs text-text-caption mb-3 uppercase tracking-wider">최종 성장 지표</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(life.stats).map(([key, val]) => (
                    <StatChip key={key} statKey={key as any} value={val as number} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Chapter timeline */}
            {completedChapters.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-xs text-text-caption uppercase tracking-wider mb-3">챕터 기록</p>
                <div className="space-y-0">
                  {completedChapters.map((chNum, i) => {
                    const age = CHAPTER_AGES[chNum - 1] ?? 9 + chNum - 1;
                    const year = CHAPTER_YEARS[chNum - 1] ?? 1894 + chNum - 1;
                    const isLast = i === completedChapters.length - 1;
                    return (
                      <div key={chNum} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-3 ${isLast ? "bg-accent-maple" : "bg-accent-jade"}`} />
                          {!isLast && <div className="w-px flex-1 bg-text/10 my-1" />}
                        </div>
                        <div className="pb-4">
                          <p className="text-xs text-text-caption">{age}세 · {year}년</p>
                          <p className="text-sm text-text-muted mt-0.5">챕터 {chNum} 완료</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* View ending card */}
            {life?.isFinished && (
              <Button
                size="lg"
                fullWidth
                onClick={() => router.push(`/play/${lifeId}/card`)}
              >
                엔딩 카드 보기
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
