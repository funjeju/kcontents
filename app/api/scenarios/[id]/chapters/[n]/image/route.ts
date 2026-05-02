export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { generateScenarioImage } from "@/lib/gemini";

type Params = { params: { id: string; n: string } };

// GET: 캐시된 이미지 URL 반환
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const doc = await adminDb
      .collection("scenarios").doc(params.id)
      .collection("chapters").doc(params.n)
      .get();
    const imageUrl = doc.data()?.imageUrl ?? null;
    return NextResponse.json({ imageUrl });
  } catch {
    return NextResponse.json({ imageUrl: null });
  }
}

// POST: 이미지 생성 (narrative 기반)
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { narrative, scenarioTitle, era } = await req.json() as {
      narrative: string;
      scenarioTitle: string;
      era: string;
    };

    // 이미 생성됐으면 기존 URL 반환
    const chapterRef = adminDb
      .collection("scenarios").doc(params.id)
      .collection("chapters").doc(params.n);
    const existing = await chapterRef.get();
    if (existing.data()?.imageUrl) {
      return NextResponse.json({ imageUrl: existing.data()!.imageUrl });
    }

    const excerpt = narrative.slice(0, 120).replace(/\n/g, " ");
    const prompt = `Korean webtoon manhwa scene illustration. Story: "${scenarioTitle}" set in ${era}. Scene: ${excerpt}. Anime art style, vibrant Korean traditional colors, expressive emotional characters, detailed historical Korean scenery, cinematic widescreen composition, soft warm lighting, no text, no watermark.`;

    const image = await generateScenarioImage(prompt);
    if (!image) return NextResponse.json({ imageUrl: null }, { status: 500 });

    const bucket = adminStorage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const filePath = `scenarios/${params.id}/chapters/${params.n}.jpg`;
    const file = bucket.file(filePath);
    await file.save(image.data, { metadata: { contentType: image.mimeType }, public: true });

    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    await chapterRef.update({ imageUrl });

    return NextResponse.json({ imageUrl });
  } catch (e) {
    console.error("[chapter/image]", e);
    return NextResponse.json({ imageUrl: null }, { status: 500 });
  }
}
