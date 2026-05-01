"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";

type InputMode = "drama_name" | "script";
type GenStep = "idle" | "analyzing" | "generating" | "reviewing" | "saving" | "done";

const STEP_LABELS: Record<GenStep, string> = {
  idle: "",
  analyzing: "드라마 분석 중...",
  generating: "시나리오 구조 생성 중...",
  reviewing: "검토 중...",
  saving: "Firestore에 저장 중...",
  done: "완료!",
};

export default function CreateScenarioPage() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("drama_name");
  const [dramaName, setDramaName] = useState("");
  const [dramaHint, setDramaHint] = useState("");
  const [script, setScript] = useState("");
  const [step, setStep] = useState<GenStep>("idle");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [editJson, setEditJson] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  async function handleGenerate() {
    if (mode === "drama_name" && !dramaName.trim()) return;
    if (mode === "script" && !script.trim()) return;

    setStep("analyzing");
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/admin/scenarios/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          dramaName: dramaName.trim(),
          dramaHint: dramaHint.trim(),
          script: script.trim(),
        }),
      });

      setStep("generating");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "생성 실패");

      setResult(data.scenario);
      setEditJson(JSON.stringify(data.scenario, null, 2));
      setStep("reviewing");
    } catch (e: any) {
      setError(e.message ?? "알 수 없는 오류");
      setStep("idle");
    }
  }

  async function handleSave() {
    setStep("saving");
    try {
      const scenario = isEditing ? JSON.parse(editJson) : result;

      const res = await fetch("/api/admin/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });

      if (!res.ok) throw new Error("저장 실패");
      const data = await res.json();

      setStep("done");
      setTimeout(() => router.push(`/admin/scenarios/${data.scenarioId}`), 1200);
    } catch (e: any) {
      setError(e.message);
      setStep("reviewing");
    }
  }

  const isLoading = step === "analyzing" || step === "generating" || step === "saving";

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">새 시나리오 생성</h1>
        <p className="text-white/40 text-sm">AI가 드라마 정서를 분석해서 게임 구조로 자동 변환합니다</p>
      </div>

      {step === "idle" || isLoading ? (
        <>
          {/* Mode selector */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode("drama_name")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "drama_name" ? "bg-white text-black" : "bg-white/10 text-white/60 hover:text-white"
              }`}
            >
              드라마 이름으로 생성
            </button>
            <button
              onClick={() => setMode("script")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "script" ? "bg-white text-black" : "bg-white/10 text-white/60 hover:text-white"
              }`}
            >
              대본/스크립트 입력
            </button>
          </div>

          {mode === "drama_name" ? (
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">드라마 이름</label>
                <input
                  type="text"
                  value={dramaName}
                  onChange={(e) => setDramaName(e.target.value)}
                  placeholder="예: 미스터 션샤인 / Reply 1988 / 이상한 변호사 우영우"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                  추가 지시 <span className="text-white/20">(선택)</span>
                </label>
                <textarea
                  value={dramaHint}
                  onChange={(e) => setDramaHint(e.target.value)}
                  rows={3}
                  placeholder="예: 주인공 등장 나이는 17세로. 결말은 10개 이상. 한국 근현대 정서 강조."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none text-sm"
                />
              </div>
              <div className="border border-white/5 rounded-xl p-4 bg-white/2">
                <p className="text-xs text-white/30 mb-2 font-medium">빠른 선택</p>
                <div className="flex flex-wrap gap-2">
                  {["미스터 션샤인", "응답하라 1988", "이태원 클라쓰", "옷소매 붉은 끝동", "파친코", "사랑의 불시착", "별에서 온 그대", "기황후"].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDramaName(d)}
                      className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-lg transition-colors"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">대본 / 시놉시스 / 줄거리</label>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                rows={14}
                placeholder={`드라마 대본, 시놉시스, 또는 줄거리를 붙여넣으세요.\n\nAI가 분석해서:\n- 시대적 배경\n- 주요 캐릭터 유형 (캐스팅 풀)\n- 핵심 사건들 (이벤트)\n- 가능한 결말들\n\n...을 자동으로 추출합니다.`}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors resize-none text-sm font-mono leading-relaxed"
              />
              <p className="text-xs text-white/25 mt-2">권장: 1,000자 이상. 많을수록 정교한 시나리오가 생성됩니다.</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isLoading || (mode === "drama_name" ? !dramaName.trim() : !script.trim())}
            className="w-full py-4 bg-white text-black font-semibold rounded-xl hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                {STEP_LABELS[step]}
              </span>
            ) : (
              "✦ AI로 시나리오 생성하기"
            )}
          </button>
        </>
      ) : step === "reviewing" ? (
        <ReviewPanel
          result={result}
          editJson={editJson}
          isEditing={isEditing}
          onEditJson={setEditJson}
          onToggleEdit={() => setIsEditing(!isEditing)}
          onSave={handleSave}
          onReset={() => { setStep("idle"); setResult(null); }}
          error={error}
        />
      ) : step === "done" ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">✓</div>
          <p className="text-white font-semibold">시나리오가 저장되었습니다</p>
          <p className="text-white/40 text-sm mt-1">편집 페이지로 이동합니다...</p>
        </div>
      ) : null}
    </div>
  );
}

function ReviewPanel({
  result,
  editJson,
  isEditing,
  onEditJson,
  onToggleEdit,
  onSave,
  onReset,
  error,
}: {
  result: any;
  editJson: string;
  isEditing: boolean;
  onEditJson: (v: string) => void;
  onToggleEdit: () => void;
  onSave: () => void;
  onReset: () => void;
  error: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">생성 결과 검토</h2>
          <p className="text-white/40 text-sm">확인 후 저장하거나 직접 수정하세요</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="px-3 py-1.5 text-sm text-white/40 hover:text-white border border-white/10 rounded-lg transition-colors"
          >
            다시 생성
          </button>
          <button
            onClick={onToggleEdit}
            className="px-3 py-1.5 text-sm text-white/60 hover:text-white border border-white/20 rounded-lg transition-colors"
          >
            {isEditing ? "미리보기" : "JSON 편집"}
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="mb-6">
          <textarea
            value={editJson}
            onChange={(e) => onEditJson(e.target.value)}
            rows={30}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-green-300 font-mono text-xs focus:outline-none focus:border-white/30 resize-y"
          />
        </div>
      ) : (
        <ScenarioPreview scenario={result} />
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        onClick={onSave}
        className="w-full py-4 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all"
      >
        Firestore에 저장하기
      </button>
    </div>
  );
}

function ScenarioPreview({ scenario: s }: { scenario: any }) {
  if (!s) return null;
  return (
    <div className="space-y-4 mb-6">
      {/* 기본 정보 */}
      <div className="border border-white/10 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-lg font-bold text-white">{s.title?.ko}</h3>
          <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">{s.era}</span>
        </div>
        <p className="text-white/60 text-sm mb-1">{s.subtitle?.ko}</p>
        <p className="text-white/40 text-sm leading-relaxed">{s.description?.ko}</p>
        <div className="flex gap-4 mt-3 text-xs text-white/30">
          <span>무게 {s.heaviness}/5</span>
          <span>시작나이 {s.cradleConfig?.cradleStartAge}세</span>
          <span>T-0 {s.cradleConfig?.cradleEndAge}세</span>
          <span>종료 {s.mainStoryEndAge}세</span>
        </div>
      </div>

      {/* 가족 배경 */}
      {s.familyBackgrounds?.length > 0 && (
        <div className="border border-white/10 rounded-xl p-5">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">가족 배경 ({s.familyBackgrounds.length}종)</p>
          <div className="space-y-2">
            {s.familyBackgrounds.map((bg: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-white/20 text-xs mt-0.5 font-mono">{i + 1}</span>
                <div>
                  <p className="text-white/80 text-sm font-medium">{bg.nameKo}</p>
                  <p className="text-white/40 text-xs">{bg.descriptionKo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 캐스팅 풀 */}
      {s.castingRoles?.length > 0 && (
        <div className="border border-white/10 rounded-xl p-5">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">캐스팅 풀 ({s.castingRoles.length}종)</p>
          <div className="space-y-3">
            {s.castingRoles.map((role: any, i: number) => (
              <div key={i} className="border border-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-white/30 font-mono">{String.fromCharCode(65 + i)}.</span>
                  <p className="text-white/90 text-sm font-semibold">{role.name?.ko}</p>
                </div>
                <p className="text-white/50 text-xs leading-relaxed">{role.shortDescription?.ko}</p>
                {role.t0NarrativeTemplate?.ko && (
                  <p className="text-white/30 text-xs mt-2 italic border-l border-white/10 pl-2">
                    "{role.t0NarrativeTemplate.ko.slice(0, 80)}..."
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 결말 */}
      {s.endings?.length > 0 && (
        <div className="border border-white/10 rounded-xl p-5">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">결말 풀 ({s.endings.length}개)</p>
          <div className="grid grid-cols-2 gap-2">
            {s.endings.map((e: any, i: number) => (
              <div key={i} className="bg-white/3 rounded-lg p-2">
                <p className="text-white/70 text-xs font-medium">{e.title?.ko}</p>
                <p className="text-white/30 text-xs mt-0.5">{e.rarityPercentage}% · {e.castingRoleId}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 명장면 */}
      {s.iconicMoments?.length > 0 && (
        <div className="border border-white/10 rounded-xl p-5">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">명장면 ({s.iconicMoments.length}개)</p>
          <div className="space-y-2">
            {s.iconicMoments.map((m: any, i: number) => (
              <div key={i} className="text-xs text-white/40">
                <span className="text-white/60 font-medium">{m.id}</span> — {m.setup?.location}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
