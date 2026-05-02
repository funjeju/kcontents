import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminDb, getSessionUid } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(
  req: NextRequest,
  { params }: { params: { lifeId: string } }
) {
  const sessionCookie = cookies().get("session")?.value;
  const uid = await getSessionUid(sessionCookie);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lifeRef = adminDb.collection("lives").doc(params.lifeId);
  const lifeDoc = await lifeRef.get();

  if (!lifeDoc.exists || lifeDoc.data()?.userId !== uid) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { selectedCards } = (await req.json()) as { selectedCards: string[] };

  if (!Array.isArray(selectedCards) || selectedCards.length !== 3) {
    return NextResponse.json({ error: "카드 3장을 선택해야 합니다" }, { status: 400 });
  }

  await lifeRef.update({
    selectedHeroCardSlots: selectedCards,
    lastPlayedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
