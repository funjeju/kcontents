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
  const castingOverview = scenario.castingRoles
    .map((r, i) => `  ${String.fromCharCode(65 + i)}. ${r.name.ko}: ${r.shortDescription.ko}`)
    .join("\n");

  return `당신은 K-Drama Life 게임의 첫 진입점 설계자입니다.
아래 시나리오의 Cradle 시작 시점에 플레이어에게 던질 질문 6개를 설계하세요.

시나리오: ${scenario.title.ko}
시대: ${scenario.era}
Cradle 시작 나이: ${scenario.cradleConfig.cradleStartAge}세

캐스팅 역할 (플레이어가 어느 방향으로 수렴할지 판단하기 위한 기준):
${castingOverview}

---

[설계 원칙]
1. 질문은 직접적이지 않아야 합니다. "당신은 어떤 사람인가요?"가 아니라, 작은 일상의 선택으로 성격이 드러나게.
2. 시대극 분위기를 유지하세요. 그 시대를 사는 사람이 실제로 마주칠 법한 상황.
3. 각 선택지는 3개 (A, B, C). 어느 캐스팅 방향으로 수렴하는지 castingHint에 명시.
4. 정답이 없는 질문. 어떤 선택도 존중받는 느낌.
5. 첫 질문은 가장 부드럽게, 마지막으로 갈수록 조금씩 더 깊어지는 흐름.

---

아래 JSON 배열로 출력하세요. 코드블록 없이 순수 JSON:

[
  {
    "id": "q1",
    "order": 1,
    "text": "질문 본문 (30~60자, 2인칭 또는 상황 서술)",
    "subtext": "보조 설명 또는 상황 설명 (선택, 없으면 null)",
    "choices": [
      { "id": "A", "text": "선택지 A (20~35자)", "castingHint": "어느 캐스팅 방향" },
      { "id": "B", "text": "선택지 B (20~35자)", "castingHint": "어느 캐스팅 방향" },
      { "id": "C", "text": "선택지 C (20~35자)", "castingHint": "어느 캐스팅 방향" }
    ]
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
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const questions = parseJsonArray(text);

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: "질문 생성 실패. 다시 시도해 주세요.", raw: text.slice(0, 300) },
        { status: 500 }
      );
    }

    return NextResponse.json({ questions });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "AI 호출 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
