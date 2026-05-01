import type { Life, Scenario, Ending } from "../types";
import { evaluateCastingConditions } from "../utils";

export function selectEligibleEnding(life: Life, scenario: Scenario): Ending | null {
  const role = scenario.castingRoles.find((r) => r.id === life.castingRole);
  if (!role) return null;

  const endingPool = scenario.endings.filter((e) => e.castingRoleId === life.castingRole);
  const sorted = [...endingPool].sort((a, b) => a.priority - b.priority);

  for (const ending of sorted) {
    if (matchesEndingConditions(life, ending.conditions)) {
      return ending;
    }
  }

  return sorted[sorted.length - 1] ?? null;
}

function matchesEndingConditions(
  life: Life,
  conditions: {
    requiredStats?: Record<string, number>;
    requiredQualities?: Record<string, number>;
    requiredPathVariables?: Record<string, unknown>;
  }
): boolean {
  if (conditions.requiredStats) {
    for (const [key, min] of Object.entries(conditions.requiredStats)) {
      if ((life.stats[key as keyof typeof life.stats] ?? 0) < min) return false;
    }
  }
  if (conditions.requiredQualities) {
    for (const [key, min] of Object.entries(conditions.requiredQualities)) {
      const val = life.qualities[key] as number ?? 0;
      if (val < min) return false;
    }
  }
  if (conditions.requiredPathVariables) {
    for (const [key, val] of Object.entries(conditions.requiredPathVariables)) {
      if (life.pathVariables[key as keyof typeof life.pathVariables] !== val) return false;
    }
  }
  return true;
}

export function isT0Chapter(life: Life, scenario: Scenario): boolean {
  return life.age === scenario.cradleConfig.cradleEndAge;
}

export function isMainStoryEnd(life: Life, scenario: Scenario): boolean {
  return life.age >= scenario.mainStoryEndAge;
}
