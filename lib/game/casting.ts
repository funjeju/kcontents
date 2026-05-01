import type { Life, Scenario, CastingRole } from "../types";
import { evaluateCastingConditions } from "../utils";

export function determineCasting(life: Life, scenario: Scenario): string {
  const sortedRoles = [...scenario.castingRoles]
    .filter((r) => r.id !== "the_witness")
    .sort((a, b) => a.priority - b.priority);

  for (const role of sortedRoles) {
    if (
      evaluateCastingConditions(
        { stats: life.stats, qualities: life.qualities, familyBackground: life.familyBackground },
        role.conditions
      )
    ) {
      return role.id;
    }
  }

  return "the_witness";
}

export function getCastingRole(scenario: Scenario, roleId: string): CastingRole | undefined {
  return scenario.castingRoles.find((r) => r.id === roleId);
}

export function buildT0Context(life: Life, scenario: Scenario, roleId: string) {
  const role = getCastingRole(scenario, roleId);
  return {
    characterName: life.characterName,
    castingRoleId: roleId,
    castingRoleName: role?.name ?? { ko: "목격자", en: "Witness" },
    castingDescription: role?.shortDescription ?? { ko: "", en: "" },
    scenarioTitle: scenario.title,
    stats: life.stats,
    qualities: life.qualities,
  };
}
