export const dynamic = "force-dynamic";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { adminDb } from "@/lib/firebase-admin";
import type { Scenario } from "@/lib/types";

interface Props {
  params: { lifeId: string; n: string };
}

async function getScenarioForLife(lifeId: string): Promise<Scenario | null> {
  try {
    const lifeDoc = await adminDb.collection("lives").doc(lifeId).get();
    if (!lifeDoc.exists) return null;
    const scenarioId = lifeDoc.data()?.scenarioId as string | undefined;
    if (!scenarioId) return null;
    const scenarioDoc = await adminDb.collection("scenarios").doc(scenarioId).get();
    if (!scenarioDoc.exists) return null;
    return { id: scenarioDoc.id, ...scenarioDoc.data() } as Scenario;
  } catch {
    return null;
  }
}

export default async function ChapterIntroPage({ params }: Props) {
  const { lifeId, n } = params;
  const chapter = parseInt(n);
  const scenario = await getScenarioForLife(lifeId);

  const cradleStartAge = scenario?.cradleConfig?.cradleStartAge ?? 12;
  const cradleEndAge = scenario?.cradleConfig?.cradleEndAge ?? 15;
  const eraStartYear = scenario?.cradleConfig?.eraStartYear;

  const age = cradleStartAge + chapter - 1;
  const year = eraStartYear != null ? eraStartYear + chapter - 1 : null;
  const t0Chapter = cradleEndAge - cradleStartAge + 1;
  const isT0 = chapter === t0Chapter;

  const seasons = ["봄", "여름", "가을", "겨울"] as const;
  const seasonIndex = (chapter - 1) % 4;
  const season = seasons[seasonIndex];

  const eraLabel = scenario?.era
    ? `${scenario.title?.ko ?? ""} · ${isT0 ? "T-0" : `챕터 ${chapter}`}`
    : (isT0 ? "T-0 · 운명의 순간" : `챕터 ${chapter}`);

  const narrative = isT0
    ? `${year != null ? `${year}년 ${season}.` : `${age}세, ${season}.`}\n\n당신 앞에 결정적인 순간이 다가왔습니다.\n\n이제 당신이 누구인지 알게 될 시간입니다.`
    : `${year != null ? `${year}년 ${season}.` : `${age}세, ${season}.`}\n\n당신은 ${age}세입니다. ${scenario?.title?.ko ?? "이 이야기"}의 세계를 살아가고 있습니다.\n\n어떤 선택을 하느냐에 따라 당신의 이야기는 달라집니다.`;

  const eventCount = isT0 ? 1 : 6;

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <div className="max-w-game mx-auto w-full px-screen-x pt-8 pb-4">
        <p className="era-label">{eraLabel}</p>
      </div>

      <div className="flex-1 flex flex-col justify-center px-screen-x max-w-game mx-auto w-full">
        <div className="animate-fade-in-slow">
          {/* Season */}
          <div className="flex gap-1 mb-6">
            {seasons.map((s, i) => (
              <span
                key={s}
                className={`text-sm ${i === seasonIndex ? "text-text font-medium" : "text-text-caption/40"}`}
              >
                {s}
              </span>
            ))}
          </div>

          {/* Age + year */}
          <h1 className="font-serif text-3xl font-bold text-text mb-2">{age}세</h1>
          {year != null && (
            <p className="font-serif text-xl text-text-muted mb-6">{year}년 {season}.</p>
          )}

          {/* Narrative */}
          <div className="narrative-text mb-8">
            {narrative.split("\n").map((line, i) => (
              <p key={i} className={i > 0 ? "mt-3" : ""}>{line}</p>
            ))}
          </div>

          <p className="text-xs text-text-caption mb-6">
            {isT0 ? "T-0 · 운명의 순간" : `챕터 ${chapter} · 이벤트 ${eventCount}개`}
          </p>
        </div>
      </div>

      <div className="px-screen-x pb-8 max-w-game mx-auto w-full">
        <Link href={`/play/${lifeId}/chapter/${n}/event/1`}>
          <Button size="lg" fullWidth>
            계속하기 ▼
          </Button>
        </Link>
      </div>
    </div>
  );
}
