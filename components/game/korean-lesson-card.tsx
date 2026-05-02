"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { KoreanLesson } from "@/lib/hooks/use-chapter-events";

interface KoreanLessonCardProps {
  lessons: KoreanLesson[];
  scenarioTitle?: string;
}

export function KoreanLessonCard({ lessons, scenarioTitle = "" }: KoreanLessonCardProps) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [saved, setSaved] = useState(false);

  // 카드 열면 단어 자동 저장
  useEffect(() => {
    if (!open || saved || !lessons.length) return;
    setSaved(true);
    const words = lessons.map((l) => ({
      word: l.word,
      romanization: l.romanization,
      meaning: l.meaning,
      culturalNote: l.culturalNote,
      scenarioTitle,
      learnedAt: new Date().toISOString(),
    }));
    fetch("/api/me/korean-words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ words }),
    }).catch(() => {});
  }, [open, saved, lessons, scenarioTitle]);

  if (!lessons || lessons.length === 0) return null;

  const active = lessons[activeIdx];

  return (
    <div className="mt-5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-accent-jade/20 bg-accent-jade/5 hover:bg-accent-jade/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🇰🇷</span>
          <span className="text-xs font-medium text-accent-jade">Learn Korean from this scene</span>
          {!open && (
            <span className="text-xs text-accent-jade/60 bg-accent-jade/10 px-1.5 py-0.5 rounded-full">
              {lessons.length} words
            </span>
          )}
        </div>
        <span className="text-xs text-text-caption">{open ? "▲" : "▼"}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-xl border border-accent-jade/15 bg-accent-jade/5 overflow-hidden">
              {/* 탭 */}
              {lessons.length > 1 && (
                <div className="flex border-b border-accent-jade/15">
                  {lessons.map((l, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIdx(i)}
                      className={`flex-1 py-2 text-xs font-medium transition-colors ${
                        activeIdx === i
                          ? "text-accent-jade border-b-2 border-accent-jade bg-accent-jade/10"
                          : "text-text-caption hover:text-text"
                      }`}
                    >
                      {l.word}
                    </button>
                  ))}
                </div>
              )}

              <div className="p-4">
                {/* 단어 + 발음 + 의미 */}
                <div className="flex items-baseline gap-3 mb-3 flex-wrap">
                  <span className="font-serif text-2xl text-text font-bold">{active.word}</span>
                  <span className="text-sm text-text-caption italic">{active.romanization}</span>
                  <span className="text-sm text-text-muted">— {active.meaning}</span>
                </div>

                <div className="h-px bg-accent-jade/15 mb-3" />

                {/* 문화 설명 */}
                <div className="flex gap-2">
                  <span className="text-accent-jade text-sm mt-0.5 shrink-0">✦</span>
                  <p className="text-sm text-text-muted leading-relaxed">{active.culturalNote}</p>
                </div>

                <p className="text-xs text-accent-jade/50 mt-3 text-right">
                  ✓ Saved to Words You&apos;ve Lived With
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
