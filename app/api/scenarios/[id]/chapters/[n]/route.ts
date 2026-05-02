export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; n: string } }
) {
  try {
    const locale = req.nextUrl.searchParams.get("locale") ?? "ko";
    const doc = await adminDb
      .collection("scenarios").doc(params.id)
      .collection("chapters").doc(params.n)
      .get();

    if (!doc.exists) return NextResponse.json({ events: null }, { status: 404 });

    const data = doc.data()!;
    // locale이 en이고 영문 캐시가 있으면 eventsEn 반환, 없으면 null
    const events = locale === "en"
      ? (data.eventsEn ?? null)
      : (data.events ?? null);

    return NextResponse.json({ events });
  } catch {
    return NextResponse.json({ events: null }, { status: 404 });
  }
}
