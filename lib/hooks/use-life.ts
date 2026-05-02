"use client";

import { useState, useEffect } from "react";
import type { Stats } from "@/lib/types";

export interface LifeData {
  id: string;
  characterName: string;
  scenarioId: string;
  familyBackground: string;
  stats: Stats;
  qualities: Record<string, number | boolean>;
  castingRole: string | null;
  age: number;
  isFinished: boolean;
  endingId: string | null;
  endingNarrative: string | null;
  completedChapters: number[];
  selectedHeroCardSlots: string[];
  usedHeroCards: { cardId: string; usedAtChapter: number }[];
  lastPlayedAt: string | null;
}

interface UseLifeResult {
  life: LifeData | null;
  loading: boolean;
  error: string | null;
  mutate: (updates: Partial<LifeData>) => void;
}

export function useLife(lifeId: string): UseLifeResult {
  const [life, setLife] = useState<LifeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lifeId) return;

    fetch(`/api/lives/${lifeId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch life");
        return res.json();
      })
      .then((data) => {
        setLife(data.life as LifeData);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [lifeId]);

  function mutate(updates: Partial<LifeData>) {
    setLife((prev) => (prev ? { ...prev, ...updates } : prev));
  }

  return { life, loading, error, mutate };
}
