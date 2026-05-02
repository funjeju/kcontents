import type { Life, Scenario, CastingRole } from "../types";
import { evaluateCastingConditions } from "../utils";

export function determineCasting(life: Life, scenario: Scenario): string {
  const lifeCtx = { stats: life.stats ?? {}, qualities: life.qualities ?? {}, familyBackground: life.familyBackground ?? "" };

  const nonWitnessRoles = [...scenario.castingRoles]
    .filter((r) => r.id !== "the_witness")
    .sort((a, b) => a.priority - b.priority);

  // 조건을 완전히 만족하는 역할 우선
  for (const role of nonWitnessRoles) {
    if (evaluateCastingConditions(lifeCtx, role.conditions ?? {})) {
      return role.id;
    }
  }

  // 아무 역할도 매칭 안 되면: conditions가 빈 객체인 역할 중 첫 번째 선택
  const emptyConditionRole = nonWitnessRoles.find((r) => {
    const c = r.conditions ?? {};
    return (
      Object.keys(c.requiredStats ?? {}).length === 0 &&
      Object.keys(c.requiredQualities ?? {}).length === 0 &&
      !c.requiredFamilyBackground?.length
    );
  });
  if (emptyConditionRole) return emptyConditionRole.id;

  // 최후 폴백: 목격자(마지막 priority)
  const witness = scenario.castingRoles.find((r) => r.id === "the_witness");
  return witness?.id ?? scenario.castingRoles[scenario.castingRoles.length - 1]?.id ?? "the_witness";
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
