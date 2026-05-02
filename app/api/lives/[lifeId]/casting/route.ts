export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminDb, getSessionUid } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { determineCasting, getCastingRole } from "@/lib/game/casting";
import type { Life, Scenario } from "@/lib/types";

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

    // Firestore에서 시나리오 가져오기
    const scenarioDoc = await adminDb.collection("scenarios").doc(life.scenarioId).get();
    if (!scenarioDoc.exists) return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    const scenario = { id: scenarioDoc.id, ...scenarioDoc.data() } as Scenario;

    if (!scenario.castingRoles || scenario.castingRoles.length === 0) {
      return NextResponse.json({ error: "No casting roles defined" }, { status: 500 });
    }

    const castingRoleId = determineCasting(life, scenario);
    const castingRole = getCastingRole(scenario, castingRoleId);

    if (!castingRole) {
      // 마지막 role(priority 가장 높은) fallback
      const fallback = [...scenario.castingRoles].sort((a, b) => b.priority - a.priority)[0];
      return NextResponse.json({
        roleId: fallback.id,
        roleName: fallback.name?.ko ?? "목격자",
        roleDescription: fallback.shortDescription?.ko ?? "",
        t0Narrative: fallback.t0NarrativeTemplate?.ko ?? "",
      });
    }

    await adminDb.collection("lives").doc(params.lifeId).update({
      castingRole: castingRoleId,
      castedAt: FieldValue.serverTimestamp(),
      lastPlayedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      roleId: castingRoleId,
      roleName: castingRole.name?.ko ?? "",
      roleDescription: castingRole.shortDescription?.ko ?? "",
      t0Narrative: castingRole.t0NarrativeTemplate?.ko ?? "",
    });
  } catch (err) {
    console.error("[casting]", err);
    return NextResponse.json({ error: "Failed to determine casting" }, { status: 500 });
  }
}
