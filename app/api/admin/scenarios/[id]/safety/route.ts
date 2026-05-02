import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { SafetyRules } from "@/lib/types";

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

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doc = await adminDb
    .collection("scenarios")
    .doc(params.id)
    .collection("meta")
    .doc("safety")
    .get();

  if (!doc.exists) return NextResponse.json({ rules: null });
  return NextResponse.json({ rules: doc.data() });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rules = (await req.json()) as Partial<SafetyRules>;

  await adminDb
    .collection("scenarios")
    .doc(params.id)
    .collection("meta")
    .doc("safety")
    .set({
      ...rules,
      scenarioId: params.id,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

  return NextResponse.json({ ok: true });
}
