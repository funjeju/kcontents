"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
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
): { events: ChapterEvent[] | null; loading: boolean; generating: boolean; error: boolean; retry: () => void } {
  const locale = useLocale();
  const [events, setEvents] = useState<ChapterEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setRetryCount((n) => n + 1);
    setError(false);
    setEvents(null);
    setLoading(true);
  }, []);

  useEffect(() => {
    if (!scenarioId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setGenerating(false);
    setError(false);

    const localeParam = locale === "en" ? "?locale=en" : "";

    async function load() {
      const r = await fetch(`/api/scenarios/${scenarioId}/chapters/${chapterNum}${localeParam}`);
      if (!cancelled && r.ok) {
        const data = await r.json();
        const firstNarrative: string = data?.events?.[0]?.narrative ?? "";
        const hasMetaPhrase = /\d+세의\s*(당신|주인공)/.test(firstNarrative);
        if (data?.events?.length > 0 && firstNarrative.length >= 100 && !hasMetaPhrase) {
          setEvents(data.events);
          return;
        }
      }

      if (!cancelled) setGenerating(true);
      const genR = await fetch(
        `/api/scenarios/${scenarioId}/chapters/${chapterNum}/generate${localeParam}`,
        { method: "POST" }
      );
      if (!cancelled) {
        if (genR.ok) {
          const genData = await genR.json();
          if (genData?.events?.length > 0) {
            setEvents(genData.events);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
        setGenerating(false);
      }
    }

    load()
      .catch(() => { if (!cancelled) { setError(true); setGenerating(false); } })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [scenarioId, chapterNum, locale, retryCount]);

  return { events, loading, generating, error, retry };
}
