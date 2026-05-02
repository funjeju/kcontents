"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLife } from "@/lib/hooks/use-life";
import type { EntryQuestion } from "@/lib/types";

interface Props {
  params: { lifeId: string };
}

export default function IntroQuestionsPage({ params }: Props) {
  const router = useRouter();
  const { lifeId } = params;
  const { life } = useLife(lifeId);

  const [questions, setQuestions] = useState<EntryQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  // 질문 로드
  useEffect(() => {
    if (!life?.scenarioId) return;
    fetch(`/api/scenarios/${life.scenarioId}/questions`)
      .then((r) => r.json())
      .then((data) => {
        const qs = data.questions as EntryQuestion[] | null;
        if (!qs || qs.length === 0) {
          // 질문 없으면 바로 챕터 1로
          router.replace(`/play/${lifeId}/chapter/1/intro`);
          return;
        }
        setQuestions(qs);
        setLoading(false);
      })
      .catch(() => {
        // 오류 시에도 챕터 1로
        router.replace(`/play/${lifeId}/chapter/1/intro`);
      });
  }, [life?.scenarioId]); // eslint-disable-line

  const currentQ = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  async function handleChoice(choiceId: string) {
    if (!currentQ) return;
    const newAnswers = { ...answers, [currentQ.id]: choiceId };
    setAnswers(newAnswers);

    if (isLast) {
      // 마지막 질문 → 저장 후 챕터 1
      setSaving(true);
      try {
        await fetch(`/api/lives/${lifeId}/answers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: newAnswers }),
        });
      } catch {
        // 저장 실패해도 진행
      }
      router.push(`/play/${lifeId}/chapter/1/intro`);
    } else {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  }

  if (loading || !currentQ) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-text-caption border-t-text rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* 진행 바 */}
      <div className="w-full h-0.5 bg-white/5">
        <motion.div
          className="h-full bg-accent-jade/60"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <div className="flex-1 flex flex-col max-w-game mx-auto w-full px-screen-x py-10">

        {/* 상단 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-10"
        >
          <p className="era-label mb-1">첫 번째 장 — 당신은 어떤 사람인가</p>
          <p className="text-text-caption text-xs">
            {currentIndex + 1} / {questions.length}
          </p>
        </motion.div>

        {/* 질문 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -24 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {/* 질문 본문 */}
            <div className="hanji-card p-6 mb-8">
              <p className="font-serif text-lg text-text leading-relaxed mb-2">
                {currentQ.text}
              </p>
              {currentQ.subtext && (
                <p className="text-text-muted text-sm leading-relaxed opacity-70">
                  {currentQ.subtext}
                </p>
              )}
            </div>

            {/* 선택지 */}
            <div className="space-y-3">
              {currentQ.choices.map((choice) => {
                const isSelected = answers[currentQ.id] === choice.id;
                return (
                  <motion.button
                    key={choice.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleChoice(choice.id)}
                    disabled={saving}
                    className={`w-full text-left rounded-xl border px-5 py-4 transition-all ${
                      isSelected
                        ? "border-accent-jade/50 bg-accent-jade/8 text-text"
                        : "border-white/10 hover:border-white/25 hover:bg-white/3 text-text-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-accent-jade bg-accent-jade text-bg text-xs"
                          : "border-white/20 text-text-caption"
                      }`}>
                        {isSelected ? "✓" : choice.id}
                      </span>
                      <span className="text-sm leading-relaxed">{choice.text}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* 저장 중 표시 */}
            {saving && (
              <div className="flex items-center justify-center gap-2 mt-8 text-text-caption text-sm">
                <div className="w-4 h-4 border-2 border-white/20 border-t-text-caption rounded-full animate-spin" />
                <span>이야기를 준비하는 중...</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* 건너뛰기 */}
        <div className="mt-auto pt-6">
          <button
            onClick={async () => {
              setSaving(true);
              try {
                if (Object.keys(answers).length > 0) {
                  await fetch(`/api/lives/${lifeId}/answers`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ answers }),
                  });
                }
              } catch { /* ignore */ }
              router.push(`/play/${lifeId}/chapter/1/intro`);
            }}
            className="w-full text-center text-xs text-text-caption hover:text-text-muted transition-colors py-2"
          >
            이 단계 건너뛰기 →
          </button>
        </div>
      </div>
    </div>
  );
}
