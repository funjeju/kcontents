"use client";

import { useState, useEffect } from "react";

export function useChapterImage(
  scenarioId: string | null | undefined,
  chapterNum: number,
  // 이벤트가 로드된 후에 전달
  firstNarrative: string | null,
  scenarioTitle: string | null | undefined,
  era: string | null | undefined
): { imageUrl: string | null; loading: boolean } {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!scenarioId || !firstNarrative) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function load() {
      // 1) 캐시된 URL 먼저 확인
      const r = await fetch(`/api/scenarios/${scenarioId}/chapters/${chapterNum}/image`);
      if (!cancelled && r.ok) {
        const data = await r.json();
        if (data.imageUrl) {
          setImageUrl(data.imageUrl);
          setLoading(false);
          return;
        }
      }

      // 2) 없으면 생성 요청 (비로그인 guest 포함, 인증 불필요)
      const gen = await fetch(
        `/api/scenarios/${scenarioId}/chapters/${chapterNum}/image`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            narrative: firstNarrative,
            scenarioTitle: scenarioTitle ?? "",
            era: era ?? "",
          }),
        }
      );
      if (!cancelled && gen.ok) {
        const data = await gen.json();
        setImageUrl(data.imageUrl ?? null);
      }
      if (!cancelled) setLoading(false);
    }

    load().catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [scenarioId, chapterNum, firstNarrative, scenarioTitle, era]);

  return { imageUrl, loading };
}
