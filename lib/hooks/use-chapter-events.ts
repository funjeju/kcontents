"use client";

import { useState, useEffect } from "react";
import type { Stats } from "@/lib/types";

export interface ChapterEvent {
  narrative: string;
  choices: { id: string; text: string }[];
  outcomes: {
    A: { statChanges: Partial<Stats>; resultNarrative: string };
    B: { statChanges: Partial<Stats>; resultNarrative: string };
  };
}

export function useChapterEvents(
  scenarioId: string | null | undefined,
  chapterNum: number
): { events: ChapterEvent[] | null; loading: boolean } {
  const [events, setEvents] = useState<ChapterEvent[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!scenarioId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/scenarios/${scenarioId}/chapters/${chapterNum}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setEvents(data?.events ?? null);
      })
      .catch(() => {
        if (!cancelled) setEvents(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [scenarioId, chapterNum]);

  return { events, loading };
}
