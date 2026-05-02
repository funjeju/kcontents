"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";

// ADMIN.md Stage 0: 소스 종류 4가지 (D는 Phase 3)
type SourceType = "drama" | "book" | "history" | "script";
type GenStep = "idle" | "analyzing" | "generating" | "reviewing" | "saving" | "done";

const SOURCE_LABELS: Record<SourceType, { title: string; subtitle: string }> = {
  drama: { title: "드라마 / 영화", subtitle: "작품 제목 입력 → AI가 서사 추출" },
  book:  { title: "책 / 문학",     subtitle: "작품 제목 입력 → 인물·서사 분석" },
  history: { title: "역사 시기",   subtitle: "시기 + 지역 → AI가 인물 창작" },
  script:  { title: "대본 / 시놉시스", subtitle: "직접 붙여넣기 → 구조 변환" },
};

const STEP_LABELS: Record<GenStep, string> = {
  idle: "",
  analyzing: "소스 분석 중...",
  generating: "시나리오 구조 생성 중...",
  reviewing: "검토 중...",
  saving: "Firestore에 저장 중...",
  done: "완료!",
};

const QUICK_DRAMAS = ["미스터 션샤인", "응답하라 1988", "이태원 클라쓰", "옷소매 붉은 끝동", "파친코", "사랑의 불시착", "기황후", "별에서 온 그대"];
const QUICK_BOOKS  = ["토지", "태백산맥", "파친코", "난쏘공", "채식주의자", "82년생 김지영", "아리랑", "혼불"];
const QUICK_HISTORY = ["1592 임진왜란 한산도", "1919 3·1운동 경성", "1945 해방 전후 경성", "1950 한국전쟁 부산", "1980년 5월 광주", "1987 서울 민주화운동"];

export default function CreateScenarioPage() {
  const router = useRouter();
  const [source, setSource] = useState<SourceType>("drama");
  const [title, setTitle] = useState("");
  const [hint, setHint] = useState("");
  const [script, setScript] = useState("");
  const [step, setStep] = useState<GenStep>("idle");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [editJson, setEditJson] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  function isInputReady() {
    if (source === "script") return script.trim().length > 0;
    return title.trim().length > 0;
  }

  async function handleGenerate() {
    if (!isInputReady()) return;
    setStep("analyzing");
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/admin/scenarios/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          title: title.trim(),
          hint: hint.trim(),
          script: script.trim(),
        }),
      });

      setStep("generating");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");

      setResult(data.scenario);
      setEditJson(JSON.stringify(data.scenario, null, 2));
      setStep("reviewing");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "저장 오류");
      setStep("reviewing");
    }
  }

  const isLoading = step === "analyzing" || step === "generating" || step === "saving";

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">새 시나리오 생성</h1>
        <p className="text-white/40 text-sm">소스 종류를 선택하면 AI가 전체 구조를 자동 생성합니다</p>
      </div>

      {(step === "idle" || isLoading) && (
        <>
          {/* 소스 타입 선택 */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {(Object.entries(SOURCE_LABELS) as [SourceType, typeof SOURCE_LABELS[SourceType]][]).map(
              ([type, { title: t, subtitle }]) => (
                <button
                  key={type}
                  onClick={() => { setSource(type); setTitle(""); }}
                  className={`px-4 py-3 rounded-xl text-left transition-colors border ${
                    source === type
                      ? "bg-white text-black border-white"
                      : "bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-white/30"
                  }`}
                >
                  <p className="font-medium text-sm">{t}</p>
                  <p className={`text-xs mt-0.5 ${source === type ? "text-black/50" : "text-white/30"}`}>
                    {subtitle}
                  </p>
                </button>
              )
            )}
          </div>

          {/* 입력 영역 */}
          {source === "drama" && (
            <InputSection
              label="드라마 / 영화 제목"
              value={title}
              onChange={setTitle}
              placeholder="예: 미스터 션샤인 / 파친코 / 이상한 변호사 우영우"
              quickItems={QUICK_DRAMAS}
              hint={hint}
              onHint={setHint}
              hintLabel="추가 지시"
              hintPlaceholder="예: 주인공 나이는 17세로. 결말 10개 이상. 여성 주인공 강조."
            />
          )}

          {source === "book" && (
            <InputSection
              label="책 / 문학 작품 제목"
              value={title}
              onChange={setTitle}
              placeholder="예: 토지 / 태백산맥 / 82년생 김지영"
              quickItems={QUICK_BOOKS}
              hint={hint}
              onHint={setHint}
              hintLabel="추가 지시"
              hintPlaceholder="예: 여성 캐릭터 중심. 1940년대 배경 강조."
            />
          )}

          {source === "history" && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                  시기 + 지역
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 1592 임진왜란 한산도 / 1980년 5월 광주 / 1945 해방 전후 경성"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
              <div className="border border-white/5 rounded-xl p-4">
                <p className="text-xs text-white/30 mb-2 font-medium">빠른 선택</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_HISTORY.map((h) => (
                    <button
                      key={h}
                      onClick={() => setTitle(h)}
                      className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-lg transition-colors"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                  추가 지시 <span className="text-white/20">(선택)</span>
                </label>
                <textarea
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  rows={3}
                  placeholder="예: 민중 시각 중심. 여성 캐릭터 포함. 결말 12개 이상."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none text-sm"
                />
              </div>
              <div className="border border-white/5 rounded-xl p-4 bg-white/2">
                <p className="text-xs text-white/30">
                  ℹ 역사 시기 소스는 AI가 그 시대를 살았을 법한 가상 인물 5종을 직접 창작합니다. 저작권 제약 없이 가장 자유롭게 창작 가능한 소스입니다.
                </p>
              </div>
            </div>
          )}

          {source === "script" && (
            <div className="mb-6">
              <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                대본 / 시놉시스 / 줄거리
              </label>
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
            disabled={isLoading || !isInputReady()}
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
      )}

      {step === "reviewing" && (
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
      )}

      {step === "done" && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">✓</div>
          <p className="text-white font-semibold">시나리오가 저장되었습니다</p>
          <p className="text-white/40 text-sm mt-1">편집 페이지로 이동합니다...</p>
        </div>
      )}
    </div>
  );
}

// ── 공통 입력 섹션 ────────────────────────────────────────────────────────────

function InputSection({
  label, value, onChange, placeholder, quickItems, hint, onHint, hintLabel, hintPlaceholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  quickItems: string[];
  hint: string;
  onHint: (v: string) => void;
  hintLabel: string;
  hintPlaceholder: string;
}) {
  return (
    <div className="space-y-4 mb-6">
      <div>
        <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
        />
      </div>
      <div>
        <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
          {hintLabel} <span className="text-white/20">(선택)</span>
        </label>
        <textarea
          value={hint}
          onChange={(e) => onHint(e.target.value)}
          rows={3}
          placeholder={hintPlaceholder}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none text-sm"
        />
      </div>
      <div className="border border-white/5 rounded-xl p-4 bg-white/2">
        <p className="text-xs text-white/30 mb-2 font-medium">빠른 선택</p>
        <div className="flex flex-wrap gap-2">
          {quickItems.map((item) => (
            <button
              key={item}
              onClick={() => onChange(item)}
              className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-lg transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 검토 패널 ─────────────────────────────────────────────────────────────────

function ReviewPanel({
  result, editJson, isEditing, onEditJson, onToggleEdit, onSave, onReset, error,
}: {
  result: unknown;
  editJson: string;
  isEditing: boolean;
  onEditJson: (v: string) => void;
  onToggleEdit: () => void;
  onSave: () => void;
  onReset: () => void;
  error: string;
}) {
  const s = result as Record<string, unknown> & {
    title?: { ko?: string }; subtitle?: { ko?: string }; description?: { ko?: string };
    era?: string; heaviness?: number; cradleConfig?: Record<string, unknown>;
    mainStoryEndAge?: number; castingRoles?: unknown[]; endings?: unknown[];
    familyBackgrounds?: unknown[]; iconicMoments?: unknown[];
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">생성 결과 검토</h2>
          <p className="text-white/40 text-sm">확인 후 저장하거나 직접 수정하세요</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onReset} className="px-3 py-1.5 text-sm text-white/40 hover:text-white border border-white/10 rounded-lg transition-colors">
            다시 생성
          </button>
          <button onClick={onToggleEdit} className="px-3 py-1.5 text-sm text-white/60 hover:text-white border border-white/20 rounded-lg transition-colors">
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
        <div className="space-y-4 mb-6">
          <div className="border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-white">{s.title?.ko}</h3>
              <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">{s.era}</span>
            </div>
            <p className="text-white/60 text-sm mb-1">{s.subtitle?.ko}</p>
            <p className="text-white/40 text-sm leading-relaxed">{s.description?.ko}</p>
            <div className="flex gap-4 mt-3 text-xs text-white/30">
              <span>무게 {s.heaviness}/5</span>
              <span>T-0 {(s.cradleConfig as {cradleEndAge?: number})?.cradleEndAge}세</span>
              <span>종료 {s.mainStoryEndAge}세</span>
              <span>캐스팅 {(s.castingRoles as unknown[])?.length ?? 0}종</span>
              <span>결말 {(s.endings as unknown[])?.length ?? 0}개</span>
            </div>
          </div>

          {(s.familyBackgrounds as {nameKo?: string; descriptionKo?: string}[])?.length > 0 && (
            <div className="border border-white/10 rounded-xl p-5">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">가족 배경 ({(s.familyBackgrounds as unknown[]).length}종)</p>
              <div className="space-y-2">
                {(s.familyBackgrounds as {nameKo?: string; descriptionKo?: string}[]).map((bg, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-white/20 text-xs font-mono mt-0.5">{i + 1}</span>
                    <div>
                      <p className="text-white/80 text-sm font-medium">{bg.nameKo}</p>
                      <p className="text-white/40 text-xs">{bg.descriptionKo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(s.castingRoles as {name?: {ko?: string}; shortDescription?: {ko?: string}}[])?.length > 0 && (
            <div className="border border-white/10 rounded-xl p-5">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">캐스팅 풀 ({(s.castingRoles as unknown[]).length}종)</p>
              <div className="space-y-2">
                {(s.castingRoles as {name?: {ko?: string}; shortDescription?: {ko?: string}}[]).map((role, i) => (
                  <div key={i} className="border border-white/5 rounded-lg p-3">
                    <p className="text-white/90 text-sm font-semibold">{role.name?.ko}</p>
                    <p className="text-white/50 text-xs">{role.shortDescription?.ko}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(s.endings as {title?: {ko?: string}; rarityPercentage?: number; castingRoleId?: string}[])?.length > 0 && (
            <div className="border border-white/10 rounded-xl p-5">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">결말 ({(s.endings as unknown[]).length}개)</p>
              <div className="grid grid-cols-2 gap-2">
                {(s.endings as {title?: {ko?: string}; rarityPercentage?: number; castingRoleId?: string}[]).map((e, i) => (
                  <div key={i} className="bg-white/3 rounded-lg p-2">
                    <p className="text-white/70 text-xs font-medium">{e.title?.ko}</p>
                    <p className="text-white/30 text-xs">{e.rarityPercentage}% · {e.castingRoleId}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">{error}</div>
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
