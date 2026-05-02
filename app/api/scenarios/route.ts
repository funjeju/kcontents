export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const snap = await adminDb.collection("scenarios").get();
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const scenarios = all.filter((s: Record<string, unknown>) => s["status"] !== "draft");
    const toSeconds = (v: unknown): number => {
      if (!v) return 0;
      if (typeof v === "object" && v !== null && "_seconds" in v) return (v as { _seconds: number })._seconds;
      if (typeof v === "string") return new Date(v).getTime() / 1000;
      return 0;
    };
    scenarios.sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
      toSeconds(b["publishedAt"] ?? b["updatedAt"]) - toSeconds(a["publishedAt"] ?? a["updatedAt"])
    );
    return NextResponse.json({ scenarios });
  } catch (err) {
    console.error("[GET /api/scenarios]", err);
    return NextResponse.json({ scenarios: [], error: String(err) }, { status: 500 });
  }
}
