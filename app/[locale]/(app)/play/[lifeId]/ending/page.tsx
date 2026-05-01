"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { StatChip } from "@/components/game/stat-bar";
import { initStats } from "@/lib/utils";

interface Props {
  params: { lifeId: string };
}

const FALLBACK_ENDING = {
  id: "returner_independence_fighter",
  title: "독립의 불꽃",
  shortDescription: "당신의 지식과 신념이 역사의 물줄기를 바꾸었습니다.",
  endingNarrative: `1919년 3월. 한성의 거리에 만세 소리가 울려 퍼졌다.

당신은 그 한가운데 있었다.

9세에 청계천 변 한약방 앞에서 세상을 바라보던 아이가, 어느새 이 나라의 미래를 위해 목소리를 높이는 사람이 되었다.

서희는 당신을 떠나지 않았다. 그녀는 여전히 한문 책을 읽으며, 당신 곁에서 이 나라가 어디로 가야 하는지를 함께 고민했다.

당신은 살아남았다. 아니, 당신은 살아냈다.

그리고 그 삶이 — 이 한 줄의 역사가 되었다.`,
  rarityPercentage: 4.2,
  stats: initStats(10),
};

export default function EndingPage({ params }: Props) {
  const router = useRouter();
  const { lifeId } = params;
  const [revealed, setRevealed] = useState(false);
  const [ending, setEnding] = useState(FALLBACK_ENDING);
  const [finalStats, setFinalStats] = useState(initStats(10));

  useEffect(() => {
    // API로 결말 생성
    fetch(`/api/lives/${lifeId}/ending`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.title) {
          setEnding({
            id: data.endingId,
            title: data.title,
            shortDescription: data.shortDescription,
            endingNarrative: data.endingNarrative,
            rarityPercentage: data.rarityPercentage,
            stats: data.finalStats ?? initStats(10),
          } as typeof FALLBACK_ENDING);
          if (data.finalStats) setFinalStats(data.finalStats);
        }
      })
      .catch(() => {})
      .finally(() => setTimeout(() => setRevealed(true), 600));
  }, [lifeId]);

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <div className="flex-1 flex flex-col max-w-game mx-auto w-full px-screen-x py-10">
        {/* Rarity badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: revealed ? 1 : 0 }}
          transition={{ duration: 0.8 }}
          className="flex justify-center mb-8"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-accent-gold tracking-widest uppercase font-medium">
              희귀 결말 — {ending.rarityPercentage}%
            </span>
            <div className="w-12 h-px bg-accent-gold/40" />
          </div>
        </motion.div>

        {/* Ending title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 12 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-8"
        >
          <p className="era-label mb-2">결말</p>
          <h1 className="font-serif text-3xl font-bold text-text">
            {ending.title}
          </h1>
          <p className="text-text-muted text-sm mt-2">{ending.shortDescription}</p>
        </motion.div>

        {/* Ending narrative */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: revealed ? 1 : 0 }}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="hanji-card p-6 mb-6 border-l-2 border-accent-maple/30"
        >
          {ending.endingNarrative.split("\n\n").map((para, i) => (
            <p key={i} className={`narrative-text text-sm leading-relaxed ${i > 0 ? "mt-4" : ""}`}>
              {para}
            </p>
          ))}
        </motion.div>

        {/* Final stats */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 8 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="hanji-card p-4 mb-8"
        >
          <p className="text-xs text-text-caption mb-3">최종 성장 지표</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(ending.stats).map(([key, val]) => (
              <StatChip key={key} statKey={key as any} value={val as number} />
            ))}
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 8 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-auto space-y-3"
        >
          <Button
            size="lg"
            fullWidth
            onClick={() => router.push(`/play/${lifeId}/card`)}
          >
            엔딩 카드 받기 ▶
          </Button>
          <Button
            size="lg"
            fullWidth
            variant="secondary"
            onClick={() => router.push(`/play/${lifeId}/share`)}
          >
            이 인생 공유하기
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
