import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { EntryQuestion } from "@/lib/types";

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

// 첫 진입점 질문 조회
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doc = await adminDb
    .collection("scenarios")
    .doc(params.id)
    .collection("meta")
    .doc("entryQuestions")
    .get();

  if (!doc.exists) return NextResponse.json({ questions: null });
  return NextResponse.json({ questions: (doc.data()?.questions ?? null) });
}

// 첫 진입점 질문 저장
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { questions } = (await req.json()) as { questions: EntryQuestion[] };

  await adminDb
    .collection("scenarios")
    .doc(params.id)
    .collection("meta")
    .doc("entryQuestions")
    .set({
      questions,
      updatedAt: FieldValue.serverTimestamp(),
    });

  return NextResponse.json({ ok: true });
}
