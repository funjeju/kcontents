import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  params: { lifeId: string; n: string };
}

export default async function ChapterIntroPage({ params }: Props) {
  const { lifeId, n } = params;
  const chapter = parseInt(n);

  // In production: fetch from Firestore via admin SDK
  // For now: mock data
  const mockData = getMockChapterData(chapter);

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Era label */}
      <div className="max-w-game mx-auto w-full px-screen-x pt-8 pb-4">
        <p className="era-label">{mockData.eraLabel}</p>
      </div>

      {/* Chapter animation overlay */}
      <div className="flex-1 flex flex-col justify-center px-screen-x max-w-game mx-auto w-full">
        <div className="animate-fade-in-slow">
          {/* Season indicator */}
          <div className="flex gap-1 mb-6">
            {["봄", "여름", "가을", "겨울"].map((season, i) => (
              <span
                key={season}
                className={`text-sm ${i === mockData.seasonIndex ? "text-text font-medium" : "text-text-caption/40"}`}
              >
                {season}
              </span>
            ))}
          </div>

          {/* Age + year */}
          <h1 className="font-serif text-3xl font-bold text-text mb-2">
            {mockData.age}세
          </h1>
          <p className="font-serif text-xl text-text-muted mb-6">
            {mockData.year}년 {mockData.season}.
          </p>

          {/* Narrative */}
          <div className="narrative-text mb-8">
            {mockData.narrative.split("\n").map((line, i) => (
              <p key={i} className={i > 0 ? "mt-3" : ""}>{line}</p>
            ))}
          </div>

          {/* Chapter label */}
          <p className="text-xs text-text-caption mb-6">
            챕터 {chapter} · 이벤트 {mockData.eventCount}개
          </p>
        </div>
      </div>

      {/* CTA */}
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

function getMockChapterData(chapter: number) {
  const chapters = [
    {
      age: 9,
      year: 1894,
      season: "가을",
      seasonIndex: 2,
      eraLabel: "조선 · 갑오개혁",
      eventCount: 5,
      narrative:
        "청계천 변 한약방의 가을은 약재 냄새로 가득하다.\n\n당신은 9세입니다. 부친이 약을 짓는 동안, 당신은 문 앞에 앉아 지나가는 사람들을 바라봅니다.\n\n올해, 나라에 무언가 큰 일이 있다고 어른들이 말합니다.",
    },
    {
      age: 10,
      year: 1895,
      season: "봄",
      seasonIndex: 0,
      eraLabel: "조선 · 을미사변",
      eventCount: 6,
      narrative:
        "봄이 왔습니다. 그러나 이 봄은 조용하지 않습니다.\n\n당신은 10세입니다. 대궐에서 무슨 일이 있었다고, 한약방을 찾는 손님들이 수군거립니다.\n\n당신은 아직 모릅니다. 이 나라가 어디로 가고 있는지를.",
    },
    {
      age: 11,
      year: 1896,
      season: "겨울",
      seasonIndex: 3,
      eraLabel: "대한제국 전야",
      eventCount: 5,
      narrative:
        "겨울입니다. 당신은 11세가 되었습니다.\n\n이웃 양반가 따님 서희가 오늘도 한약방에 들렀습니다. 손에 한문 책을 들고서.\n\n당신은 그 책이 궁금합니다.",
    },
    {
      age: 12,
      year: 1897,
      season: "봄",
      seasonIndex: 0,
      eraLabel: "대한제국 원년",
      eventCount: 7,
      narrative:
        "12세, 1897년 봄.\n한성에 새 칙명이 내렸다. 대한제국. 그 이름이 거리에 떠돈다.\n\n당신은 한약방 일을 익히고 있고, 이웃의 양반가 따님은 요즘 부쩍 자주 약을 사러 온다. 한문 책을 들고서.\n\n변하는 것은 나라의 이름만이 아닌 듯하다.",
    },
    {
      age: 13,
      year: 1898,
      season: "여름",
      seasonIndex: 1,
      eraLabel: "대한제국 · 독립협회",
      eventCount: 6,
      narrative:
        "13세의 여름.\n\n독립협회가 만민공동회를 열었다. 종로 거리에 사람들이 모였다.\n\n당신도 그 소리를 들었습니다. 처음으로, 나라에 대해 생각하게 된 여름.",
    },
    {
      age: 14,
      year: 1899,
      season: "가을",
      seasonIndex: 2,
      eraLabel: "대한제국",
      eventCount: 6,
      narrative:
        "14세. 1899년 가을.\n\n한성에 전차가 놓였다. 당신은 처음으로 전차를 탔습니다.\n\n세상이 빠르게 변하고 있습니다. 당신도 변해야 할 것 같습니다.",
    },
    {
      age: 15,
      year: 1900,
      season: "가을",
      seasonIndex: 2,
      eraLabel: "대한제국 · T-0",
      eventCount: 1,
      narrative:
        "15세, 1900년 가을.\n\n6년이 지났습니다.\n\n세상이 변했습니다. 당신도 변했습니다.\n\n이제, 당신이 누구인지 알게 될 시간입니다.",
    },
  ];

  return chapters[Math.min(chapter - 1, chapters.length - 1)] ?? chapters[0];
}
