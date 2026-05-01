"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface Props {
  params: { lifeId: string };
}

type CastingPhase = "blackout" | "reveal" | "narrate" | "confirm";

const MOCK_CASTING = {
  roleId: "the_gentleman",
  roleName: "개화의 신사",
  roleDescription:
    "당신은 시대의 변화를 읽는 눈을 가진 사람이 되었습니다. 신학문과 전통 사이에서 자신만의 길을 찾아가는 이.",
  t0Narrative:
    "1900년 가을. 한성 어딘가에서, 당신의 삶이 선택의 기로에 놓였습니다.\n\n6년 동안의 선택들이 당신을 여기까지 데려왔습니다.\n\n당신은 — 개화의 신사입니다.",
  dominantStats: ["intellect", "morality"],
  iconicImage: null,
};

export default function CastingPage({ params }: Props) {
  const router = useRouter();
  const { lifeId } = params;

  const [phase, setPhase] = useState<CastingPhase>("blackout");
  const [casting] = useState(MOCK_CASTING);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("reveal"), 1800),
      setTimeout(() => setPhase("narrate"), 3800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  function handleContinue() {
    setPhase("confirm");
  }

  function handleStartMainStory() {
    router.push(`/play/${lifeId}/chapter/8/intro`);
  }

  return (
    <div className="min-h-dvh bg-[#0D0B08] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-maple/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-game px-screen-x py-12 flex flex-col items-center text-center relative z-10">
        {/* Blackout intro */}
        <AnimatePresence>
          {phase === "blackout" && (
            <motion.div
              key="blackout"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="flex flex-col items-center gap-4"
            >
              <p className="text-text-caption text-sm tracking-widest uppercase">T-0</p>
              <div className="w-px h-16 bg-text-caption/30" />
              <p className="text-white/60 font-serif text-lg">1900년 가을</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Role reveal */}
        <AnimatePresence>
          {(phase === "reveal" || phase === "narrate" || phase === "confirm") && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="flex flex-col items-center gap-6 w-full"
            >
              {/* Role badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="w-24 h-24 rounded-full border-2 border-accent-maple/60 flex items-center justify-center bg-accent-maple/10"
              >
                <span className="text-4xl">🎭</span>
              </motion.div>

              {/* Role name */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <p className="text-accent-maple/80 text-xs tracking-widest uppercase mb-2">당신은</p>
                <h1 className="font-serif text-3xl font-bold text-white leading-tight">
                  {casting.roleName}
                </h1>
              </motion.div>

              {/* Separator */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "4rem" }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="h-px bg-accent-maple/40"
              />

              {/* T-0 Narrative */}
              <AnimatePresence>
                {(phase === "narrate" || phase === "confirm") && (
                  <motion.div
                    key="narrative"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-sm"
                  >
                    {casting.t0Narrative.split("\n").map((line, i) =>
                      line ? (
                        <p
                          key={i}
                          className="text-white/70 leading-relaxed text-sm font-serif mb-3"
                        >
                          {line}
                        </p>
                      ) : null
                    )}

                    {/* Role description */}
                    <div className="mt-4 p-4 rounded-card border border-accent-maple/20 bg-accent-maple/5">
                      <p className="text-white/60 text-xs leading-relaxed">
                        {casting.roleDescription}
                      </p>
                    </div>

                    {phase === "narrate" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-8"
                      >
                        <Button
                          size="lg"
                          fullWidth
                          onClick={handleContinue}
                          className="bg-accent-maple hover:bg-accent-maple/90 text-white border-none"
                        >
                          계속하기
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Confirm / Main story CTA */}
              <AnimatePresence>
                {phase === "confirm" && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm"
                  >
                    <div className="hanji-card p-4 mb-6 text-center" style={{ background: "#1a1610" }}>
                      <p className="text-accent-gold/80 font-serif text-sm italic leading-relaxed">
                        "이제 본 이야기가 시작됩니다.
                        <br />당신은 무대 위에 섰습니다."
                      </p>
                    </div>
                    <Button
                      size="lg"
                      fullWidth
                      onClick={handleStartMainStory}
                      className="bg-accent-maple hover:bg-accent-maple/90 text-white border-none"
                    >
                      ▶ 본편 시작하기
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
