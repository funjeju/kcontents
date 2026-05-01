"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Link2, MessageCircle, Twitter, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLife } from "@/lib/hooks/use-life";
import { MR_SUNSHINE_SCENARIO } from "@/data/scenarios/mr-sunshine";

interface Props {
  params: { lifeId: string };
}

const SCENARIOS: Record<string, typeof MR_SUNSHINE_SCENARIO> = {
  mr_sunshine: MR_SUNSHINE_SCENARIO,
};

export default function SharePage({ params }: Props) {
  const router = useRouter();
  const { lifeId } = params;
  const [copied, setCopied] = useState(false);

  const { life } = useLife(lifeId);

  const scenario = life ? SCENARIOS[life.scenarioId] : null;
  const castingRole = scenario?.castingRoles.find((r) => r.id === life?.castingRole);
  const ending = scenario?.endings.find((e) => e.id === life?.endingId);

  const characterName = life?.characterName ?? "—";
  const roleName = castingRole?.name.ko ?? "—";
  const endingTitle = ending?.title.ko ?? "—";
  const endingRarity = ending?.rarityPercentage ?? 0;
  const scenarioTitle = scenario?.title.ko ?? "미스터 션샤인 정서";

  const shareText = `나는 ${scenarioTitle}에서 '${roleName}'로 살았습니다.\n결말: ${endingTitle}${endingRarity > 0 ? ` (상위 ${endingRarity}%)` : ""}\n\nLiveMovie에서 당신의 인생을 살아보세요.`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/play/${lifeId}/card`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleKakao() {
    alert("카카오 공유는 SDK 연동 후 활성화됩니다.");
  }

  function handleTwitter() {
    const encoded = encodeURIComponent(shareText);
    window.open(`https://twitter.com/intent/tweet?text=${encoded}`, "_blank");
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <div className="flex-1 flex flex-col max-w-game mx-auto w-full px-screen-x py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="era-label mb-1">공유하기</p>
          <h1 className="font-serif text-2xl font-bold text-text">
            {characterName}의 이야기를 나눠요
          </h1>
        </motion.div>

        {/* Preview card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="hanji-card p-5 mb-8 border border-accent-maple/20"
        >
          <p className="font-serif font-semibold text-text mb-1">
            {roleName} · {endingTitle}
          </p>
          <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">
            {shareText}
          </p>
        </motion.div>

        {/* Share buttons */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 mb-8"
        >
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-4 p-4 rounded-card border border-text/10 bg-bg-card hover:border-text/20 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-accent-jade/10 flex items-center justify-center">
              {copied ? (
                <Check size={18} className="text-accent-jade" />
              ) : (
                <Link2 size={18} className="text-accent-jade" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-text">
                {copied ? "복사됨!" : "링크 복사"}
              </p>
              <p className="text-xs text-text-caption">카드 링크를 클립보드에 복사</p>
            </div>
          </button>

          <button
            onClick={handleKakao}
            className="w-full flex items-center gap-4 p-4 rounded-card border border-text/10 bg-bg-card hover:border-text/20 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-accent-gold/10 flex items-center justify-center">
              <MessageCircle size={18} className="text-accent-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-text">카카오톡 공유</p>
              <p className="text-xs text-text-caption">카카오톡으로 카드 공유</p>
            </div>
          </button>

          <button
            onClick={handleTwitter}
            className="w-full flex items-center gap-4 p-4 rounded-card border border-text/10 bg-bg-card hover:border-text/20 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center">
              <Twitter size={18} className="text-sky-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-text">X (Twitter) 공유</p>
              <p className="text-xs text-text-caption">트위터로 인생 공유</p>
            </div>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-auto space-y-3"
        >
          <Button
            size="lg"
            fullWidth
            onClick={() => router.push("/scenarios/recommended")}
          >
            다른 시나리오 시작하기
          </Button>
          <Button
            size="lg"
            fullWidth
            variant="secondary"
            onClick={() => router.push("/me")}
          >
            내 인생들 보기
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
