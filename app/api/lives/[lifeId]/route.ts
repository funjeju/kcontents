export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminDb, getSessionUid } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";

interface Params {
  params: { lifeId: string };
}

async function getLifeDoc(lifeId: string) {
  const doc = await adminDb.collection("lives").doc(lifeId).get();
  return doc.exists ? doc.data() : null;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const uid = await getSessionUid(cookies().get("session")?.value);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const life = await getLifeDoc(params.lifeId);
    if (!life) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (life.userId !== uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    return NextResponse.json({ life });
  } catch (err) {
    console.error("[lives/:id GET]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const uid = await getSessionUid(cookies().get("session")?.value);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const life = await getLifeDoc(params.lifeId);
    if (!life) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (life.userId !== uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const updates: Record<string, unknown> = { lastPlayedAt: FieldValue.serverTimestamp() };

    // Special: addCompletedChapter uses arrayUnion to avoid race conditions
    if (typeof body.addCompletedChapter === "number") {
      updates.completedChapters = FieldValue.arrayUnion(body.addCompletedChapter);
      delete body.addCompletedChapter;
    }

    Object.assign(updates, body);
    await adminDb.collection("lives").doc(params.lifeId).update(updates);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[lives/:id PATCH]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
