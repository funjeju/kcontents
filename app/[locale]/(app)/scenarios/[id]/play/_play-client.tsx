"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { Scenario, FamilyBackground } from "@/lib/types";
import { cn } from "@/lib/utils";

const SUGGESTED_NAMES = [
  ["김아연", "이수민", "박소희"],
  ["최명준", "한동혁", "이준영"],
];

export function PlayClient({ scenario }: { scenario: Scenario }) {
  const router = useRouter();
  const [characterName, setCharacterName] = useState("");
  const [selectedBg, setSelectedBg] = useState<string | null>(null);
  const [namePool] = useState(() => [
    ...SUGGESTED_NAMES[0],
    ...SUGGESTED_NAMES[1],
  ]);
  const startAge = scenario.cradleConfig?.cradleStartAge ?? 0;
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    if (!characterName || !selectedBg) return;
    setLoading(true);
    try {
      const res = await fetch("/api/lives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: scenario.id,
          characterName,
          familyBackground: selectedBg,
        }),
      });

      if (res.status === 401) {
        // 비로그인 — sessionStorage에 guest life 저장 후 진행
        const bg = scenario.familyBackgrounds?.find((b) => b.id === selectedBg);
        const baseStats = { intellect: 22, creativity: 22, emotion: 22, physique: 22, sociability: 22, morality: 22 };
        const stats = bg?.initialStats
          ? Object.fromEntries(
              Object.entries(baseStats).map(([k, v]) => [k, v + (bg.initialStats[k as keyof typeof bg.initialStats] ?? 0)])
            )
          : baseStats;
        const guestLife = {
          id: `guest_${Date.now()}`,
          characterName,
          scenarioId: scenario.id,
          scenarioTitle: scenario.title?.ko ?? null,
          familyBackground: selectedBg,
          stats,
          qualities: {},
          castingRole: null,
          age: startAge,
          isFinished: false,
          endingId: null,
          endingNarrative: null,
          completedChapters: [],
          selectedHeroCardSlots: [],
          usedHeroCards: [],
          lastPlayedAt: null,
          currentChapterId: null,
          currentEventIndex: null,
        };
        sessionStorage.setItem("guestLife", JSON.stringify(guestLife));
        router.push(`/play/${guestLife.id}/intro`);
        return;
      }

      const data = await res.json();
      if (data.lifeId) {
        router.push(`/play/${data.lifeId}/intro`);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="page-container animate-slide-up">
      <div className="mb-6">
        <p className="era-label">{scenario.subtitle?.ko}</p>
        <h1 className="font-serif text-2xl font-bold text-text mt-1">
          {startAge}세. 당신의 이름은?
        </h1>
      </div>

      {/* Name selection */}
      <div className="hanji-card p-5 mb-5">
        <h2 className="font-serif font-semibold text-text mb-3 text-sm">캐릭터 이름</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {namePool.map((name) => (
            <button
              key={name}
              onClick={() => setCharacterName(name)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border transition-all",
                characterName === name
                  ? "bg-accent-maple text-white border-accent-maple"
                  : "bg-bg text-text-muted border-text/10 hover:border-text/20"
              )}
            >
              {name}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value.slice(0, 10))}
          placeholder="직접 입력 (2~10자)"
          className="w-full h-10 px-3 rounded-button bg-bg border border-text/10 text-text text-sm placeholder:text-text-caption focus:outline-none focus:border-accent-maple/50 transition-colors"
          minLength={2}
          maxLength={10}
        />
      </div>

      {/* Family background */}
      {scenario.familyBackgrounds?.length > 0 && (
        <div className="mb-6">
          <h2 className="font-serif font-semibold text-text mb-3">
            {characterName || "당신"}의 가족 배경
          </h2>
          <div className="space-y-2">
            {scenario.familyBackgrounds.map((bg) => (
              <FamilyBgCard
                key={bg.id}
                bg={bg}
                selected={selectedBg === bg.id}
                onSelect={() => setSelectedBg(bg.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Selected preview */}
      {characterName && selectedBg && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="hanji-card p-4 mb-5 border border-accent-maple/20"
        >
          <p className="font-serif text-text text-sm leading-relaxed">
            <span className="text-accent-maple font-medium">{characterName}</span>은(는){" "}
            {startAge}세입니다.{" "}
            {scenario.familyBackgrounds?.find((b) => b.id === selectedBg)?.descriptionKo}
          </p>
        </motion.div>
      )}

      <Button
        size="lg"
        fullWidth
        onClick={handleStart}
        disabled={!characterName || !selectedBg || loading}
      >
        {loading ? "인생 시작 중..." : "▶ 인생 시작하기"}
      </Button>
    </div>
  );
}

function FamilyBgCard({
  bg,
  selected,
  onSelect,
}: {
  bg: FamilyBackground;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-card p-4 border transition-all",
        selected
          ? "border-accent-maple bg-accent-maple/5 shadow-paper"
          : "border-text/10 bg-bg-card hover:border-text/20"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className={cn("font-medium text-sm", selected ? "text-text" : "text-text-muted")}>
            {bg.nameKo}
          </p>
          <p className="text-xs text-text-caption mt-1 leading-relaxed">{bg.descriptionKo}</p>
        </div>
        {selected && (
          <span className="shrink-0 w-5 h-5 rounded-full bg-accent-maple flex items-center justify-center text-white text-xs">
            ✓
          </span>
        )}
      </div>
      {Object.keys(bg.initialStats).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {Object.entries(bg.initialStats).map(([stat, delta]) => (
            <span key={stat} className="text-xs bg-accent-jade/10 text-accent-jade px-2 py-0.5 rounded-full">
              {stat} +{delta}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
