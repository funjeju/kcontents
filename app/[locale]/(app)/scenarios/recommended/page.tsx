import { ScenarioCard } from "@/components/scenarios/scenario-card";
import { MR_SUNSHINE_SCENARIO } from "@/data/scenarios/mr-sunshine";
import type { Scenario } from "@/lib/types";

// Phase 1: Mr. Sunshine 1개 + 준비 중 카드들
const PUBLISHED_SCENARIOS: Scenario[] = [MR_SUNSHINE_SCENARIO];

export default function RecommendedPage() {
  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6 animate-slide-up">
        <p className="era-label mb-1">K-Drama Life</p>
        <h1 className="font-serif text-2xl font-bold text-text">
          당신을 위해 골랐어요
        </h1>
        <p className="text-text-muted text-sm mt-1">어떤 인생을 살아보시겠어요?</p>
      </div>

      {/* Scenarios */}
      <div className="space-y-card-gap animate-fade-in">
        {PUBLISHED_SCENARIOS.map((scenario) => (
          <ScenarioCard key={scenario.id} scenario={scenario} featured />
        ))}

        {/* Coming soon */}
        {COMING_SOON.map((item) => (
          <div
            key={item.title}
            className="hanji-card p-5 opacity-60 border border-dashed border-text/15"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <h3 className="font-serif font-semibold text-text">{item.title}</h3>
                <p className="text-xs text-text-caption">{item.era}</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs text-text-caption bg-bg rounded-full px-3 py-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-pulse" />
              준비 중
            </div>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="mt-8 text-center text-xs text-text-caption">
        더 많은 시나리오가 곧 추가됩니다
      </div>
    </div>
  );
}

const COMING_SOON = [
  { icon: "🏯", title: "Hidden Court", era: "17세기 조선 궁중" },
  { icon: "✊", title: "Liberation", era: "일제강점기" },
  { icon: "🏘️", title: "Reply 1988 정서", era: "1980년대 골목" },
  { icon: "🎤", title: "Idol Trainee", era: "현대" },
];
