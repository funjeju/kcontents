"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { STANDARD_CARDS, CARD_CATEGORY_LABELS, CARD_RARITY_LABELS, CARD_TIMING_LABELS } from "@/data/cards";
import { applyStatChanges } from "@/lib/utils";
import type { GameCard, Stats } from "@/lib/types";

interface CardTrayProps {
  lifeId: string;
  scenarioId: string;
  selectedCardIds: string[];
  usedCards: { cardId: string; usedAtChapter: number }[];
  stats: Stats;
  chapterNum: number;
  onCardUsed: (cardId: string, newStats: Stats) => void;
}

export function CardTray({
  lifeId,
  scenarioId,
  selectedCardIds,
  usedCards,
  stats,
  chapterNum,
  onCardUsed,
}: CardTrayProps) {
  const [open, setOpen] = useState(false);
  const [customCards, setCustomCards] = useState<GameCard[]>([]);
  const [using, setUsing] = useState<string | null>(null);
  const [usedThisSession, setUsedThisSession] = useState<string[]>([]);

  useEffect(() => {
    if (!scenarioId) return;
    fetch(`/api/scenarios/${scenarioId}/cards`)
      .then((r) => r.json())
      .then((d) => setCustomCards(d.cards ?? []))
      .catch(() => {});
  }, [scenarioId]);

  const allCards = [...STANDARD_CARDS, ...customCards];
  const selectedCards = selectedCardIds
    .map((id) => allCards.find((c) => c.id === id))
    .filter(Boolean) as GameCard[];

  const usedCardIds = new Set([
    ...usedCards.map((u) => u.cardId),
    ...usedThisSession,
  ]);

  const unusedCount = selectedCards.filter((c) => !usedCardIds.has(c.id)).length;

  function canUseNow(card: GameCard): boolean {
    if (usedCardIds.has(card.id)) return false;
    if (card.usageTiming === "anytime") return true;
    if (card.usageTiming === "stat_warning") {
      // 스탯 최대 50 기준 — hard warning 임계값과 동일하게 맞춤
      return Object.values(stats).some((v) => v <= 3 || v >= 47);
    }
    return false;
  }

  async function handleUse(card: GameCard) {
    if (!canUseNow(card) || using) return;
    setUsing(card.id);

    const statEffect = card.statEffect ?? {};
    const newStats =
      Object.keys(statEffect).length > 0
        ? applyStatChanges(stats, statEffect)
        : stats;

    try {
      await fetch(`/api/lives/${lifeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addUsedHeroCard: { cardId: card.id, usedAtChapter: chapterNum },
          ...(Object.keys(statEffect).length > 0 ? { stats: newStats } : {}),
        }),
      });
      setUsedThisSession((prev) => [...prev, card.id]);
      onCardUsed(card.id, newStats);
    } catch {
      // silent
    } finally {
      setUsing(null);
    }
  }

  if (selectedCards.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-xs text-text-caption border border-white/10 rounded-lg px-4 py-2 hover:bg-white/5 transition-colors flex items-center justify-between"
      >
        <span>
          🃏 보유 카드{" "}
          <span className={unusedCount > 0 ? "text-accent-jade" : "text-text-caption"}>
            ({unusedCount}/{selectedCards.length})
          </span>
        </span>
        <span className="text-text-caption">{open ? "▲" : "▼"}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2 pb-2">
              {selectedCards.map((card) => {
                const isUsed = usedCardIds.has(card.id);
                const usable = canUseNow(card);
                const catLabel = CARD_CATEGORY_LABELS[card.category];
                const rarLabel = CARD_RARITY_LABELS[card.rarity];
                const timingLabel = CARD_TIMING_LABELS[card.usageTiming];

                return (
                  <div
                    key={card.id}
                    className={`hanji-card p-4 transition-opacity ${isUsed ? "opacity-40" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${catLabel.color}`}
                          >
                            {catLabel.ko}
                          </span>
                          <span className={`text-xs font-medium ${rarLabel.color}`}>
                            {rarLabel.ko}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-text leading-tight">
                          {card.nameKo}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {isUsed ? (
                          <span className="text-xs text-text-caption">사용됨</span>
                        ) : usable ? (
                          <button
                            disabled={using === card.id}
                            onClick={() => handleUse(card)}
                            className="text-xs px-3 py-1 bg-accent-jade/20 text-accent-jade border border-accent-jade/30 rounded-full hover:bg-accent-jade/30 transition-colors disabled:opacity-50"
                          >
                            {using === card.id ? "..." : "사용"}
                          </button>
                        ) : (
                          <span className="text-xs text-text-caption text-right leading-tight max-w-[80px] block">
                            {timingLabel ?? card.usageTiming}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-text-muted leading-relaxed">
                      {card.descriptionKo}
                    </p>
                    {!isUsed && (
                      <p className="text-xs text-text-caption mt-1 leading-relaxed">
                        → {card.effectKo}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
