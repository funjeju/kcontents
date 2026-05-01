"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { StatsGrid } from "@/components/game/stat-bar";
import { initStats } from "@/lib/utils";
import type { Stats } from "@/lib/types";

interface Props {
  params: { lifeId: string; n: string };
}

export default function ChapterEndPage({ params }: Props) {
  const router = useRouter();
  const { lifeId, n } = params;
  const chapter = parseInt(n);
  const isLastCradleChapter = chapter >= 7;

  const [stats] = useState<Stats>(initStats(10));
  const age = 9 + chapter - 1;
  const year = 1894 + chapter - 1;

  const summaryLines = getMockChapterSummary(chapter);

  function handleNext() {
    if (isLastCradleChapter) {
      router.push(`/play/${lifeId}/casting`);
    } else {
      router.push(`/play/${lifeId}/chapter/${chapter + 1}/intro`);
    }
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <div className="flex-1 flex flex-col max-w-game mx-auto w-full px-screen-x py-8">
        {/* Chapter badge */}
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

        {/* Chapter summary */}
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

        {/* Stats snapshot */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="hanji-card p-5 mb-6"
        >
          <p className="text-xs text-text-caption mb-4 font-medium uppercase tracking-wider">현재 성장 지표</p>
          <StatsGrid stats={stats} />
        </motion.div>

        {/* Transition hint */}
        {isLastCradleChapter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="hanji-card p-4 mb-6 border border-accent-gold/30 bg-accent-gold/5"
          >
            <p className="text-sm text-text-muted leading-relaxed text-center font-serif italic">
              "6년이 흘렀다. 이제 당신이 누구인지 알게 될 시간이 왔다."
            </p>
          </motion.div>
        )}

        <div className="mt-auto">
          <Button size="lg" fullWidth onClick={handleNext}>
            {isLastCradleChapter ? "T-0 모먼트로 ▶" : `${chapter + 1}챕터로 ▶`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function getMockChapterSummary(chapter: number): string[] {
  const summaries: Record<number, string[]> = {
    1: [
      "9세의 가을은 짧고 빠르게 지나갔다.",
      "한약방 문 앞에 앉아 세상을 바라보던 당신. 갑오개혁의 소용돌이 속에서도 하루하루는 조용히 쌓여갔다.",
    ],
    2: [
      "10세, 을미사변의 해. 대궐에서 무슨 일이 있었다는 소문이 한성을 떠돌았다.",
      "당신은 아직 어렸지만, 어른들의 목소리에서 두려움을 느꼈다.",
    ],
    3: [
      "11세의 겨울. 양반가 따님 서희가 자주 한약방에 들렀다.",
      "그녀가 읽는 한문 책이 당신의 호기심을 자극했다.",
    ],
    4: [
      "12세, 대한제국 원년. 나라의 이름이 바뀌었다.",
      "세상이 변하고 있었고, 당신도 조금씩 변해갔다.",
    ],
    5: [
      "13세의 여름. 독립협회의 외침이 종로를 울렸다.",
      "처음으로 나라에 대해 진지하게 생각하게 된 계절이었다.",
    ],
    6: [
      "14세, 1899년. 한성에 전차가 놓였다.",
      "빠르게 변하는 세상 속에서 당신은 자신이 어디로 가야 할지 생각했다.",
    ],
    7: [
      "15세. 크레이들의 마지막 해.",
      "6년이 지났다. 당신은 이제 더 이상 어린아이가 아니다.",
      "당신이 걸어온 길이, 이제 당신이 누구인지를 결정할 것이다.",
    ],
  };

  return summaries[chapter] ?? summaries[1];
}
