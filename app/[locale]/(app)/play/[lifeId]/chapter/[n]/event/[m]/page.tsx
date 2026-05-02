"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLife } from "@/lib/hooks/use-life";
import { useScenario } from "@/lib/hooks/use-scenario";
import { useChapterEvents } from "@/lib/hooks/use-chapter-events";
import { motion, AnimatePresence } from "framer-motion";
import { GameHeader } from "@/components/layout/game-header";
import { ChoiceButton } from "@/components/game/choice-button";
import { CardTray } from "@/components/game/card-tray";
import { Button } from "@/components/ui/button";
import { initStats, applyStatChanges } from "@/lib/utils";
import type { Stats } from "@/lib/types";

interface Props {
  params: { lifeId: string; n: string; m: string };
}

type Phase = "reading" | "choosing" | "result" | "done";

export default function EventPage({ params }: Props) {
  const router = useRouter();
  const { lifeId, n, m } = params;
  const chapterNum = parseInt(n);
  const eventNum = parseInt(m);

  const { life, mutate } = useLife(lifeId);
  const { scenario, loading: scenarioLoading } = useScenario(life?.scenarioId);

  const { events: firestoreEvents, loading: eventsLoading, generating, error: eventsError, retry: retryEvents } = useChapterEvents(
    life?.scenarioId,
    chapterNum
  );

  const [phase, setPhase] = useState<Phase>("choosing");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [statDeltas, setStatDeltas] = useState<Partial<Stats>>({});
  const [saving, setSaving] = useState(false);
  const [liveStats, setLiveStats] = useState<Stats | null>(null);

  const baseStats = life?.stats ?? initStats(10);
  const stats = liveStats ?? baseStats;

  // Scenario가 로드되기 전까지는 스피너만 표시 (잘못된 나이 플래시 방지)
  if (!life || scenarioLoading || !scenario) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-text-caption border-t-text rounded-full animate-spin" />
      </div>
    );
  }

  const cradleStartAge = scenario.cradleConfig.cradleStartAge;
  const cradleEndAge = scenario.cradleConfig.cradleEndAge;
  const eraStartYear = scenario.cradleConfig.eraStartYear ?? null;
  const t0Chapter = cradleEndAge - cradleStartAge + 1;

  const age = cradleStartAge + chapterNum - 1;
  const year = eraStartYear != null ? eraStartYear + chapterNum - 1 : null;
  const isT0Chapter = chapterNum === t0Chapter;

  const eventPool = !eventsLoading ? firestoreEvents : null;
  const event = eventPool
    ? eventPool[(eventNum - 1) % eventPool.length] ?? eventPool[0]
    : null;

  const totalEvents = eventPool?.length ?? 6;

  async function handleChoice(choiceId: string) {
    if (phase !== "choosing") return;

    if (choiceId === "C") {
      router.push(`/play/${lifeId}/chapter/${n}/freeform?event=${m}`);
      return;
    }

    setSelectedChoice(choiceId);
    setPhase("result");

    const outcome = choiceId === "A" ? event!.outcomes.A : event!.outcomes.B;
    setStatDeltas(outcome.statChanges);

    mutate({ stats: applyStatChanges(stats, outcome.statChanges) });
    setSaving(true);
    try {
      await fetch(`/api/lives/${lifeId}/events/${chapterNum}-${eventNum}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statChanges: outcome.statChanges }),
      });
    } catch {
      // UI already updated
    } finally {
      setSaving(false);
    }
  }

  function handleNext() {
    const nextEventNum = eventNum + 1;
    if (isT0Chapter && nextEventNum > 1) {
      router.push(`/play/${lifeId}/casting`);
      return;
    }
    if (nextEventNum > totalEvents) {
      router.push(`/play/${lifeId}/chapter/${n}/end`);
    } else {
      router.push(`/play/${lifeId}/chapter/${n}/event/${nextEventNum}`);
    }
  }

  const ageYearLabel = year != null ? `${age}세 · ${year}년` : `${age}세`;
  const headerPhase = chapterNum <= t0Chapter ? "cradle" : "main";

  // Loading skeleton (events loading or being generated)
  if (!event) {
    return (
      <div className="h-dvh bg-bg flex flex-col">
        <GameHeader
          chapter={chapterNum} age={age} year={year ?? undefined}
          eventProgress={{ current: eventNum, total: 6 }}
          stats={stats}
          backHref={`/play/${lifeId}/chapter/${n}/intro`}
          phase={headerPhase}
        />
        <div className="flex-1 flex flex-col max-w-game mx-auto w-full px-screen-x py-6">
          <p className="era-label mb-4">{ageYearLabel}</p>
          {eventsError ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-4">
              <p className="text-text-muted text-sm">이야기를 불러오지 못했어요</p>
              <button
                onClick={retryEvents}
                className="px-4 py-2 text-sm rounded-full border border-text/20 text-text hover:border-text/40 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : generating ? (
            <div className="space-y-2">
              <p className="text-xs text-text-caption animate-pulse">이야기를 생성하고 있습니다...</p>
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-text/10 rounded w-3/4" />
                <div className="h-4 bg-text/10 rounded w-full" />
                <div className="h-4 bg-text/10 rounded w-2/3" />
              </div>
            </div>
          ) : (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-text/10 rounded w-3/4" />
              <div className="h-4 bg-text/10 rounded w-full" />
              <div className="h-4 bg-text/10 rounded w-2/3" />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh bg-bg flex flex-col">
      <GameHeader
        chapter={chapterNum}
        age={age}
        year={year ?? undefined}
        eventProgress={{ current: eventNum, total: totalEvents }}
        stats={stats}
        backHref={`/play/${lifeId}/chapter/${n}/intro`}
        phase={headerPhase}
      />

      <div className="flex-1 flex flex-col max-w-game mx-auto w-full px-screen-x py-6 overflow-y-auto">
        <p className="era-label mb-4">{ageYearLabel}</p>

        <AnimatePresence mode="wait">
          <motion.div
            key={`narrative-${eventNum}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="event-narrative mb-6"
          >
            {event.narrative.split("\n").map((line, i) => (
              <p key={i} className={i > 0 ? "mt-3" : ""}>{line}</p>
            ))}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {phase === "result" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="hanji-card p-4 mb-4 border-l-2 border-accent-maple/40"
            >
              <p className="text-sm text-text leading-relaxed">
                {selectedChoice === "A"
                  ? event.outcomes.A.resultNarrative
                  : event.outcomes.B.resultNarrative}
              </p>
              {Object.entries(statDeltas).length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {Object.entries(statDeltas).map(([key, delta]) => (
                    delta !== 0 && (
                      <span
                        key={key}
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          (delta ?? 0) > 0
                            ? "bg-accent-jade/15 text-accent-jade"
                            : "bg-accent-maple/15 text-accent-maple"
                        }`}
                      >
                        {key} {(delta ?? 0) > 0 ? `+${delta}` : delta}
                      </span>
                    )
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {(phase === "reading" || phase === "choosing") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="choices-container mt-6"
          >
            <p className="text-xs text-text-caption mb-3">당신은:</p>
            {event.choices.map((choice) => (
              <ChoiceButton
                key={choice.id}
                choiceId={choice.id}
                text={choice.text}
                onSelect={handleChoice}
                isFreeform={choice.id === "C"}
              />
            ))}

            {life?.selectedHeroCardSlots && life.selectedHeroCardSlots.length > 0 && (
              <CardTray
                lifeId={lifeId}
                scenarioId={life.scenarioId}
                selectedCardIds={life.selectedHeroCardSlots}
                usedCards={life.usedHeroCards ?? []}
                stats={stats}
                chapterNum={chapterNum}
                onCardUsed={(_cardId, newStats) => {
                  setLiveStats(newStats);
                  mutate({ stats: newStats });
                }}
              />
            )}
          </motion.div>
        )}

        {phase === "result" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-4 pb-2"
          >
            <Button size="lg" fullWidth onClick={handleNext}>
              {eventNum >= totalEvents ? "챕터 마무리 ▶" : "다음 ▶"}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
