export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import type { Scenario } from "@/lib/types";
import { PlayClient } from "./_play-client";

interface Props {
  params: { id: string };
}

async function getScenario(id: string): Promise<Scenario | null> {
  try {
    const doc = await adminDb.collection("scenarios").doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Scenario;
  } catch {
    return null;
  }
}

export default async function CharacterCreatePage({ params }: Props) {
  const scenario = await getScenario(params.id);
  if (!scenario) notFound();

  return <PlayClient scenario={scenario} />;
}
