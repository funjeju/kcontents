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

function getChapterNarrative(
  chapter: number,
  age: number,
  year: number | null,
  season: "봄" | "여름" | "가을" | "겨울",
  isT0: boolean,
  t0Chapter: number,
  scenarioTitle: string | null,
): string {
  const title = scenarioTitle ?? "이 세계";

  if (isT0) {
    return [
      `${year != null ? `${year}년 ${season}` : `${age}세, ${season}`}. 크레이들의 마지막 해.`,
      `당신은 이제 ${age}세입니다. 지금까지의 모든 선택들이 조용히 당신 뒤에 서 있습니다. 무엇을 원하는지, 무엇이 되고 싶은지 — 이 계절이 지나면, 당신은 더 이상 예전의 당신이 아닐 것입니다.`,
      `T-0 모먼트가 다가왔습니다. 스스로를 직면할 준비가 되어 있나요.`,
    ].join("\n\n");
  }

  const progress = chapter / t0Chapter;
  const isEarly = progress <= 0.35;
  const isLate = progress >= 0.75;

  const narratives: Record<string, { p1: string; p2: string }> = {
    "봄": {
      p1: `겨울이 물러나고 ${title}의 세계에 새 바람이 불어옵니다. 당신은 어느새 ${age}세가 되었습니다. 새 시작은 언제나 눈부시지만, 그 빛 뒤에는 반드시 그림자도 따라오는 법입니다.`,
      p2: isEarly
        ? `아직 당신의 이야기는 씨앗에 불과합니다. 지금 심는 선택들이 훗날 당신이라는 사람을 만들어갈 것입니다. 봄은 짧습니다. 멈춰 있을 여유가 없습니다.`
        : isLate
        ? `이제 봄이 찾아와도 예전의 설렘과는 다릅니다. 당신은 그동안 많은 것을 경험했고, 그만큼 더 깊어졌습니다. 이번 봄이 당신에게 무엇을 가져올지는 아직 알 수 없습니다.`
        : `봄은 짧지만, 그 안에서 심어진 것들은 오래도록 자랍니다. 이번 계절을 어떻게 보낼 것인지 — 그 선택이 당신을 조금씩 완성해나갑니다.`,
    },
    "여름": {
      p1: `뜨겁고 긴 계절이 시작되었습니다. ${title}의 세계는 지금 숨 막히게 돌아가고 있습니다. 당신은 ${age}세 — 그 흐름 한가운데 서 있습니다.`,
      p2: isEarly
        ? `아직 여름의 열기가 낯설 수 있습니다. 하지만 이 계절 안에서만 가능한 것들이 있습니다. 당신만이 할 수 있는 무언가가 지금 막 시작되고 있습니다.`
        : isLate
        ? `더 이상 여름이 단순하지 않습니다. 이 뜨거움 속에서 무언가를 결정해야 할 순간이 반드시 옵니다. 어떤 선택을 내릴지, 그것이 당신의 이야기를 갈라놓을 것입니다.`
        : `이 여름이 지나면 당신은 달라져 있을 것입니다 — 더 강하게, 혹은 더 지쳐서. 어느 쪽이 될지는 지금 당신이 어떻게 행동하느냐에 달려 있습니다.`,
    },
    "가을": {
      p1: `무언가를 거두어야 할 계절이 왔습니다. ${title}의 세계에서 쌓인 시간들이 서서히 의미를 드러내기 시작합니다. 당신은 ${age}세입니다.`,
      p2: isEarly
        ? `아직 거둘 것이 많지 않을 수도 있습니다. 하지만 지금 무엇을 버리고 무엇을 지킬지 구분하는 것 — 그것이 이 가을의 과제입니다. 선택하지 않는 것도 하나의 선택입니다.`
        : isLate
        ? `붙잡고 싶은 것들과 놓아보내야 할 것들 사이에서, 당신은 점점 더 선명해지고 있습니다. 가을은 아름답지만, 그 아름다움 속에는 반드시 끝이 담겨 있습니다.`
        : `거둔 것들을 바라보세요. 지금의 당신은 과거의 선택들이 만들어낸 결과입니다. 이 가을이 지나면, 당신은 또 한 번 달라져 있을 것입니다.`,
    },
    "겨울": {
      p1: `세상이 조용해졌습니다. ${title}의 세계도 잠시 숨을 고르고 있습니다. 당신은 ${age}세 — 이 겨울을 어떻게 견딜 것인가요.`,
      p2: isEarly
        ? `첫 겨울은 가장 길게 느껴집니다. 이 추위 속에서 당신이 무엇을 붙잡는지가, 당신이 어떤 사람인지를 말해줍니다. 아직은 많은 것이 열려 있습니다.`
        : isLate
        ? `겨울은 사람을 단단하게 만들기도 하고, 때로는 부러뜨리기도 합니다. 이 계절이 끝났을 때 당신이 어느 쪽이 될지 — 지금의 선택이 그것을 결정합니다.`
        : `소음이 사라진 자리에서 진짜 목소리가 들려오기 시작합니다. 조용한 계절에 당신의 내면은 더 분명해집니다. 이 겨울, 무엇이 들립니까.`,
    },
  };

  const { p1, p2 } = narratives[season] ?? narratives["봄"];
  return `${p1}\n\n${p2}`;
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
  const season = seasons[(chapter - 1) % 4];

  const eraLabel = scenario?.era
    ? `${scenario.title?.ko ?? ""} · ${isT0 ? "T-0" : `챕터 ${chapter}`}`
    : (isT0 ? "T-0 · 운명의 순간" : `챕터 ${chapter}`);

  const narrative = getChapterNarrative(
    chapter, age, year, season, isT0, t0Chapter, scenario?.title?.ko ?? null
  );

  const eventCount = isT0 ? 1 : 6;

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <div className="max-w-game mx-auto w-full px-screen-x pt-8 pb-4">
        <p className="era-label">{eraLabel}</p>
      </div>

      <div className="flex-1 flex flex-col justify-center px-screen-x max-w-game mx-auto w-full">
        <div className="animate-fade-in-slow">
          {/* Season indicator */}
          <div className="flex gap-1 mb-6">
            {seasons.map((s, i) => (
              <span
                key={s}
                className={`text-sm ${s === season ? "text-text font-medium" : "text-text-caption/40"}`}
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
