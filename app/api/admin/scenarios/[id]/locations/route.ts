import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getApps } from "firebase-admin/app";
import type { LocationCard } from "@/lib/types";

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
    .collection("locations")
    .orderBy("chapterAge", "asc")
    .get();

  const locations = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ locations });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { locations } = (await req.json()) as { locations: Omit<LocationCard, "id">[] };

  const batch = getFirestore(getApps()[0]).batch();

  // 기존 삭제
  const existing = await adminDb
    .collection("scenarios").doc(params.id).collection("locations").get();
  existing.docs.forEach((d) => batch.delete(d.ref));

  // 새로 저장
  for (const loc of locations) {
    const ref = adminDb.collection("scenarios").doc(params.id).collection("locations").doc();
    batch.set(ref, {
      ...loc,
      id: ref.id,
      scenarioId: params.id,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  return NextResponse.json({ ok: true, count: locations.length });
}
