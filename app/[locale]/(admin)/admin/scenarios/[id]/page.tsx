"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";

type Scenario = Record<string, unknown>;
type Status = "draft" | "published" | "archived";

const STATUS_LABELS: Record<Status, string> = {
  draft: "초안",
  published: "출시",
  archived: "보관",
};

const STATUS_COLORS: Record<Status, string> = {
  draft: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  published: "text-green-400 bg-green-400/10 border-green-400/20",
  archived: "text-white/30 bg-white/5 border-white/10",
};

export default function AdminScenarioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const scenarioId = params?.id as string;

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editJson, setEditJson] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/scenarios/${scenarioId}`);
        if (!res.ok) throw new Error("불러오기 실패");
        const data = await res.json();
        setScenario(data.scenario);
        setEditJson(JSON.stringify(data.scenario, null, 2));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "오류");
      } finally {
        setLoading(false);
      }
    }
    if (scenarioId) load();
  }, [scenarioId]);

  async function handleSave() {
    setSaving(true);
    setSaveMsg("");
    try {
      const updated = JSON.parse(editJson);
      const res = await fetch(`/api/admin/scenarios/${scenarioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: updated }),
      });
      if (!res.ok) throw new Error("저장 실패");
      setScenario(updated);
      setIsEditing(false);
      setSaveMsg("저장되었습니다");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch (e: unknown) {
      setSaveMsg(e instanceof Error ? e.message : "저장 오류");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus: Status) {
    try {
      const res = await fetch(`/api/admin/scenarios/${scenarioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("상태 변경 실패");
      setScenario((prev) => prev ? { ...prev, status: newStatus } : prev);
      const updated = JSON.parse(editJson);
      updated.status = newStatus;
      setEditJson(JSON.stringify(updated, null, 2));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "오류");
    }
  }

  async function handleDelete() {
    if (!confirm("이 시나리오를 삭제하시겠습니까? 되돌릴 수 없습니다.")) return;
    try {
      const res = await fetch(`/api/admin/scenarios/${scenarioId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("삭제 실패");
      router.push("/admin/scenarios");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "삭제 오류");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !scenario) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
        {error}
      </div>
    );
  }

  const s = scenario as Record<string, unknown> & {
    title?: { ko?: string };
    subtitle?: { ko?: string };
    description?: { ko?: string };
    era?: string;
    status?: Status;
    heaviness?: number;
    cradleConfig?: { type?: string; cradleStartAge?: number; cradleEndAge?: number };
    mainStoryEndAge?: number;
    castingRoles?: unknown[];
    endings?: unknown[];
    familyBackgrounds?: unknown[];
    iconicMoments?: unknown[];
    genre?: string[];
    isPremium?: boolean;
  };

  const status = (s.status ?? "draft") as Status;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">{s.title?.ko ?? scenarioId}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[status]}`}>
              {STATUS_LABELS[status]}
            </span>
          </div>
          <p className="text-white/40 text-sm">{s.subtitle?.ko ?? ""}</p>
          <p className="text-white/20 text-xs mt-1 font-mono">{scenarioId}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 text-sm text-white/60 hover:text-white border border-white/20 rounded-lg transition-colors"
          >
            {isEditing ? "미리보기" : "JSON 편집"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      {saveMsg && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400">
          {saveMsg}
        </div>
      )}

      {isEditing ? (
        <div className="mb-6">
          <textarea
            value={editJson}
            onChange={(e) => setEditJson(e.target.value)}
            rows={40}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-green-300 font-mono text-xs focus:outline-none focus:border-white/30 resize-y"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-4 py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 disabled:opacity-30 transition-all"
          >
            {saving ? "저장 중..." : "변경사항 저장"}
          </button>
        </div>
      ) : (
        <>
          {/* Status management */}
          <div className="border border-white/10 rounded-xl p-5 mb-4">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">상태 변경</p>
            <div className="flex gap-2">
              {(["draft", "published", "archived"] as Status[]).map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  disabled={status === st}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    status === st
                      ? STATUS_COLORS[st]
                      : "border-white/10 text-white/40 hover:text-white hover:border-white/30"
                  }`}
                >
                  {STATUS_LABELS[st]}
                </button>
              ))}
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: "무게", value: `${s.heaviness}/5` },
              { label: "캐스팅", value: `${(s.castingRoles as unknown[])?.length ?? 0}종` },
              { label: "결말", value: `${(s.endings as unknown[])?.length ?? 0}개` },
              { label: "명장면", value: `${(s.iconicMoments as unknown[])?.length ?? 0}개` },
            ].map((item) => (
              <div key={item.label} className="border border-white/10 rounded-xl p-4 text-center">
                <p className="text-xl font-bold text-white">{item.value}</p>
                <p className="text-xs text-white/40 mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="border border-white/10 rounded-xl p-5 mb-4">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">설명</p>
            <p className="text-white/70 text-sm leading-relaxed">{s.description?.ko}</p>
            <div className="flex gap-4 mt-3 text-xs text-white/30">
              <span>시대 {s.era}</span>
              <span>장르 {(s.genre as string[])?.join(", ")}</span>
              <span>{s.isPremium ? "프리미엄" : "무료"}</span>
            </div>
          </div>

          {/* Cradle config */}
          <div className="border border-white/10 rounded-xl p-5 mb-4">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">크래들 설정</p>
            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-white/30 text-xs mb-1">타입</p>
                <p className="text-white font-medium">{s.cradleConfig?.type}</p>
              </div>
              <div>
                <p className="text-white/30 text-xs mb-1">시작 나이</p>
                <p className="text-white font-medium">{s.cradleConfig?.cradleStartAge}세</p>
              </div>
              <div>
                <p className="text-white/30 text-xs mb-1">T-0 나이</p>
                <p className="text-white font-medium">{s.cradleConfig?.cradleEndAge}세</p>
              </div>
              <div>
                <p className="text-white/30 text-xs mb-1">메인스토리 종료</p>
                <p className="text-white font-medium">{s.mainStoryEndAge}세</p>
              </div>
            </div>
          </div>

          {/* Casting Roles */}
          {(s.castingRoles as CastingRole[])?.length > 0 && (
            <div className="border border-white/10 rounded-xl p-5 mb-4">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">
                캐스팅 역할 ({(s.castingRoles as unknown[]).length}종)
              </p>
              <div className="space-y-3">
                {(s.castingRoles as CastingRole[]).map((role, i) => (
                  <div key={role.id ?? i} className="border border-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-white/30 font-mono">{String.fromCharCode(65 + i)}.</span>
                      <p className="text-white/90 text-sm font-semibold">{role.name?.ko}</p>
                      <span className="text-xs text-white/20 ml-auto">결말 {role.endingIds?.length ?? 0}개</span>
                    </div>
                    <p className="text-white/50 text-xs leading-relaxed">{role.shortDescription?.ko}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Family Backgrounds */}
          {(s.familyBackgrounds as FamilyBg[])?.length > 0 && (
            <div className="border border-white/10 rounded-xl p-5 mb-4">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">
                가족 배경 ({(s.familyBackgrounds as unknown[]).length}종)
              </p>
              <div className="space-y-2">
                {(s.familyBackgrounds as FamilyBg[]).map((bg, i) => (
                  <div key={bg.id ?? i} className="flex items-start gap-3">
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

          {/* Endings */}
          {(s.endings as Ending[])?.length > 0 && (
            <div className="border border-white/10 rounded-xl p-5 mb-4">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">
                결말 ({(s.endings as unknown[]).length}개)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(s.endings as Ending[]).map((e, i) => (
                  <div key={e.id ?? i} className="bg-white/3 rounded-lg p-3">
                    <p className="text-white/70 text-xs font-medium">{e.title?.ko}</p>
                    <p className="text-white/30 text-xs mt-0.5">{e.rarityPercentage}% · {e.castingRoleId}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Iconic Moments */}
          {(s.iconicMoments as IconicMoment[])?.length > 0 && (
            <div className="border border-white/10 rounded-xl p-5 mb-4">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">
                명장면 ({(s.iconicMoments as unknown[]).length}개)
              </p>
              <div className="space-y-2">
                {(s.iconicMoments as IconicMoment[]).map((m, i) => (
                  <div key={m.id ?? i} className="text-xs text-white/40">
                    <span className="text-white/60 font-medium font-mono">{m.id}</span>
                    {" — "}
                    {m.setup?.location}
                    {" "}
                    <span className="text-white/20">({m.chapterAge}세)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Danger zone */}
          <div className="border border-red-500/20 rounded-xl p-5 mt-8">
            <p className="text-xs text-red-400/60 uppercase tracking-wider mb-3">위험 구역</p>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              시나리오 삭제
            </button>
          </div>
        </>
      )}
    </div>
  );
}

interface CastingRole {
  id?: string;
  name?: { ko?: string };
  shortDescription?: { ko?: string };
  endingIds?: string[];
}

interface FamilyBg {
  id?: string;
  nameKo?: string;
  descriptionKo?: string;
}

interface Ending {
  id?: string;
  castingRoleId?: string;
  title?: { ko?: string };
  rarityPercentage?: number;
}

interface IconicMoment {
  id?: string;
  chapterAge?: number;
  setup?: { location?: string };
}
