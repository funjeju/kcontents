"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { StatsGrid } from "@/components/game/stat-bar";
import { initStats } from "@/lib/utils";
import { useLife } from "@/lib/hooks/use-life";

interface Props {
  params: { lifeId: string; n: string };
}

// Mr. Sunshine: 크레이들 12세(1897) 시작, 챕터 4 = 15세 = T-0
const CRADLE_START_AGE = 12;
const CRADLE_START_YEAR = 1897;
const T0_CHAPTER = 4;

export default function ChapterEndPage({ params }: Props) {
  const router = useRouter();
  const { lifeId, n } = params;
  const chapter = parseInt(n);
  const isT0Chapter = chapter === T0_CHAPTER;

  const { life } = useLife(lifeId);
  const stats = life?.stats ?? initStats(10);
  const age = CRADLE_START_AGE + chapter - 1;
  const year = CRADLE_START_YEAR + chapter - 1;
  const markedRef = useRef(false);

  useEffect(() => {
    if (markedRef.current) return;
    markedRef.current = true;
    fetch(`/api/lives/${lifeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addCompletedChapter: chapter }),
    }).catch(() => {});
  }, [lifeId, chapter]);

  const summaryLines = getChapterSummary(chapter, age, year);

  function handleNext() {
    if (isT0Chapter) {
      router.push(`/play/${lifeId}/casting`);
    } else {
      router.push(`/play/${lifeId}/chapter/${chapter + 1}/intro`);
    }
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <div className="flex-1 flex flex-col max-w-game mx-auto w-full px-screen-x py-8">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <p className="era-label mb-1">{age}세 · {year}년</p>
          <h1 className="font-serif text-2xl font-bold text-text">
            챕터 {chapter} 마무리
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="hanji-card p-5 mb-6 border-l-2 border-accent-maple/40"
        >
          <p className="text-xs text-text-caption mb-3 font-medium uppercase tracking-wider">이 해의 기록</p>
          <div className="space-y-2">
            {summaryLines.map((line, i) => (
              <p key={i} className="narrative-text text-sm leading-relaxed">{line}</p>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="hanji-card p-5 mb-6"
        >
          <p className="text-xs text-text-caption mb-4 font-medium uppercase tracking-wider">현재 성장 지표</p>
          <StatsGrid stats={stats} />
        </motion.div>

        {isT0Chapter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="hanji-card p-4 mb-6 border border-accent-gold/30 bg-accent-gold/5"
          >
            <p className="text-sm text-text-muted leading-relaxed text-center font-serif italic">
              "3년이 흘렀다. 이제 당신이 누구인지 알게 될 시간이 왔다."
            </p>
          </motion.div>
        )}

        <div className="mt-auto">
          <Button size="lg" fullWidth onClick={handleNext}>
            {isT0Chapter ? "T-0 모먼트로 ▶" : `${chapter + 1}챕터로 ▶`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function getChapterSummary(chapter: number, age: number, year: number): string[] {
  const summaries: Record<number, string[]> = {
    1: [
      `${age}세, 대한제국 원년 ${year}년.`,
      "새 나라의 이름이 선포된 해였다. 당신은 그 변화의 한가운데서 처음으로 세상을 인식하기 시작했다.",
    ],
    2: [
      `${age}세의 여름. 만민공동회의 외침이 종로를 울렸다.`,
      "처음으로 나라에 대해 진지하게 생각하게 된 계절이었다.",
    ],
    3: [
      `${age}세, ${year}년. 한성에 전차가 놓였다.`,
      "빠르게 변하는 세상 속에서 당신은 자신이 어디로 가야 할지 생각했다.",
    ],
    4: [
      `${age}세. 크레이들의 마지막 해.`,
      "3년이 지났다. 당신은 이제 더 이상 어린아이가 아니다.",
      "당신이 걸어온 길이, 이제 당신이 누구인지를 결정할 것이다.",
    ],
  };

  return summaries[chapter] ?? [
    `${age}세, ${year}년.`,
    "당신의 이야기가 계속되고 있다.",
  ];
}
