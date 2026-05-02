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
    const prompt = `Create an anime-style scene illustration.

SETTING: ${era}
Scene: ${excerpt}

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

Choose ONE visual style that best fits this era and scene mood:
• Style A — Makoto Shinkai: detailed urban/natural environments, luminous skies, modern emotional drama
• Style B — Demon Slayer: bold contrast, dramatic lighting, intense cinematic atmosphere
• Style C — Violet Evergarden: soft pastel palette, delicate light, emotional character focus
• Style D — Vinland Saga / Kingdom: gritty realism, heavy atmosphere, serious dramatic weight
• Style E — Mamoru Hosoda: warm naturalistic tones, everyday beauty, emotional warmth

Composition: widescreen cinematic, no text, no watermark`;


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
