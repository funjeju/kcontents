"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatChip } from "@/components/game/stat-bar";
import { useLife } from "@/lib/hooks/use-life";
import { useScenario } from "@/lib/hooks/use-scenario";

interface Props {
  params: { lifeId: string };
}

export default function CardPage({ params }: Props) {
  const router = useRouter();
  const { lifeId } = params;
  const [flipped, setFlipped] = useState(false);

  const { life, loading: lifeLoading } = useLife(lifeId);
  const { scenario, loading: scenarioLoading } = useScenario(life?.scenarioId);

  const loading = lifeLoading || (!!life && scenarioLoading);

  const castingRole = scenario?.castingRoles?.find((r) => r.id === life?.castingRole);
  const ending = scenario?.endings?.find((e) => e.id === life?.endingId);

  const cradleStartAge = scenario?.cradleConfig?.cradleStartAge ?? 0;
  const eraStartYear = scenario?.cradleConfig?.eraStartYear;
  const mainStoryEndAge = scenario?.mainStoryEndAge;
  const yearRange =
    eraStartYear != null && mainStoryEndAge != null
      ? `${eraStartYear}–${eraStartYear + (mainStoryEndAge - cradleStartAge)}`
      : null;

  const prefix = (life?.scenarioId ?? "XXX").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
  const cardNumber = `${prefix}-${lifeId.slice(-4).toUpperCase()}`;

  const cardData = {
    characterName: life?.characterName ?? "—",
    scenarioTitle: scenario?.title?.ko ?? "—",
    roleName: castingRole?.name?.ko ?? "—",
    endingTitle: ending?.title?.ko ?? "—",
    endingRarity: ending?.rarityPercentage ?? 0,
    stats: life?.stats ?? {},
    cardNumber,
    year: yearRange,
  };

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center">
      <div className="w-full max-w-game px-screen-x py-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <p className="era-label mb-1">엔딩 카드</p>
          <h1 className="font-serif text-2xl font-bold text-text">
            당신의 인생이 카드가 되었습니다
          </h1>
          <p className="text-text-caption text-sm mt-1">카드를 탭해서 뒤집어보세요</p>
        </motion.div>

        {loading ? (
          <div className="w-full max-w-xs aspect-[3/4] rounded-2xl bg-bg-card border border-text/10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-accent-maple/40 border-t-accent-maple rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-xs cursor-pointer mb-8"
            onClick={() => setFlipped((f) => !f)}
            style={{ perspective: 1000 }}
          >
            <motion.div
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              style={{ transformStyle: "preserve-3d", position: "relative" }}
              className="w-full"
            >
              {/* Front */}
              <div
                style={{ backfaceVisibility: "hidden" }}
                className="w-full aspect-[3/4] rounded-2xl border border-accent-maple/30 bg-bg-card shadow-paper-md overflow-hidden flex flex-col"
              >
                <div className="flex-1 bg-gradient-to-br from-accent-maple/5 to-accent-jade/10 flex items-center justify-center relative">
                  <span className="text-7xl opacity-20">🎭</span>
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-transparent to-transparent" />
                  {cardData.endingRarity > 0 && (
                    <div className="absolute top-3 right-3">
                      <span className="text-xs text-accent-gold font-medium bg-bg-card/80 px-2 py-0.5 rounded-full">
                        {cardData.endingRarity}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="px-4 py-4">
                  <p className="text-xs text-text-caption mb-1">{cardData.scenarioTitle}</p>
                  <h2 className="font-serif text-lg font-bold text-text">{cardData.characterName}</h2>
                  <p className="text-sm text-accent-maple">{cardData.roleName}</p>
                  {cardData.year && (
                    <p className="text-xs text-text-caption mt-2">{cardData.year}</p>
                  )}
                  <div className="mt-2 pt-2 border-t border-text/5">
                    <p className="text-xs text-text-caption font-mono">{cardData.cardNumber}</p>
                  </div>
                </div>
              </div>

              {/* Back */}
              <div
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }}
                className="w-full aspect-[3/4] rounded-2xl border border-accent-maple/30 bg-bg-card shadow-paper-md overflow-hidden flex flex-col p-5"
              >
                <p className="text-xs text-text-caption mb-3 uppercase tracking-wider">결말</p>
                <h3 className="font-serif text-xl font-bold text-text mb-3">{cardData.endingTitle}</h3>

                {life?.endingNarrative && (
                  <blockquote className="border-l-2 border-accent-maple/40 pl-3 mb-4">
                    <p className="text-sm text-text-muted italic font-serif leading-relaxed line-clamp-4">
                      {life.endingNarrative.split("\n\n")[0]}
                    </p>
                  </blockquote>
                )}

                <div className="mt-auto">
                  <p className="text-xs text-text-caption mb-2">최종 성장</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(cardData.stats).map(([key, val]) => (
                      <StatChip key={key} statKey={key as any} value={val as number} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="w-full space-y-3">
          <Button
            size="lg"
            fullWidth
            onClick={() => router.push(`/play/${lifeId}/share`)}
          >
            <Share2 size={16} className="mr-2" />
            공유하기
          </Button>
          <Button size="lg" fullWidth variant="secondary">
            <Download size={16} className="mr-2" />
            이미지 저장
          </Button>
          <Button
            size="lg"
            fullWidth
            variant="ghost"
            onClick={() => router.push("/scenarios/recommended")}
          >
            다른 시나리오 하기
          </Button>
        </div>
      </div>
    </div>
  );
}
