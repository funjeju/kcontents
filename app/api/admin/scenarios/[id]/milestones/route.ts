import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { Milestone } from "@/lib/types";

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

  const snap = await adminDb
    .collection("scenarios")
    .doc(params.id)
    .collection("milestones")
    .orderBy("order", "asc")
    .get();

  const milestones = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ milestones });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const milestone = (await req.json()) as Omit<Milestone, "id" | "scenarioId">;

  const ref = adminDb
    .collection("scenarios")
    .doc(params.id)
    .collection("milestones")
    .doc();

  await ref.set({
    ...milestone,
    id: ref.id,
    scenarioId: params.id,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: ref.id, ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { milestoneId } = await req.json();
  if (!milestoneId) return NextResponse.json({ error: "milestoneId required" }, { status: 400 });

  await adminDb
    .collection("scenarios")
    .doc(params.id)
    .collection("milestones")
    .doc(milestoneId)
    .delete();

  return NextResponse.json({ ok: true });
}
