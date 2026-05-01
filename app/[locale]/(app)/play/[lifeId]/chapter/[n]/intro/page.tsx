import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  params: { lifeId: string; n: string };
}

// Mr. Sunshine 정서: 크레이들 12세(1897) → T-0 15세(1900) → 본편 19세(1904)
const CRADLE_START_AGE = 12;
const CRADLE_START_YEAR = 1897;
const T0_CHAPTER = 4; // 챕터 4 = 15세 = T-0

export default async function ChapterIntroPage({ params }: Props) {
  const { lifeId, n } = params;
  const chapter = parseInt(n);

  const age = CRADLE_START_AGE + chapter - 1;
  const year = CRADLE_START_YEAR + chapter - 1;
  const isT0 = chapter === T0_CHAPTER;
  const data = getChapterData(chapter, age, year, isT0);

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <div className="max-w-game mx-auto w-full px-screen-x pt-8 pb-4">
        <p className="era-label">{data.eraLabel}</p>
      </div>

      <div className="flex-1 flex flex-col justify-center px-screen-x max-w-game mx-auto w-full">
        <div className="animate-fade-in-slow">
          {/* Season */}
          <div className="flex gap-1 mb-6">
            {["봄", "여름", "가을", "겨울"].map((s, i) => (
              <span
                key={s}
                className={`text-sm ${i === data.seasonIndex ? "text-text font-medium" : "text-text-caption/40"}`}
              >
                {s}
              </span>
            ))}
          </div>

          {/* Age + year */}
          <h1 className="font-serif text-3xl font-bold text-text mb-2">{age}세</h1>
          <p className="font-serif text-xl text-text-muted mb-6">{year}년 {data.season}.</p>

          {/* Narrative */}
          <div className="narrative-text mb-8">
            {data.narrative.split("\n").map((line, i) => (
              <p key={i} className={i > 0 ? "mt-3" : ""}>{line}</p>
            ))}
          </div>

          <p className="text-xs text-text-caption mb-6">
            {isT0 ? "T-0 · 운명의 순간" : `챕터 ${chapter} · 이벤트 ${data.eventCount}개`}
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

function getChapterData(chapter: number, age: number, year: number, isT0: boolean) {
  const chapters: Record<number, {
    season: string;
    seasonIndex: number;
    eraLabel: string;
    eventCount: number;
    narrative: string;
  }> = {
    1: {
      season: "봄",
      seasonIndex: 0,
      eraLabel: "대한제국 원년",
      eventCount: 6,
      narrative:
        `${year}년 봄. 대한제국이 선포되었습니다.\n\n당신은 ${age}세입니다. 한성의 거리는 새 나라의 이름으로 떠들썩하지만, 당신의 하루는 여전히 한약방 앞에서 시작됩니다.\n\n세상이 바뀌고 있습니다. 그 변화가 당신에게도 다가올 것입니다.`,
    },
    2: {
      season: "여름",
      seasonIndex: 1,
      eraLabel: "대한제국 · 독립협회",
      eventCount: 6,
      narrative:
        `${age}세의 여름. ${year}년.\n\n독립협회가 만민공동회를 열었습니다. 종로 거리에 사람들이 모여들었습니다.\n\n당신도 그 소리를 들었습니다. 처음으로, 나라에 대해 진지하게 생각하게 된 계절.`,
    },
    3: {
      season: "가을",
      seasonIndex: 2,
      eraLabel: "대한제국",
      eventCount: 6,
      narrative:
        `${age}세, ${year}년 가을.\n\n한성에 전차가 놓였습니다. 당신은 처음으로 그 철로를 바라보았습니다.\n\n세상이 빠르게 변하고 있습니다. 당신도 변해야 할 것 같습니다.`,
    },
    4: {
      season: "가을",
      seasonIndex: 2,
      eraLabel: "대한제국 · T-0",
      eventCount: 1,
      narrative:
        `${age}세, ${year}년 가을.\n\n3년이 지났습니다.\n\n세상이 변했습니다. 당신도 변했습니다.\n\n이제, 당신이 누구인지 알게 될 시간입니다.`,
    },
  };

  // 본편 챕터 (5장 이후)
  if (chapter >= 5) {
    const mainAge = age;
    const mainYear = year;
    return {
      season: "봄",
      seasonIndex: 0,
      eraLabel: `대한제국 · ${mainYear}년`,
      eventCount: 6,
      narrative: `${mainAge}세, ${mainYear}년.\n\n당신의 이야기가 계속됩니다.`,
    };
  }

  return chapters[chapter] ?? chapters[1];
}
