export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminDb, getSessionUid } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { applyStatChanges, checkStatDeath } from "@/lib/utils";
import type { Stats } from "@/lib/types";

interface Params {
  params: { lifeId: string; eventId: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const uid = await getSessionUid(cookies().get("session")?.value);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { statChanges } = await req.json();

    const doc = await adminDb.collection("lives").doc(params.lifeId).get();
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const life = doc.data()!;
    if (life.userId !== uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const currentStats = life.stats as Stats;
    const newStats = applyStatChanges(currentStats, statChanges ?? {});
    const diedEarlyOfStat = checkStatDeath(newStats);

    const updates: Record<string, unknown> = {
      stats: newStats,
      lastPlayedAt: FieldValue.serverTimestamp(),
    };

    if (diedEarlyOfStat) {
      updates.diedEarlyOfStat = diedEarlyOfStat;
      updates.diedAtAge = life.age;
      updates.isFinished = true;
    }

    await adminDb.collection("lives").doc(params.lifeId).update(updates);

    return NextResponse.json({ ok: true, newStats, diedEarlyOfStat });
  } catch (err) {
    console.error("[events/respond]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
