import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { Scenario, SafetySourceType } from "@/lib/types";

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

function detectSourceType(scenario: Scenario): SafetySourceType {
  // era 코드나 genre로 추정. 실제로는 시나리오 생성 시 source를 저장하면 더 정확.
  const genre = scenario.genre ?? [];
  if (genre.includes("historical") && !genre.includes("drama")) return "history";
  return "drama";
}

function buildPrompt(scenario: Scenario, sourceType: SafetySourceType): string {
  const isIPBased = sourceType === "drama" || sourceType === "book";
  const isHistory = sourceType === "history";

  const ipSection = isIPBased ? `
[IP 보호 안전선 — 소스가 드라마/책이므로 필수]
- forbiddenCharacterNames: 이 작품에서 실명 사용이 절대 금지되는 원작 캐릭터 이름 목록 (5~10개)
- forbiddenQuotes: 직접 인용이 금지되는 명대사 패턴 목록 (3~5개, 실제 대사가 아닌 패턴 설명)
- forbiddenScenePatterns: 그대로 묘사하면 안 되는 명장면 패턴 (3~5개, 어떤 장면인지 설명)` : "";

  const historySection = isHistory ? `
[역사 왜곡 방지 안전선 — 역사 기반 시나리오이므로 필수]
- confirmedHistoricalFacts: 반드시 지켜야 할 역사적 사실 (날짜, 사건, 결과 등) 5~8개
- forbiddenHistoricalDistortions: 절대 왜곡하면 안 되는 역사 사실 목록 5~8개
- realPersonPrivacyRules: 실존 인물의 사적 영역 임의 창작 금지 규칙 3~5개
- dignityRules: 학살·피해자·희생자 존엄 보존 규칙 3~5개` : "";

  return `당신은 K-Drama Life 게임의 콘텐츠 안전 설계자입니다.
아래 시나리오에 맞는 AI 생성 안전선 룰을 작성하세요.

시나리오: ${scenario.title.ko}
시대: ${scenario.era}
소스 타입: ${sourceType}
장르: ${scenario.genre?.join(", ")}

---
${ipSection}
${historySection}

[공통 안전선 — 모든 시나리오]
- generalRules: 아래 항목을 반드시 포함하고, 이 시나리오에 맞게 3~5개 추가:
  * "18세 미만 사용자에게 부적절한 성적 묘사 금지"
  * "특정 집단 혐오·차별 표현 금지"
  * "자해·자살 방법 상세 묘사 금지"
  * 시나리오 특성에 맞는 추가 규칙

---

아래 JSON 형식으로 출력하세요. 코드블록 없이 순수 JSON:

{
  "sourceType": "${sourceType}",
  "forbiddenCharacterNames": [],
  "forbiddenQuotes": [],
  "forbiddenScenePatterns": [],
  "confirmedHistoricalFacts": [],
  "forbiddenHistoricalDistortions": [],
  "realPersonPrivacyRules": [],
  "dignityRules": [],
  "generalRules": []
}`;
}

function parseJson(text: string): Record<string, unknown> | null {
  try {
    const match = text.match(/```json\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/);
    const raw = match?.[1] ?? text;
    return JSON.parse(raw.trim());
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
  const sourceType = detectSourceType(scenario);
  const prompt = buildPrompt(scenario, sourceType);

  try {
    const { generateText } = await import("@/lib/gemini");
    const text = await generateText(prompt);
    const rules = parseJson(text);

    if (!rules) {
      return NextResponse.json(
        { error: "안전선 생성 실패. 다시 시도해 주세요.", raw: text.slice(0, 300) },
        { status: 500 }
      );
    }

    return NextResponse.json({ rules, sourceType });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "AI 호출 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
