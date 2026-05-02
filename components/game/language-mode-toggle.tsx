"use client";

import { useLanguageMode, type LanguageMode } from "@/lib/hooks/use-language-mode";

const MODES: { value: LanguageMode; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "mixed", label: "Mixed" },
  { value: "ko", label: "한국어" },
];

export function LanguageModeToggle() {
  const { mode, setMode } = useLanguageMode();

  return (
    <div className="flex items-center gap-0.5 bg-text/5 rounded-full p-0.5">
      {MODES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setMode(value)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            mode === value
              ? "bg-bg text-text shadow-sm"
              : "text-text-caption hover:text-text"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
