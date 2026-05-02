import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb, adminStorage } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

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

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doc = await adminDb.collection("scenarios").doc(params.id).get();
  if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ scenario: { id: doc.id, ...doc.data() } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { scenario, status } = body as {
    scenario?: Record<string, unknown>;
    status?: string;
  };

  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: uid,
  };

  if (scenario) {
    Object.assign(updates, scenario);
  }
  if (status) {
    updates.status = status;
  }

  try {
    await adminDb.collection("scenarios").doc(params.id).update(updates);

    // 출시 시 커버 이미지가 없으면 즉시 생성
    if (status === "published") {
      const doc = await adminDb.collection("scenarios").doc(params.id).get();
      const data = doc.data() ?? {};
      if (!data.coverImageUrl) {
        generateAndSaveCoverImage(params.id, data).catch(() => null);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "업데이트 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function generateAndSaveCoverImage(
  scenarioId: string,
  data: Record<string, unknown>
) {
  const title = (data.title as { ko?: string })?.ko ?? String(data.title ?? "");
  const era = String(data.era ?? "");
  const description = (data.description as { ko?: string })?.ko ?? "";

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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = await verifyAdmin();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await adminDb.collection("scenarios").doc(params.id).delete();
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "삭제 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
