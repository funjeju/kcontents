import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Stats, StatKey, Life } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initStats(base = 10): Stats {
  return {
    intellect: base,
    creativity: base,
    emotion: base,
    physique: base,
    sociability: base,
    morality: base,
  };
}

export function clampStat(value: number): number {
  return Math.max(0, Math.min(20, value));
}

export function applyStatChanges(stats: Stats, changes: Partial<Stats>): Stats {
  const result = { ...stats };
  for (const [key, delta] of Object.entries(changes)) {
    if (delta !== undefined) {
      result[key as StatKey] = clampStat((result[key as StatKey] ?? 0) + delta);
    }
  }
  return result;
}

export function checkStatDeath(stats: Stats): StatKey | null {
  for (const [key, val] of Object.entries(stats)) {
    if (val <= 0 || val >= 20) return key as StatKey;
  }
  return null;
}

export function formatAge(age: number): string {
  return `${age}세`;
}

export function formatYear(baseYear: number, age: number, cradleStartAge: number): number {
  return baseYear + (age - cradleStartAge);
}

export function rarityLabel(pct: number): string {
  if (pct < 1) return "전설적";
  if (pct < 5) return "희귀";
  if (pct < 15) return "이색적";
  if (pct < 40) return "특별한";
  return "일반적";
}

export function getStatColor(key: StatKey): string {
  const colors: Record<StatKey, string> = {
    intellect: "#5B514B",
    creativity: "#C9302C",
    emotion: "#A87C50",
    physique: "#5C8E76",
    sociability: "#8B5A2B",
    morality: "#D4AF37",
  };
  return colors[key];
}

export function evaluateCastingConditions(
  life: Pick<Life, "stats" | "qualities" | "familyBackground">,
  conditions: {
    requiredStats?: Partial<Stats>;
    requiredQualities?: Record<string, number>;
    requiredFamilyBackground?: string[];
    forbiddenQualities?: Record<string, number>;
  }
): boolean {
  const { stats, qualities, familyBackground } = life;

  if (conditions.requiredStats) {
    for (const [key, min] of Object.entries(conditions.requiredStats)) {
      if ((stats[key as StatKey] ?? 0) < (min ?? 0)) return false;
    }
  }

  if (conditions.requiredQualities) {
    for (const [key, min] of Object.entries(conditions.requiredQualities)) {
      const val = typeof qualities[key] === "boolean"
        ? (qualities[key] ? 1 : 0)
        : (qualities[key] as number ?? 0);
      if (val < min) return false;
    }
  }

  if (
    conditions.requiredFamilyBackground &&
    !conditions.requiredFamilyBackground.includes(familyBackground)
  ) {
    return false;
  }

  if (conditions.forbiddenQualities) {
    for (const [key, threshold] of Object.entries(conditions.forbiddenQualities)) {
      const val = qualities[key] as number ?? 0;
      if (val >= threshold) return false;
    }
  }

  return true;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
