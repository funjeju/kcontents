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

const HISTORICAL_CONTEXT: Record<string, Record<number, string>> = {
  "1900s_hanseong": {
    1897: "대한제국 선포, 독립협회 창설, 고종 황제 즉위",
    1898: "만민공동회 전국 확산, 독립협회 강제 해산",
    1899: "경인선·한성전차 개통, 황성신문 창간",
    1900: "의화단 사건 여파, 열강 이권 경쟁 심화, 청나라 분할 위기",
    1901: "신축교안(제주 민중봉기), 콜레라 유행, 미국 공사관 확장",
    1902: "영일동맹 체결, 하와이 한인 이민 시작, 러시아 만주 주둔",
    1903: "황무지 개간권 반대 운동, 러시아 만주 철군 거부",
    1904: "러일전쟁 발발, 한일의정서 강제 체결, 일본군 한성 주둔",
    1905: "을사늑약 체결, 외교권 박탈, 항일 의병 봉기",
    1906: "통감부 설치, 이토 히로부미 초대 통감 부임",
    1907: "헤이그 특사 사건, 고종 강제 퇴위, 정미의병 전국 확산",
    1908: "의병 탄압 심화, 안창호 신민회 활동",
    1909: "안중근 이토 히로부미 저격, 나라 잃음의 예감",
    1910: "경술국치, 대한제국 멸망, 조선총독부 설치",
  },
  "1980s_seoul": {
    1980: "5·18 광주민주화운동, 전두환 신군부 집권",
    1981: "야간 통행금지 해제, 프로야구 출범",
    1982: "중학교 무시험 추첨 배정, 야간통금 완전 폐지",
    1983: "KBS 이산가족 찾기 방송, 아웅산 테러",
    1984: "학원자율화 조치, 대학생 시위 증가",
    1985: "2·12 총선 야당 돌풍, 민주화 요구 고조",
    1986: "아시안게임, 직선제 개헌 논의",
    1987: "6월 민주항쟁, 직선제 개헌, 대통령 선거",
    1988: "서울 올림픽, 민주화 이후 첫 평화적 정권 교체",
    1989: "베를린 장벽 붕괴, 전대협 결성, 문익환 방북",
  },
};

interface SafetyRulesDoc {
  sourceType?: string;
  forbiddenCharacterNames?: string[];
  forbiddenQuotes?: string[];
  forbiddenScenePatterns?: string[];
  confirmedHistoricalFacts?: string[];
  forbiddenHistoricalDistortions?: string[];
  realPersonPrivacyRules?: string[];
  dignityRules?: string[];
  generalRules?: string[];
}

function buildSafetyBlock(rules: SafetyRulesDoc | null): string {
  if (!rules) return "";

  const lines: string[] = [];
  const isIP = rules.sourceType === "drama" || rules.sourceType === "book";
  const isHistory = rules.sourceType === "history";

  if (isIP) {
    if (rules.forbiddenCharacterNames?.length)
      lines.push(`절대 사용 금지 인물명: ${rules.forbiddenCharacterNames.join(", ")}`);
    if (rules.forbiddenQuotes?.length)
      lines.push(`직접 인용 금지 대사 패턴:\n${rules.forbiddenQuotes.map((q) => `  - ${q}`).join("\n")}`);
    if (rules.forbiddenScenePatterns?.length)
      lines.push(`묘사 금지 명장면:\n${rules.forbiddenScenePatterns.map((s) => `  - ${s}`).join("\n")}`);
  }

  if (isHistory) {
    if (rules.confirmedHistoricalFacts?.length)
      lines.push(`반드시 지켜야 할 역사적 사실:\n${rules.confirmedHistoricalFacts.map((f) => `  - ${f}`).join("\n")}`);
    if (rules.forbiddenHistoricalDistortions?.length)
      lines.push(`역사 왜곡 절대 금지:\n${rules.forbiddenHistoricalDistortions.map((d) => `  - ${d}`).join("\n")}`);
    if (rules.realPersonPrivacyRules?.length)
      lines.push(`실존 인물 사적 영역 창작 금지:\n${rules.realPersonPrivacyRules.map((r) => `  - ${r}`).join("\n")}`);
    if (rules.dignityRules?.length)
      lines.push(`피해자·희생자 존엄 보존:\n${rules.dignityRules.map((d) => `  - ${d}`).join("\n")}`);
  }

  if (rules.generalRules?.length)
    lines.push(`공통 안전 규칙:\n${rules.generalRules.map((r) => `  - ${r}`).join("\n")}`);

  if (lines.length === 0) return "";
  return `\n[⚠️ 안전선 — 반드시 준수]\n${lines.join("\n")}\n`;
}

function buildPrompt(params: {
  scenario: Record<string, unknown>;
  chapterNum: number;
  age: number;
  year: number;
  isT0: boolean;
  eventCount: number;
  historicalContext: string;
  safetyRules: SafetyRulesDoc | null;
}): string {
  const { scenario, chapterNum, age, year, isT0, eventCount, historicalContext, safetyRules } = params;

  const castingRoleNames = (scenario.castingRoles as { name?: { ko?: string } }[])
    ?.map((r) => r.name?.ko)
    .filter(Boolean)
    .join(", ") ?? "";

  const t0Note = isT0
    ? `\n⚠️ 이 챕터는 T-0입니다. 주인공이 자신의 운명적 역할을 마주하는 단 하나의 장면. 이벤트 1개만 생성.`
    : "";

  const safetyBlock = buildSafetyBlock(safetyRules);

  return `당신은 K-Drama Life 게임의 챕터 이벤트 작성자입니다.${safetyBlock}

[시나리오]
제목: ${(scenario.title as { ko?: string })?.ko}
설명: ${(scenario.description as { ko?: string })?.ko}
캐스팅 역할 (T-0 이후 등장할 인물 유형들): ${castingRoleNames}

[챕터 ${chapterNum} — 주인공 ${age}세, ${year}년]
시대 배경: ${historicalContext}${t0Note}

[생성 규칙]
1. narrative: 50~150자. 2인칭(당신). 현재 시제. \\n으로 단락 구분.
2. 선택지 A/B: 성격이 다른 두 반응 (적극적↔신중한, 감성적↔이성적 등). 각 20~40자.
3. 선택지 C는 반드시 "(자유롭게 답하기)" 고정.
4. statChanges: intellect/creativity/emotion/physique/sociability/morality 중 1~2개만. 절대값 1~2.
5. resultNarrative: 50~80자. 선택의 결과가 느껴지는 시대극 문체.
6. 반드시 ${year}년 역사적 분위기를 자연스럽게 녹이세요.
7. T-0가 아닌 경우: 이벤트들이 각각 다른 상황(가족/거리/대화/사건/내면)을 다루게 하세요.

[출력 — 순수 JSON만, 코드블록 없이]
{
  "events": [
    {
      "narrative": "장면 묘사 텍스트",
      "choices": [
        { "id": "A", "text": "선택지 A" },
        { "id": "B", "text": "선택지 B" },
        { "id": "C", "text": "(자유롭게 답하기)" }
      ],
      "outcomes": {
        "A": { "statChanges": { "morality": 1 }, "resultNarrative": "결과 묘사" },
        "B": { "statChanges": { "intellect": 1 }, "resultNarrative": "결과 묘사" }
      }
    }
  ]
}

이벤트 ${eventCount}개를 위 형식으로 생성하세요.`;
}

function parseEvents(text: string): unknown[] | null {
  try {
    const match =
      text.match(/```json\s*([\s\S]*?)```/) ??
      text.match(/```\s*([\s\S]*?)```/) ??
      text.match(/(\{[\s\S]*\})/);
    const raw = match?.[1] ?? text;
    const parsed = JSON.parse(raw.trim());
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.events)) return parsed.events;
    return null;
  } catch {
    return null;
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string; n: string } }
) {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [scenarioDoc, safetyDoc] = await Promise.all([
    adminDb.collection("scenarios").doc(params.id).get(),
    adminDb.collection("scenarios").doc(params.id).collection("meta").doc("safety").get(),
  ]);
  if (!scenarioDoc.exists) return NextResponse.json({ error: "시나리오 없음" }, { status: 404 });

  const scenario = scenarioDoc.data()!;
  const safetyRules = safetyDoc.exists ? (safetyDoc.data() as SafetyRulesDoc) : null;
  const chapterNum = parseInt(params.n);

  const cradleConfig = (scenario.cradleConfig as { cradleStartAge?: number; cradleEndAge?: number }) ?? {};
  const cradleStartAge = cradleConfig.cradleStartAge ?? 12;
  const cradleEndAge = cradleConfig.cradleEndAge ?? 15;
  const age = cradleStartAge + chapterNum - 1;

  const subtitleKo = (scenario.subtitle as { ko?: string })?.ko ?? "";
  const yearMatch = subtitleKo.match(/(\d{4})/);
  const startYear = yearMatch ? parseInt(yearMatch[1]) : 1897;
  const year = startYear + chapterNum - 1;

  const isT0 = age === cradleEndAge;
  const eventCount = isT0 ? 1 : 6;

  const era = (scenario.era as string) ?? "";
  const historicalMap = HISTORICAL_CONTEXT[era] ?? {};
  const historicalContext = historicalMap[year] ?? `${year}년 ${era} 시대`;

  const prompt = buildPrompt({ scenario, chapterNum, age, year, isT0, eventCount, historicalContext, safetyRules });

  try {
    const { generateText } = await import("@/lib/gemini");
    const text = await generateText(prompt);
    const events = parseEvents(text);

    if (!events) {
      return NextResponse.json(
        { error: "이벤트 파싱 실패. 다시 시도하세요.", raw: text.slice(0, 300) },
        { status: 500 }
      );
    }

    return NextResponse.json({ events, age, year, isT0, chapterNum });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "AI 호출 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
