import { ScenarioCard } from "@/components/scenarios/scenario-card";
import { adminDb } from "@/lib/firebase-admin";
import type { Scenario } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getPublishedScenarios(): Promise<Scenario[]> {
  try {
    const snap = await adminDb
      .collection("scenarios")
      .where("status", "==", "published")
      .get();
    const scenarios = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Scenario[];
    // 최신순 정렬 (publishedAt 또는 updatedAt 기준)
    return scenarios.sort((a, b) => {
      const aDate = a.publishedAt ?? a.updatedAt ?? "";
      const bDate = b.publishedAt ?? b.updatedAt ?? "";
      return bDate.localeCompare(aDate);
    });
  } catch {
    return [];
  }
}

export default async function RecommendedPage() {
  const scenarios = await getPublishedScenarios();

  return (
    /* 모바일: max-w-game(480px) 중앙 / PC(lg+): 넉넉하게 1100px */
    <div className="mx-auto px-4 py-6 w-full max-w-game lg:max-w-[1100px] lg:px-8">
      {/* Header */}
      <div className="mb-6 animate-slide-up">
        <p className="era-label mb-1">K-Drama Life</p>
        <h1 className="font-serif text-2xl font-bold text-text">
          당신을 위해 골랐어요
        </h1>
        <p className="text-text-muted text-sm mt-1">어떤 인생을 살아보시겠어요?</p>
      </div>

      {/* Scenarios — 모바일 1열 / PC 3열, 최신순 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in">
        {scenarios.length > 0 ? (
          scenarios.map((scenario, i) => (
            <ScenarioCard key={scenario.id} scenario={scenario} featured={i === 0} />
          ))
        ) : (
          <p className="text-text-caption text-sm text-center py-8 col-span-full">
            출시된 시나리오가 없습니다
          </p>
        )}
      </div>
    </div>
  );
}
