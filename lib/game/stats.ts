import type { Stats, StatKey, Life } from "../types";
import { clampStat, applyStatChanges, checkStatDeath } from "../utils";

export const STAT_DEATH_NARRATIVES: Record<StatKey, { zero: string; twenty: string }> = {
  intellect: {
    zero: "무지의 함정에 빠져, 당신은 사기꾼의 말을 믿고 모든 것을 잃었습니다.",
    twenty: "지력이 과부하에 달해, 당신은 번아웃과 고립 속에 쓰러졌습니다.",
  },
  creativity: {
    zero: "관습에 갇힌 평생, 당신은 끝내 자신만의 세계를 만들지 못했습니다.",
    twenty: "예술의 광기에 사로잡혀, 당신은 세상과 완전히 단절되었습니다.",
  },
  emotion: {
    zero: "감정이 마비된 당신은, 가장 소중한 이들을 모두 떠나보냈습니다.",
    twenty: "감정의 과부하에 무너진 당신은, 더 이상 일어서지 못했습니다.",
  },
  physique: {
    zero: "너무 이른 나이에, 당신의 몸은 시대의 무게를 버티지 못했습니다.",
    twenty: "몸의 한계를 모른 채 달려온 당신은, 결국 자신을 파괴했습니다.",
  },
  sociability: {
    zero: "세상과 단절된 채, 당신은 아무도 모르는 곳에서 생을 마감했습니다.",
    twenty: "타인에게 너무 휘둘린 당신은, 결국 자기 자신을 잃어버렸습니다.",
  },
  morality: {
    zero: "배신과 이기심이 쌓인 끝에, 당신 곁에는 아무도 남지 않았습니다.",
    twenty: "광신적 신념이 당신을 파멸로 이끌었습니다.",
  },
};

export function getStatDeathNarrative(key: StatKey, value: number): string {
  return value <= 0
    ? STAT_DEATH_NARRATIVES[key].zero
    : STAT_DEATH_NARRATIVES[key].twenty;
}

export function applyNaturalAgingStats(stats: Stats, age: number): Partial<Stats> {
  const changes: Partial<Stats> = {};
  if (age >= 18) changes.physique = -1;
  return changes;
}

// ADMIN.md Stage 16: 스탯 간 상호작용 규칙
export const STAT_INTERACTIONS: {
  condition: (s: Stats) => boolean;
  quality: string;
  labelKo: string;
  isDanger: boolean;
}[] = [
  {
    condition: (s) => s.intellect >= 17 && s.creativity >= 17,
    quality: "genius",
    labelKo: "천재",
    isDanger: false,
  },
  {
    condition: (s) => s.morality >= 17 && s.sociability >= 17,
    quality: "community_leader",
    labelKo: "공동체 지도자",
    isDanger: false,
  },
  {
    condition: (s) => s.morality >= 17 && s.sociability <= 5,
    quality: "isolated_righteous",
    labelKo: "고립된 의인",
    isDanger: true,
  },
  {
    condition: (s) => s.physique >= 17 && s.morality <= 5,
    quality: "rampage_risk",
    labelKo: "폭주 위험",
    isDanger: true,
  },
];

export function computeStatInteractions(stats: Stats): {
  newQualities: Record<string, number>;
  activatedLabels: string[];
  dangerLabels: string[];
} {
  const newQualities: Record<string, number> = {};
  const activatedLabels: string[] = [];
  const dangerLabels: string[] = [];

  for (const rule of STAT_INTERACTIONS) {
    if (rule.condition(stats)) {
      newQualities[rule.quality] = 1;
      activatedLabels.push(rule.labelKo);
      if (rule.isDanger) dangerLabels.push(rule.labelKo);
    }
  }
  return { newQualities, activatedLabels, dangerLabels };
}

export function computeStatTotal(stats: Stats): number {
  return Object.values(stats).reduce((s, v) => s + v, 0);
}

export { applyStatChanges, checkStatDeath, clampStat };
