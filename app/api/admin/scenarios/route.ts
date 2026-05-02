import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb, adminStorage } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

async function generateAndSaveCoverImage(
  scenarioId: string,
  scenario: Record<string, unknown>
) {
  const title = (scenario.title as { ko?: string })?.ko ?? String(scenario.title ?? "");
  const era = String(scenario.era ?? "");
  const description = (scenario.description as { ko?: string })?.ko ?? "";

  const imagePrompt = `Create a cinematic K-Drama scene poster for a story titled "${title}" set in ${era}. ${description ? `Theme: ${description}.` : ""} Painterly style, dramatic lighting, Korean aesthetic, no text.`;

  const { generateScenarioImage } = await import("@/lib/gemini");
  const image = await generateScenarioImage(imagePrompt);
  if (!image) return;

  const bucket = adminStorage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
  const filePath = `scenarios/${scenarioId}/cover.jpg`;
  const file = bucket.file(filePath);
  await file.save(image.data, {
    metadata: { contentType: image.mimeType },
    public: true,
  });

  const coverImageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
  await adminDb.collection("scenarios").doc(scenarioId).update({ coverImageUrl });
}

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

export async function POST(req: NextRequest) {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { scenario } = body as { scenario: Record<string, unknown> };

  if (!scenario?.id || !scenario?.title) {
    return NextResponse.json({ error: "유효하지 않은 시나리오" }, { status: 400 });
  }

  const scenarioId = scenario.id as string;
  const now = FieldValue.serverTimestamp();

  try {
    await adminDb.collection("scenarios").doc(scenarioId).set({
      ...scenario,
      status: scenario.status ?? "draft",
      createdAt: now,
      updatedAt: now,
      createdBy: uid,
    });

    // 커버 이미지 자동 생성 (백그라운드, 실패해도 저장은 완료)
    generateAndSaveCoverImage(scenarioId, scenario).catch(() => null);

    return NextResponse.json({ scenarioId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "저장 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const snap = await adminDb
      .collection("scenarios")
      .orderBy("updatedAt", "desc")
      .limit(50)
      .get();
    const scenarios = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ scenarios });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "조회 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
