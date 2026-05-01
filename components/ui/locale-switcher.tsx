"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  ko: "한국어",
  en: "English",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(next: string) {
    router.replace(pathname, { locale: next as "ko" | "en" });
  }

  return (
    <div className="flex rounded-button border border-text/10 overflow-hidden">
      {routing.locales.map((l) => (
        <button
          key={l}
          onClick={() => handleChange(l)}
          className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
            locale === l
              ? "bg-accent-maple text-white"
              : "bg-bg text-text-muted hover:bg-bg-card"
          }`}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
