export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";

export async function GET() {
  const session = cookies().get("session")?.value;
  if (!session) return NextResponse.json({ loggedIn: false });
  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    return NextResponse.json({ loggedIn: true, uid: decoded.uid });
  } catch {
    return NextResponse.json({ loggedIn: false });
  }
}
