export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; n: string } }
) {
  try {
    const doc = await adminDb
      .collection("scenarios").doc(params.id)
      .collection("chapters").doc(params.n)
      .get();

    if (!doc.exists) return NextResponse.json({ events: null }, { status: 404 });
    return NextResponse.json({ events: doc.data()?.events ?? null });
  } catch {
    return NextResponse.json({ events: null }, { status: 404 });
  }
}
