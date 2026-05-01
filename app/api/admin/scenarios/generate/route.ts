import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

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

function buildPrompt(params: {
  mode: "drama_name" | "script";
  dramaName?: string;
  dramaHint?: string;
  script?: string;
}): string {
  const input =
    params.mode === "drama_name"
      ? `드라마 이름: "${params.dramaName}"\n추가 지시: ${params.dramaHint || "(없음)"}`
      : `대본/시놉시스:\n${params.script}`;

  return `당신은 K-Drama Life 게임의 시나리오 설계자입니다.
아래 드라마를 게임 시나리오 JSON으로 변환하세요.

${input}

---

[게임 구조 규칙]
1. Cradle(요람) 단계: 주인공이 T-0 나이에서 3~4년 전부터 시작 (cradleStartAge = T-0 나이 - 3 또는 4)
2. T-0 순간: 드라마 주인공으로 "캐스팅"되는 나이 (cradleEndAge). 캐스팅 역할이 이후 이야기를 결정.
3. 주인공이 너무 어리면(13세 미만 등장): type="parent_raising" 사용, 부모 세대부터 시작.
4. castingRoles 5종: 드라마 핵심 감정을 대표하는 역할들. 마지막(priority:99)은 반드시 평범한 목격자 타입.
5. endings: 각 castingRole별 2~4개. 총 12개 이상 필수.
6. familyBackgrounds: 5종. 각각 다른 계층/배경.
7. iconicMoments: 드라마 명장면 3~5개.

[출력 JSON 스키마 — 이 형식을 정확히 따르세요]
{
  "id": "영문_소문자_밑줄",
  "title": { "ko": "시나리오 제목", "en": "..." },
  "subtitle": { "ko": "시대+배경 한 줄 (예: 1897~1907 한성)", "en": "..." },
  "description": { "ko": "150~200자 분위기 설명", "en": "..." },
  "era": "시대코드 (예: 1900s_hanseong, 1980s_seoul, 1990s_busan)",
  "genre": ["historical", "romance", "action", ...],
  "heaviness": 감정무게 1~5,
  "recommendedAgeMin": 12~18,
  "coverImageUrl": "/images/scenarios/[id]-cover.jpg",
  "cradleConfig": {
    "type": "self_youth 또는 parent_raising",
    "cradleStartAge": T0나이-3,
    "cradleEndAge": T0나이
  },
  "mainStoryEndAge": T0나이+4~6,
  "isPremium": false,
  "status": "draft",
  "totalPlays": 0,
  "averageRating": 0,
  "familyBackgrounds": [
    {
      "id": "bg_id",
      "nameKo": "가문/집안 이름",
      "nameEn": "...",
      "descriptionKo": "한 문장",
      "initialStats": { "intellect": 0, "creativity": 0, "emotion": 0, "physique": 0, "sociability": 0, "morality": 0 },
      "initialQualities": {}
    }
  ],
  "castingRoles": [
    {
      "id": "role_id",
      "scenarioId": "[위 id와 동일]",
      "name": { "ko": "역할 이름", "en": "..." },
      "shortDescription": { "ko": "두 줄 설명", "en": "..." },
      "conditions": {
        "requiredStats": {},
        "requiredQualities": {}
      },
      "priority": 1,
      "t0NarrativeTemplate": {
        "ko": "T-0 순간 200~300자 내러티브. 나이, 연도, 계절 포함. '당신의 이야기는 이제 시작된다.'로 끝낼 것.",
        "en": "..."
      },
      "endingIds": ["ending_id_a", "ending_id_b"],
      "iconicMomentIds": ["moment_id"]
    }
  ],
  "iconicMoments": [
    {
      "id": "moment_id",
      "scenarioId": "[위 id와 동일]",
      "applicableCastings": ["role_id"],
      "chapterAge": 나이,
      "conditions": { "requiredQualities": {} },
      "setup": {
        "location": "장소, 계절",
        "npcInvolved": ["npc이름"],
        "sceneDirective": "연출 지시 2~3문장",
        "emotionalTone": "감정 키워드",
        "expectedNarrativeLength": "medium"
      },
      "outcomes": {
        "dramaConsistent": {
          "labelKo": "선택지 텍스트",
          "labelEn": "...",
          "qualityChanges": {},
          "relationshipChanges": {},
          "statChanges": {},
          "pathFlag": "flag_name"
        },
        "divergent": {
          "labelKo": "다른 선택지",
          "labelEn": "...",
          "qualityChanges": {},
          "relationshipChanges": {},
          "statChanges": {},
          "activatesPath": "path_name"
        },
        "custom": { "evaluatorPrompt": "자유 입력 평가 지시" }
      }
    }
  ],
  "endings": [
    {
      "id": "ending_id",
      "scenarioId": "[위 id와 동일]",
      "castingRoleId": "role_id",
      "title": { "ko": "결말 제목", "en": "..." },
      "shortDescription": { "ko": "한 줄 요약", "en": "..." },
      "conditions": {
        "requiredStats": {},
        "requiredQualities": {}
      },
      "priority": 1,
      "narrativeContext": {
        "historicalEvents": ["사건1"],
        "keyMotifs": ["주제1"],
        "suggestedQuoteThemes": ["테마1"]
      },
      "cardArtStyle": {
        "palette": "시대_분위기코드",
        "composition": "portrait 또는 scene 또는 landscape",
        "moodKeywords": ["키워드1", "키워드2", "키워드3"]
      },
      "totalDiscoveries": 0,
      "rarityPercentage": 0~100
    }
  ]
}

순수 JSON만 출력하세요. 코드블록이나 설명 없이. 모든 ID는 영문 소문자와 밑줄만 사용.`;
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

export async function POST(req: NextRequest) {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { mode, dramaName, dramaHint, script } = body as {
    mode: "drama_name" | "script";
    dramaName?: string;
    dramaHint?: string;
    script?: string;
  };

  if (mode === "drama_name" && !dramaName?.trim()) {
    return NextResponse.json({ error: "드라마 이름이 필요합니다" }, { status: 400 });
  }
  if (mode === "script" && !script?.trim()) {
    return NextResponse.json({ error: "대본이 필요합니다" }, { status: 400 });
  }

  const prompt = buildPrompt({ mode, dramaName, dramaHint, script });

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const scenario = parseJson(text);

    if (!scenario || !scenario.id || !scenario.castingRoles) {
      return NextResponse.json(
        { error: "시나리오 구조 생성 실패. 다시 시도해 주세요.", raw: text.slice(0, 500) },
        { status: 500 }
      );
    }

    return NextResponse.json({ scenario });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "AI 호출 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
