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

  const { answers } = (await req.json()) as { answers: Record<string, string> };

  await lifeRef.update({
    entryAnswers: answers,
    lastPlayedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
