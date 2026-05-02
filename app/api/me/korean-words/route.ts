export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

async function getUid(): Promise<string | null> {
  const session = cookies().get("session")?.value;
  if (!session) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    return decoded.uid;
  } catch { return null; }
}

export interface SavedWord {
  word: string;
  romanization: string;
  meaning: string;
  culturalNote: string;
  scenarioTitle: string;
  learnedAt: string;
}

// GET: 저장된 단어 목록
export async function GET() {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ words: [] });

  const doc = await adminDb.collection("users").doc(uid).get();
  const words = (doc.data()?.koreanWords ?? []) as SavedWord[];
  return NextResponse.json({ words });
}

// POST: 새 단어 추가 (중복 제거)
export async function POST(req: NextRequest) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { words } = await req.json() as { words: SavedWord[] };
  if (!words?.length) return NextResponse.json({ ok: true });

  const doc = await adminDb.collection("users").doc(uid).get();
  const existing = (doc.data()?.koreanWords ?? []) as SavedWord[];
  const existingSet = new Set(existing.map((w) => w.word));

  const toAdd = words.filter((w) => !existingSet.has(w.word));
  if (!toAdd.length) return NextResponse.json({ ok: true });

  const updated = [...existing, ...toAdd].slice(-200); // 최대 200개
  await adminDb.collection("users").doc(uid).set({ koreanWords: updated }, { merge: true });

  return NextResponse.json({ ok: true, added: toAdd.length });
}
