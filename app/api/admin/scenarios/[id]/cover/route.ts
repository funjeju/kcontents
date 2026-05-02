import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb, adminStorage } from "@/lib/firebase-admin";

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

// AI로 커버 이미지 생성
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doc = await adminDb.collection("scenarios").doc(params.id).get();
  if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = doc.data() ?? {};
  const title = (data.title as { ko?: string })?.ko ?? String(data.title ?? "");
  const era = String(data.era ?? "");
  const description = (data.description as { ko?: string })?.ko ?? "";

  const imagePrompt = `Korean webtoon manhwa illustration style poster for "${title}" set in ${era}. ${description ? description + "." : ""} Anime art style, vibrant saturated colors, expressive character design, soft cel-shading, detailed Korean traditional background, cinematic composition, no text, no watermark, no logo.`;

  try {
    const { generateScenarioImage } = await import("@/lib/gemini");
    const image = await generateScenarioImage(imagePrompt);
    if (!image) return NextResponse.json({ error: "이미지 생성 실패" }, { status: 500 });

    const bucket = adminStorage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const filePath = `scenarios/${params.id}/cover.jpg`;
    const file = bucket.file(filePath);
    await file.save(image.data, { metadata: { contentType: image.mimeType }, public: true });

    const coverImageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    await adminDb.collection("scenarios").doc(params.id).update({ coverImageUrl });

    return NextResponse.json({ coverImageUrl });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "이미지 생성 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// 직접 업로드 (base64)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { base64, mimeType } = await req.json() as { base64: string; mimeType: string };
  if (!base64 || !mimeType) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  try {
    const buffer = Buffer.from(base64, "base64");
    const ext = mimeType.includes("png") ? "png" : "jpg";
    const bucket = adminStorage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const filePath = `scenarios/${params.id}/cover.${ext}`;
    const file = bucket.file(filePath);
    await file.save(buffer, { metadata: { contentType: mimeType }, public: true });

    const coverImageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    await adminDb.collection("scenarios").doc(params.id).update({ coverImageUrl });

    return NextResponse.json({ coverImageUrl });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "업로드 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
