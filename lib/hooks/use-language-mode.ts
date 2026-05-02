"use client";

import { useState, useEffect } from "react";

export type LanguageMode = "en" | "mixed" | "ko";

const STORAGE_KEY = "kdl_language_mode";

export function useLanguageMode() {
  const [mode, setMode] = useState<LanguageMode>("en");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageMode | null;
    if (saved && ["en", "mixed", "ko"].includes(saved)) setMode(saved);
  }, []);

  function updateMode(next: LanguageMode) {
    setMode(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  return { mode, setMode: updateMode };
}
