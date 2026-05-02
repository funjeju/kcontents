import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { Scenario, BgmContext } from "@/lib/types";

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

const BGM_CONTEXTS: { context: BgmContext; desc: string }[] = [
  { context: "everyday",         desc: "평상시 일상, 잔잔한 배경음" },
  { context: "cradle",           desc: "Cradle 단계 전반, 어린 시절의 기억" },
  { context: "spring",           desc: "봄 계절감, 새 시작" },
  { context: "summer",           desc: "여름, 뜨겁고 긴박한" },
  { context: "autumn",           desc: "가을, 쓸쓸하고 깊어지는" },
  { context: "winter",           desc: "겨울, 고요하고 무거운" },
  { context: "t0_casting",       desc: "T-0 캐스팅 모먼트, 운명의 순간" },
  { context: "milestone",        desc: "이정표 도달, 역사적 사건 발생" },
  { context: "iconic_moment",    desc: "명장면, 드라마틱한 전환점" },
  { context: "stat_warning",     desc: "스탯 위험 경고, 내면의 긴장" },
  { context: "chapter_end",      desc: "챕터 마무리, 한 해의 끝" },
  { context: "ending_happy",     desc: "행복한 결말" },
  { context: "ending_tragic",    desc: "비극적 결말" },
  { context: "ending_bittersweet", desc: "씁쓸하고 아름다운 결말" },
];

function buildPrompt(scenario: Scenario): string {
  const contextList = BGM_CONTEXTS
    .map((c) => `  - context: "${c.context}" — ${c.desc}`)
    .join("\n");

  return `당신은 K-Drama Life 게임의 음악 감독입니다.
아래 시나리오의 분위기와 시대에 맞는 BGM 풀을 정의하세요.

시나리오: ${scenario.title.ko}
시대: ${scenario.era}
장르: ${scenario.genre?.join(", ")}
감정 무게: ${scenario.heaviness}/5

---

[BGM 컨텍스트 목록 — 모두 포함해야 합니다]
${contextList}

[작성 원칙]
- instruments: 그 시대에 어울리는 실제 악기 이름 (한국어 가능). 2~4개.
- referenceTrackHint: 실제 곡명이 아니라 "어떤 느낌인지" 묘사. AI 작곡 지시문처럼 작성.
  예: "가야금 선율이 먼저 시작하고 서양 현악이 서서히 겹쳐지는, 전통과 근대의 경계에 선 소리"
- mood: 감정 키워드 2~3개 (예: "그리움, 고요한 긴장")
- tempo: "slow" | "moderate" | "fast"

---

아래 JSON 배열로 출력하세요. 코드블록 없이 순수 JSON, ${BGM_CONTEXTS.length}개:

[
  {
    "id": "bgm_[context]",
    "context": "context값",
    "nameKo": "트랙 이름/분위기 이름",
    "mood": "감정 키워드",
    "instruments": ["악기1", "악기2"],
    "tempo": "slow",
    "referenceTrackHint": "분위기 묘사 지시문",
    "fileUrl": null
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
    const tracks = parseJsonArray(text);

    if (!tracks || tracks.length === 0) {
      return NextResponse.json(
        { error: "BGM 생성 실패. 다시 시도해 주세요.", raw: text.slice(0, 300) },
        { status: 500 }
      );
    }

    return NextResponse.json({ tracks });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "AI 호출 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
