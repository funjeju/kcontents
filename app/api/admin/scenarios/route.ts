import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

async function verifyAdmin(): Promise<string | null> {
  const session = cookies().get("session")?.value;
  if (!session) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
    if (userDoc.data()?.isAdmin !== true) return null;
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { scenario } = body as { scenario: Record<string, unknown> };

  if (!scenario?.id || !scenario?.title) {
    return NextResponse.json({ error: "유효하지 않은 시나리오" }, { status: 400 });
  }

  const scenarioId = scenario.id as string;
  const now = FieldValue.serverTimestamp();

  try {
    await adminDb.collection("scenarios").doc(scenarioId).set({
      ...scenario,
      status: scenario.status ?? "draft",
      createdAt: now,
      updatedAt: now,
      createdBy: uid,
    });

    return NextResponse.json({ scenarioId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "저장 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const snap = await adminDb
      .collection("scenarios")
      .orderBy("updatedAt", "desc")
      .limit(50)
      .get();
    const scenarios = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ scenarios });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "조회 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
