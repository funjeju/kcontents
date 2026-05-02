export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const snap = await adminDb
      .collection("scenarios")
      .where("status", "==", "published")
      .get();

    const scenarios = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const featured = scenarios[0]?.id ?? null;
    return NextResponse.json({ scenarios, featured });
  } catch {
    return NextResponse.json({ scenarios: [], featured: null });
  }
}
