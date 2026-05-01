"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLife } from "@/lib/hooks/use-life";
import { motion, AnimatePresence } from "framer-motion";
import { GameHeader } from "@/components/layout/game-header";
import { ChoiceButton } from "@/components/game/choice-button";
import { Button } from "@/components/ui/button";
import { initStats, applyStatChanges } from "@/lib/utils";
import type { Stats } from "@/lib/types";

interface Props {
  params: { lifeId: string; n: string; m: string };
}

type Phase = "reading" | "choosing" | "result" | "done";

export default function EventPage({ params }: Props) {
  const router = useRouter();
  const { lifeId, n, m } = params;
  const chapterNum = parseInt(n);
  const eventNum = parseInt(m);

  const { life, mutate } = useLife(lifeId);

  const [phase, setPhase] = useState<Phase>("choosing");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [statDeltas, setStatDeltas] = useState<Partial<Stats>>({});
  const [saving, setSaving] = useState(false);

  const event = getMockEvent(chapterNum, eventNum);
  const totalEvents = 6;
  const stats = life?.stats ?? initStats(10);

  async function handleChoice(choiceId: string) {
    if (phase !== "choosing") return;

    if (choiceId === "C") {
      router.push(`/play/${lifeId}/chapter/${n}/freeform?event=${m}`);
      return;
    }

    setSelectedChoice(choiceId);
    setPhase("result");

    const outcome = choiceId === "A" ? event.outcomes.A : event.outcomes.B;
    setStatDeltas(outcome.statChanges);

    // 즉시 로컬 업데이트 + 백그라운드 저장
    mutate({ stats: applyStatChanges(stats, outcome.statChanges) });
    setSaving(true);
    try {
      await fetch(`/api/lives/${lifeId}/events/${chapterNum}-${eventNum}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statChanges: outcome.statChanges }),
      });
    } catch {
      // 실패해도 UI는 이미 업데이트됨
    } finally {
      setSaving(false);
    }
  }

  // Mr. Sunshine: 크레이들 12세(1897) 시작, 챕터 4 = 15세 = T-0
  const CRADLE_START_AGE = 12;
  const CRADLE_START_YEAR = 1897;
  const T0_CHAPTER = 4;

  const age = CRADLE_START_AGE + chapterNum - 1;
  const year = CRADLE_START_YEAR + chapterNum - 1;
  const isT0Chapter = chapterNum === T0_CHAPTER;

  function handleNext() {
    const nextEventNum = eventNum + 1;
    // T-0 챕터: 이벤트 1개 후 캐스팅으로
    if (isT0Chapter && nextEventNum > 1) {
      router.push(`/play/${lifeId}/casting`);
      return;
    }
    if (nextEventNum > totalEvents) {
      router.push(`/play/${lifeId}/chapter/${n}/end`);
    } else {
      router.push(`/play/${lifeId}/chapter/${n}/event/${nextEventNum}`);
    }
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <GameHeader
        chapter={chapterNum}
        age={age}
        year={year}
        eventProgress={{ current: eventNum, total: totalEvents }}
        stats={stats}
        backHref={`/play/${lifeId}/chapter/${n}/intro`}
        phase={chapterNum <= T0_CHAPTER ? "cradle" : "main"}
      />

      <div className="flex-1 flex flex-col max-w-game mx-auto w-full px-screen-x py-6">
        {/* Age label */}
        <p className="era-label mb-4">{age}세 · {year}년</p>

        {/* Narrative */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`narrative-${eventNum}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="event-narrative mb-6"
          >
            {event.narrative.split("\n").map((line, i) => (
              <p key={i} className={i > 0 ? "mt-3" : ""}>{line}</p>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Result narrative */}
        <AnimatePresence>
          {phase === "result" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="hanji-card p-4 mb-4 border-l-2 border-accent-maple/40"
            >
              <p className="text-sm text-text leading-relaxed">
                {selectedChoice === "A"
                  ? event.outcomes.A.resultNarrative
                  : event.outcomes.B.resultNarrative}
              </p>
              {/* Stat changes */}
              {Object.entries(statDeltas).length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {Object.entries(statDeltas).map(([key, delta]) => (
                    delta !== 0 && (
                      <span
                        key={key}
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          (delta ?? 0) > 0
                            ? "bg-accent-jade/15 text-accent-jade"
                            : "bg-accent-maple/15 text-accent-maple"
                        }`}
                      >
                        {key} {(delta ?? 0) > 0 ? `+${delta}` : delta}
                      </span>
                    )
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Choices */}
        {(phase === "reading" || phase === "choosing") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="choices-container mt-auto"
          >
            <p className="text-xs text-text-caption mb-3">당신은:</p>
            {event.choices.map((choice) => (
              <ChoiceButton
                key={choice.id}
                choiceId={choice.id}
                text={choice.text}
                onSelect={handleChoice}
                isFreeform={choice.id === "C"}
              />
            ))}
          </motion.div>
        )}

        {/* Next button */}
        {phase === "result" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-auto pt-4"
          >
            <Button size="lg" fullWidth onClick={handleNext}>
              {eventNum >= totalEvents ? "챕터 마무리 ▶" : "다음 ▶"}
            </Button>
          </motion.div>
        )}

      </div>
    </div>
  );
}

interface MockEvent {
  narrative: string;
  choices: { id: string; text: string }[];
  outcomes: {
    A: { statChanges: Partial<Stats>; resultNarrative: string };
    B: { statChanges: Partial<Stats>; resultNarrative: string };
  };
}

// 챕터별 이벤트 풀 — 각 챕터마다 완전히 다른 사건
const CHAPTER_EVENTS: Record<number, MockEvent[]> = {
  // 챕터 1 — 12세, 1897년, 대한제국 원년
  1: [
    {
      narrative: "대한제국이 선포되었다는 소식이 한성에 퍼졌다.\n부친이 한약방 문을 닫고 나지막이 말씀하셨다.\n\"나라 이름이 바뀌었다. 이게 좋은 건지는 모르겠다.\"",
      choices: [
        { id: "A", text: "\"새 나라가 생기면 뭔가 달라지겠죠?\" 희망을 말한다." },
        { id: "B", text: "조용히 듣는다. 어른들의 걱정이 느껴진다." },
        { id: "C", text: "(자유롭게 생각 말하기)" },
      ],
      outcomes: {
        A: { statChanges: { emotion: 1, sociability: 1 }, resultNarrative: "부친이 쓸쓸히 웃으셨다. \"그래, 달라지겠지.\" 그 미소가 기쁜 것인지 슬픈 것인지 당신은 알 수 없었다." },
        B: { statChanges: { morality: 1, intellect: 1 }, resultNarrative: "그날 밤 당신은 오래 생각했다. 나라 이름이 바뀌면 사람들의 삶도 바뀌는 걸까." },
      },
    },
    {
      narrative: "양반가의 따님 서희가 약을 사러 한약방에 들렀다.\n손에 한문 책을 들고 있다.\n\n\"여인이 책을 읽는다고 신기하니?\" 그녀가 먼저 말을 걸었다.",
      choices: [
        { id: "A", text: "\"아닙니다. 무슨 책인지 궁금해서요.\"" },
        { id: "B", text: "고개를 숙이고 일에 집중한다." },
        { id: "C", text: "(자유롭게 답하기)" },
      ],
      outcomes: {
        A: { statChanges: { intellect: 1, sociability: 1 }, resultNarrative: "서희가 잠시 당신을 바라보더니 책 제목을 보여주었다. 논어였다. 당신들의 첫 대화가 그렇게 시작되었다." },
        B: { statChanges: { morality: 1 }, resultNarrative: "당신은 시선을 돌렸다. 서희는 약을 사고 조용히 떠났다. 하지만 왠지 그 한문 책이 머릿속에 남았다." },
      },
    },
    {
      narrative: "서당에서 훈장 어른이 퀴즈를 내셨다.\n\"천자문에서 하늘 천(天)이 뜻하는 것은?\"",
      choices: [
        { id: "A", text: "\"하늘이요. 하늘이 만물의 근본입니다.\"" },
        { id: "B", text: "머뭇거리다가 이웃 친구에게 답을 듣는다." },
        { id: "C", text: "(직접 답하기)" },
      ],
      outcomes: {
        A: { statChanges: { intellect: 2 }, resultNarrative: "훈장 어른이 고개를 끄덕이셨다. \"맞다. 이 아이는 집에서 공부를 잘 하는구나.\" 칭찬이 기분 좋았다." },
        B: { statChanges: { sociability: 1, intellect: -1 }, resultNarrative: "이웃 친구가 작은 소리로 알려주었다. 훈장 어른은 알아채셨지만, 그냥 넘어가셨다." },
      },
    },
    {
      narrative: "부친이 무거운 약재 짐을 들고 계셨다.\n지게를 진 등이 조금 굽어 보인다.",
      choices: [
        { id: "A", text: "\"제가 들겠습니다.\" 짐을 받아 든다." },
        { id: "B", text: "부친이 혼자 하실 수 있다고 생각하고 지켜본다." },
        { id: "C", text: "(자유롭게 선택하기)" },
      ],
      outcomes: {
        A: { statChanges: { physique: 1, morality: 1 }, resultNarrative: "부친이 잠시 당신을 바라보셨다. \"많이 컸구나.\" 그 말 한마디가 온 하루를 따뜻하게 했다." },
        B: { statChanges: { intellect: 1 }, resultNarrative: "부친은 혼자 짐을 드셨다. 나중에 당신은 생각했다. 도와드렸어야 했나." },
      },
    },
    {
      narrative: "골목에서 일본 상인과 조선 장사꾼이 다투고 있다.\n사람들이 모여들었지만 아무도 나서지 않는다.",
      choices: [
        { id: "A", text: "그냥 지나친다. 나와 상관없는 일이다." },
        { id: "B", text: "조선 장사꾼 편에 서서 소리를 질렀다." },
        { id: "C", text: "(자유롭게 행동하기)" },
      ],
      outcomes: {
        A: { statChanges: { sociability: -1 }, resultNarrative: "당신은 골목을 빠져나왔다. 뒤에서 고함소리가 들렸다. 그날 밤, 잠이 잘 오지 않았다." },
        B: { statChanges: { morality: 2, physique: -1 }, resultNarrative: "당신의 소리에 일본 상인이 멈칫했다. 조선 장사꾼이 도망칠 틈이 생겼다. 하지만 당신은 일본 상인의 눈길을 받게 되었다." },
      },
    },
    {
      narrative: "밤에 혼자 한약방 뒷마당에 앉았다.\n새 나라 대한제국이 선포된 해. 별은 여전히 같은 자리에 있다.",
      choices: [
        { id: "A", text: "이 나라가 어떻게 됐으면 좋겠는지 상상한다." },
        { id: "B", text: "내일 할 일들을 생각하며 일어난다." },
        { id: "C", text: "(지금 이 순간 무슨 생각을 하는지 써보기)" },
      ],
      outcomes: {
        A: { statChanges: { morality: 1, creativity: 1 }, resultNarrative: "자유로운 나라. 평등한 세상. 아직 막연한 꿈이지만, 그 꿈이 가슴 속에 심어졌다." },
        B: { statChanges: { physique: 1 }, resultNarrative: "내일도 한약방 일이 있다. 당신은 그런 사람이다. 지금 할 수 있는 일을 하는." },
      },
    },
  ],

  // 챕터 2 — 13세, 1898년, 독립협회·만민공동회
  2: [
    {
      narrative: "종로 거리에 사람들이 모여들고 있다.\n만민공동회(萬民共同會). 신분을 막론하고 모든 사람이 모이는 집회.\n\n\"저기 가도 되는 겁니까?\" 이웃이 부친께 묻는다.",
      choices: [
        { id: "A", text: "부친 몰래 혼자 구경하러 간다." },
        { id: "B", text: "부친과 함께 멀리서 지켜본다." },
        { id: "C", text: "(자유롭게 행동하기)" },
      ],
      outcomes: {
        A: { statChanges: { intellect: 1, physique: -1, morality: 1 }, resultNarrative: "군중 속에 섞여들었다. 사람들의 목소리가 하나로 합쳐지는 걸 처음으로 느꼈다. 가슴이 두근거렸다." },
        B: { statChanges: { emotion: 1, morality: 1 }, resultNarrative: "멀리서도 사람들의 외침이 들렸다. 부친이 조용히 말씀하셨다. \"세상이 바뀌려 하는구나.\"" },
      },
    },
    {
      narrative: "집회에서 돌아온 이웃 어른이 흥분한 얼굴로 말했다.\n\"오늘 연설자가 말했소 — 백성이 나라의 주인이라고!\"",
      choices: [
        { id: "A", text: "\"정말요? 백성이 주인이 될 수 있나요?\" 눈이 빛난다." },
        { id: "B", text: "\"위험한 말 아닌가요.\" 걱정이 앞선다." },
        { id: "C", text: "(자유롭게 생각 말하기)" },
      ],
      outcomes: {
        A: { statChanges: { intellect: 1, creativity: 1 }, resultNarrative: "이웃 어른이 당신을 흥미롭게 바라보았다. \"이 아이는 눈이 다르군.\" 그 말이 오래 기억에 남았다." },
        B: { statChanges: { morality: 1, emotion: 1 }, resultNarrative: "이웃 어른이 쓴웃음을 지었다. \"맞소. 조심해야 하오.\" 당신은 세상의 복잡함을 조금 더 알았다." },
      },
    },
    {
      narrative: "서희가 한약방 앞을 지나다 잠깐 걸음을 멈췄다.\n\"만민공동회에 갔었습니까?\"\n그녀의 눈이 반짝인다.",
      choices: [
        { id: "A", text: "\"네. 갔었습니다. 당신도요?\" 솔직하게 답한다." },
        { id: "B", text: "\"아닙니다.\" 짧게 부정한다." },
        { id: "C", text: "(자유롭게 대화하기)" },
      ],
      outcomes: {
        A: { statChanges: { sociability: 1, emotion: 1 }, resultNarrative: "서희가 작게 웃었다. \"저는 멀리서 봤습니다. 양반가 처녀가 거기 갈 수는 없으니.\" 잠깐의 침묵이 흘렀다." },
        B: { statChanges: { morality: -1 }, resultNarrative: "서희는 아무 말 없이 걸어갔다. 당신은 왜 거짓말을 했는지 스스로도 몰랐다." },
      },
    },
    {
      narrative: "정부가 독립협회를 강제 해산했다는 소식이 들렸다.\n한약방 안에서 어른들이 수군거리고 있다.",
      choices: [
        { id: "A", text: "어른들 대화에 귀를 기울인다." },
        { id: "B", text: "일에 집중한다. 내가 알아야 할 일이 아니다." },
        { id: "C", text: "(자유롭게 행동하기)" },
      ],
      outcomes: {
        A: { statChanges: { intellect: 2, emotion: 1 }, resultNarrative: "\"힘이 없으면 뜻도 없소.\" 어른 중 하나가 탄식했다. 그 말이 오래 머릿속에 맴돌았다." },
        B: { statChanges: { physique: 1 }, resultNarrative: "당신은 약재를 골랐다. 세상이 어떻게 돌아가든 오늘 할 일은 있었다." },
      },
    },
    {
      narrative: "한밤중에 누군가 한약방 문을 두드렸다.\n열어보니 낯선 젊은 남자가 피를 흘리며 서 있다.\n\"제발... 숨겨주시오.\"",
      choices: [
        { id: "A", text: "집 안으로 들인다. 부친께 알린다." },
        { id: "B", text: "문을 닫는다. 가족이 위험해질 수 있다." },
        { id: "C", text: "(자유롭게 결정하기)" },
      ],
      outcomes: {
        A: { statChanges: { morality: 2, physique: -1 }, resultNarrative: "부친이 상처를 치료해 주셨다. 새벽에 그 사람은 조용히 떠났다. 이름도 묻지 않았고 묻지도 않았다." },
        B: { statChanges: { intellect: 1, morality: -1 }, resultNarrative: "문을 닫으며 손이 떨렸다. 그 사람이 어떻게 됐는지, 당신은 끝내 알지 못했다." },
      },
    },
    {
      narrative: "올 한 해를 돌아본다.\n만민공동회, 독립협회 해산...\n세상은 당신이 생각보다 복잡하다는 걸 가르쳐주었다.",
      choices: [
        { id: "A", text: "이 복잡한 세상 속에서 내 자리를 찾고 싶다고 다짐한다." },
        { id: "B", text: "지금은 공부가 먼저라고 생각한다." },
        { id: "C", text: "(올해를 어떻게 기억하고 싶은지 써보기)" },
      ],
      outcomes: {
        A: { statChanges: { morality: 1, sociability: 1 }, resultNarrative: "아직 무엇이 자기 자리인지 모른다. 하지만 찾고 싶다는 마음이 생겼다는 것만으로도 충분했다." },
        B: { statChanges: { intellect: 2 }, resultNarrative: "책을 펼쳤다. 세상이 어수선할수록 실력이 있어야 한다고 생각했다." },
      },
    },
  ],

  // 챕터 3 — 14세, 1899년, 전차 개통·근대화
  3: [
    {
      narrative: "한성에 전차(電車)가 놓였다.\n쇠 궤도 위를 달리는 괴물 같은 것.\n처음 보는 사람들이 웅성거린다.",
      choices: [
        { id: "A", text: "용기를 내어 전차에 올라탄다." },
        { id: "B", text: "멀리서 구경만 한다. 아직 무섭다." },
        { id: "C", text: "(자유롭게 행동하기)" },
      ],
      outcomes: {
        A: { statChanges: { physique: 1, creativity: 1, intellect: 1 }, resultNarrative: "바람이 귓가를 스쳤다. 빠르고 낯설고 기이했다. 세상이 변하고 있다는 것을 온몸으로 느꼈다." },
        B: { statChanges: { emotion: 1 }, resultNarrative: "궤도 위를 달리는 전차를 보며 오래 생각했다. 저것이 좋은 것인지, 나쁜 것인지." },
      },
    },
    {
      narrative: "전차 안에서 일본인 관리가 조선 사람에게 자리를 비키라 했다.\n조선 사람은 말없이 일어났다.",
      choices: [
        { id: "A", text: "못 본 척한다. 혼자서는 어쩔 수 없다." },
        { id: "B", text: "일어선 사람 옆에 서서 조용히 같이 서 있는다." },
        { id: "C", text: "(자유롭게 행동하기)" },
      ],
      outcomes: {
        A: { statChanges: { morality: -1, intellect: 1 }, resultNarrative: "모른 척했지만 눈앞 장면이 잊히지 않았다. 세상은 이런 식으로 돌아간다는 걸 배웠다." },
        B: { statChanges: { morality: 2, sociability: 1 }, resultNarrative: "그 사람이 조용히 당신을 바라보았다. 고맙다는 말도 없었지만, 눈빛으로 전해졌다." },
      },
    },
    {
      narrative: "서희가 한약방에 들렀다.\n예전보다 말수가 줄었다.\n\"요즘 무슨 생각을 하십니까?\" 그녀가 먼저 물었다.",
      choices: [
        { id: "A", text: "\"이 나라가 어디로 가는지 걱정됩니다.\" 솔직하게 말한다." },
        { id: "B", text: "\"그냥... 하루하루 사는 것을 생각합니다.\" 얼버무린다." },
        { id: "C", text: "(자유롭게 대화하기)" },
      ],
      outcomes: {
        A: { statChanges: { emotion: 1, sociability: 1 }, resultNarrative: "서희가 잠시 침묵했다가 말했다. \"저도요.\" 그 짧은 두 글자가 오래 남았다." },
        B: { statChanges: { morality: 1 }, resultNarrative: "서희는 더 묻지 않았다. 약을 사고 조용히 떠났다. 당신은 그 뒷모습을 바라보았다." },
      },
    },
    {
      narrative: "부친이 일본 상인에게 약재를 팔라는 제안을 받으셨다.\n값은 좋다. 하지만 뭔가 꺼림칙하다.",
      choices: [
        { id: "A", text: "\"팔지 마세요, 부친.\" 반대 의견을 말한다." },
        { id: "B", text: "부친의 결정에 맡긴다. 어른의 일이다." },
        { id: "C", text: "(자유롭게 의견 말하기)" },
      ],
      outcomes: {
        A: { statChanges: { morality: 2, sociability: -1 }, resultNarrative: "부친이 잠시 당신을 바라보셨다. 결국 거절하셨다. 그날 저녁 밥상이 조금 검소해졌다." },
        B: { statChanges: { intellect: 1 }, resultNarrative: "부친은 결국 팔지 않으셨다. 당신은 아무 말도 하지 않았고, 그게 옳았는지 여전히 모른다." },
      },
    },
    {
      narrative: "학당에서 선생님이 새로운 학문 — 산수, 지리, 과학 — 을 가르치기 시작했다.\n전통 서당과는 전혀 다른 방식이다.",
      choices: [
        { id: "A", text: "열심히 배운다. 세상이 바뀌고 있으니 새 학문이 필요하다." },
        { id: "B", text: "한문과 유학을 더 깊이 공부하는 게 낫다고 생각한다." },
        { id: "C", text: "(어떻게 배우고 싶은지 말하기)" },
      ],
      outcomes: {
        A: { statChanges: { intellect: 2, creativity: 1 }, resultNarrative: "지구가 둥글다는 것, 먼 나라의 지도... 머릿속이 넓어지는 기분이었다." },
        B: { statChanges: { intellect: 1, morality: 1 }, resultNarrative: "옛 글 속에 이미 지혜가 있다고 생각했다. 뿌리를 알아야 가지가 자란다." },
      },
    },
    {
      narrative: "1899년이 저문다.\n전차가 다니고, 전기가 들어오는 한성.\n하지만 곳곳에서 일본의 영향이 느껴진다.\n\n당신은 내년에 15세가 된다.",
      choices: [
        { id: "A", text: "내년에는 무언가를 결정해야 할 것 같다는 느낌이 든다." },
        { id: "B", text: "아직은 아무것도 모른다. 조금 더 지켜봐야 한다." },
        { id: "C", text: "(1899년을 어떻게 기억하고 싶은지 써보기)" },
      ],
      outcomes: {
        A: { statChanges: { morality: 1, emotion: 1 }, resultNarrative: "무언가를 결정해야 한다는 것. 그게 무엇인지는 아직 모른다. 하지만 그 감각 자체가 당신을 성장시키고 있었다." },
        B: { statChanges: { intellect: 1, creativity: 1 }, resultNarrative: "조급함 없이 지켜보는 것도 하나의 태도였다. 당신은 아직 배우는 중이다." },
      },
    },
  ],

  // 챕터 4 — 15세, 1900년, T-0 단 하나의 이벤트
  4: [
    {
      narrative: "1900년 가을.\n\n부친이 당신을 불러 앉히셨다.\n\n\"이제 너도 어엿한 나이가 됐다.\n앞으로 어떻게 살 것인지 — 스스로 생각해야 한다.\"",
      choices: [
        { id: "A", text: "\"제 길을 찾겠습니다.\" 결심을 말한다." },
        { id: "B", text: "\"부친과 함께하겠습니다.\" 가업을 잇겠다고 한다." },
        { id: "C", text: "(자유롭게 마음 말하기)" },
      ],
      outcomes: {
        A: { statChanges: { intellect: 1, morality: 1 }, resultNarrative: "부친이 오랫동안 당신을 바라보셨다. 그리고 고개를 끄덕이셨다. \"그래. 네 길을 가거라.\"" },
        B: { statChanges: { morality: 2, emotion: 1 }, resultNarrative: "부친의 눈가가 촉촉해졌다. 당신은 그 모습이 처음이었다. 가족이란 무엇인지 다시 생각했다." },
      },
    },
  ],

  // 챕터 5 — 16세, 1901년, 격동의 시작
  5: [
    {
      narrative: "제주에서 온 편지가 한성에 돌았다.\n수천 명이 죽었다는 소식.\n신축교안(辛丑敎案). 민중과 천주교도 사이의 충돌.\n\n부친이 편지를 읽다가 조용히 접으셨다.",
      choices: [
        { id: "A", text: "\"왜 그런 일이 벌어지는 겁니까?\" 까닭을 묻는다." },
        { id: "B", text: "조용히 자리를 피한다. 모르는 게 나을 것 같다." },
        { id: "C", text: "(자유롭게 반응하기)" },
      ],
      outcomes: {
        A: { statChanges: { intellect: 2, emotion: 1 }, resultNarrative: "부친이 한참 후에 입을 여셨다. \"두려움과 분노가 한꺼번에 터지면 사람이 사람을 해친다.\" 당신은 그 말을 오래 곱씹었다." },
        B: { statChanges: { morality: 1, physique: 1 }, resultNarrative: "뒷마당에서 약재를 고르며 생각했다. 먼 곳의 일이지만, 언젠가 이 한성에도 같은 바람이 불어올지 모른다는 느낌이 들었다." },
      },
    },
    {
      narrative: "미국 공사관 앞을 지나던 중\n성조기가 펄럭이는 것을 보았다.\n어린 조선 아이가 그 깃발을 신기하게 올려다보고 있다.",
      choices: [
        { id: "A", text: "아이 곁에 서서 함께 바라본다. 저 나라는 어떤 곳일까." },
        { id: "B", text: "발길을 재촉한다. 남의 나라 깃발에 마음 쓸 여유가 없다." },
        { id: "C", text: "(자유롭게 행동하기)" },
      ],
      outcomes: {
        A: { statChanges: { intellect: 1, creativity: 1 }, resultNarrative: "공사관 안에서 영어 말소리가 새어 나왔다. 저 안에서는 조선의 운명이 저들의 언어로 논해지고 있을지도 몰랐다." },
        B: { statChanges: { physique: 1, morality: 1 }, resultNarrative: "골목을 돌아 나오면서 뒤를 한 번 돌아보았다. 아이는 여전히 깃발을 바라보고 있었다." },
      },
    },
    {
      narrative: "종로에서 오랜만에 서희를 마주쳤다.\n그녀는 한 해 사이에 눈빛이 달라져 있었다.\n\"요즘 무엇을 하고 계십니까?\" 그녀가 먼저 물었다.",
      choices: [
        { id: "A", text: "\"아직 찾고 있습니다. 제 길을.\" 솔직하게 말한다." },
        { id: "B", text: "\"한약방 일입니다.\" 짧게 답하고 화제를 돌린다." },
        { id: "C", text: "(자유롭게 대화하기)" },
      ],
      outcomes: {
        A: { statChanges: { emotion: 2, sociability: 1 }, resultNarrative: "서희가 고개를 끄덕였다. \"저도요.\" 그 대답이 예전보다 훨씬 무겁게 들렸다. 그녀 역시 무언가를 찾고 있었다." },
        B: { statChanges: { intellect: 1 }, resultNarrative: "서희는 더 묻지 않았다. 인사를 나누고 헤어졌다. 돌아오는 길에 말을 좀 더 했어야 했나 싶었다." },
      },
    },
    {
      narrative: "관립 외국어 학교에서 학생을 모집한다는 방이 붙었다.\n일어, 영어, 프랑스어 — 새 세상의 언어들.\n\n부친이 그 방을 한참 바라보셨다.",
      choices: [
        { id: "A", text: "\"입학하고 싶습니다.\" 직접 말씀드린다." },
        { id: "B", text: "부친의 눈치를 살피며 기다린다." },
        { id: "C", text: "(자유롭게 결정하기)" },
      ],
      outcomes: {
        A: { statChanges: { intellect: 1, sociability: 1, morality: 1 }, resultNarrative: "부친이 오래 침묵하셨다. 그리고 말씀하셨다. \"네가 원한다면.\" 그 말이 허락인지 포기인지, 당신은 알 수 없었다." },
        B: { statChanges: { emotion: 1, morality: 1 }, resultNarrative: "부친은 아무 말씀 없이 걸어가셨다. 그 방은 며칠 후 바람에 떨어졌다." },
      },
    },
    {
      narrative: "야학(夜學)에서 글을 가르치는 젊은 훈장이 당신에게 물었다.\n\"당신은 왜 배웁니까?\"\n\n처음 들어보는 질문이었다.",
      choices: [
        { id: "A", text: "\"살아남기 위해서입니다.\"" },
        { id: "B", text: "\"세상을 바꾸고 싶기 때문입니다.\"" },
        { id: "C", text: "(솔직하게 자신의 이유를 말하기)" },
      ],
      outcomes: {
        A: { statChanges: { intellect: 1, physique: 1 }, resultNarrative: "훈장이 고개를 끄덕였다. \"정직한 대답이오.\" 당신은 그것이 칭찬인지 아닌지 몰랐다." },
        B: { statChanges: { morality: 2, creativity: 1 }, resultNarrative: "훈장이 잠시 당신을 바라보았다. 그리고 웃었다. \"그 마음, 잃지 마시오.\"" },
      },
    },
    {
      narrative: "1901년이 저문다.\n당신은 이제 열여섯.\n주변의 모든 것이 조금씩 빠르게 변하고 있다.\n\n그 변화 속에서 당신은 어디쯤 서 있는가.",
      choices: [
        { id: "A", text: "변화의 중심에 서고 싶다. 지켜보는 것은 이제 충분하다." },
        { id: "B", text: "아직은 때가 아니다. 더 단단해져야 한다." },
        { id: "C", text: "(1901년의 자신에게 한 마디 건네기)" },
      ],
      outcomes: {
        A: { statChanges: { morality: 1, sociability: 1 }, resultNarrative: "결심은 말보다 행동이다. 당신은 그것을 알기 시작했다." },
        B: { statChanges: { intellect: 1, physique: 1 }, resultNarrative: "서두르지 않는 것도 힘이다. 당신은 아직 준비 중이다." },
      },
    },
  ],

  // 챕터 6 — 17세, 1902년, 이민과 동맹의 시대
  6: [
    {
      narrative: "한성에 소문이 돌았다.\n조선 사람들이 배를 타고 하와이로 떠난다고.\n\n\"거기 가면 돈을 번다더라.\" 골목 아이들이 수군거렸다.",
      choices: [
        { id: "A", text: "\"나도 언젠가 저 배를 탈 수 있을까.\" 상상해본다." },
        { id: "B", text: "\"이 땅을 떠나는 게 맞는 일인가.\" 의심이 든다." },
        { id: "C", text: "(자유롭게 생각하기)" },
      ],
      outcomes: {
        A: { statChanges: { creativity: 1, intellect: 1 }, resultNarrative: "먼 바다 저편 낯선 땅. 그 상상이 가슴을 열어주는 것도 같고, 두렵게 하는 것도 같았다." },
        B: { statChanges: { morality: 2 }, resultNarrative: "이 땅이 힘들어도 이 땅이 내 땅이다. 당신은 그렇게 생각했다. 하지만 떠나는 사람들을 탓할 수는 없었다." },
      },
    },
    {
      narrative: "일본과 영국이 동맹을 맺었다는 소식.\n영일동맹(英日同盟).\n\n어른들이 술잔을 내려놓고 한참 침묵했다.",
      choices: [
        { id: "A", text: "\"그게 왜 우리한테 나쁜 건가요?\" 솔직히 묻는다." },
        { id: "B", text: "어른들의 표정을 보며 나쁜 일임을 짐작한다." },
        { id: "C", text: "(자유롭게 반응하기)" },
      ],
      outcomes: {
        A: { statChanges: { intellect: 2 }, resultNarrative: "어른이 긴 설명을 해주었다. 나라와 나라 사이의 계산. 그 계산에 조선은 없었다는 말이 마지막에 나왔다." },
        B: { statChanges: { emotion: 1, morality: 1 }, resultNarrative: "말 없이 분위기만으로도 알 수 있는 것들이 있었다. 세상은 점점 조선에게 불리하게 돌아가고 있었다." },
      },
    },
    {
      narrative: "시내에서 러시아 군인을 처음 보았다.\n덩치 큰 이방인들이 거리를 활보하고 있다.\n일본 상인의 얼굴이 굳어 있다.",
      choices: [
        { id: "A", text: "거리 구경에 섞여 지켜본다. 이 도시는 누구의 것인가." },
        { id: "B", text: "빠르게 자리를 피한다. 강자들 사이에서 살아남는 법이다." },
        { id: "C", text: "(자유롭게 행동하기)" },
      ],
      outcomes: {
        A: { statChanges: { intellect: 1, emotion: 1 }, resultNarrative: "러시아인, 일본인, 조선인이 한 거리에 섞여 있었다. 각자 다른 셈을 하면서. 이 도시는 누구의 것도 아닌 것처럼 느껴졌다." },
        B: { statChanges: { physique: 1, morality: 1 }, resultNarrative: "골목으로 빠져나오며 생각했다. 살아남는 것이 먼저다. 판단은 나중에 해도 된다." },
      },
    },
    {
      narrative: "서희가 보낸 쪽지 한 장.\n\"내일 오시오. 드릴 말씀이 있소.\"\n\n짧고 단정한 글씨체. 그녀답다.",
      choices: [
        { id: "A", text: "약속 장소로 간다." },
        { id: "B", text: "조심스러워 답장만 보낸다. 양반가 규수와 함부로 만날 수 없다." },
        { id: "C", text: "(자유롭게 결정하기)" },
      ],
      outcomes: {
        A: { statChanges: { sociability: 1, emotion: 2 }, resultNarrative: "서희가 낮은 목소리로 말했다. \"이 나라가 어디로 가는지, 당신은 어떻게 생각하십니까.\" 그 질문은 처음부터 끝이 정해진 대화의 시작이었다." },
        B: { statChanges: { morality: 1, intellect: 1 }, resultNarrative: "답장을 썼다. '사정이 있어 가기 어렵소.' 쪽지를 접으며 당신은 그 이유가 진심인지 자신에게 물었다." },
      },
    },
    {
      narrative: "독립 운동을 돕는 자금을 모은다는 젊은이가 찾아왔다.\n\"당신도 힘을 보태 주시오.\"\n눈빛이 진지하다.",
      choices: [
        { id: "A", text: "가진 것이 없지만 함께하겠다고 한다." },
        { id: "B", text: "지금은 때가 아니라며 정중히 거절한다." },
        { id: "C", text: "(자유롭게 결정하기)" },
      ],
      outcomes: {
        A: { statChanges: { morality: 2, physique: -1 }, resultNarrative: "젊은이가 당신의 손을 잡았다. 그 악수가 무엇을 뜻하는지 당신은 알면서도 잡았다." },
        B: { statChanges: { intellect: 1, morality: -1 }, resultNarrative: "젊은이는 다음 사람에게로 발걸음을 옮겼다. 당신은 그 뒷모습을 바라보며 오래 서 있었다." },
      },
    },
    {
      narrative: "열일곱 해가 저문다.\n이 도시엔 러시아와 일본의 기운이 팽팽하다.\n전쟁이 난다는 소문이 끊이지 않는다.\n\n당신은 어떤 사람이 되어가고 있는가.",
      choices: [
        { id: "A", text: "이미 선택은 했다. 내 길을 걷는다." },
        { id: "B", text: "아직 모르겠다. 세상이 먼저 결정할 것이다." },
        { id: "C", text: "(열일곱의 자신에게 말 건네기)" },
      ],
      outcomes: {
        A: { statChanges: { morality: 1, physique: 1 }, resultNarrative: "선택은 한 번에 오지 않는다. 매일 조금씩 해온 것들이 쌓여 지금의 당신이 되어 있었다." },
        B: { statChanges: { intellect: 1, emotion: 1 }, resultNarrative: "모른다고 솔직히 인정하는 것. 그것도 용기다. 세상은 이미 움직이고 있었다." },
      },
    },
  ],

  // 챕터 7 — 18세, 1903년, 황무지와 전쟁의 전야
  7: [
    {
      narrative: "일본이 조선의 황무지 개간권을 요구하고 있다는 소식.\n\n\"그 땅에 우리 조상 묘가 있소!\" 어느 농부가 울부짖었다.",
      choices: [
        { id: "A", text: "반대 서명 운동에 이름을 올린다." },
        { id: "B", text: "지켜본다. 어차피 한 사람이 바꿀 수 있는 게 아니다." },
        { id: "C", text: "(자유롭게 행동하기)" },
      ],
      outcomes: {
        A: { statChanges: { morality: 2, sociability: 1 }, resultNarrative: "수천 명의 이름이 모였다. 그 무게가 어떤 결과를 낳을지 몰랐지만, 이름을 올린 것만으로도 무언가 달라진 기분이었다." },
        B: { statChanges: { intellect: 1 }, resultNarrative: "열흘 후 일본이 요구를 철회했다. 당신은 자신이 서명을 안 한 것을 기억했다." },
      },
    },
    {
      narrative: "러시아 군대가 만주에서 철수하지 않고 있다.\n한성에는 전쟁이 곧 난다는 소문이 파다하다.\n\n부친이 약재를 두 배로 사들이셨다.",
      choices: [
        { id: "A", text: "\"전쟁이 나면 어떻게 됩니까?\" 부친께 묻는다." },
        { id: "B", text: "조용히 약재 정리를 돕는다. 준비하는 것만이 할 수 있는 일이다." },
        { id: "C", text: "(자유롭게 반응하기)" },
      ],
      outcomes: {
        A: { statChanges: { intellect: 1, emotion: 1 }, resultNarrative: "부친이 잠시 손을 멈추셨다. \"사람이 많이 죽는다.\" 그게 전부였다. 더 이상 묻지 않았다." },
        B: { statChanges: { physique: 1, morality: 1 }, resultNarrative: "약재를 고르며 생각했다. 이 손이 얼마나 많은 사람을 살릴 수 있을까. 전쟁 속에서도." },
      },
    },
    {
      narrative: "지사(志士)들이 비밀리에 모인다는 소문을 들었다.\n나라를 지키기 위한 의병 준비라고.\n누군가 당신에게 그 자리를 알려주었다.",
      choices: [
        { id: "A", text: "그 자리에 찾아간다." },
        { id: "B", text: "위험하다고 생각해 가지 않는다." },
        { id: "C", text: "(자유롭게 결정하기)" },
      ],
      outcomes: {
        A: { statChanges: { morality: 2, physique: 1 }, resultNarrative: "좁은 방 안에 열 명 남짓한 사람들이 앉아 있었다. 나이도 신분도 달랐다. 그러나 눈빛만은 같았다." },
        B: { statChanges: { intellect: 1, sociability: -1 }, resultNarrative: "가지 않기로 했다. 아직은 아니라고. 창호지 뒤로 저 멀리 사람들의 목소리가 들리는 것 같았다." },
      },
    },
    {
      narrative: "부친이 쓰러지셨다.\n며칠째 누워 계신다.\n약방 일을 당신 혼자 감당해야 했다.",
      choices: [
        { id: "A", text: "모든 것을 제쳐두고 부친 곁을 지킨다." },
        { id: "B", text: "약방을 지키면서 부친을 돌본다. 둘 다 해야 한다." },
        { id: "C", text: "(자유롭게 선택하기)" },
      ],
      outcomes: {
        A: { statChanges: { emotion: 2, morality: 1 }, resultNarrative: "열흘 후 부친이 일어나셨다. \"너 덕분이다.\" 그 말 한마디가 지난 열흘을 다 지워주었다." },
        B: { statChanges: { physique: 1, intellect: 1 }, resultNarrative: "몸이 한계에 부딪혔다. 하지만 쓰러지지 않았다. 부친도 당신도." },
      },
    },
    {
      narrative: "서희와 마지막으로 이야기를 나눴다.\n그녀의 집안에서 혼처를 정했다고 했다.\n\n\"어디 가시는 겁니까.\" 당신이 물었다.",
      choices: [
        { id: "A", text: "\"잘 되시길 바랍니다.\" 담담하게 말한다." },
        { id: "B", text: "아무 말 못하고 그 자리를 떠난다." },
        { id: "C", text: "(자유롭게 마음을 전하기)" },
      ],
      outcomes: {
        A: { statChanges: { morality: 1, emotion: -1 }, resultNarrative: "서희가 잠시 당신을 바라보았다. \"당신도요.\" 그리고 돌아섰다. 그게 마지막이었는지 당신은 몰랐다." },
        B: { statChanges: { emotion: 2 }, resultNarrative: "골목을 나오며 뒤돌아보지 않았다. 무언가가 끝나는 소리가 들리는 것 같았다." },
      },
    },
    {
      narrative: "1903년이 끝나간다.\n전쟁의 기운이 짙다.\n당신은 열여덟.\n이제 더 이상 아이가 아니다.",
      choices: [
        { id: "A", text: "내년에 전쟁이 나면 나는 무엇을 할 것인가 — 생각한다." },
        { id: "B", text: "생각을 멈춘다. 일어나지 않은 일을 걱정하는 건 소용없다." },
        { id: "C", text: "(열여덟의 자신에게 남길 말 쓰기)" },
      ],
      outcomes: {
        A: { statChanges: { morality: 1, intellect: 1 }, resultNarrative: "준비한 사람만이 그 순간 자신의 선택을 할 수 있다. 당신은 그것을 알기 시작했다." },
        B: { statChanges: { physique: 1, emotion: 1 }, resultNarrative: "지금 이 순간을 사는 것. 내일은 내일이 알아서 온다. 당신은 촛불을 끄고 잠자리에 들었다." },
      },
    },
  ],

  // 챕터 8 — 19세, 1904년, 러일전쟁·한일의정서
  8: [
    {
      narrative: "1904년 2월.\n러일전쟁이 시작되었다.\n한성 거리에 일본 군대가 줄지어 들어왔다.\n\n사람들이 길 양쪽으로 물러섰다.",
      choices: [
        { id: "A", text: "당당히 제자리에 서서 그들이 지나가는 걸 바라본다." },
        { id: "B", text: "다른 사람들처럼 길가로 물러선다." },
        { id: "C", text: "(자유롭게 행동하기)" },
      ],
      outcomes: {
        A: { statChanges: { morality: 2, physique: 1 }, resultNarrative: "일본 병사 하나가 당신을 힐끗 바라보았다. 당신은 시선을 피하지 않았다. 그 순간이 오래 기억에 남았다." },
        B: { statChanges: { intellect: 1, sociability: 1 }, resultNarrative: "살아남는 것이 먼저다. 물러서며 당신은 주변 사람들의 얼굴을 보았다. 두려움과 분노가 뒤섞여 있었다." },
      },
    },
    {
      narrative: "한일의정서(韓日議定書) 체결.\n조선 정부가 일본군의 군략상 필요한 곳을 제공한다는 내용.\n\n어른들이 말을 잃었다.",
      choices: [
        { id: "A", text: "\"이제 어떻게 됩니까?\" 직접 어른들에게 묻는다." },
        { id: "B", text: "혼자 조용한 곳으로 가서 생각을 정리한다." },
        { id: "C", text: "(자유롭게 반응하기)" },
      ],
      outcomes: {
        A: { statChanges: { intellect: 1, sociability: 1 }, resultNarrative: "어른들 중 하나가 낮게 말했다. \"이제 시작이오.\" 그 말이 가리키는 끝이 어디인지 아무도 말하지 않았다." },
        B: { statChanges: { emotion: 2, creativity: 1 }, resultNarrative: "혼자 앉아 오래 생각했다. 이 땅이 어디로 가는지. 내가 무엇을 할 수 있는지. 답은 없었다. 하지만 질문이 생겼다." },
      },
    },
    {
      narrative: "의병 조직에서 연락이 왔다.\n\"함께하겠소?\"\n이것이 돌이킬 수 없는 선택임을 알고 있다.",
      choices: [
        { id: "A", text: "\"함께하겠습니다.\" 손을 내민다." },
        { id: "B", text: "\"아직은 제 자리에서 할 일이 있소.\" 거절한다." },
        { id: "C", text: "(자유롭게 결정하기)" },
      ],
      outcomes: {
        A: { statChanges: { morality: 3, physique: 1 }, resultNarrative: "그들의 손이 당신 손을 잡았다. 무거웠다. 기쁘지 않았다. 그러나 옳았다. 적어도 당신은 그렇게 믿었다." },
        B: { statChanges: { intellect: 1, morality: 1 }, resultNarrative: "연락자가 고개를 끄덕이고 떠났다. 당신은 그 뒷모습을 오래 바라보았다. 이 선택이 비겁한 것인지, 현명한 것인지 — 시간이 답해줄 것이다." },
      },
    },
    {
      narrative: "부친이 당신을 불러 앉히셨다.\n\"고향으로 내려가거라. 한성은 이제 위험하다.\"",
      choices: [
        { id: "A", text: "\"저는 여기 있겠습니다.\" 단호하게 말한다." },
        { id: "B", text: "\"알겠습니다.\" 부친의 뜻을 따른다." },
        { id: "C", text: "(자유롭게 마음을 말하기)" },
      ],
      outcomes: {
        A: { statChanges: { morality: 2, emotion: 1 }, resultNarrative: "부친이 오래 침묵하셨다. 그리고 당신의 어깨에 손을 얹으셨다. \"그래. 네 뜻대로 해라.\" 그 손이 무거웠다." },
        B: { statChanges: { emotion: 2, physique: -1 }, resultNarrative: "짐을 쌌다. 한성을 떠나며 뒤를 돌아보았다. 저 골목, 저 한약방, 저 거리. 언제 다시 볼 수 있을까." },
      },
    },
    {
      narrative: "전쟁 중에 부상병을 치료하는 일을 돕고 있다.\n어제는 조선 사람을, 오늘은 일본 병사를 돌봤다.\n\n\"둘 다 사람이오.\" 늙은 의원이 말했다.",
      choices: [
        { id: "A", text: "그 말이 옳다고 생각한다. 사람 먼저다." },
        { id: "B", text: "그 말에 동의하기 어렵다. 적은 적이다." },
        { id: "C", text: "(자유롭게 생각하기)" },
      ],
      outcomes: {
        A: { statChanges: { morality: 2, emotion: 1 }, resultNarrative: "당신 손이 붕대를 감는다. 이 사람이 어제 총을 쐈는지 모른다. 하지만 지금은 살려야 한다. 그것이 당신의 선택이었다." },
        B: { statChanges: { physique: 1, morality: -1 }, resultNarrative: "그 말이 틀렸다고 할 수 없었다. 하지만 받아들이기 어려웠다. 당신의 마음속에 무언가가 굳어가고 있었다." },
      },
    },
    {
      narrative: "1904년이 저문다.\n전쟁은 아직 끝나지 않았다.\n\n당신은 열아홉.\n이 한 해가 당신에게 무엇을 남겼는가.",
      choices: [
        { id: "A", text: "많은 것을 잃었지만, 잃어서는 안 될 것은 지켰다." },
        { id: "B", text: "아직 끝나지 않았다. 내가 해야 할 일이 남아 있다." },
        { id: "C", text: "(1904년의 당신에게 마지막 말 건네기)" },
      ],
      outcomes: {
        A: { statChanges: { morality: 1, emotion: 2 }, resultNarrative: "무엇을 지켰는가. 당신만이 안다. 그리고 그것으로 충분하다." },
        B: { statChanges: { physique: 1, intellect: 1 }, resultNarrative: "해야 할 일이 있다는 것. 그것이 당신을 아직 서게 한다. 내년도, 그 다음 해도, 계속." },
      },
    },
  ],
};

function getMockEvent(chapter: number, event: number): MockEvent {
  const pool = CHAPTER_EVENTS[chapter] ?? CHAPTER_EVENTS[1];
  return pool[(event - 1) % pool.length] ?? pool[0];
}
