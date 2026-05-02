"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import type { Stats } from "@/lib/types";

export interface KoreanLesson {
  word: string;
  romanization: string;
  meaning: string;
  culturalNote: string;
}

export interface ChapterEvent {
  narrative: string;
  narrativeKo?: string; // mixed/ko 모드용 한국어 내러티브
  choices: { id: string; text: string }[];
  choicesKo?: { id: string; text: string }[]; // ko 모드용 한국어 선택지
  outcomes: {
    A: { statChanges: Partial<Stats>; resultNarrative: string };
    B: { statChanges: Partial<Stats>; resultNarrative: string };
  };
  outcomesKo?: {
    A: { statChanges: Partial<Stats>; resultNarrative: string };
    B: { statChanges: Partial<Stats>; resultNarrative: string };
  };
  koreanLessons?: KoreanLesson[];
}

async function fetchOrGenerate(
  scenarioId: string,
  chapterNum: number,
  localeParam: string
): Promise<ChapterEvent[] | null> {
  const r = await fetch(`/api/scenarios/${scenarioId}/chapters/${chapterNum}${localeParam}`);
  if (r.ok) {
    const data = await r.json();
    const firstNarrative: string = data?.events?.[0]?.narrative ?? "";
    const hasMetaPhrase = /\d+세의\s*(당신|주인공)/.test(firstNarrative);
    if (data?.events?.length > 0 && firstNarrative.length >= 100 && !hasMetaPhrase) {
      return data.events as ChapterEvent[];
    }
  }
  const genR = await fetch(
    `/api/scenarios/${scenarioId}/chapters/${chapterNum}/generate${localeParam}`,
    { method: "POST" }
  );
  if (genR.ok) {
    const genData = await genR.json();
    if (genData?.events?.length > 0) return genData.events as ChapterEvent[];
  }
  return null;
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

    function prefetchNext(nextChapter: number) {
      fetch(`/api/scenarios/${scenarioId}/chapters/${nextChapter}${localeParam}`)
        .then((r) => r.json())
        .then((data) => {
          const firstNarrative: string = data?.events?.[0]?.narrative ?? "";
          const hasMetaPhrase = /\d+세의\s*(당신|주인공)/.test(firstNarrative);
          if (!data?.events?.length || firstNarrative.length < 100 || hasMetaPhrase) {
            fetch(
              `/api/scenarios/${scenarioId}/chapters/${nextChapter}/generate${localeParam}`,
              { method: "POST" }
            ).catch(() => {});
          }
        })
        .catch(() => {});
    }

    async function load() {
      if (!cancelled) setGenerating(false);

      // 영문 로케일: EN 이벤트 로드 + 병렬로 한국어 이벤트도 로드 (mixed/ko 모드 대비)
      if (locale === "en") {
        const [enEvents, koEvents] = await Promise.all([
          fetchOrGenerate(scenarioId!, chapterNum, "?locale=en"),
          fetchOrGenerate(scenarioId!, chapterNum, ""),
        ]);

        if (cancelled) return;

        if (!enEvents) {
          setError(true);
          setGenerating(false);
          return;
        }

        // 한국어 narrative/choices를 EN 이벤트에 병합
        const merged: ChapterEvent[] = enEvents.map((ev, i) => ({
          ...ev,
          narrativeKo: koEvents?.[i]?.narrative,
          choicesKo: koEvents?.[i]?.choices,
          outcomesKo: koEvents?.[i]?.outcomes,
        }));

        setEvents(merged);
        prefetchNext(chapterNum + 1);
      } else {
        // 한국어 로케일
        if (!cancelled) setGenerating(true);
        const koEvents = await fetchOrGenerate(scenarioId!, chapterNum, "");
        if (cancelled) return;
        if (koEvents) {
          setEvents(koEvents);
          prefetchNext(chapterNum + 1);
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
