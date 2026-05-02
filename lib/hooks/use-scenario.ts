"use client";

import { useState, useEffect } from "react";
import type { Scenario } from "@/lib/types";

export function useScenario(scenarioId: string | null | undefined) {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!scenarioId) {
      setLoading(false);
      return;
    }
    fetch(`/api/scenarios/${scenarioId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setScenario(data?.scenario ?? null))
      .catch(() => setScenario(null))
      .finally(() => setLoading(false));
  }, [scenarioId]);

  return { scenario, loading };
}
