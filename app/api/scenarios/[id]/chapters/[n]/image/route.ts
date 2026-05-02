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
    const prompt = `Create an anime scene illustration. Choose the single most fitting visual style from the options below based on the story's mood and setting — then apply it consistently.

Story: "${scenarioTitle}" set in ${era}
Scene: ${excerpt}

Visual style options (pick one):
• Style A — Makoto Shinkai: photorealistic backgrounds, hyper-detailed skies, emotional lighting, bittersweet mood
• Style B — Demon Slayer: high-contrast dramatic lighting, bold color gradients, intense historical energy
• Style C — Violet Evergarden: soft pastel palette, warm golden light, period drama, delicate expressions
• Style D — Vinland Saga / Kingdom: gritty realism, muted earthy tones, historical accuracy, dramatic weight
• Style E — Mamoru Hosoda: warm everyday naturalism, emotional storytelling, life elevated to beauty

Rules:
- Costumes and environment must match the actual setting of the story
- Widescreen cinematic composition
- No text, no watermark`;


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
