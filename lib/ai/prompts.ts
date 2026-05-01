import type { Stats, Qualities } from "../types";

export const SYSTEM_PROMPT_BASE = `당신은 K-Drama Life의 내러티브 엔진입니다.

원칙:
1. 한국 시대 정서와 K-드라마 톤을 정확히 담아냅니다.
2. 역사적 사실을 왜곡하지 않습니다. 픽션은 사실 위에서만 자유롭습니다.
3. 특정 드라마 제목, 캐릭터명, 명대사를 직접 인용하지 않습니다.
4. 선악을 단순하게 그리지 않습니다.
5. 무거운 역사적 사건을 다룰 때는 피해자에 대한 존엄을 잃지 않습니다.
6. 사용자의 선택을 존중합니다.
7. 한국어 작성 시 자연스러운 시대극 톤.

금기:
- 실존 인물의 사적 영역 묘사
- 미성년자 대상 부적절 콘텐츠
- 특정 정치 입장 강요
- 폭력의 미화`;

export function buildChapterIntroPrompt(ctx: {
  scenarioTitle: string;
  characterName: string;
  age: number;
  year: number;
  season: string;
  familyBackground: string;
  stats: Stats;
  castingRole: string | null;
  historicalEvents: string[];
  previousChapterSummary: string;
  language: "ko" | "en";
}): string {
  return `${SYSTEM_PROMPT_BASE}

시나리오: ${ctx.scenarioTitle}
캐릭터: ${ctx.characterName}, ${ctx.age}세
연도: ${ctx.year}년 ${ctx.season}
시대 사건: ${ctx.historicalEvents.join(", ")}
이전 챕터: ${ctx.previousChapterSummary}

200자 이내의 챕터 시작 내러티브를 작성하세요. 시대극 톤. narrative만 출력하세요.`;
}

export function buildEventNarrativePrompt(ctx: {
  sceneDirective: string;
  characterName: string;
  age: number;
  npcs: string[];
  outcomeALabel: string;
  outcomeBLabel: string;
  language: "ko" | "en";
}): string {
  return `${SYSTEM_PROMPT_BASE}

장면 지시: ${ctx.sceneDirective}
캐릭터: ${ctx.characterName}, ${ctx.age}세
등장 NPC: ${ctx.npcs.join(", ")}
옵션 A 결과: ${ctx.outcomeALabel}
옵션 B 결과: ${ctx.outcomeBLabel}

JSON 형식으로 답하세요:
{
  "narrative": "100~150자 장면 묘사",
  "choices": [
    { "id": "A", "text": "선택지 A 텍스트" },
    { "id": "B", "text": "선택지 B 텍스트" },
    { "id": "C", "text": "(자유롭게 답하기)" }
  ]
}`;
}

export function buildFreeformEvalPrompt(ctx: {
  eventNarrative: string;
  userInput: string;
  gateType: string;
  language: "ko" | "en";
}): string {
  return `${SYSTEM_PROMPT_BASE}

상황: ${ctx.eventNarrative}
사용자 답변: ${ctx.userInput}
게이트 종류: ${ctx.gateType}

평가 후 JSON 형식으로 답하세요:
{
  "passed": true,
  "statChanges": { "morality": 1 },
  "qualityChanges": {},
  "resultNarrative": "50~100자 결과",
  "feedback": "격려 한 줄"
}`;
}

export function buildT0CastingPrompt(ctx: {
  characterName: string;
  castingRoleName: string;
  castingDescription: string;
  scenarioTitle: string;
  year: number;
  season: string;
  pastSummary: string;
  language: "ko" | "en";
}): string {
  return `${SYSTEM_PROMPT_BASE}

당신은 K-Drama Life에서 가장 중요한 T-0 모먼트 — 캐스팅 알림 내러티브를 씁니다.
6년 동안 평범하게 살아온 사용자가 자신이 어떤 인물이 되었는지 알게 되는 순간입니다.

캐릭터: ${ctx.characterName}
캐스팅: ${ctx.castingRoleName}
캐스팅의 결: ${ctx.castingDescription}
시나리오: ${ctx.scenarioTitle}
현재: ${ctx.year}년 ${ctx.season}
과거 요약: ${ctx.pastSummary}

JSON:
{
  "narrative": "200~300자 영화 OP 같은 narrative, 직접적 통보 X, 사용자가 알아채게",
  "subtitle": "캐스팅의 결을 한 줄로",
  "musicMood": "epic"
}`;
}

export function buildEndingNarrativePrompt(ctx: {
  scenarioTitle: string;
  characterName: string;
  castingRoleName: string;
  endingName: string;
  keyChoices: string[];
  finalStats: Stats;
  finalQualities: Qualities;
  endAge: number;
  language: "ko" | "en";
}): string {
  return `${SYSTEM_PROMPT_BASE}

당신은 한 인생의 마지막 페이지를 씁니다.

시나리오: ${ctx.scenarioTitle}
캐릭터: ${ctx.characterName}, ${ctx.castingRoleName}
결말: ${ctx.endingName}
종료 나이: ${ctx.endAge}세
핵심 선택들: ${ctx.keyChoices.join(" | ")}
최종 스탯: ${JSON.stringify(ctx.finalStats)}

JSON:
{
  "endingNarrative": "150~250자 시대극 회고 톤 narrative",
  "iconicQuote": "30자 이내 명대사",
  "finalAge": ${ctx.endAge}
}`;
}

export function buildModerationPrompt(userInput: string, context: string): string {
  return `사용자 자유 입력 안전 분류기.

입력: ${userInput}
컨텍스트: ${context}

JSON:
{
  "decision": "ALLOW" | "REVIEW" | "BLOCK",
  "tags": [],
  "reason": "짧게"
}`;
}
