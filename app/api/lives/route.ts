export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminDb, getSessionUid } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { generateId, initStatsRandom, applyStatChanges } from "@/lib/utils";
import type { FamilyBackground, PathVariables, Scenario } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = cookies().get("session")?.value;
    const uid = await getSessionUid(sessionCookie);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { scenarioId, characterName, familyBackground } = await req.json();

    if (!scenarioId || !characterName || !familyBackground) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Firestore에서 시나리오 조회 (하드코딩 제거)
    const scenarioDoc = await adminDb.collection("scenarios").doc(scenarioId).get();
    const scenario = scenarioDoc.exists ? (scenarioDoc.data() as Scenario) : null;

    const lifeId = generateId();
    const now = FieldValue.serverTimestamp();

    const pathVariables: PathVariables = {
      isOnDramaPath: false,
      isDivergent: false,
      metaChaptersSeen: 0,
      iconicMomentsSeen: [],
    };

    const startAge = scenario?.cradleConfig?.cradleStartAge ?? 9;

    // 랜덤 기본 스탯 (20~25) + 가족 배경 초기 스탯 적용
    const baseStats = initStatsRandom();
    const familyBackgrounds = scenario?.familyBackgrounds as FamilyBackground[] | undefined;
    const bgDef = familyBackgrounds?.find((b) => b.id === familyBackground);
    const startStats = bgDef ? applyStatChanges(baseStats, bgDef.initialStats) : baseStats;

    const lifeDoc = {
      id: lifeId,
      userId: uid,
      scenarioId,
      scenarioTitle: scenario?.title?.ko ?? null,
      characterName,
      familyBackground,
      stats: startStats,
      qualities: {},
      relationships: {},
      castingRole: null,
      castedAt: null,
      perspective: "self" as const,
      pathVariables,
      age: startAge,
      currentChapterId: null,
      currentEventIndex: null,
      completedChapters: [],
      selectedHeroCardSlots: [],
      usedHeroCards: [],
      earnedLocationCardIds: [],
      isFinished: false,
      endingId: null,
      endingNarrative: null,
      endingCardImageUrl: null,
      finishedAt: null,
      createdAt: now,
      lastPlayedAt: now,
      totalPlayTimeSeconds: 0,
      diedEarlyOfStat: null,
      diedAtAge: null,
    };

    await adminDb.collection("lives").doc(lifeId).set(lifeDoc);

    return NextResponse.json({ lifeId, ok: true });
  } catch (err) {
    console.error("[lives POST] error:", err);
    return NextResponse.json({ error: "Failed to create life" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const sessionCookie = cookies().get("session")?.value;
    const uid = await getSessionUid(sessionCookie);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // orderBy 제거 → 복합 인덱스 불필요, 정렬은 JS에서 처리
    const snapshot = await adminDb
      .collection("lives")
      .where("userId", "==", uid)
      .limit(50)
      .get();

    const lives = snapshot.docs
      .map((doc) => doc.data())
      .sort((a, b) => {
        const aMs = (a.lastPlayedAt as any)?._seconds ?? 0;
        const bMs = (b.lastPlayedAt as any)?._seconds ?? 0;
        return bMs - aMs;
      })
      .slice(0, 20);

    return NextResponse.json({ lives });
  } catch (err) {
    console.error("[lives GET] error:", err);
    return NextResponse.json({ error: "Failed to fetch lives" }, { status: 500 });
  }
}
