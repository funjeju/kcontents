import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { Scenario, Milestone } from "@/lib/types";

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

function buildMilestonePrompt(scenario: Scenario): string {
  const castingNames = scenario.castingRoles
    .map((r) => `- ${r.id}: ${r.name.ko} (${r.shortDescription.ko})`)
    .join("\n");

  const isHistory = !scenario.castingRoles.some((r) =>
    r.shortDescription.ko.includes("드라마")
  );

  const sourceNote = isHistory
    ? "이 시나리오는 역사적 배경 픽션입니다. 이정표는 실제 역사적 사건에 기반하며, isHistoricalFact: true로 표시하세요."
    : "이 시나리오는 드라마/문학 기반입니다. 핵심 서사 이정표를 정의하되, 특정 IP 캐릭터명 사용 금지.";

  return `당신은 K-Drama Life 게임의 시나리오 설계자입니다.
아래 시나리오에 맞는 이정표(Milestone) 목록을 생성하세요.

시나리오: ${scenario.title.ko}
시대: ${scenario.era}
시간 범위: ${scenario.cradleConfig.cradleStartAge}세 ~ ${scenario.mainStoryEndAge}세
T-0 나이: ${scenario.cradleConfig.cradleEndAge}세

캐스팅 역할:
${castingNames}

${sourceNote}

---

[이정표 설계 원칙]
1. 이정표는 "AI가 절대 벗어나면 안 되는 서사의 기둥"입니다.
2. Cradle 단계(시작 ~ T-0)에 3~4개, Main Story(T-0 이후)에 4~6개 생성.
3. T-0 순간 자체는 반드시 이정표로 포함 (isT0: true).
4. 각 이정표마다 모든 castingRole에 대한 결정 모먼트(castingOutcomes)를 정의.
5. 역사적 사실은 isHistoricalFact: true — 플레이어가 막을 수 없는 사건.
6. aiDirective는 AI에게 주는 실제 지시문 (50~100자). 이 시점에 무엇을 강조할지.

---

아래 JSON 배열을 출력하세요. 코드블록 없이 순수 JSON:

[
  {
    "age": 나이 (숫자),
    "year": 절대연도 (숫자, 역사 시나리오만),
    "title": "이정표 이름",
    "description": "이정표 상황 설명 (50~100자)",
    "isHistoricalFact": true 또는 false,
    "isT0": true 또는 false,
    "aiDirective": "AI가 이 시점에서 따라야 할 지시문",
    "castingOutcomes": [
      {
        "castingRoleId": "role_id",
        "decisionPrompt": "이 캐스팅이 직면하는 결정 상황 설명",
        "dramaticPathFlag": "flag_name_dramatic",
        "divergentPathFlag": "flag_name_divergent"
      }
    ],
    "order": 정렬순서 (1부터 시작)
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
  const prompt = buildMilestonePrompt(scenario);

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const milestones = parseJsonArray(text) as Partial<Milestone>[] | null;

    if (!milestones || milestones.length === 0) {
      return NextResponse.json(
        { error: "이정표 생성 실패. 다시 시도해 주세요.", raw: text.slice(0, 500) },
        { status: 500 }
      );
    }

    return NextResponse.json({ milestones });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "AI 호출 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
