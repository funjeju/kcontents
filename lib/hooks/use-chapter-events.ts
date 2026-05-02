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
): { events: ChapterEvent[] | null; loading: boolean; generating: boolean } {
  const [events, setEvents] = useState<ChapterEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!scenarioId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setGenerating(false);

    async function load() {
      const r = await fetch(`/api/scenarios/${scenarioId}/chapters/${chapterNum}`);
      if (!cancelled && r.ok) {
        const data = await r.json();
        if (data?.events?.length > 0) {
          setEvents(data.events);
          return;
        }
      }

      // Not in Firestore — generate on-demand
      if (!cancelled) setGenerating(true);
      const genR = await fetch(
        `/api/scenarios/${scenarioId}/chapters/${chapterNum}/generate`,
        { method: "POST" }
      );
      if (!cancelled) {
        if (genR.ok) {
          const genData = await genR.json();
          setEvents(genData?.events ?? null);
        } else {
          setEvents(null);
        }
        setGenerating(false);
      }
    }

    load()
      .catch(() => { if (!cancelled) { setEvents(null); setGenerating(false); } })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [scenarioId, chapterNum]);

  return { events, loading, generating };
}
