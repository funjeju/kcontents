export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminDb, getSessionUid } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { callLLM, parseJsonFromText } from "@/lib/ai/router";
import { buildEndingNarrativePrompt } from "@/lib/ai/prompts";
import { selectEligibleEnding } from "@/lib/game/events";
import { MR_SUNSHINE_SCENARIO } from "@/data/scenarios/mr-sunshine";
import type { Life, Scenario } from "@/lib/types";

const SCENARIOS: Record<string, Scenario> = {
  mr_sunshine: MR_SUNSHINE_SCENARIO,
};

interface Params {
  params: { lifeId: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const uid = await getSessionUid(cookies().get("session")?.value);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const doc = await adminDb.collection("lives").doc(params.lifeId).get();
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const lifeData = doc.data()!;
    if (lifeData.userId !== uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const life = lifeData as Life;
    const scenario = SCENARIOS[life.scenarioId];
    if (!scenario) return NextResponse.json({ error: "Scenario not found" }, { status: 404 });

    const ending = selectEligibleEnding(life, scenario);
    if (!ending) {
      return NextResponse.json({ error: "No eligible ending found" }, { status: 500 });
    }

    const castingRole = scenario.castingRoles.find((r) => r.id === life.castingRole);

    const prompt = buildEndingNarrativePrompt({
      scenarioTitle: scenario.title.ko,
      characterName: life.characterName,
      castingRoleName: castingRole?.name.ko ?? "목격자",
      endingName: ending.title.ko,
      keyChoices: [],
      finalStats: life.stats,
      finalQualities: life.qualities,
      endAge: scenario.mainStoryEndAge,
      language: "ko",
    });

    const aiResponse = await callLLM("ending_narrative", prompt);
    const parsed = parseJsonFromText(aiResponse.text);

    const endingNarrative: string =
      (parsed?.endingNarrative as string) ?? ending.shortDescription.ko;

    await adminDb.collection("lives").doc(params.lifeId).update({
      endingId: ending.id,
      endingNarrative,
      isFinished: true,
      finishedAt: FieldValue.serverTimestamp(),
      lastPlayedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      endingId: ending.id,
      title: ending.title.ko,
      shortDescription: ending.shortDescription.ko,
      endingNarrative,
      rarityPercentage: ending.rarityPercentage,
      finalStats: life.stats,
    });
  } catch (err) {
    console.error("[ending]", err);
    return NextResponse.json({ error: "Failed to generate ending" }, { status: 500 });
  }
}
