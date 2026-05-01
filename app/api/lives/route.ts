export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, getSessionUid } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { generateId, initStats } from "@/lib/utils";
import type { Life, PathVariables } from "@/lib/types";

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

    const lifeId = generateId();
    const now = FieldValue.serverTimestamp();

    const pathVariables: PathVariables = {
      isOnDramaPath: false,
      isDivergent: false,
      metaChaptersSeen: 0,
      iconicMomentsSeen: [],
    };

    const lifeDoc = {
      id: lifeId,
      userId: uid,
      scenarioId,
      characterName,
      familyBackground,
      stats: initStats(10),
      qualities: {},
      relationships: {},
      castingRole: null,
      castedAt: null,
      perspective: "self" as const,
      pathVariables,
      age: 9,
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

    const snapshot = await adminDb
      .collection("lives")
      .where("userId", "==", uid)
      .orderBy("lastPlayedAt", "desc")
      .limit(20)
      .get();

    const lives = snapshot.docs.map((doc) => doc.data());

    return NextResponse.json({ lives });
  } catch (err) {
    console.error("[lives GET] error:", err);
    return NextResponse.json({ error: "Failed to fetch lives" }, { status: 500 });
  }
}
