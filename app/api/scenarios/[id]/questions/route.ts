import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// 인증 불필요 — 게임 플레이 중 공개 접근
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doc = await adminDb
      .collection("scenarios")
      .doc(params.id)
      .collection("meta")
      .doc("entryQuestions")
      .get();

    if (!doc.exists) return NextResponse.json({ questions: null });
    return NextResponse.json({ questions: doc.data()?.questions ?? null });
  } catch {
    return NextResponse.json({ questions: null });
  }
}
