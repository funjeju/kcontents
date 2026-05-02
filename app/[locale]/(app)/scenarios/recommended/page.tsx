"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { ScenarioCard } from "@/components/scenarios/scenario-card";
import type { Scenario } from "@/lib/types";

export default function RecommendedPage() {
  const locale = useLocale();
  const isEn = locale === "en";
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scenarios")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) console.error("[scenarios]", data.error);
        setScenarios(data.scenarios ?? []);
      })
      .catch((e) => console.error("[scenarios fetch]", e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto px-4 py-6 w-full max-w-game lg:max-w-[1100px] lg:px-8">

      {/* 글로벌 유저 전용 히어로 배너 */}
      {isEn && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl bg-gradient-to-br from-accent-maple/10 to-accent-jade/10 border border-accent-maple/15 p-6"
        >
          <p className="text-xs text-accent-maple font-medium tracking-widest uppercase mb-2">K-Drama Life · Global</p>
          <h2 className="font-serif text-2xl font-bold text-text mb-2 leading-tight">
            Live inside your favorite K-drama.<br />
            <span className="text-accent-jade">Learn Korean along the way.</span>
          </h2>
          <p className="text-sm text-text-muted leading-relaxed mb-4">
            Step into historical Korea as a character. Every scene teaches you real Korean words and cultural context — not textbook, but the language people actually lived.
          </p>
          <div className="flex gap-4 flex-wrap">
            {[
              { icon: "🎭", text: "Live a full life in K-drama eras" },
              { icon: "🇰🇷", text: "Learn Korean through the story" },
              { icon: "✦", text: "EN · Mixed · 한국어 mode toggle" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs text-text-muted">
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 헤더 */}
      <div className="mb-6 animate-slide-up">
        <p className="era-label mb-1">K-Drama Life</p>
        <h1 className="font-serif text-2xl font-bold text-text">
          {isEn ? "Choose your era" : "당신을 위해 골랐어요"}
        </h1>
        <p className="text-text-muted text-sm mt-1">
          {isEn ? "Which life will you live?" : "어떤 인생을 살아보시겠어요?"}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="hanji-card h-48 animate-pulse bg-text/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in">
          {scenarios.length > 0 ? (
            scenarios.map((scenario, i) => (
              <ScenarioCard key={scenario.id} scenario={scenario} featured={i === 0} />
            ))
          ) : (
            <p className="text-text-caption text-sm text-center py-8 col-span-full">
              {isEn ? "No scenarios available yet" : "출시된 시나리오가 없습니다"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
