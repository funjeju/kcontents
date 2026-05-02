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
  return `당신은 K-Drama Life 게임의 위치 큐레이터입니다.
아래 시나리오에 등장하는 역사적 장소 8~12곳을 선정하고, 각각의 정보를 정리하세요.

시나리오: ${scenario.title.ko}
시대: ${scenario.era}
시간 범위: ${scenario.cradleConfig.cradleStartAge}세 ~ ${scenario.mainStoryEndAge}세

---

[선정 기준]
1. 현재도 실존하거나 흔적이 남아 있는 장소 우선
2. 그 시대에 실제로 의미 있던 장소 (역사적 사건 현장, 민초들이 오갔던 거리 등)
3. 플레이어가 직접 방문해볼 수 있을 법한 곳
4. 다양한 캐스팅 역할이 거쳐갈 수 있는 범용 장소 + 특정 캐스팅 전용 장소 혼합

[sensoryDescription 작성 요령]
- 그 시대의 빛, 냄새, 소리, 발 밑의 감촉, 사람들의 옷차림으로 묘사
- 80~120자. AI가 게임 내러티브 생성 시 이 묘사를 참고

---

아래 JSON 배열로 출력하세요. 코드블록 없이 순수 JSON:

[
  {
    "nameKo": "장소 이름",
    "nameEn": "Place Name",
    "address": "실제 주소 (현재 기준)",
    "lat": 위도(소수점 6자리),
    "lng": 경도(소수점 6자리),
    "chapterAge": 이 장소가 주로 등장하는 나이(숫자, 없으면 null),
    "castingRoleIds": [],
    "inGameMeaning": "이 장소가 이야기 안에서 갖는 의미 (1~2문장)",
    "sensoryDescription": "그 시대 감각적 묘사 80~120자",
    "guideNote": "실제 방문 가이드 한 줄 (현재 어떻게 찾아갈 수 있는지)",
    "imageUrl": null
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
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const locations = parseJsonArray(text);

    if (!locations || locations.length === 0) {
      return NextResponse.json(
        { error: "위치 생성 실패. 다시 시도해 주세요.", raw: text.slice(0, 300) },
        { status: 500 }
      );
    }

    return NextResponse.json({ locations });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "AI 호출 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
