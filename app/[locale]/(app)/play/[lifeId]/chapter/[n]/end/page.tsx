"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLife } from "@/lib/hooks/use-life";
import { useScenario } from "@/lib/hooks/use-scenario";
import { initStats, checkStatDeath, applyStatChanges, getStatWarningLevel } from "@/lib/utils";
import { getStatDeathNarrative, applyNaturalAgingStats, computeStatInteractions } from "@/lib/game/stats";
import { STAT_LABELS } from "@/lib/types";
import type { StatKey, Stats } from "@/lib/types";

interface Props {
  params: { lifeId: string; n: string };
}

export default function ChapterEndPage({ params }: Props) {
  const router = useRouter();
  const { lifeId, n } = params;
  const chapter = parseInt(n);

  const { life } = useLife(lifeId);
  const { scenario, loading: scenarioLoading } = useScenario(life?.scenarioId);

  const cradleStartAge = scenario?.cradleConfig?.cradleStartAge ?? 0;
  const cradleEndAge = scenario?.cradleConfig?.cradleEndAge ?? 0;
  const eraStartYear = scenario?.cradleConfig?.eraStartYear ?? null;
  const t0Chapter = cradleEndAge - cradleStartAge + 1;

  const stats = life?.stats ?? initStats(10);
  const age = cradleStartAge + chapter - 1;
  const year = eraStartYear != null ? eraStartYear + chapter - 1 : null;
  const isT0Chapter = chapter === t0Chapter;

  const savedRef = useRef(false);
  const [interactions, setInteractions] = useState<{ label: string; isDanger: boolean }[]>([]);
  const [deathSaved, setDeathSaved] = useState(false);
  const [chapterLocations, setChapterLocations] = useState<{ nameKo: string; guideNote: string }[]>([]);

  useEffect(() => {
    // scenario가 로드되어야 age가 정확해짐
    if (!life || !scenario || savedRef.current) return;
    savedRef.current = true;

    const aging = applyNaturalAgingStats(stats, age);
    const agedStats = Object.keys(aging).length > 0 ? applyStatChanges(stats, aging) : stats;
    const { newQualities, activatedLabels, dangerLabels } = computeStatInteractions(agedStats);
    const deadStat = checkStatDeath(agedStats);

    const activated = activatedLabels.map((label) => ({
      label,
      isDanger: dangerLabels.includes(label),
    }));
    setInteractions(activated);

    const updates: Record<string, unknown> = { addCompletedChapter: chapter };
    if (Object.keys(aging).length > 0) updates.stats = agedStats;
    if (Object.keys(newQualities).length > 0) {
      updates.qualities = { ...(life.qualities ?? {}), ...newQualities };
    }
    if (deadStat) {
      updates.isFinished = true;
      updates.diedEarlyOfStat = deadStat;
      updates.diedAtAge = age;
      setDeathSaved(true);
    }

    fetch(`/api/lives/${lifeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).catch(() => {});
  }, [life, scenario]); // eslint-disable-line

  useEffect(() => {
    if (!life?.scenarioId) return;
    fetch(`/api/scenarios/${life.scenarioId}/locations`)
      .then((r) => r.json())
      .then((data) => {
        const all = (data.locations ?? []) as { nameKo: string; chapterAge?: number | null; guideNote: string }[];
        const matched = all.filter((l) => l.chapterAge == null || l.chapterAge === age);
        setChapterLocations(matched.slice(0, 3));
      })
      .catch(() => {});
  }, [life?.scenarioId, age]); // eslint-disable-line

  if (!life || scenarioLoading || !scenario) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-text-caption border-t-text rounded-full animate-spin" />
      </div>
    );
  }

  const aging = applyNaturalAgingStats(stats, age);
  const agedStats = Object.keys(aging).length > 0 ? applyStatChanges(stats, aging) : stats;
  const deadStat = checkStatDeath(agedStats);

  if (deadStat) {
    return (
      <DeathScreen
        stat={deadStat}
        stats={agedStats}
        age={age}
        lifeId={lifeId}
        saved={deathSaved}
        onFinish={() => router.push(`/play/${lifeId}/card`)}
      />
    );
  }

  function handleNext() {
    if (isT0Chapter) {
      router.push(`/play/${lifeId}/casting`);
    } else {
      router.push(`/play/${lifeId}/chapter/${chapter + 1}/intro`);
    }
  }

  const ageYearLabel = year != null ? `${age}세 · ${year}년` : `${age}세`;

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <div className="flex-1 flex flex-col max-w-game mx-auto w-full px-screen-x py-8">

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <p className="era-label mb-1">{ageYearLabel}</p>
          <h1 className="font-serif text-2xl font-bold text-text">챕터 {chapter} 마무리</h1>
        </motion.div>

        {/* 이 해의 기록 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="hanji-card p-5 mb-5 border-l-2 border-accent-maple/40"
        >
          <p className="text-xs text-text-caption mb-3 font-medium uppercase tracking-wider">이 해의 기록</p>
          <div className="space-y-2">
            {getChapterSummary(chapter, age, year, isT0Chapter, scenario?.title?.ko).map((line, i) => (
              <p key={i} className="narrative-text text-sm leading-relaxed">{line}</p>
            ))}
          </div>
        </motion.div>

        {/* 스탯 + 경고 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="hanji-card p-5 mb-5"
        >
          <p className="text-xs text-text-caption mb-4 font-medium uppercase tracking-wider">현재 성장 지표</p>
          <StatWarningGrid stats={agedStats} />
        </motion.div>

        {/* 스탯 상호작용 뱃지 */}
        {interactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="mb-5 flex flex-wrap gap-2"
          >
            {interactions.map(({ label, isDanger }) => (
              <span
                key={label}
                className={`text-xs px-3 py-1 rounded-full border font-medium ${
                  isDanger
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : "bg-accent-jade/10 text-accent-jade border-accent-jade/20"
                }`}
              >
                {isDanger ? "⚠ " : "✦ "}{label}
              </span>
            ))}
          </motion.div>
        )}

        {/* 그 해 거쳐간 곳 */}
        {chapterLocations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="hanji-card p-5 mb-5"
          >
            <p className="text-xs text-text-caption mb-3 font-medium uppercase tracking-wider">
              그 해 당신이 거쳐간 곳
            </p>
            <div className="space-y-3">
              {chapterLocations.map((loc) => (
                <div key={loc.nameKo} className="flex items-start gap-3">
                  <span className="text-text-caption text-sm mt-0.5 shrink-0">📍</span>
                  <div>
                    <p className="text-text text-sm font-medium">{loc.nameKo}</p>
                    <p className="text-text-caption text-xs mt-0.5">{loc.guideNote}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* T-0 메시지 */}
        {isT0Chapter && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="hanji-card p-4 mb-5 border border-accent-gold/30 bg-accent-gold/5"
          >
            <p className="text-sm text-text-muted leading-relaxed text-center font-serif italic">
              "이제 당신이 누구인지 알게 될 시간이 왔다."
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

function StatWarningGrid({ stats }: { stats: Stats }) {
  return (
    <div className="space-y-2">
      {(Object.entries(stats) as [StatKey, number][]).map(([key, val]) => {
        const label = STAT_LABELS[key];
        const warning = getStatWarningLevel(val);
        const pct = (val / 50) * 100;

        return (
          <div key={key}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-text-caption">
                {label.icon} {label.ko}
              </span>
              <div className="flex items-center gap-2">
                {warning === "hard" && (
                  <span className="text-xs text-red-400 font-medium animate-pulse">위험</span>
                )}
                {warning === "soft" && (
                  <span className="text-xs text-amber-400 font-medium">주의</span>
                )}
                <span className="text-xs text-text-caption font-mono">{val}</span>
              </div>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  warning === "hard"
                    ? "bg-red-500"
                    : warning === "soft"
                    ? "bg-amber-400"
                    : "bg-accent-jade"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {warning !== "none" && (
              <p className={`text-xs mt-0.5 ${warning === "hard" ? "text-red-400" : "text-amber-400"}`}>
                {warning === "hard"
                  ? val >= 47
                    ? "지나친 빛은 그림자를 만든다. 당신의 영혼이 한쪽으로 기울고 있다."
                    : "위태로운 경계에 서 있다."
                  : val >= 40
                  ? "지나친 빛은 그림자를 만든다."
                  : "이 힘이 더 약해지면 위험하다."}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DeathScreen({
  stat, stats, age, lifeId, saved, onFinish,
}: {
  stat: StatKey;
  stats: Stats;
  age: number;
  lifeId: string;
  saved: boolean;
  onFinish: () => void;
}) {
  const val = stats[stat] ?? 0;
  const narrative = getStatDeathNarrative(stat, val);
  const label = STAT_LABELS[stat];

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-screen-x">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="max-w-game w-full text-center"
      >
        <p className="text-xs text-text-caption mb-6 tracking-widest uppercase">
          {label.icon} {label.ko} — {val <= 0 ? "0" : "20"}
        </p>
        <div className="hanji-card p-6 mb-8 border-l-2 border-accent-maple">
          <p className="font-serif text-lg text-text leading-relaxed mb-4">{age}세.</p>
          <p className="narrative-text leading-relaxed text-text-muted">{narrative}</p>
        </div>
        <p className="text-xs text-text-caption mb-8 opacity-60">
          이 결말은 전체 플레이어 중 극소수만 맞이합니다.
        </p>
        <Button size="lg" fullWidth onClick={onFinish}>
          인생 카드 받기 ▶
        </Button>
      </motion.div>
    </div>
  );
}

function getChapterSummary(
  chapter: number,
  age: number,
  year: number | null,
  isT0: boolean,
  scenarioTitle?: string
): string[] {
  const yearStr = year != null ? `${year}년` : "";
  const ageYear = yearStr ? `${age}세, ${yearStr}.` : `${age}세.`;

  if (isT0) {
    return [
      `${age}세. 크레이들의 마지막 해.`,
      "이제 당신이 걸어온 길이 당신이 누구인지를 결정할 것이다.",
    ];
  }

  return [
    ageYear,
    scenarioTitle
      ? `${scenarioTitle}의 세계에서 당신의 이야기가 한 해 더 쌓였다.`
      : "당신의 이야기가 계속되고 있다.",
  ];
}
