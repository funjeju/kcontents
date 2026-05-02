export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: "idToken required" }, { status: 400 });
    }

    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days

    const [decodedToken, sessionCookie] = await Promise.all([
      adminAuth.verifyIdToken(idToken),
      adminAuth.createSessionCookie(idToken, { expiresIn }),
    ]);

    await adminDb.collection("users").doc(decodedToken.uid).set(
      {
        email: decodedToken.email ?? null,
        displayName: decodedToken.name ?? null,
        photoUrl: decodedToken.picture ?? null,
        lastLoginAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const cookieStore = cookies();
    cookieStore.set("session", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[session] error:", err);
    return NextResponse.json({ error: "Failed to create session" }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.delete("session");
  return NextResponse.json({ ok: true });
}
