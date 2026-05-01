"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Star, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatChip } from "@/components/game/stat-bar";
import { initStats } from "@/lib/utils";

interface Props {
  params: { lifeId: string };
}

const MOCK_LIFE_DETAIL = {
  characterName: "김아연",
  scenarioTitle: "미스터 션샤인 정서",
  roleName: "개화의 신사",
  endingTitle: "독립의 불꽃",
  endingRarity: 4.2,
  playedAt: "2024년 3월 15일",
  stats: initStats(12),
  chapters: [
    { n: 1, age: 9, year: 1894, summary: "한약방 앞에서 세상을 바라보았다." },
    { n: 2, age: 10, year: 1895, summary: "대궐의 소문을 들었다." },
    { n: 3, age: 11, year: 1896, summary: "서희와 처음 이야기를 나눴다." },
    { n: 4, age: 12, year: 1897, summary: "대한제국 원년, 변화를 느꼈다." },
    { n: 5, age: 13, year: 1898, summary: "만민공동회의 함성을 들었다." },
    { n: 6, age: 14, year: 1899, summary: "전차를 처음으로 탔다." },
    { n: 7, age: 15, year: 1900, summary: "T-0. 개화의 신사로 결정되었다." },
  ],
};

export default function LifeReviewPage({ params }: Props) {
  const router = useRouter();
  const { lifeId } = params;
  const life = MOCK_LIFE_DETAIL;

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
            <h1 className="font-serif font-semibold text-text">{life.characterName}의 인생</h1>
            <button
              onClick={() => router.push(`/play/${lifeId}/share`)}
              className="ml-auto text-text-muted"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

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
                  {life.characterName[0]}
                </span>
              </div>
              <div>
                <h2 className="font-serif font-bold text-text">{life.characterName}</h2>
                <p className="text-sm text-accent-maple">{life.roleName}</p>
                <p className="text-xs text-text-caption mt-0.5">{life.scenarioTitle} · {life.playedAt}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-text/5">
              <div className="flex items-center gap-2">
                <Star size={14} className="text-accent-gold fill-accent-gold" />
                <p className="font-medium text-text text-sm">{life.endingTitle}</p>
                <span className="text-xs text-text-caption">({life.endingRarity}%)</span>
              </div>
            </div>
          </motion.div>

          {/* Final stats */}
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

          {/* Chapter timeline */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-xs text-text-caption uppercase tracking-wider mb-3">챕터 기록</p>
            <div className="space-y-0">
              {life.chapters.map((ch, i) => (
                <div key={ch.n} className="flex gap-3">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-3 ${i === life.chapters.length - 1 ? "bg-accent-maple" : "bg-accent-jade"}`} />
                    {i < life.chapters.length - 1 && (
                      <div className="w-px flex-1 bg-text/10 my-1" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="pb-4">
                    <p className="text-xs text-text-caption">{ch.age}세 · {ch.year}년</p>
                    <p className="text-sm text-text-muted mt-0.5">{ch.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* View ending card */}
          <Button
            size="lg"
            fullWidth
            onClick={() => router.push(`/play/${lifeId}/card`)}
          >
            엔딩 카드 보기
          </Button>
        </div>
      </div>
    </div>
  );
}
