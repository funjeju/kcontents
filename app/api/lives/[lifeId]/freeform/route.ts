export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminDb, getSessionUid } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { callLLM, parseJsonFromText } from "@/lib/ai/router";
import { buildFreeformEvalPrompt } from "@/lib/ai/prompts";
import { applyStatChanges } from "@/lib/utils";
import type { Stats } from "@/lib/types";

interface Params {
  params: { lifeId: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const uid = await getSessionUid(cookies().get("session")?.value);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { input, eventNarrative, gateType } = await req.json();

    if (!input || input.length < 5) {
      return NextResponse.json({ error: "Input too short" }, { status: 400 });
    }

    const doc = await adminDb.collection("lives").doc(params.lifeId).get();
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const life = doc.data()!;
    if (life.userId !== uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const prompt = buildFreeformEvalPrompt({
      eventNarrative: eventNarrative ?? "당신은 어떻게 할 건가요?",
      userInput: input,
      gateType: gateType ?? "philosophy",
      language: "ko",
    });

    const aiResponse = await callLLM("freeform_eval", prompt);
    const parsed = parseJsonFromText(aiResponse.text);

    const narrative: string = (parsed?.resultNarrative as string) ?? "당신의 선택이 기록되었습니다.";
    const statChanges: Partial<Stats> = parsed?.statChanges ?? {};

    if (Object.keys(statChanges).length > 0) {
      const newStats = applyStatChanges(life.stats as Stats, statChanges);
      await adminDb.collection("lives").doc(params.lifeId).update({
        stats: newStats,
        lastPlayedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ narrative, statChanges });
  } catch (err) {
    console.error("[freeform]", err);
    return NextResponse.json({
      narrative: "당신의 선택이 기록되었습니다.",
      statChanges: {},
    });
  }
}
