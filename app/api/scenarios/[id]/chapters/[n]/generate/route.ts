export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { generateText } from "@/lib/gemini";
import type { Scenario } from "@/lib/types";

function buildPrompt(scenario: Scenario, chapterNum: number, age: number, isT0: boolean, locale: string): string {
  const isEn = locale === "en";
  const title = isEn
    ? (scenario.title?.en ?? scenario.title?.ko ?? "Scenario")
    : (scenario.title?.ko ?? "시나리오");
  const sourceTitle = scenario.title?.ko ?? "";
  const description = isEn
    ? (scenario.description?.en ?? scenario.description?.ko ?? "")
    : (scenario.description?.ko ?? "");
  const era = scenario.era ?? "";
  const sourceLine = isEn
    ? `This scenario is based on the Korean drama "${sourceTitle}". If you know this drama, reflect its actual story arc, key events, and emotional turning points faithfully in the events — do not make up a different story.`
    : `이 시나리오는 "${sourceTitle}"을(를) 원작으로 합니다. 이 드라마를 알고 있다면, 실제 원작의 이야기 흐름·핵심 사건·감정적 전환점을 충실히 반영하세요. 임의로 다른 스토리를 만들지 마세요.`;

  if (isEn) {
    if (isT0) {
      return `You are an event designer for a K-Drama Life game.

Scenario: "${title}" (${era})
Description: ${description}
${sourceLine}

Chapter ${chapterNum} is the T-0 moment — the fateful decision the protagonist faces at age ${age}.
Only 1 event is needed for this chapter.

Generate exactly 1 event in this JSON format:
[
  {
    "narrative": "200-300 character narrative. No meta phrases like 'at age X, you...' — start directly inside the scene. 4-6 vivid, immersive sentences that fit the scenario's world and era.",
    "choices": [
      { "id": "A", "text": "Choice A text (10-25 chars)" },
      { "id": "B", "text": "Choice B text (10-25 chars)" },
      { "id": "C", "text": "(Write your own thoughts)" }
    ],
    "outcomes": {
      "A": { "statChanges": { "intellect": 0, "creativity": 0, "emotion": 0, "physique": 0, "sociability": 0, "morality": 0 }, "resultNarrative": "Result in 2-3 sentences, 60-100 chars" },
      "B": { "statChanges": { "intellect": 0, "creativity": 0, "emotion": 0, "physique": 0, "sociability": 0, "morality": 0 }, "resultNarrative": "Result in 2-3 sentences, 60-100 chars" }
    }
  }
]

statChanges: each value -3 to +3 range. Total absolute sum 4-6. Output pure JSON array only.`;
    }

    return `You are an event designer for a K-Drama Life game.

Scenario: "${title}" (${era})
Description: ${description}
${sourceLine}

Chapter ${chapterNum}: the protagonist lives through age ${age}.
Generate 6 events that fully match this scenario's world and atmosphere.

Each event must fit this scenario's setting/era/profession/environment exactly.
Do not mix in content from other scenarios.

Generate exactly 6 events in this JSON format:
[
  {
    "narrative": "200-300 character narrative. No meta phrases like 'at age X, you...' — start directly inside the scene. Include specific characters, places, and conflict that fit the scenario background. Do not write it short.",
    "choices": [
      { "id": "A", "text": "Choice A text (10-25 chars)" },
      { "id": "B", "text": "Choice B text (10-25 chars)" },
      { "id": "C", "text": "(Write your own thoughts)" }
    ],
    "outcomes": {
      "A": { "statChanges": { "intellect": 0, "creativity": 0, "emotion": 0, "physique": 0, "sociability": 0, "morality": 0 }, "resultNarrative": "Result in 2-3 sentences, 60-100 chars" },
      "B": { "statChanges": { "intellect": 0, "creativity": 0, "emotion": 0, "physique": 0, "sociability": 0, "morality": 0 }, "resultNarrative": "Result in 2-3 sentences, 60-100 chars" }
    }
  }
]

statChanges rules:
- Each value -3 to +3. Total absolute sum per event: 4-6.
- Vary the primary stats per event:
  Event1: intellect/creativity | Event2: sociability/emotion
  Event3: physique/morality | Event4: creativity/morality
  Event5: emotion/intellect | Event6: physique/sociability
- No single stat should increase in all 6 events.
- Choice A and B must affect different stats.
Output pure JSON array only. No code blocks.`;
  }

  // Korean prompts
  if (isT0) {
    return `당신은 K-Drama Life 게임의 이벤트 설계자입니다.

시나리오: "${title}" (${era})
설명: ${description}
${sourceLine}

챕터 ${chapterNum}은 T-0 순간입니다 — 주인공이 ${age}세에 맞이하는 운명의 결정 순간입니다.
이 챕터에는 단 1개의 이벤트만 필요합니다.

다음 JSON 형식으로 정확히 1개의 이벤트를 생성하세요:
[
  {
    "narrative": "200~300자의 내러티브. 나이나 '당신은' 같은 메타 표현 없이, 주인공이 처한 결정적 순간을 4~6문장으로 직접 묘사. 시나리오 세계관과 시대에 완전히 맞는 구체적 상황. 감각적이고 몰입감 있게 서술.",
    "choices": [
      { "id": "A", "text": "선택지 A 텍스트 (10~20자)" },
      { "id": "B", "text": "선택지 B 텍스트 (10~20자)" },
      { "id": "C", "text": "(자유롭게 생각 말하기)" }
    ],
    "outcomes": {
      "A": { "statChanges": { "intellect": 0, "creativity": 0, "emotion": 0, "physique": 0, "sociability": 0, "morality": 0 }, "resultNarrative": "선택 결과 2~3문장, 60~100자" },
      "B": { "statChanges": { "intellect": 0, "creativity": 0, "emotion": 0, "physique": 0, "sociability": 0, "morality": 0 }, "resultNarrative": "선택 결과 2~3문장, 60~100자" }
    }
  }
]

statChanges: 각 값은 -3 ~ +3 범위. 합산 절댓값이 4~6. 순수 JSON 배열만 출력.`;
  }

  return `당신은 K-Drama Life 게임의 이벤트 설계자입니다.

시나리오: "${title}" (${era})
설명: ${description}
${sourceLine}

챕터 ${chapterNum}: 주인공이 ${age}세를 살아가는 시기.
이 시나리오의 세계관과 분위기에 완전히 맞는 이벤트 6개를 생성하세요.

각 이벤트는 반드시 이 시나리오의 배경/시대/직업/환경에 맞아야 합니다.
절대 다른 시나리오의 내용이 섞이지 않도록 하세요.

다음 JSON 형식으로 정확히 6개의 이벤트를 생성하세요:
[
  {
    "narrative": "200~300자의 내러티브. '몇 세의 당신은' '주인공은' 같은 메타 표현 없이, 장면 안에서 바로 시작하는 서술. 배경에 맞는 인물/장소/갈등이 드러나는 몰입감 있는 서술. 짧게 쓰지 말 것.",
    "choices": [
      { "id": "A", "text": "선택지 A 텍스트 (10~20자)" },
      { "id": "B", "text": "선택지 B 텍스트 (10~20자)" },
      { "id": "C", "text": "(자유롭게 생각 말하기)" }
    ],
    "outcomes": {
      "A": { "statChanges": { "intellect": 0, "creativity": 0, "emotion": 0, "physique": 0, "sociability": 0, "morality": 0 }, "resultNarrative": "선택 결과 2~3문장, 60~100자" },
      "B": { "statChanges": { "intellect": 0, "creativity": 0, "emotion": 0, "physique": 0, "sociability": 0, "morality": 0 }, "resultNarrative": "선택 결과 2~3문장, 60~100자" }
    }
  }
]

statChanges 규칙:
- 각 값은 -3 ~ +3 범위. 이벤트 하나당 합산 절댓값 4~6.
- 이벤트마다 주로 변화하는 스탯을 다르게 배분하라:
  이벤트1: intellect/creativity 위주 | 이벤트2: sociability/emotion 위주
  이벤트3: physique/morality 위주 | 이벤트4: creativity/morality 위주
  이벤트5: emotion/intellect 위주 | 이벤트6: physique/sociability 위주
- 같은 스탯이 6개 이벤트 모두에서 오르는 일은 절대 없어야 한다.
- 선택지 A와 B는 서로 다른 스탯에 영향을 줘야 한다.
순수 JSON 배열만 출력. 코드블록 없이.`;
}

function parseEvents(text: string): unknown[] | null {
  try {
    const match = text.match(/```json\s*([\s\S]*?)```/) ?? text.match(/(\[[\s\S]*\])/);
    const raw = match?.[1] ?? text.trim();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return null;
  } catch {
    return null;
  }
}

function isTooShort(events: unknown[]): boolean {
  const first = (events[0] as Record<string, unknown>)?.narrative;
  if (typeof first !== "string") return true;
  if (first.length < 80) return true;
  if (/\d+세의\s*(당신|주인공)/.test(first)) return true;
  return false;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; n: string } }
) {
  const force = req.nextUrl.searchParams.get("force") === "true";
  const locale = req.nextUrl.searchParams.get("locale") ?? "ko";
  const eventsField = locale === "en" ? "eventsEn" : "events";

  try {
    const chapterRef = adminDb
      .collection("scenarios").doc(params.id)
      .collection("chapters").doc(params.n);

    if (!force) {
      const existing = await chapterRef.get();
      const cached = existing.data()?.[eventsField];
      if (
        existing.exists &&
        Array.isArray(cached) &&
        cached.length > 0 &&
        !isTooShort(cached)
      ) {
        return NextResponse.json({ events: cached });
      }
    }

    const scenarioDoc = await adminDb.collection("scenarios").doc(params.id).get();
    if (!scenarioDoc.exists) return NextResponse.json({ events: null }, { status: 404 });
    const scenario = { id: scenarioDoc.id, ...scenarioDoc.data() } as Scenario;

    const chapterNum = parseInt(params.n);
    const cradleStartAge = scenario.cradleConfig?.cradleStartAge ?? 12;
    const cradleEndAge = scenario.cradleConfig?.cradleEndAge ?? 15;
    const age = cradleStartAge + chapterNum - 1;
    const t0Chapter = cradleEndAge - cradleStartAge + 1;
    const isT0 = chapterNum === t0Chapter;

    const prompt = buildPrompt(scenario, chapterNum, age, isT0, locale);
    const text = await generateText(prompt);
    const events = parseEvents(text);

    if (events && events.length > 0) {
      // 기존 필드를 유지하면서 locale별 필드만 업데이트
      const existing = await chapterRef.get();
      if (existing.exists) {
        await chapterRef.update({ [eventsField]: events, generatedAt: new Date().toISOString() });
      } else {
        await chapterRef.set({ [eventsField]: events, generatedAt: new Date().toISOString() });
      }
    }

    return NextResponse.json({ events: events ?? null });
  } catch (e) {
    console.error("[chapters/generate]", e);
    return NextResponse.json({ events: null }, { status: 500 });
  }
}
