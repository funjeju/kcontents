export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = cookies().get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const body = await req.json();

    const { ageBracket, gender, country, preferredGenres } = body;

    await adminDb.collection("users").doc(decoded.uid).set(
      {
        ageBracket,
        gender,
        country,
        preferredGenres,
        onboarded: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[onboard] error:", err);
    return NextResponse.json({ error: "Failed to save onboarding" }, { status: 500 });
  }
}
