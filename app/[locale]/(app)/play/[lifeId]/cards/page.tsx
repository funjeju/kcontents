"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLife } from "@/lib/hooks/use-life";
import { useScenario } from "@/lib/hooks/use-scenario";
import { STANDARD_CARDS, CARD_CATEGORY_LABELS, CARD_RARITY_LABELS, CARD_TIMING_LABELS } from "@/data/cards";
import type { GameCard } from "@/lib/types";

interface Props {
  params: { lifeId: string };
}

const MAX_SLOTS = 3;

export default function CardSelectionPage({ params }: Props) {
  const router = useRouter();
  const { lifeId } = params;
  const { life } = useLife(lifeId);
  const { scenario } = useScenario(life?.scenarioId);

  const [allCards, setAllCards] = useState<GameCard[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // 커스텀 카드 로드 + 표준 카드 합산
  useEffect(() => {
    if (!life?.scenarioId) return;
    fetch(`/api/admin/scenarios/${life.scenarioId}/cards`)
      .then((r) => r.json())
      .then((data) => {
        const custom = (data.cards ?? []) as GameCard[];
        setAllCards([...STANDARD_CARDS, ...custom]);
      })
      .catch(() => {
        setAllCards(STANDARD_CARDS);
      });
  }, [life?.scenarioId]);

  // 이미 선택된 카드가 있으면 복원
  useEffect(() => {
    if (life?.selectedHeroCardSlots?.length) {
      setSelected(life.selectedHeroCardSlots);
    }
  }, [life]);

  const categories = ["all", "flow", "encounter", "growth", "threshold", "custom"];
  const filtered = activeCategory === "all"
    ? allCards
    : allCards.filter((c) => c.category === activeCategory);

  function toggleCard(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= MAX_SLOTS) return prev;
      return [...prev, id];
    });
  }

  async function handleConfirm() {
    if (selected.length !== MAX_SLOTS) return;
    setSaving(true);
    try {
      await fetch(`/api/lives/${lifeId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedCards: selected }),
      });
      // T-0 챕터 다음 챕터로 이동 (시나리오 cradleConfig 기준)
      const cradleStartAge = scenario?.cradleConfig?.cradleStartAge ?? 12;
      const cradleEndAge = scenario?.cradleConfig?.cradleEndAge ?? 15;
      const t0Chapter = cradleEndAge - cradleStartAge + 1;
      const firstMainChapter = t0Chapter + 1;
      router.push(`/play/${lifeId}/chapter/${firstMainChapter}/intro`);
    } catch {
      setSaving(false);
    }
  }

  if (!life) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-text-caption border-t-text rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <div className="flex-1 flex flex-col max-w-game mx-auto w-full px-screen-x py-8">

        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <p className="era-label mb-1">T-0 직후 — 인생을 걸 패를 고르라</p>
          <h1 className="font-serif text-2xl font-bold text-text">카드 선택</h1>
          <p className="text-text-muted text-sm mt-1">
            이 인생에서 사용할 카드 <strong className="text-text">{MAX_SLOTS}장</strong>을 고르세요.
            한 번 정하면 바꿀 수 없습니다.
          </p>
        </motion.div>

        {/* 선택된 슬롯 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6"
        >
          {Array.from({ length: MAX_SLOTS }).map((_, i) => {
            const cardId = selected[i];
            const card = cardId ? allCards.find((c) => c.id === cardId) : null;
            const catStyle = card ? CARD_CATEGORY_LABELS[card.category]?.color ?? "" : "";
            return (
              <div
                key={i}
                className={`flex-1 rounded-xl border p-3 min-h-[72px] transition-all ${
                  card
                    ? "border-accent-jade/40 bg-accent-jade/5"
                    : "border-white/10 bg-white/2 border-dashed"
                }`}
              >
                {card ? (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-xs px-1 py-0.5 rounded border ${catStyle}`}>
                        {CARD_CATEGORY_LABELS[card.category]?.ko}
                      </span>
                    </div>
                    <p className="text-xs text-text font-medium leading-tight">{card.nameKo}</p>
                    <button
                      onClick={() => toggleCard(card.id)}
                      className="text-xs text-red-400/60 hover:text-red-400 mt-1 transition-colors"
                    >
                      해제
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-text-caption text-xs">{i + 1}번 슬롯</span>
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>

        {/* 카테고리 필터 */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                activeCategory === cat
                  ? "bg-white/15 text-white border-white/30"
                  : "text-text-caption border-white/10 hover:text-text hover:border-white/20"
              }`}
            >
              {cat === "all" ? "전체" : CARD_CATEGORY_LABELS[cat]?.ko ?? cat}
            </button>
          ))}
        </div>

        {/* 카드 목록 */}
        <div className="flex-1 space-y-2 mb-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((card) => {
              const isSelected = selected.includes(card.id);
              const isDisabled = !isSelected && selected.length >= MAX_SLOTS;
              const catStyle = CARD_CATEGORY_LABELS[card.category]?.color ?? "";
              const rarityStyle = CARD_RARITY_LABELS[card.rarity]?.color ?? "text-white/40";

              return (
                <motion.button
                  key={card.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: isDisabled ? 0.4 : 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={() => !isDisabled && toggleCard(card.id)}
                  disabled={isDisabled}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    isSelected
                      ? "border-accent-jade/50 bg-accent-jade/8"
                      : isDisabled
                      ? "border-white/5 cursor-not-allowed"
                      : "border-white/10 hover:border-white/25 hover:bg-white/3"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* 체크 */}
                    <div className={`shrink-0 w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center transition-all ${
                      isSelected ? "bg-accent-jade border-accent-jade" : "border-white/20"
                    }`}>
                      {isSelected && <span className="text-black text-xs">✓</span>}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${catStyle}`}>
                          {CARD_CATEGORY_LABELS[card.category]?.ko}
                        </span>
                        <span className="text-text text-sm font-medium">{card.nameKo}</span>
                        <span className={`text-xs ml-auto ${rarityStyle}`}>
                          {CARD_RARITY_LABELS[card.rarity]?.ko}
                        </span>
                      </div>
                      <p className="text-text-muted text-xs leading-relaxed mb-1.5">{card.descriptionKo}</p>
                      <div className="flex items-center gap-3">
                        <p className="text-text-caption text-xs">
                          ⚡ {card.effectKo}
                        </p>
                        <span className="text-text-caption text-xs ml-auto shrink-0">
                          {CARD_TIMING_LABELS[card.usageTiming]}
                        </span>
                      </div>
                      {card.usageCondition && (
                        <p className="text-text-caption text-xs mt-1 opacity-60">조건: {card.usageCondition}</p>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* 확정 버튼 */}
        <div className="mt-auto">
          <Button
            size="lg"
            fullWidth
            disabled={selected.length !== MAX_SLOTS || saving}
            onClick={handleConfirm}
          >
            {saving
              ? "저장 중..."
              : selected.length === MAX_SLOTS
              ? "이 패로 시작 ▶"
              : `${MAX_SLOTS - selected.length}장 더 선택하세요`}
          </Button>
        </div>
      </div>
    </div>
  );
}
