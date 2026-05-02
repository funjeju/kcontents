import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { GameCard } from "@/lib/types";

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

// 시나리오 커스텀 카드 목록 조회
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await adminDb
    .collection("scenarios")
    .doc(params.id)
    .collection("customCards")
    .orderBy("createdAt", "asc")
    .get();

  const cards = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ cards });
}

// 커스텀 카드 저장 (POST: 새 카드 추가)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const card = (await req.json()) as Omit<GameCard, "id">;
  const ref = adminDb
    .collection("scenarios")
    .doc(params.id)
    .collection("customCards")
    .doc();

  await ref.set({
    ...card,
    id: ref.id,
    scenarioId: params.id,
    category: "custom",
    isStandard: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: ref.id, ok: true });
}

// 커스텀 카드 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cardId } = await req.json();
  if (!cardId) return NextResponse.json({ error: "cardId required" }, { status: 400 });

  await adminDb
    .collection("scenarios")
    .doc(params.id)
    .collection("customCards")
    .doc(cardId)
    .delete();

  return NextResponse.json({ ok: true });
}
