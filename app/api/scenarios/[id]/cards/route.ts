import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const snap = await adminDb
      .collection("scenarios").doc(params.id)
      .collection("customCards")
      .get();

    const cards = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ cards });
  } catch {
    return NextResponse.json({ cards: [] });
  }
}
