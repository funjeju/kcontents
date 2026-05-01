"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
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

  const [phase, setPhase] = useState<Phase>("reading");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [statDeltas, setStatDeltas] = useState<Partial<Stats>>({});
  const [stats, setStats] = useState<Stats>(initStats(10));

  // Mock event data
  const event = getMockEvent(chapterNum, eventNum);
  const totalEvents = 6;

  function handleChoice(choiceId: string) {
    if (phase !== "choosing") return;

    if (choiceId === "C") {
      router.push(`/play/${lifeId}/chapter/${n}/freeform?event=${m}`);
      return;
    }

    setSelectedChoice(choiceId);
    setPhase("result");

    const outcome = choiceId === "A" ? event.outcomes.A : event.outcomes.B;
    setStatDeltas(outcome.statChanges);
    setStats((prev) => applyStatChanges(prev, outcome.statChanges));
  }

  function handleNext() {
    const nextEventNum = eventNum + 1;

    if (nextEventNum > totalEvents) {
      // Chapter end
      router.push(`/play/${lifeId}/chapter/${n}/end`);
    } else if (chapterNum === 7 && nextEventNum > 1) {
      // T-0 moment
      router.push(`/play/${lifeId}/casting`);
    } else {
      router.push(`/play/${lifeId}/chapter/${n}/event/${nextEventNum}`);
    }
  }

  const age = 9 + chapterNum - 1;
  const year = 1894 + chapterNum - 1;

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <GameHeader
        chapter={chapterNum}
        age={age}
        year={year}
        eventProgress={{ current: eventNum, total: totalEvents }}
        stats={stats}
        backHref={`/play/${lifeId}/chapter/${n}/intro`}
        phase={chapterNum < 7 ? "cradle" : "main"}
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

        {/* Tap to reveal choices */}
        {phase === "reading" && (
          <button
            className="mt-auto text-center text-sm text-text-caption py-4"
            onClick={() => setPhase("choosing")}
          >
            탭하여 선택 →
          </button>
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

function getMockEvent(chapter: number, event: number): MockEvent {
  const events: MockEvent[] = [
    {
      narrative:
        "양반가의 따님 서희(13세)가 약을 사러 한약방에 들렀다.\n그녀는 손에 한문 책을 쥐고 있다.\n\n당신이 빤히 본다는 걸 알아챈 그녀는 책을 살짝 가린다.\n\"여인이 책을 읽는다고 신기하니?\"",
      choices: [
        { id: "A", text: "\"아닙니다. 무슨 책인지 궁금해서요.\"" },
        { id: "B", text: "고개를 숙이고 일에 집중한다." },
        { id: "C", text: "(자유롭게 답하기)" },
      ],
      outcomes: {
        A: {
          statChanges: { intellect: 1, sociability: 1 },
          resultNarrative:
            "서희가 잠시 당신을 바라보더니, 책의 제목을 보여주었다. 논어였다. 당신들의 첫 대화가 그렇게 시작되었다.",
        },
        B: {
          statChanges: { morality: 1 },
          resultNarrative:
            "당신은 시선을 돌렸다. 서희는 약을 사고 조용히 떠났다. 하지만 왠지 그 한문 책이 머릿속에 남았다.",
        },
      },
    },
    {
      narrative:
        "서당에서 훈장 어른이 퀴즈를 내셨다.\n\"천자문에서 하늘 천이 뜻하는 것은?\"",
      choices: [
        { id: "A", text: "\"하늘이요. 하늘이 만물의 근본입니다.\"" },
        { id: "B", text: "머뭇거리다가 이웃 아이에게 답을 듣는다." },
        { id: "C", text: "(직접 답하기)" },
      ],
      outcomes: {
        A: {
          statChanges: { intellect: 2 },
          resultNarrative:
            "훈장 어른이 고개를 끄덕이셨다. \"맞다. 하늘 천. 이 아이는 집에서 공부를 잘 하는구나.\" 칭찬이 기분 좋았다.",
        },
        B: {
          statChanges: { sociability: 1, intellect: -1 },
          resultNarrative:
            "이웃 아이가 작은 소리로 알려주었다. 훈장 어른은 알아채셨지만, 그냥 넘어가셨다.",
        },
      },
    },
    {
      narrative:
        "부친이 무거운 약재 짐을 들고 계셨다.\n당신이 도와드릴 수 있을 것 같다.",
      choices: [
        { id: "A", text: "\"제가 들겠습니다.\" 짐을 받아 든다." },
        { id: "B", text: "부친이 혼자 하실 수 있다고 생각하고 지켜본다." },
        { id: "C", text: "(자유롭게 선택하기)" },
      ],
      outcomes: {
        A: {
          statChanges: { physique: 1, morality: 1 },
          resultNarrative:
            "부친이 잠시 당신을 바라보셨다. \"많이 컸구나.\" 그 말 한마디가 온 하루를 따뜻하게 했다.",
        },
        B: {
          statChanges: { intellect: 1 },
          resultNarrative:
            "부친은 혼자 짐을 드셨다. 나중에 당신은 생각했다. 도와드렸어야 했나.",
        },
      },
    },
    {
      narrative:
        "골목에서 싸움이 벌어졌다. 일본 상인과 조선 장사꾼의 다툼이다.\n사람들이 모여들었지만 아무도 나서지 않는다.",
      choices: [
        { id: "A", text: "그냥 지나친다. 나와 상관없는 일이다." },
        { id: "B", text: "조선 장사꾼 편에 서서 소리쳤다." },
        { id: "C", text: "(자유롭게 행동하기)" },
      ],
      outcomes: {
        A: {
          statChanges: { sociability: -1 },
          resultNarrative:
            "당신은 골목을 빠져나왔다. 뒤에서 고함소리가 들렸다. 그날 밤, 잠이 잘 오지 않았다.",
        },
        B: {
          statChanges: { morality: 2, physique: -1 },
          resultNarrative:
            "당신의 소리에 일본 상인이 멈칫했다. 조선 장사꾼이 도망칠 틈이 생겼다. 그러나 당신은 일본 상인의 눈길을 받게 되었다.",
        },
      },
    },
    {
      narrative:
        "오늘은 부친과 함께 처음으로 광화문 앞에 나왔다.\n사람들이 무언가를 보며 수군거리고 있다.",
      choices: [
        { id: "A", text: "부친께 저것이 무엇이냐고 여쭤본다." },
        { id: "B", text: "직접 가서 본다." },
        { id: "C", text: "(자유롭게 행동하기)" },
      ],
      outcomes: {
        A: {
          statChanges: { intellect: 1, emotion: 1 },
          resultNarrative:
            "부친이 낮은 목소리로 말씀하셨다. \"저건 일본 사람들이 붙인 방(榜)이다. 네가 크면 이 나라가 어떻게 될지...\" 말씀을 잇지 않으셨다.",
        },
        B: {
          statChanges: { intellect: 2, sociability: 1 },
          resultNarrative:
            "가까이 가서 보니 일본어로 쓴 포고문이었다. 당신은 읽을 수 없었지만, 그것이 무언가 좋지 않은 것임을 느꼈다.",
        },
      },
    },
    {
      narrative:
        "밤에 혼자 한약방 뒷마당에 앉았다.\n별이 많이 떴다. 한참 동안 생각했다.",
      choices: [
        { id: "A", text: "이 나라가 어떻게 됐으면 좋겠는지 상상한다." },
        { id: "B", text: "내일 해야 할 일들을 생각한다." },
        { id: "C", text: "(지금 이 순간 무슨 생각을 하는지 써보기)" },
      ],
      outcomes: {
        A: {
          statChanges: { morality: 1, creativity: 1 },
          resultNarrative:
            "당신의 상상은 멀리 뻗어갔다. 자유로운 나라. 평등한 세상. 아직 어린 당신에게는 막연한 꿈이지만, 그 꿈이 가슴 속에 심어졌다.",
        },
        B: {
          statChanges: { physique: 1 },
          resultNarrative:
            "내일도 한약방 일이 있다. 서당도 가야 한다. 당신은 그런 사람이다. 지금 할 수 있는 일을 하는.",
        },
      },
    },
  ];

  return events[(event - 1) % events.length] ?? events[0];
}
