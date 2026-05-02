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

  const imagePrompt = `Create a dramatic anime-style poster illustration.

SETTING: ${era}
${description ? `Story: ${description}` : ""}

VISUAL REQUIREMENTS — follow exactly based on the setting "${era}":

If the setting is modern (contains years like 2000s / 2010s / 2020s / 현대 / 당대 / contemporary):
  → Characters must wear modern everyday clothes: jeans, coats, suits, street fashion
  → Environment must show modern cityscape: glass towers, apartments, neon signs, subway, cafes, offices
  → Zero historical elements

If the setting is pre-20th century historical:
  → Period-accurate clothing and architecture for that exact culture and era

ABSOLUTELY DO NOT DRAW (unless the era explicitly demands it):
✗ Hanbok, jeogori, chima, gat, or any traditional Korean costume
✗ Hanok, tiled rooftops, wooden palace gates, traditional Korean architecture
✗ Any element that visually contradicts the era "${era}"

Choose ONE visual style that best fits this era and mood:
• Style A — Makoto Shinkai: detailed urban/natural environments, luminous skies, modern emotional drama
• Style B — Demon Slayer: bold contrast, dramatic lighting, intense cinematic atmosphere
• Style C — Violet Evergarden: soft pastel palette, delicate light, emotional character focus
• Style D — Vinland Saga / Kingdom: gritty realism, heavy atmosphere, serious dramatic weight
• Style E — Mamoru Hosoda: warm naturalistic tones, everyday beauty, emotional warmth

Composition: cinematic poster layout, no text, no watermark, no logo`;



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
