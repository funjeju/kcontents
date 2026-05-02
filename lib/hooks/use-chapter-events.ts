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
        const firstNarrative: string = data?.events?.[0]?.narrative ?? "";
        const hasMetaPhrase = /\d+세의\s*(당신|주인공)/.test(firstNarrative);
        if (data?.events?.length > 0 && firstNarrative.length >= 100 && !hasMetaPhrase) {
          setEvents(data.events);
          return;
        }
      }

      // Not in Firestore or narrative too short — generate on-demand
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
