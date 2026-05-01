export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminDb, getSessionUid } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { callLLM, parseJsonFromText } from "@/lib/ai/router";
import { buildT0CastingPrompt } from "@/lib/ai/prompts";
import { determineCasting, getCastingRole } from "@/lib/game/casting";
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

    const castingRoleId = determineCasting(life, scenario);
    const castingRole = getCastingRole(scenario, castingRoleId);

    if (!castingRole) {
      return NextResponse.json({ error: "Casting role not found" }, { status: 500 });
    }

    const prompt = buildT0CastingPrompt({
      characterName: life.characterName,
      castingRoleName: castingRole.name.ko,
      castingDescription: castingRole.shortDescription.ko,
      scenarioTitle: scenario.title.ko,
      year: 1900,
      season: "가을",
      pastSummary: "6년의 어린 시절을 한성에서 보내며 많은 선택을 했습니다.",
      language: "ko",
    });

    const aiResponse = await callLLM("t0_casting", prompt);
    const parsed = parseJsonFromText(aiResponse.text);

    const t0Narrative: string =
      (parsed?.narrative as string) ?? castingRole.t0NarrativeTemplate.ko;

    await adminDb.collection("lives").doc(params.lifeId).update({
      castingRole: castingRoleId,
      castedAt: FieldValue.serverTimestamp(),
      lastPlayedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      roleId: castingRoleId,
      roleName: castingRole.name.ko,
      roleDescription: castingRole.shortDescription.ko,
      t0Narrative,
    });
  } catch (err) {
    console.error("[casting]", err);
    return NextResponse.json({ error: "Failed to determine casting" }, { status: 500 });
  }
}
