"use client";

import { useEffect, useState } from "react";
import { ScenarioCard } from "@/components/scenarios/scenario-card";
import type { Scenario } from "@/lib/types";

export default function RecommendedPage() {
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
      {/* Header */}
      <div className="mb-6 animate-slide-up">
        <p className="era-label mb-1">K-Drama Life</p>
        <h1 className="font-serif text-2xl font-bold text-text">
          당신을 위해 골랐어요
        </h1>
        <p className="text-text-muted text-sm mt-1">어떤 인생을 살아보시겠어요?</p>
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
              출시된 시나리오가 없습니다
            </p>
          )}
        </div>
      )}
    </div>
  );
}
