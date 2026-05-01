"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation"
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GameHeader } from "@/components/layout/game-header";
import { initStats } from "@/lib/utils";

interface Props {
  params: { lifeId: string; n: string };
}

export default function FreeformPage({ params }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lifeId, n } = params;
  const eventNum = searchParams.get("event") ?? "1";

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ narrative: string; statChanges: Record<string, number> } | null>(null);
  const stats = initStats(10);
  const chapter = parseInt(n);
  const age = 9 + chapter - 1;
  const year = 1894 + chapter - 1;

  async function handleSubmit() {
    if (!input.trim() || input.length < 10) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/lives/${lifeId}/freeform`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, chapter, eventNum }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({
        narrative: "당신의 선택이 기록되었습니다.",
        statChanges: {},
      });
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    const nextEvent = parseInt(eventNum) + 1;
    router.push(`/play/${lifeId}/chapter/${n}/event/${nextEvent}`);
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <GameHeader
        chapter={chapter}
        age={age}
        year={year}
        eventProgress={{ current: parseInt(eventNum), total: 6 }}
        stats={stats}
        backHref={`/play/${lifeId}/chapter/${n}/event/${eventNum}`}
        phase={chapter < 7 ? "cradle" : "main"}
      />

      <div className="flex-1 flex flex-col max-w-game mx-auto w-full px-screen-x py-6">
        <div className="animate-slide-up">
          <p className="era-label mb-2">{age}세 · 자유 답변</p>
          <h2 className="font-serif text-xl font-semibold text-text mb-4">
            당신은 어떻게 할 건가요?
          </h2>
        </div>

        {!result ? (
          <div className="flex-1 flex flex-col">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 500))}
              placeholder="당신의 생각을 자유롭게 써주세요. (50자 이상 권장)"
              className="flex-1 min-h-40 w-full p-4 rounded-card bg-bg-card border border-text/10 text-text placeholder:text-text-caption text-base leading-relaxed resize-none focus:outline-none focus:border-accent-maple/40 transition-colors"
            />
            <div className="flex justify-between items-center mt-2 mb-4">
              <span className="text-xs text-text-caption">
                {input.length}자 / 500자
              </span>
              {input.length < 10 && input.length > 0 && (
                <span className="text-xs text-accent-maple">조금 더 써주세요</span>
              )}
            </div>

            <Button
              size="lg"
              fullWidth
              onClick={handleSubmit}
              disabled={input.length < 10 || loading}
            >
              {loading ? (
                <span className="animate-pulse">당신의 선택이 기록되고 있어요...</span>
              ) : (
                "제출하기"
              )}
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="hanji-card p-5 mb-4 border-l-2 border-accent-jade/50">
              <p className="narrative-text text-base leading-relaxed">{result.narrative}</p>

              {Object.keys(result.statChanges).length > 0 && (
                <div className="flex gap-2 flex-wrap mt-4">
                  {Object.entries(result.statChanges).map(([key, delta]) => (
                    <span
                      key={key}
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        delta > 0
                          ? "bg-accent-jade/15 text-accent-jade"
                          : "bg-accent-maple/15 text-accent-maple"
                      }`}
                    >
                      {key} {delta > 0 ? `+${delta}` : delta}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-auto">
              <Button size="lg" fullWidth onClick={handleNext}>
                다음 ▶
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
