export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const snap = await adminDb.collection("scenarios").get();
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const scenarios = all.filter((s: Record<string, unknown>) => s["status"] !== "draft");
    scenarios.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const aDate = (a["publishedAt"] ?? a["updatedAt"] ?? "") as string;
      const bDate = (b["publishedAt"] ?? b["updatedAt"] ?? "") as string;
      return bDate.localeCompare(aDate);
    });
    return NextResponse.json({ scenarios });
  } catch (err) {
    console.error("[GET /api/scenarios]", err);
    return NextResponse.json({ scenarios: [], error: String(err) }, { status: 500 });
  }
}
