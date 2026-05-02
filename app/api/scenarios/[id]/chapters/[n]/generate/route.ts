export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { generateText } from "@/lib/gemini";
import type { Scenario } from "@/lib/types";

function buildPrompt(scenario: Scenario, chapterNum: number, age: number, isT0: boolean): string {
  const title = scenario.title?.ko ?? "시나리오";
  const description = scenario.description?.ko ?? "";
  const era = scenario.era ?? "";

  if (isT0) {
    return `당신은 K-Drama Life 게임의 이벤트 설계자입니다.

시나리오: "${title}" (${era})
설명: ${description}

챕터 ${chapterNum}은 T-0 순간입니다 — 주인공이 ${age}세에 맞이하는 운명의 결정 순간입니다.
이 챕터에는 단 1개의 이벤트만 필요합니다.

다음 JSON 형식으로 정확히 1개의 이벤트를 생성하세요:
[
  {
    "narrative": "200~300자의 내러티브. ${age}세의 주인공이 처한 결정적 순간을 4~6문장으로 묘사. 시나리오 세계관과 시대에 완전히 맞는 구체적 상황. 감각적이고 몰입감 있게 서술.",
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

챕터 ${chapterNum}: 주인공이 ${age}세를 살아가는 시기.
이 시나리오의 세계관과 분위기에 완전히 맞는 이벤트 6개를 생성하세요.

각 이벤트는 반드시 이 시나리오의 배경/시대/직업/환경에 맞아야 합니다.
절대 다른 시나리오의 내용이 섞이지 않도록 하세요.

다음 JSON 형식으로 정확히 6개의 이벤트를 생성하세요:
[
  {
    "narrative": "200~300자의 내러티브. ${age}세 주인공의 구체적인 상황을 4~6문장으로 묘사. 시나리오 배경에 맞는 인물/장소/갈등이 포함된 몰입감 있는 서술. 짧게 쓰지 말 것.",
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
  return typeof first === "string" && first.length < 100;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; n: string } }
) {
  const force = req.nextUrl.searchParams.get("force") === "true";

  try {
    const chapterRef = adminDb
      .collection("scenarios").doc(params.id)
      .collection("chapters").doc(params.n);

    // Return existing if already generated with adequate length
    if (!force) {
      const existing = await chapterRef.get();
      if (
        existing.exists &&
        Array.isArray(existing.data()?.events) &&
        existing.data()!.events.length > 0 &&
        !isTooShort(existing.data()!.events)
      ) {
        return NextResponse.json({ events: existing.data()!.events });
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

    const prompt = buildPrompt(scenario, chapterNum, age, isT0);
    const text = await generateText(prompt);
    const events = parseEvents(text);

    if (events && events.length > 0) {
      await chapterRef.set({ events, generatedAt: new Date().toISOString() });
    }

    return NextResponse.json({ events: events ?? null });
  } catch (e) {
    console.error("[chapters/generate]", e);
    return NextResponse.json({ events: null }, { status: 500 });
  }
}
