import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

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

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; n: string } }
) {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doc = await adminDb
    .collection("scenarios").doc(params.id)
    .collection("chapters").doc(params.n)
    .get();

  if (!doc.exists) return NextResponse.json({ events: null }, { status: 404 });
  return NextResponse.json(doc.data());
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; n: string } }
) {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { events } = body as { events: unknown[] };

  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: "유효한 이벤트 배열 필요" }, { status: 400 });
  }

  await adminDb
    .collection("scenarios").doc(params.id)
    .collection("chapters").doc(params.n)
    .set({
      chapterNum: parseInt(params.n),
      scenarioId: params.id,
      events,
      updatedAt: FieldValue.serverTimestamp(),
      generatedBy: uid,
    }, { merge: true });

  return NextResponse.json({ ok: true });
}
