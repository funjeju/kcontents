import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const snap = await adminDb
      .collection("scenarios").doc(params.id)
      .collection("locations")
      .orderBy("chapterAge", "asc")
      .get();

    const locations = snap.docs.map((d) => {
      const data = d.data();
      // 게임에 필요한 필드만 반환 (좌표, 이름, 감각 묘사)
      return {
        id: d.id,
        nameKo: data.nameKo,
        chapterAge: data.chapterAge ?? null,
        inGameMeaning: data.inGameMeaning,
        sensoryDescription: data.sensoryDescription,
        guideNote: data.guideNote,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
      };
    });

    return NextResponse.json({ locations });
  } catch {
    return NextResponse.json({ locations: [] });
  }
}
