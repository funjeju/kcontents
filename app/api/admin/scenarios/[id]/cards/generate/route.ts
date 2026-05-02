import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { Scenario } from "@/lib/types";

async function verifyAdmin(): Promise<string | null> {
  const session = cookies().get("session")?.value;
  if (!session) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
    if (userDoc.data()?.isAdmin !== true) return null;
    return decoded.uid;
  } catch {
    return null;
  }
}

function buildPrompt(scenario: Scenario): string {
  return `당신은 K-Drama Life 게임의 카드 설계자입니다.
아래 시나리오에 맞는 고유 커스텀 카드 1~2장을 생성하세요.

시나리오: ${scenario.title.ko}
시대: ${scenario.era}
장르: ${scenario.genre?.join(", ")}
무게: ${scenario.heaviness}/5

---

[커스텀 카드 설계 원칙]
- 이 시나리오의 시대·정서·소재를 반영하는 고유한 카드여야 합니다.
- 예시:
  * 사극(조선/대한제국) → "어진의 그림자", "밀서"
  * 일제강점기 → "비밀 서신", "독립의 씨앗"
  * 1988 골목 → "어머니의 도시락", "빛바랜 앨범"
  * 전쟁기 → "방공호의 밤", "생사불명"
- 표준 카드(시간의 귀환, 절제 등)와 중복되지 않아야 합니다.
- usageTiming: "chapter_start" | "chapter_end" | "stat_warning" | "anytime" 중 하나.
- rarity: "uncommon" 또는 "rare" 추천.

---

아래 JSON 배열로 출력하세요. 코드블록 없이 순수 JSON:

[
  {
    "nameKo": "카드 이름",
    "nameEn": "Card Name",
    "descriptionKo": "분위기 설명 (30~50자)",
    "effectKo": "실제 효과 (간결하게 한 줄)",
    "usageTiming": "chapter_start",
    "usageCondition": "사용 조건 (없으면 null)",
    "rarity": "rare"
  }
]`;
}

function parseJsonArray(text: string): unknown[] | null {
  try {
    const match = text.match(/```json\s*([\s\S]*?)```/) ?? text.match(/(\[[\s\S]*\])/);
    const raw = match?.[1] ?? text;
    const parsed = JSON.parse(raw.trim());
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scenarioDoc = await adminDb.collection("scenarios").doc(params.id).get();
  if (!scenarioDoc.exists) {
    return NextResponse.json({ error: "시나리오를 찾을 수 없습니다" }, { status: 404 });
  }

  const scenario = scenarioDoc.data() as Scenario;
  const prompt = buildPrompt(scenario);

  try {
    const { generateText } = await import("@/lib/gemini");
    const text = await generateText(prompt);
    const cards = parseJsonArray(text);

    if (!cards || cards.length === 0) {
      return NextResponse.json(
        { error: "카드 생성 실패. 다시 시도해 주세요.", raw: text.slice(0, 300) },
        { status: 500 }
      );
    }

    return NextResponse.json({ cards });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "AI 호출 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
