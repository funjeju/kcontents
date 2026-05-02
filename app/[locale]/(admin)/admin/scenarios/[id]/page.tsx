"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "chapters" | "milestones" | "cards" | "safety" | "questions" | "locations" | "bgm" | "json";
type Status = "draft" | "published" | "archived";

interface StatChanges {
  intellect?: number; creativity?: number; emotion?: number;
  physique?: number; sociability?: number; morality?: number;
}
interface ChapterEvent {
  narrative: string;
  choices: { id: string; text: string }[];
  outcomes: {
    A: { statChanges: StatChanges; resultNarrative: string };
    B: { statChanges: StatChanges; resultNarrative: string };
  };
}
interface ChapterInfo { n: number; age: number; year: number | null; isT0: boolean }

interface LocationData {
  id?: string;
  nameKo: string; nameEn: string; address: string;
  lat: number; lng: number;
  chapterAge?: number | null;
  inGameMeaning: string; sensoryDescription: string; guideNote: string;
  imageUrl?: string | null;
}
interface BgmTrackData {
  id: string; context: string; nameKo: string;
  mood: string; instruments: string[];
  tempo: "slow" | "moderate" | "fast";
  referenceTrackHint: string; fileUrl?: string | null;
}

interface EntryQuestionChoice { id: string; text: string; castingHint: string; }
interface EntryQuestionData {
  id: string;
  order: number;
  text: string;
  subtext?: string | null;
  choices: EntryQuestionChoice[];
}

interface SafetyRulesData {
  sourceType?: string;
  forbiddenCharacterNames: string[];
  forbiddenQuotes: string[];
  forbiddenScenePatterns: string[];
  confirmedHistoricalFacts: string[];
  forbiddenHistoricalDistortions: string[];
  realPersonPrivacyRules: string[];
  dignityRules: string[];
  generalRules: string[];
}

interface CustomCardData {
  id?: string;
  nameKo: string;
  nameEn: string;
  descriptionKo: string;
  effectKo: string;
  usageTiming: string;
  usageCondition?: string | null;
  rarity: string;
  category?: string;
}

interface MilestoneOutcome {
  castingRoleId: string;
  decisionPrompt: string;
  dramaticPathFlag?: string;
  divergentPathFlag?: string;
}
interface MilestoneData {
  id?: string;
  age: number;
  year?: number;
  title: string;
  description: string;
  isHistoricalFact: boolean;
  isT0: boolean;
  aiDirective: string;
  castingOutcomes: MilestoneOutcome[];
  order: number;
}
interface ChapterState {
  fetchDone: boolean; generating: boolean; saving: boolean;
  events: ChapterEvent[] | null; savedToDb: boolean;
  error: string; expanded: boolean; jsonMode: boolean; editJson: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<Status, string> = { draft: "초안", published: "출시", archived: "보관" };
const STATUS_COLORS: Record<Status, string> = {
  draft: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  published: "text-green-400 bg-green-400/10 border-green-400/20",
  archived: "text-white/30 bg-white/5 border-white/10",
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminScenarioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const scenarioId = params?.id as string;

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [scenario, setScenario] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [editJson, setEditJson] = useState("");

  // Chapter states (keyed by chapter number)
  const [chapterStates, setChapterStates] = useState<Record<number, ChapterState>>({});

  // Location states
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsError, setLocationsError] = useState("");
  const [generatingLocations, setGeneratingLocations] = useState(false);
  const [savingLocations, setSavingLocations] = useState(false);
  const [locationsSaved, setLocationsSaved] = useState(false);

  // BGM states
  const [bgmTracks, setBgmTracks] = useState<BgmTrackData[]>([]);
  const [bgmLoading, setBgmLoading] = useState(false);
  const [bgmError, setBgmError] = useState("");
  const [generatingBgm, setGeneratingBgm] = useState(false);
  const [savingBgm, setSavingBgm] = useState(false);
  const [bgmSaved, setBgmSaved] = useState(false);

  // Entry questions states
  const [entryQuestions, setEntryQuestions] = useState<EntryQuestionData[] | null>(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState("");
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [questionsSaved, setQuestionsSaved] = useState(false);

  // Safety rules states
  const [safetyRules, setSafetyRules] = useState<SafetyRulesData | null>(null);
  const [safetyLoading, setSafetyLoading] = useState(false);
  const [safetyError, setSafetyError] = useState("");
  const [generatingSafety, setGeneratingSafety] = useState(false);
  const [savingSafety, setSavingSafety] = useState(false);
  const [safetySaved, setSafetySaved] = useState(false);

  // Card states
  const [customCards, setCustomCards] = useState<CustomCardData[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState("");
  const [generatingCards, setGeneratingCards] = useState(false);

  // Milestone states
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const [milestonesError, setMilestonesError] = useState("");
  const [generatingMilestones, setGeneratingMilestones] = useState(false);
  const [savingMilestones, setSavingMilestones] = useState(false);

  // ── Load scenario ──
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

  // ── Compute chapters from scenario ──
  function getChapters(): ChapterInfo[] {
    if (!scenario) return [];
    const cfg = scenario.cradleConfig as { cradleStartAge?: number; cradleEndAge?: number; eraStartYear?: number | null } | undefined;
    const cradleStartAge = cfg?.cradleStartAge ?? 12;
    const cradleEndAge = cfg?.cradleEndAge ?? 15;
    const mainStoryEndAge = (scenario.mainStoryEndAge as number) ?? 19;
    const eraStartYear = cfg?.eraStartYear ?? null;
    const total = mainStoryEndAge - cradleStartAge + 1;
    return Array.from({ length: total }, (_, i) => ({
      n: i + 1,
      age: cradleStartAge + i,
      year: eraStartYear != null ? eraStartYear + i : null,
      isT0: (cradleStartAge + i) === cradleEndAge,
    }));
  }

  // ── Chapter: fetch saved events ──
  const fetchChapterStatus = useCallback(async (n: number) => {
    setChapterStates((prev) => ({
      ...prev,
      [n]: { ...defaultChapterState(), ...(prev[n] ?? {}), fetchDone: false },
    }));
    try {
      const res = await fetch(`/api/admin/scenarios/${scenarioId}/chapters/${n}`);
      const data = res.ok ? await res.json() : null;
      setChapterStates((prev) => ({
        ...prev,
        [n]: {
          ...defaultChapterState(),
          ...(prev[n] ?? {}),
          fetchDone: true,
          events: data?.events ?? null,
          savedToDb: !!data?.events,
          editJson: data?.events ? JSON.stringify(data.events, null, 2) : "",
        },
      }));
    } catch {
      setChapterStates((prev) => ({
        ...prev,
        [n]: { ...defaultChapterState(), ...(prev[n] ?? {}), fetchDone: true },
      }));
    }
  }, [scenarioId]);

  // Load all chapter statuses when switching to chapters tab
  useEffect(() => {
    if (activeTab !== "chapters" || !scenario) return;
    const chapters = getChapters();
    chapters.forEach((ch) => {
      if (!chapterStates[ch.n]?.fetchDone) {
        fetchChapterStatus(ch.n);
      }
    });
  }, [activeTab, scenario]); // eslint-disable-line

  // ── Chapter: generate events ──
  async function handleGenerate(n: number) {
    setChapterStates((prev) => ({
      ...prev,
      [n]: { ...(prev[n] ?? defaultChapterState()), generating: true, error: "", expanded: true },
    }));
    try {
      const res = await fetch(`/api/admin/scenarios/${scenarioId}/chapters/${n}/generate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      setChapterStates((prev) => ({
        ...prev,
        [n]: {
          ...(prev[n] ?? defaultChapterState()),
          generating: false,
          events: data.events,
          savedToDb: false,
          expanded: true,
          editJson: JSON.stringify(data.events, null, 2),
        },
      }));
    } catch (e: unknown) {
      setChapterStates((prev) => ({
        ...prev,
        [n]: {
          ...(prev[n] ?? defaultChapterState()),
          generating: false,
          error: e instanceof Error ? e.message : "오류",
        },
      }));
    }
  }

  // ── Chapter: save events ──
  async function handleSaveChapter(n: number) {
    const cs = chapterStates[n];
    const events = cs?.jsonMode ? (() => {
      try { return JSON.parse(cs.editJson); } catch { return null; }
    })() : cs?.events;

    if (!events) return;
    setChapterStates((prev) => ({ ...prev, [n]: { ...(prev[n] ?? defaultChapterState()), saving: true, error: "" } }));
    try {
      const res = await fetch(`/api/admin/scenarios/${scenarioId}/chapters/${n}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
      });
      if (!res.ok) throw new Error("저장 실패");
      setChapterStates((prev) => ({
        ...prev,
        [n]: { ...(prev[n] ?? defaultChapterState()), saving: false, savedToDb: true, events },
      }));
    } catch (e: unknown) {
      setChapterStates((prev) => ({
        ...prev,
        [n]: {
          ...(prev[n] ?? defaultChapterState()),
          saving: false,
          error: e instanceof Error ? e.message : "저장 오류",
        },
      }));
    }
  }

  // ── Generate ALL chapters sequentially ──
  async function handleGenerateAll() {
    const chapters = getChapters();
    for (const ch of chapters) {
      await handleGenerate(ch.n);
    }
  }

  // ── Locations: load ──
  useEffect(() => {
    if (activeTab !== "locations" || !scenario || locations.length > 0) return;
    setLocationsLoading(true);
    fetch(`/api/admin/scenarios/${scenarioId}/locations`)
      .then((r) => r.json())
      .then((data) => setLocations(data.locations ?? []))
      .catch(() => setLocationsError("위치 로드 실패"))
      .finally(() => setLocationsLoading(false));
  }, [activeTab, scenario]); // eslint-disable-line

  async function handleGenerateLocations() {
    setGeneratingLocations(true);
    setLocationsError("");
    setLocationsSaved(false);
    try {
      const res = await fetch(`/api/admin/scenarios/${scenarioId}/locations/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      setLocations(data.locations as LocationData[]);
    } catch (e: unknown) {
      setLocationsError(e instanceof Error ? e.message : "생성 오류");
    } finally {
      setGeneratingLocations(false);
    }
  }

  async function handleSaveLocations() {
    setSavingLocations(true);
    setLocationsError("");
    setLocationsSaved(false);
    try {
      const res = await fetch(`/api/admin/scenarios/${scenarioId}/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locations }),
      });
      if (!res.ok) throw new Error("저장 실패");
      setLocationsSaved(true);
      setTimeout(() => setLocationsSaved(false), 2000);
    } catch (e: unknown) {
      setLocationsError(e instanceof Error ? e.message : "저장 오류");
    } finally {
      setSavingLocations(false);
    }
  }

  // ── BGM: load ──
  useEffect(() => {
    if (activeTab !== "bgm" || !scenario || bgmTracks.length > 0) return;
    setBgmLoading(true);
    fetch(`/api/admin/scenarios/${scenarioId}/bgm`)
      .then((r) => r.json())
      .then((data) => setBgmTracks(data.tracks ?? []))
      .catch(() => setBgmError("BGM 로드 실패"))
      .finally(() => setBgmLoading(false));
  }, [activeTab, scenario]); // eslint-disable-line

  async function handleGenerateBgm() {
    setGeneratingBgm(true);
    setBgmError("");
    setBgmSaved(false);
    try {
      const res = await fetch(`/api/admin/scenarios/${scenarioId}/bgm/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      setBgmTracks(data.tracks as BgmTrackData[]);
    } catch (e: unknown) {
      setBgmError(e instanceof Error ? e.message : "생성 오류");
    } finally {
      setGeneratingBgm(false);
    }
  }

  async function handleSaveBgm() {
    setSavingBgm(true);
    setBgmError("");
    setBgmSaved(false);
    try {
      const res = await fetch(`/api/admin/scenarios/${scenarioId}/bgm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks: bgmTracks }),
      });
      if (!res.ok) throw new Error("저장 실패");
      setBgmSaved(true);
      setTimeout(() => setBgmSaved(false), 2000);
    } catch (e: unknown) {
      setBgmError(e instanceof Error ? e.message : "저장 오류");
    } finally {
      setSavingBgm(false);
    }
  }

  // ── Questions: load ──
  useEffect(() => {
    if (activeTab !== "questions" || !scenario || entryQuestions !== null) return;
    setQuestionsLoading(true);
    fetch(`/api/admin/scenarios/${scenarioId}/questions`)
      .then((r) => r.json())
      .then((data) => setEntryQuestions(data.questions ?? []))
      .catch(() => setQuestionsError("질문 로드 실패"))
      .finally(() => setQuestionsLoading(false));
  }, [activeTab, scenario]); // eslint-disable-line

  // ── Questions: AI generate ──
  async function handleGenerateQuestions() {
    setGeneratingQuestions(true);
    setQuestionsError("");
    setQuestionsSaved(false);
    try {
      const res = await fetch(`/api/admin/scenarios/${scenarioId}/questions/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      setEntryQuestions(data.questions as EntryQuestionData[]);
    } catch (e: unknown) {
      setQuestionsError(e instanceof Error ? e.message : "생성 오류");
    } finally {
      setGeneratingQuestions(false);
    }
  }

  // ── Questions: save ──
  async function handleSaveQuestions() {
    if (!entryQuestions) return;
    setSavingQuestions(true);
    setQuestionsError("");
    setQuestionsSaved(false);
    try {
      const res = await fetch(`/api/admin/scenarios/${scenarioId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: entryQuestions }),
      });
      if (!res.ok) throw new Error("저장 실패");
      setQuestionsSaved(true);
      setTimeout(() => setQuestionsSaved(false), 2000);
    } catch (e: unknown) {
      setQuestionsError(e instanceof Error ? e.message : "저장 오류");
    } finally {
      setSavingQuestions(false);
    }
  }

  // ── Safety: load ──
  useEffect(() => {
    if (activeTab !== "safety" || !scenario || safetyRules !== null) return;
    setSafetyLoading(true);
    fetch(`/api/admin/scenarios/${scenarioId}/safety`)
      .then((r) => r.json())
      .then((data) => setSafetyRules(data.rules ?? emptyRules()))
      .catch(() => setSafetyError("안전선 로드 실패"))
      .finally(() => setSafetyLoading(false));
  }, [activeTab, scenario]); // eslint-disable-line

  // ── Safety: AI generate ──
  async function handleGenerateSafety() {
    setGeneratingSafety(true);
    setSafetyError("");
    setSafetySaved(false);
    try {
      const res = await fetch(`/api/admin/scenarios/${scenarioId}/safety/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      setSafetyRules(data.rules as SafetyRulesData);
    } catch (e: unknown) {
      setSafetyError(e instanceof Error ? e.message : "생성 오류");
    } finally {
      setGeneratingSafety(false);
    }
  }

  // ── Safety: save ──
  async function handleSaveSafety() {
    if (!safetyRules) return;
    setSavingSafety(true);
    setSafetyError("");
    setSafetySaved(false);
    try {
      const res = await fetch(`/api/admin/scenarios/${scenarioId}/safety`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(safetyRules),
      });
      if (!res.ok) throw new Error("저장 실패");
      setSafetySaved(true);
      setTimeout(() => setSafetySaved(false), 2000);
    } catch (e: unknown) {
      setSafetyError(e instanceof Error ? e.message : "저장 오류");
    } finally {
      setSavingSafety(false);
    }
  }

  // ── Cards: load ──
  useEffect(() => {
    if (activeTab !== "cards" || !scenario || customCards.length > 0) return;
    setCardsLoading(true);
    fetch(`/api/admin/scenarios/${scenarioId}/cards`)
      .then((r) => r.json())
      .then((data) => setCustomCards(data.cards ?? []))
      .catch(() => setCardsError("카드 로드 실패"))
      .finally(() => setCardsLoading(false));
  }, [activeTab, scenario]); // eslint-disable-line

  // ── Cards: AI generate ──
  async function handleGenerateCards() {
    setGeneratingCards(true);
    setCardsError("");
    try {
      const res = await fetch(`/api/admin/scenarios/${scenarioId}/cards/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      // 생성된 카드를 바로 Firestore에 저장
      const saved: CustomCardData[] = [];
      for (const card of (data.cards as CustomCardData[])) {
        const r = await fetch(`/api/admin/scenarios/${scenarioId}/cards`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(card),
        });
        const d = await r.json();
        saved.push({ ...card, id: d.id });
      }
      setCustomCards((prev) => [...prev, ...saved]);
    } catch (e: unknown) {
      setCardsError(e instanceof Error ? e.message : "생성 오류");
    } finally {
      setGeneratingCards(false);
    }
  }

  // ── Cards: delete ──
  async function handleDeleteCard(index: number) {
    const card = customCards[index];
    if (card.id) {
      await fetch(`/api/admin/scenarios/${scenarioId}/cards`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id }),
      });
    }
    setCustomCards((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Milestones: load ──
  useEffect(() => {
    if (activeTab !== "milestones" || !scenario || milestones.length > 0) return;
    setMilestonesLoading(true);
    fetch(`/api/admin/scenarios/${scenarioId}/milestones`)
      .then((r) => r.json())
      .then((data) => setMilestones(data.milestones ?? []))
      .catch(() => setMilestonesError("이정표 로드 실패"))
      .finally(() => setMilestonesLoading(false));
  }, [activeTab, scenario]); // eslint-disable-line

  // ── Milestones: AI generate ──
  async function handleGenerateMilestones() {
    setGeneratingMilestones(true);
    setMilestonesError("");
    try {
      const res = await fetch(`/api/admin/scenarios/${scenarioId}/milestones/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      setMilestones(data.milestones ?? []);
    } catch (e: unknown) {
      setMilestonesError(e instanceof Error ? e.message : "생성 오류");
    } finally {
      setGeneratingMilestones(false);
    }
  }

  // ── Milestones: save all to Firestore ──
  async function handleSaveMilestones() {
    setSavingMilestones(true);
    setMilestonesError("");
    try {
      // Delete existing, then save new ones in order
      await Promise.all(
        milestones.filter((m) => m.id).map((m) =>
          fetch(`/api/admin/scenarios/${scenarioId}/milestones`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ milestoneId: m.id }),
          })
        )
      );
      const saved: MilestoneData[] = [];
      for (const m of milestones) {
        const { id: _id, ...body } = m;
        const res = await fetch(`/api/admin/scenarios/${scenarioId}/milestones`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        saved.push({ ...m, id: data.id });
      }
      setMilestones(saved);
    } catch (e: unknown) {
      setMilestonesError(e instanceof Error ? e.message : "저장 오류");
    } finally {
      setSavingMilestones(false);
    }
  }

  // ── Milestones: delete one ──
  async function handleDeleteMilestone(index: number) {
    const m = milestones[index];
    if (m.id) {
      await fetch(`/api/admin/scenarios/${scenarioId}/milestones`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId: m.id }),
      });
    }
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Scenario: save JSON edits ──
  async function handleSaveScenario() {
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
      setSaveMsg("저장되었습니다");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch (e: unknown) {
      setSaveMsg(e instanceof Error ? e.message : "저장 오류");
    } finally {
      setSaving(false);
    }
  }

  // ── Scenario: change status ──
  async function handleStatusChange(newStatus: Status) {
    try {
      await fetch(`/api/admin/scenarios/${scenarioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setScenario((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "오류");
    }
  }

  // ── Scenario: delete ──
  async function handleDelete() {
    if (!confirm("이 시나리오를 삭제하시겠습니까? 되돌릴 수 없습니다.")) return;
    try {
      await fetch(`/api/admin/scenarios/${scenarioId}`, { method: "DELETE" });
      router.push("/admin/scenarios");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "삭제 오류");
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !scenario) {
    return <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>;
  }

  const s = scenario as ScenarioShape;
  const status = (s.status ?? "draft") as Status;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
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
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-xl w-fit">
        {([["overview", "개요"], ["chapters", "챕터 이벤트"], ["milestones", "이정표"], ["cards", "카드"], ["safety", "안전선"], ["questions", "진입 질문"], ["locations", "장소"], ["bgm", "BGM"], ["json", "JSON 편집"]] as [Tab, string][]).map(
          ([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab ? "bg-white text-black" : "text-white/50 hover:text-white"
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      {/* ── Tab: Overview ── */}
      {activeTab === "overview" && (
        <OverviewTab
          s={s}
          status={status}
          scenarioId={scenarioId}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}

      {/* ── Tab: Chapter Events ── */}
      {activeTab === "chapters" && (
        <ChaptersTab
          scenarioId={scenarioId}
          chapters={getChapters()}
          chapterStates={chapterStates}
          onGenerate={handleGenerate}
          onGenerateAll={handleGenerateAll}
          onSave={handleSaveChapter}
          onToggleExpand={(n) =>
            setChapterStates((prev) => ({
              ...prev,
              [n]: { ...(prev[n] ?? defaultChapterState()), expanded: !prev[n]?.expanded },
            }))
          }
          onToggleJson={(n) =>
            setChapterStates((prev) => ({
              ...prev,
              [n]: { ...(prev[n] ?? defaultChapterState()), jsonMode: !prev[n]?.jsonMode },
            }))
          }
          onEditJson={(n, v) =>
            setChapterStates((prev) => ({
              ...prev,
              [n]: { ...(prev[n] ?? defaultChapterState()), editJson: v },
            }))
          }
        />
      )}

      {/* ── Tab: Locations ── */}
      {activeTab === "locations" && (
        <LocationsTab
          locations={locations}
          loading={locationsLoading}
          error={locationsError}
          generating={generatingLocations}
          saving={savingLocations}
          saved={locationsSaved}
          onGenerate={handleGenerateLocations}
          onSave={handleSaveLocations}
          onChange={setLocations}
        />
      )}

      {/* ── Tab: BGM ── */}
      {activeTab === "bgm" && (
        <BgmTab
          tracks={bgmTracks}
          loading={bgmLoading}
          error={bgmError}
          generating={generatingBgm}
          saving={savingBgm}
          saved={bgmSaved}
          onGenerate={handleGenerateBgm}
          onSave={handleSaveBgm}
          onChange={setBgmTracks}
        />
      )}

      {/* ── Tab: Questions ── */}
      {activeTab === "questions" && (
        <QuestionsTab
          questions={entryQuestions}
          loading={questionsLoading}
          error={questionsError}
          generating={generatingQuestions}
          saving={savingQuestions}
          saved={questionsSaved}
          onGenerate={handleGenerateQuestions}
          onSave={handleSaveQuestions}
          onChange={setEntryQuestions}
        />
      )}

      {/* ── Tab: Safety ── */}
      {activeTab === "safety" && (
        <SafetyTab
          rules={safetyRules}
          loading={safetyLoading}
          error={safetyError}
          generating={generatingSafety}
          saving={savingSafety}
          saved={safetySaved}
          onGenerate={handleGenerateSafety}
          onSave={handleSaveSafety}
          onChange={(updated) => setSafetyRules(updated)}
        />
      )}

      {/* ── Tab: Cards ── */}
      {activeTab === "cards" && (
        <CardsTab
          customCards={customCards}
          loading={cardsLoading}
          error={cardsError}
          generating={generatingCards}
          onGenerate={handleGenerateCards}
          onDelete={handleDeleteCard}
        />
      )}

      {/* ── Tab: Milestones ── */}
      {activeTab === "milestones" && (
        <MilestonesTab
          milestones={milestones}
          loading={milestonesLoading}
          error={milestonesError}
          generating={generatingMilestones}
          saving={savingMilestones}
          onGenerate={handleGenerateMilestones}
          onSave={handleSaveMilestones}
          onDelete={handleDeleteMilestone}
          onChange={(updated) => setMilestones(updated)}
        />
      )}

      {/* ── Tab: JSON Edit ── */}
      {activeTab === "json" && (
        <div>
          {saveMsg && (
            <div className={`mb-4 p-3 rounded-lg text-sm border ${
              saveMsg.includes("실패") || saveMsg.includes("오류")
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-green-500/10 border-green-500/20 text-green-400"
            }`}>{saveMsg}</div>
          )}
          <textarea
            value={editJson}
            onChange={(e) => setEditJson(e.target.value)}
            rows={40}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-green-300 font-mono text-xs focus:outline-none focus:border-white/30 resize-y mb-4"
          />
          <button
            onClick={handleSaveScenario}
            disabled={saving}
            className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 disabled:opacity-30 transition-all"
          >
            {saving ? "저장 중..." : "시나리오 메타데이터 저장"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function CoverImageSection({ scenarioId, initialUrl }: { scenarioId: string; initialUrl?: string }) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleAiGenerate() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/scenarios/${scenarioId}/cover`, { method: "POST" });
      const data = await res.json();
      if (data.coverImageUrl) setUrl(data.coverImageUrl);
      else setError(data.error ?? "생성 실패");
    } catch {
      setError("네트워크 오류");
    } finally {
      setGenerating(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetch(`/api/admin/scenarios/${scenarioId}/cover`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64, mimeType: file.type }),
        });
        const data = await res.json();
        if (data.coverImageUrl) setUrl(data.coverImageUrl);
        else setError(data.error ?? "업로드 실패");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setError("업로드 오류");
      setUploading(false);
    }
  }

  return (
    <div className="border border-white/10 rounded-xl p-5">
      <p className="text-xs text-white/40 uppercase tracking-wider mb-3">커버 이미지</p>
      <div className="aspect-video bg-white/5 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
        {url ? (
          <img src={url} alt="cover" className="w-full h-full object-cover" />
        ) : (
          <p className="text-white/20 text-sm">이미지 없음</p>
        )}
      </div>
      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleAiGenerate}
          disabled={generating || uploading}
          className="flex-1 py-2 text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50"
        >
          {generating ? "AI 생성 중..." : "✦ AI로 생성"}
        </button>
        <label className={`flex-1 py-2 text-xs bg-white/5 text-white/50 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-center ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          {uploading ? "업로드 중..." : "↑ 직접 업로드"}
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      </div>
    </div>
  );
}

function OverviewTab({
  s, status, scenarioId, onStatusChange, onDelete,
}: {
  s: ScenarioShape;
  status: Status;
  scenarioId: string;
  onStatusChange: (s: Status) => void;
  onDelete: () => void;
}) {
  const [publishing, setPublishing] = useState(false);

  async function handlePublish() {
    if (!confirm("이 시나리오를 출시하면 모든 플레이어에게 공개됩니다. 계속하시겠습니까?")) return;
    setPublishing(true);
    await onStatusChange("published");
    setPublishing(false);
  }

  return (
    <div className="space-y-4">
      {/* 커버 이미지 */}
      <CoverImageSection scenarioId={scenarioId} initialUrl={s.coverImageUrl} />

      {/* 발행 워크플로우 */}
      <div className={`border rounded-xl p-5 ${
        status === "published"
          ? "border-green-500/30 bg-green-500/5"
          : "border-white/10"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-white/40 uppercase tracking-wider">발행 상태</p>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[status]}`}>
            {STATUS_LABELS[status]}
          </span>
        </div>

        {status === "draft" && (
          <>
            <div className="space-y-1.5 mb-4">
              {[
                "챕터 이벤트 탭 — 모든 챕터 생성 및 저장",
                "이정표 탭 — 이정표 생성 및 저장",
                "안전선 탭 — 안전선 생성 및 저장",
                "진입 질문 탭 — 진입 질문 생성 및 저장",
                "장소 탭 — 장소 생성 및 저장",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-xs text-white/30">
                  <span className="shrink-0 mt-0.5">□</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="w-full py-2.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50"
            >
              {publishing ? "발행 중..." : "✓ 시나리오 출시"}
            </button>
          </>
        )}

        {status === "published" && (
          <div className="space-y-2">
            <p className="text-sm text-green-400/80">
              이 시나리오는 현재 플레이어에게 공개되어 있습니다.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onStatusChange("draft")}
                className="px-3 py-1.5 text-xs border border-white/10 text-white/40 rounded-lg hover:text-white hover:border-white/30 transition-colors"
              >
                초안으로 되돌리기
              </button>
              <button
                onClick={() => onStatusChange("archived")}
                className="px-3 py-1.5 text-xs border border-white/10 text-white/40 rounded-lg hover:text-white hover:border-white/30 transition-colors"
              >
                보관
              </button>
            </div>
          </div>
        )}

        {status === "archived" && (
          <div className="space-y-2">
            <p className="text-sm text-white/30">보관된 시나리오입니다.</p>
            <button
              onClick={() => onStatusChange("draft")}
              className="px-3 py-1.5 text-xs border border-white/10 text-white/40 rounded-lg hover:text-white hover:border-white/30 transition-colors"
            >
              초안으로 복구
            </button>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "무게", value: `${s.heaviness}/5` },
          { label: "캐스팅", value: `${s.castingRoles?.length ?? 0}종` },
          { label: "결말", value: `${s.endings?.length ?? 0}개` },
          { label: "명장면", value: `${s.iconicMoments?.length ?? 0}개` },
        ].map((item) => (
          <div key={item.label} className="border border-white/10 rounded-xl p-4 text-center">
            <p className="text-xl font-bold text-white">{item.value}</p>
            <p className="text-xs text-white/40 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="border border-white/10 rounded-xl p-5">
        <p className="text-xs text-white/40 uppercase tracking-wider mb-2">설명</p>
        <p className="text-white/70 text-sm leading-relaxed">{s.description?.ko}</p>
        <div className="flex gap-4 mt-3 text-xs text-white/30">
          <span>시대 {s.era}</span>
          <span>장르 {s.genre?.join(", ")}</span>
          <span>{s.isPremium ? "프리미엄" : "무료"}</span>
        </div>
      </div>

      {/* Cradle config */}
      <div className="border border-white/10 rounded-xl p-5">
        <p className="text-xs text-white/40 uppercase tracking-wider mb-3">크래들 설정</p>
        <div className="flex gap-6 text-sm">
          <div><p className="text-white/30 text-xs mb-1">타입</p><p className="text-white font-medium">{s.cradleConfig?.type}</p></div>
          <div><p className="text-white/30 text-xs mb-1">시작 나이</p><p className="text-white font-medium">{s.cradleConfig?.cradleStartAge}세</p></div>
          <div><p className="text-white/30 text-xs mb-1">T-0 나이</p><p className="text-white font-medium">{s.cradleConfig?.cradleEndAge}세</p></div>
          <div><p className="text-white/30 text-xs mb-1">시작 연도</p><p className="text-white font-medium">{s.cradleConfig?.eraStartYear ?? "현대"}</p></div>
          <div><p className="text-white/30 text-xs mb-1">스토리 종료</p><p className="text-white font-medium">{s.mainStoryEndAge}세</p></div>
        </div>
      </div>

      {/* Casting roles */}
      {(s.castingRoles?.length ?? 0) > 0 && (
        <div className="border border-white/10 rounded-xl p-5">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">캐스팅 역할 ({s.castingRoles!.length}종)</p>
          <div className="space-y-2">
            {s.castingRoles!.map((role, i) => (
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

      {/* Endings */}
      {(s.endings?.length ?? 0) > 0 && (
        <div className="border border-white/10 rounded-xl p-5">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">결말 ({s.endings!.length}개)</p>
          <div className="grid grid-cols-2 gap-2">
            {s.endings!.map((e, i) => (
              <div key={e.id ?? i} className="bg-white/3 rounded-lg p-3">
                <p className="text-white/70 text-xs font-medium">{e.title?.ko}</p>
                <p className="text-white/30 text-xs mt-0.5">{e.rarityPercentage}% · {e.castingRoleId}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger zone */}
      <div className="border border-red-500/20 rounded-xl p-5 mt-4">
        <p className="text-xs text-red-400/60 uppercase tracking-wider mb-3">위험 구역</p>
        <button
          onClick={onDelete}
          className="px-4 py-2 text-sm text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
        >
          시나리오 삭제
        </button>
      </div>
    </div>
  );
}

// ── Chapters Tab ──────────────────────────────────────────────────────────────

function ChaptersTab({
  scenarioId, chapters, chapterStates,
  onGenerate, onGenerateAll, onSave,
  onToggleExpand, onToggleJson, onEditJson,
}: {
  scenarioId: string;
  chapters: ChapterInfo[];
  chapterStates: Record<number, ChapterState>;
  onGenerate: (n: number) => void;
  onGenerateAll: () => void;
  onSave: (n: number) => void;
  onToggleExpand: (n: number) => void;
  onToggleJson: (n: number) => void;
  onEditJson: (n: number, v: string) => void;
}) {
  const generatedCount = chapters.filter((ch) => chapterStates[ch.n]?.savedToDb).length;
  const isGeneratingAny = chapters.some((ch) => chapterStates[ch.n]?.generating);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-white/60 text-sm">
            {generatedCount}/{chapters.length} 챕터 저장됨
          </p>
        </div>
        <button
          onClick={onGenerateAll}
          disabled={isGeneratingAny}
          className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-40"
        >
          {isGeneratingAny ? "생성 중..." : "전체 챕터 AI 생성"}
        </button>
      </div>

      {/* Chapter list */}
      <div className="space-y-3">
        {chapters.map((ch) => {
          const cs = chapterStates[ch.n];
          return (
            <ChapterCard
              key={ch.n}
              ch={ch}
              cs={cs}
              onGenerate={() => onGenerate(ch.n)}
              onSave={() => onSave(ch.n)}
              onToggleExpand={() => onToggleExpand(ch.n)}
              onToggleJson={() => onToggleJson(ch.n)}
              onEditJson={(v) => onEditJson(ch.n, v)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Chapter Card ──────────────────────────────────────────────────────────────

function ChapterCard({
  ch, cs,
  onGenerate, onSave, onToggleExpand, onToggleJson, onEditJson,
}: {
  ch: ChapterInfo;
  cs: ChapterState | undefined;
  onGenerate: () => void;
  onSave: () => void;
  onToggleExpand: () => void;
  onToggleJson: () => void;
  onEditJson: (v: string) => void;
}) {
  const hasEvents = !!(cs?.events?.length);
  const isSaved = cs?.savedToDb;
  const isLoading = !cs?.fetchDone;

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm">챕터 {ch.n}</span>
            {ch.isT0 && (
              <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded font-medium">
                T-0
              </span>
            )}
          </div>
          <p className="text-white/40 text-xs mt-0.5">{ch.age}세{ch.year != null ? ` · ${ch.year}년` : ""}</p>
        </div>

        {/* Status badge */}
        {isLoading ? (
          <span className="text-xs text-white/30">확인 중...</span>
        ) : isSaved ? (
          <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">
            {cs?.events?.length ?? 0}개 저장됨
          </span>
        ) : hasEvents ? (
          <span className="text-xs px-2 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full">
            미저장
          </span>
        ) : (
          <span className="text-xs px-2 py-0.5 bg-white/5 text-white/30 border border-white/10 rounded-full">
            미생성
          </span>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!cs?.generating && (
            <button
              onClick={onGenerate}
              className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              {isSaved ? "재생성" : "AI 생성"}
            </button>
          )}
          {cs?.generating && (
            <span className="flex items-center gap-1.5 text-xs text-white/40">
              <span className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin" />
              생성 중...
            </span>
          )}
          {hasEvents && (
            <button
              onClick={onToggleExpand}
              className="text-xs text-white/40 hover:text-white px-2 py-1.5 transition-colors"
            >
              {cs?.expanded ? "▲" : "▼"}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {cs?.error && (
        <div className="px-5 pb-3">
          <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{cs.error}</p>
        </div>
      )}

      {/* Expanded events */}
      {cs?.expanded && hasEvents && (
        <div className="border-t border-white/10 bg-white/2 px-5 py-4">
          {/* JSON / Preview toggle */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs text-white/40">{cs.events!.length}개 이벤트</p>
            <div className="flex gap-2">
              <button
                onClick={onToggleJson}
                className="text-xs px-3 py-1 border border-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
              >
                {cs.jsonMode ? "미리보기" : "JSON 편집"}
              </button>
              <button
                onClick={onSave}
                disabled={cs.saving}
                className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                  cs.savedToDb
                    ? "border border-green-500/30 text-green-400 hover:bg-green-500/10"
                    : "bg-white text-black hover:bg-white/90"
                }`}
              >
                {cs.saving ? "저장 중..." : cs.savedToDb ? "저장됨 ✓" : "Firestore 저장"}
              </button>
            </div>
          </div>

          {cs.jsonMode ? (
            <textarea
              value={cs.editJson}
              onChange={(e) => onEditJson(e.target.value)}
              rows={20}
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-green-300 font-mono text-xs focus:outline-none focus:border-white/30 resize-y"
            />
          ) : (
            <div className="space-y-3">
              {cs.events!.map((ev, i) => (
                <EventPreviewCard key={i} index={i} event={ev} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Event Preview Card ────────────────────────────────────────────────────────

function EventPreviewCard({ index, event: ev }: { index: number; event: ChapterEvent }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-white/8 rounded-lg bg-white/3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-start gap-3"
      >
        <span className="text-white/30 text-xs font-mono mt-0.5 shrink-0">E{index + 1}</span>
        <p className="text-white/70 text-xs leading-relaxed line-clamp-2 flex-1">
          {ev.narrative.split("\n")[0]}
        </p>
        <span className="text-white/30 text-xs shrink-0">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3">
          {/* Full narrative */}
          <div className="text-white/60 text-xs leading-relaxed mb-3 whitespace-pre-line">
            {ev.narrative}
          </div>
          {/* Choices */}
          <div className="space-y-1.5 mb-3">
            {ev.choices.map((ch) => (
              <div key={ch.id} className="flex gap-2 text-xs">
                <span className="text-white/30 font-mono shrink-0">{ch.id}.</span>
                <span className="text-white/50">{ch.text}</span>
              </div>
            ))}
          </div>
          {/* Outcomes */}
          <div className="grid grid-cols-2 gap-2">
            {(["A", "B"] as const).map((k) => {
              const out = ev.outcomes[k];
              const deltas = Object.entries(out.statChanges ?? {}).filter(([, v]) => v !== 0);
              return (
                <div key={k} className="bg-white/3 rounded p-2">
                  <div className="flex gap-1 flex-wrap mb-1">
                    {deltas.map(([stat, val]) => (
                      <span
                        key={stat}
                        className={`text-xs px-1 rounded ${
                          (val as number) > 0 ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
                        }`}
                      >
                        {stat} {(val as number) > 0 ? `+${val}` : val}
                      </span>
                    ))}
                  </div>
                  <p className="text-white/40 text-xs leading-snug">{out.resultNarrative}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Locations Tab ─────────────────────────────────────────────────────────────

function LocationsTab({
  locations, loading, error, generating, saving, saved,
  onGenerate, onSave, onChange,
}: {
  locations: LocationData[]; loading: boolean; error: string;
  generating: boolean; saving: boolean; saved: boolean;
  onGenerate: () => void; onSave: () => void; onChange: (l: LocationData[]) => void;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <TabHeader
        subtitle="챕터 종료 시 '거쳐간 곳'·인생 종료 후 컬렉션에 노출"
        count={locations.length} unit="곳"
        generating={generating} saving={saving} saved={saved}
        hasSaveTarget={locations.length > 0}
        onGenerate={onGenerate} onSave={onSave}
        generateLabel="AI 장소 매칭" regenerateLabel="재매칭"
      />
      {error && <ErrorBox msg={error} />}
      {generating && <GeneratingBox msg="시나리오 시대에 맞는 실존 장소를 분석하고 있습니다..." />}
      {locations.length === 0 && !generating && <EmptyBox msg="AI 장소 매칭 버튼을 눌러 시작하세요." />}

      <div className="space-y-3">
        {locations.map((loc, i) => (
          <div key={i} className="border border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full text-left px-5 py-4 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white/80 text-sm font-medium">{loc.nameKo}</span>
                  <span className="text-white/30 text-xs">{loc.nameEn}</span>
                  {loc.chapterAge && (
                    <span className="text-xs text-accent-jade/70">{loc.chapterAge}세</span>
                  )}
                </div>
                <p className="text-white/40 text-xs mt-0.5 truncate">{loc.address}</p>
              </div>
              <span className="text-white/30 text-xs shrink-0">{expanded === i ? "▲" : "▼"}</span>
            </button>

            {expanded === i && (
              <div className="border-t border-white/10 bg-white/2 px-5 py-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs text-white/40">
                  <span>위도 {loc.lat}</span>
                  <span>경도 {loc.lng}</span>
                </div>
                <div>
                  <p className="text-xs text-white/30 mb-1">작품 내 의미</p>
                  <p className="text-white/60 text-xs leading-relaxed">{loc.inGameMeaning}</p>
                </div>
                <div>
                  <p className="text-xs text-amber-400/60 mb-1">감각적 묘사 (AI 프롬프트 주입용)</p>
                  <p className="text-amber-300/60 text-xs leading-relaxed font-mono">{loc.sensoryDescription}</p>
                </div>
                <div>
                  <p className="text-xs text-white/30 mb-1">방문 가이드</p>
                  <p className="text-white/50 text-xs">{loc.guideNote}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── BGM Tab ───────────────────────────────────────────────────────────────────

const BGM_CONTEXT_KO: Record<string, string> = {
  everyday: "평상시", cradle: "요람기", spring: "봄", summer: "여름",
  autumn: "가을", winter: "겨울", t0_casting: "T-0 캐스팅",
  milestone: "이정표", iconic_moment: "명장면", stat_warning: "스탯 경고",
  chapter_end: "챕터 마무리", ending_happy: "행복한 결말",
  ending_tragic: "비극적 결말", ending_bittersweet: "씁쓸한 결말",
};
const TEMPO_KO: Record<string, string> = { slow: "느림", moderate: "보통", fast: "빠름" };

function BgmTab({
  tracks, loading, error, generating, saving, saved,
  onGenerate, onSave, onChange,
}: {
  tracks: BgmTrackData[]; loading: boolean; error: string;
  generating: boolean; saving: boolean; saved: boolean;
  onGenerate: () => void; onSave: () => void; onChange: (t: BgmTrackData[]) => void;
}) {
  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <TabHeader
        subtitle="게임 플레이 중 컨텍스트에 맞게 자동 선택되는 BGM 풀 (14종)"
        count={tracks.length} unit="트랙"
        generating={generating} saving={saving} saved={saved}
        hasSaveTarget={tracks.length > 0}
        onGenerate={onGenerate} onSave={onSave}
        generateLabel="AI BGM 풀 생성" regenerateLabel="재생성"
      />
      {error && <ErrorBox msg={error} />}
      {generating && <GeneratingBox msg="시나리오 정서에 맞는 BGM 풀을 정의하고 있습니다..." />}
      {tracks.length === 0 && !generating && <EmptyBox msg="AI BGM 풀 생성 버튼을 눌러 시작하세요." />}

      <div className="space-y-2">
        {tracks.map((track, i) => (
          <div key={track.id ?? i} className="border border-white/10 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs px-1.5 py-0.5 bg-white/8 text-white/50 rounded border border-white/10">
                    {BGM_CONTEXT_KO[track.context] ?? track.context}
                  </span>
                  <span className="text-white/80 text-sm font-medium">{track.nameKo}</span>
                  <span className="text-white/30 text-xs ml-auto">{TEMPO_KO[track.tempo] ?? track.tempo}</span>
                </div>
                <p className="text-text-muted text-xs mb-1.5">🎭 {track.mood}</p>
                <p className="text-white/40 text-xs mb-1.5">🎵 {track.instruments?.join(", ")}</p>
                <p className="text-white/30 text-xs leading-relaxed font-mono italic">{track.referenceTrackHint}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Shared UI helpers ─────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );
}
function ErrorBox({ msg }: { msg: string }) {
  return <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">{msg}</div>;
}
function GeneratingBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white/3 rounded-xl border border-white/10">
      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin shrink-0" />
      <p className="text-white/50 text-sm">{msg}</p>
    </div>
  );
}
function EmptyBox({ msg }: { msg: string }) {
  return (
    <div className="text-center py-12 text-white/30 text-sm border border-dashed border-white/10 rounded-xl">
      {msg}
    </div>
  );
}
function TabHeader({
  subtitle, count, unit, generating, saving, saved, hasSaveTarget,
  onGenerate, onSave, generateLabel, regenerateLabel,
}: {
  subtitle: string; count: number; unit: string;
  generating: boolean; saving: boolean; saved: boolean; hasSaveTarget: boolean;
  onGenerate: () => void; onSave: () => void;
  generateLabel: string; regenerateLabel: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-white/60 text-sm">{count > 0 ? `${count}${unit}` : "없음"}</p>
        <p className="text-white/30 text-xs mt-0.5">{subtitle}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        {hasSaveTarget && (
          <button
            onClick={onSave} disabled={saving}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors disabled:opacity-40 ${
              saved ? "text-green-400 border-green-500/30 bg-green-500/10"
                    : "text-white border-white/20 hover:border-white/40 bg-white/5"
            }`}
          >
            {saving ? "저장 중..." : saved ? "저장됨 ✓" : "Firestore 저장"}
          </button>
        )}
        <button
          onClick={onGenerate} disabled={generating}
          className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-40"
        >
          {generating ? "생성 중..." : count > 0 ? regenerateLabel : generateLabel}
        </button>
      </div>
    </div>
  );
}

// ── Questions Tab ─────────────────────────────────────────────────────────────

function QuestionsTab({
  questions, loading, error, generating, saving, saved,
  onGenerate, onSave, onChange,
}: {
  questions: EntryQuestionData[] | null;
  loading: boolean;
  error: string;
  generating: boolean;
  saving: boolean;
  saved: boolean;
  onGenerate: () => void;
  onSave: () => void;
  onChange: (q: EntryQuestionData[]) => void;
}) {
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white/50 text-sm">Cradle 시작 직후 플레이어 성향 파악용 질문</p>
          <p className="text-white/30 text-xs mt-0.5">AI가 답변 패턴으로 캐스팅 수렴 방향을 추적</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {questions && questions.length > 0 && (
            <button
              onClick={onSave}
              disabled={saving}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors disabled:opacity-40 ${
                saved
                  ? "text-green-400 border-green-500/30 bg-green-500/10"
                  : "text-white border-white/20 hover:border-white/40 bg-white/5"
              }`}
            >
              {saving ? "저장 중..." : saved ? "저장됨 ✓" : "Firestore 저장"}
            </button>
          )}
          <button
            onClick={onGenerate}
            disabled={generating}
            className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-40"
          >
            {generating ? "생성 중..." : questions?.length ? "재생성" : "AI 질문 생성"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">{error}</div>
      )}

      {generating && (
        <div className="flex items-center gap-3 p-4 bg-white/3 rounded-xl border border-white/10">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin shrink-0" />
          <p className="text-white/50 text-sm">캐스팅 역할을 분석해 진입 질문을 생성하고 있습니다...</p>
        </div>
      )}

      {(!questions || questions.length === 0) && !generating && (
        <div className="text-center py-12 text-white/30 text-sm border border-dashed border-white/10 rounded-xl">
          <p className="mb-1">진입 질문이 없습니다.</p>
          <p className="text-xs">AI 질문 생성 버튼을 눌러 시작하세요.</p>
        </div>
      )}

      <div className="space-y-3">
        {(questions ?? []).map((q, qi) => (
          <div key={q.id} className="border border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
              className="w-full text-left px-5 py-4 flex items-start gap-3"
            >
              <span className="text-white/30 text-xs font-mono shrink-0 mt-0.5">Q{q.order}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-sm leading-relaxed">{q.text}</p>
                {q.subtext && <p className="text-white/30 text-xs mt-0.5">{q.subtext}</p>}
              </div>
              <span className="text-white/30 text-xs shrink-0">{expandedQ === q.id ? "▲" : "▼"}</span>
            </button>

            {expandedQ === q.id && (
              <div className="border-t border-white/10 bg-white/2 px-5 py-4 space-y-4">
                {/* 질문 편집 */}
                <div>
                  <p className="text-xs text-white/30 mb-1">질문 텍스트</p>
                  <textarea
                    defaultValue={q.text}
                    onBlur={(e) => {
                      const updated = [...(questions ?? [])];
                      updated[qi] = { ...q, text: e.target.value };
                      onChange(updated);
                    }}
                    rows={2}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/70 text-sm focus:outline-none focus:border-white/30 resize-none"
                  />
                </div>

                {/* 선택지 */}
                <div className="space-y-2">
                  <p className="text-xs text-white/30">선택지 ({q.choices.length}개)</p>
                  {q.choices.map((ch) => (
                    <div key={ch.id} className="flex items-start gap-3 bg-white/3 rounded-lg p-3">
                      <span className="text-white/40 text-xs font-mono shrink-0 w-4">{ch.id}.</span>
                      <div className="flex-1">
                        <p className="text-white/70 text-xs mb-1">{ch.text}</p>
                        <p className="text-white/30 text-xs font-mono">→ {ch.castingHint}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {questions && questions.length > 0 && (
        <div className="border border-white/10 rounded-xl p-4 bg-white/2">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">게임 내 동작</p>
          <p className="text-white/50 text-sm">Life 생성 직후, 챕터 1 시작 전에 순서대로 표시됩니다.</p>
          <p className="text-white/30 text-xs mt-1">답변은 Firestore에 저장되어 이후 AI 캐스팅 판단에 활용됩니다.</p>
        </div>
      )}
    </div>
  );
}

// ── Safety Tab ────────────────────────────────────────────────────────────────

const SAFETY_SECTIONS: { key: keyof SafetyRulesData; label: string; hint: string; sourceOnly?: string }[] = [
  { key: "forbiddenCharacterNames", label: "실명 사용 금지 인물", hint: "한 줄에 하나씩", sourceOnly: "drama_book" },
  { key: "forbiddenQuotes", label: "직접 인용 금지 명대사 패턴", hint: "실제 대사가 아닌 패턴 설명", sourceOnly: "drama_book" },
  { key: "forbiddenScenePatterns", label: "묘사 금지 명장면 패턴", hint: "어떤 장면인지 설명", sourceOnly: "drama_book" },
  { key: "confirmedHistoricalFacts", label: "반드시 지켜야 할 역사적 사실", hint: "날짜·사건·결과 포함", sourceOnly: "history" },
  { key: "forbiddenHistoricalDistortions", label: "역사 왜곡 금지 항목", hint: "무엇을 어떻게 왜곡하면 안 되는지", sourceOnly: "history" },
  { key: "realPersonPrivacyRules", label: "실존 인물 사적 영역 창작 금지", hint: "어떤 실존 인물의 어떤 영역", sourceOnly: "history" },
  { key: "dignityRules", label: "피해자·희생자 존엄 보존 규칙", hint: "구체적 보존 원칙", sourceOnly: "history" },
  { key: "generalRules", label: "공통 안전 규칙", hint: "소스 무관 공통 적용" },
];

function emptyRules(): SafetyRulesData {
  return {
    sourceType: "drama",
    forbiddenCharacterNames: [],
    forbiddenQuotes: [],
    forbiddenScenePatterns: [],
    confirmedHistoricalFacts: [],
    forbiddenHistoricalDistortions: [],
    realPersonPrivacyRules: [],
    dignityRules: [],
    generalRules: [],
  };
}

function SafetyTab({
  rules, loading, error, generating, saving, saved, onGenerate, onSave, onChange,
}: {
  rules: SafetyRulesData | null;
  loading: boolean;
  error: string;
  generating: boolean;
  saving: boolean;
  saved: boolean;
  onGenerate: () => void;
  onSave: () => void;
  onChange: (updated: SafetyRulesData) => void;
}) {
  const isHistory = rules?.sourceType === "history";
  const isIPBased = rules?.sourceType === "drama" || rules?.sourceType === "book";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  function updateList(key: keyof SafetyRulesData, raw: string) {
    if (!rules) return;
    const items = raw.split("\n").map((s) => s.trim()).filter(Boolean);
    onChange({ ...rules, [key]: items });
  }

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white/50 text-sm">AI 생성 프롬프트에 자동 주입되는 안전선 룰</p>
          {rules?.sourceType && (
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded border ${
              isHistory
                ? "text-blue-400 bg-blue-400/10 border-blue-400/20"
                : "text-amber-400 bg-amber-400/10 border-amber-400/20"
            }`}>
              {isHistory ? "역사 기반 — 역사 왜곡 방지 우선" : "IP 기반 — 저작권 보호 우선"}
            </span>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {rules && (
            <button
              onClick={onSave}
              disabled={saving}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors disabled:opacity-40 ${
                saved
                  ? "text-green-400 border-green-500/30 bg-green-500/10"
                  : "text-white border-white/20 hover:border-white/40 bg-white/5"
              }`}
            >
              {saving ? "저장 중..." : saved ? "저장됨 ✓" : "Firestore 저장"}
            </button>
          )}
          <button
            onClick={onGenerate}
            disabled={generating}
            className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-40"
          >
            {generating ? "생성 중..." : rules ? "재생성" : "AI 안전선 생성"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">{error}</div>
      )}

      {generating && (
        <div className="flex items-center gap-3 p-4 bg-white/3 rounded-xl border border-white/10">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin shrink-0" />
          <p className="text-white/50 text-sm">시나리오 소스 타입을 분석해 안전선을 생성하고 있습니다...</p>
        </div>
      )}

      {!rules && !generating && (
        <div className="text-center py-12 text-white/30 text-sm border border-dashed border-white/10 rounded-xl">
          <p className="mb-1">안전선이 없습니다.</p>
          <p className="text-xs">AI 안전선 생성 버튼을 눌러 시작하세요.</p>
        </div>
      )}

      {rules && SAFETY_SECTIONS.map((section) => {
        // 소스 타입에 맞지 않는 섹션은 숨김
        if (section.sourceOnly === "drama_book" && !isIPBased) return null;
        if (section.sourceOnly === "history" && !isHistory) return null;

        const items = (rules[section.key] as string[]) ?? [];
        const rawText = items.join("\n");

        return (
          <div key={section.key} className="border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/70 text-sm font-medium">{section.label}</p>
              <span className="text-xs text-white/20">{items.length}개</span>
            </div>
            <p className="text-white/30 text-xs mb-2">{section.hint}</p>
            <textarea
              defaultValue={rawText}
              onBlur={(e) => updateList(section.key, e.target.value)}
              rows={Math.max(3, items.length + 1)}
              placeholder="한 줄에 하나씩 입력..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/70 text-xs font-mono focus:outline-none focus:border-white/30 resize-y"
            />
          </div>
        );
      })}
    </div>
  );
}

// ── Cards Tab ─────────────────────────────────────────────────────────────────

const CATEGORY_STYLE: Record<string, string> = {
  flow:      "text-blue-400 bg-blue-400/10 border-blue-400/20",
  encounter: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  growth:    "text-green-400 bg-green-400/10 border-green-400/20",
  threshold: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  custom:    "text-rose-400 bg-rose-400/10 border-rose-400/20",
};
const CATEGORY_KO: Record<string, string> = {
  flow: "흐름", encounter: "접점", growth: "성장", threshold: "임계", custom: "시나리오",
};
const TIMING_KO: Record<string, string> = {
  chapter_start: "챕터 시작", chapter_end: "챕터 종료", stat_warning: "스탯 경고", anytime: "언제든",
};
const STANDARD_PREVIEW = [
  { id: "time_return",    category: "flow",      nameKo: "시간의 귀환",   effectKo: "한 챕터를 되돌려 다시 진행",        rarity: "rare",      usageTiming: "chapter_start" },
  { id: "fate_book",      category: "flow",      nameKo: "운명의 책",     effectKo: "다음 이벤트 결과 미리보기",         rarity: "uncommon",  usageTiming: "chapter_start" },
  { id: "second_chance",  category: "flow",      nameKo: "두 번째 기회",  effectKo: "직전 이벤트 재시도",               rarity: "uncommon",  usageTiming: "chapter_end" },
  { id: "casting_reroll", category: "flow",      nameKo: "운명의 재주사위", effectKo: "T-0 캐스팅 재굴림",             rarity: "rare",      usageTiming: "anytime" },
  { id: "guardian_angel", category: "flow",      nameKo: "수호천사",      effectKo: "즉사 1회 면제",                   rarity: "epic",      usageTiming: "stat_warning" },
  { id: "brushed_path",   category: "encounter", nameKo: "스친 길",       effectKo: "다른 캐스팅 인물과 조우",           rarity: "common",    usageTiming: "chapter_start" },
  { id: "letter_from_afar", category: "encounter", nameKo: "먼 데서 온 편지", effectKo: "다른 인물의 소식이 내러티브에 등장", rarity: "common", usageTiming: "chapter_start" },
  { id: "witness",        category: "encounter", nameKo: "목격자",        effectKo: "명장면을 제3자 시점으로 경험",       rarity: "uncommon",  usageTiming: "chapter_start" },
  { id: "shared_table",   category: "encounter", nameKo: "한 상에 앉다",  effectKo: "NPC 인연 +2, 특별 대화 추가",       rarity: "rare",      usageTiming: "chapter_start" },
  { id: "masters_tutelage", category: "growth",  nameKo: "스승의 가르침", effectKo: "선택 스탯 +3 (17 미만일 때만)",    rarity: "rare",      usageTiming: "chapter_end" },
  { id: "wandering_year", category: "growth",    nameKo: "방랑의 해",     effectKo: "모든 스탯 +1 (17 미만 스탯만)",    rarity: "uncommon",  usageTiming: "chapter_start" },
  { id: "quiet_resolve",  category: "growth",    nameKo: "조용한 결의",   effectKo: "도덕성 +2, 감성 +1",              rarity: "common",    usageTiming: "chapter_end" },
  { id: "severed_tie",    category: "growth",    nameKo: "끊어진 인연",   effectKo: "NPC 인연 -3, 감성 +2",            rarity: "uncommon",  usageTiming: "chapter_end" },
  { id: "restraint",      category: "threshold", nameKo: "절제",          effectKo: "스탯 19 → 17 낮추고 다른 스탯 +2", rarity: "rare",      usageTiming: "stat_warning" },
  { id: "awakening",      category: "threshold", nameKo: "각성",          effectKo: "스탯 1 → 5 회복하고 다른 스탯 -2", rarity: "rare",      usageTiming: "stat_warning" },
];

function CardsTab({
  customCards, loading, error, generating, onGenerate, onDelete,
}: {
  customCards: CustomCardData[];
  loading: boolean;
  error: string;
  generating: boolean;
  onGenerate: () => void;
  onDelete: (index: number) => void;
}) {
  const [showStandard, setShowStandard] = useState(true);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">{error}</div>
      )}

      {/* 커스텀 카드 섹션 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white/80 text-sm font-medium">시나리오 커스텀 카드</p>
            <p className="text-white/30 text-xs mt-0.5">이 시나리오에만 등장하는 고유 카드 (1~2장 권장)</p>
          </div>
          <button
            onClick={onGenerate}
            disabled={generating}
            className="px-4 py-2 text-sm bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-lg transition-colors disabled:opacity-40"
          >
            {generating ? "생성 중..." : "AI 커스텀 카드 생성"}
          </button>
        </div>

        {generating && (
          <div className="flex items-center gap-3 p-4 bg-white/3 rounded-xl border border-white/10 mb-3">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin shrink-0" />
            <p className="text-white/50 text-sm">시나리오 정서에 맞는 커스텀 카드를 생성하고 있습니다...</p>
          </div>
        )}

        {customCards.length === 0 && !generating ? (
          <div className="text-center py-8 text-white/30 text-sm border border-white/5 rounded-xl">
            커스텀 카드가 없습니다. AI 생성 버튼을 눌러보세요.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {customCards.map((card, i) => (
              <div key={i} className="border border-rose-500/20 bg-rose-500/5 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-white font-medium text-sm">{card.nameKo}</span>
                      <span className="text-xs text-white/40">/ {card.nameEn}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${CATEGORY_STYLE["custom"]}`}>시나리오</span>
                      <span className="text-xs text-white/30">{TIMING_KO[card.usageTiming] ?? card.usageTiming}</span>
                    </div>
                    <p className="text-white/50 text-xs mb-1">{card.descriptionKo}</p>
                    <p className="text-white/70 text-xs font-medium">⚡ {card.effectKo}</p>
                    {card.usageCondition && (
                      <p className="text-white/30 text-xs mt-1">조건: {card.usageCondition}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onDelete(i)}
                    className="text-xs text-red-400/50 hover:text-red-400 transition-colors shrink-0"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 표준 카드풀 미리보기 */}
      <div>
        <button
          onClick={() => setShowStandard(!showStandard)}
          className="flex items-center gap-2 text-white/50 hover:text-white/80 text-sm transition-colors mb-3"
        >
          <span>{showStandard ? "▲" : "▼"}</span>
          표준 카드풀 ({STANDARD_PREVIEW.length}장) — 모든 시나리오 공통
        </button>

        {showStandard && (
          <div className="grid grid-cols-1 gap-2">
            {STANDARD_PREVIEW.map((card) => (
              <div key={card.id} className="border border-white/8 rounded-lg p-3 flex items-center gap-3">
                <span className={`text-xs px-1.5 py-0.5 rounded border shrink-0 ${CATEGORY_STYLE[card.category]}`}>
                  {CATEGORY_KO[card.category]}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-white/70 text-xs font-medium">{card.nameKo}</span>
                  <span className="text-white/30 text-xs ml-2">{card.effectKo}</span>
                </div>
                <span className="text-white/20 text-xs shrink-0">{TIMING_KO[card.usageTiming]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 카드 슬롯 안내 */}
      <div className="border border-white/10 rounded-xl p-4 bg-white/2">
        <p className="text-xs text-white/40 uppercase tracking-wider mb-2">플레이어 카드 슬롯</p>
        <p className="text-white/60 text-sm">한 인생당 <strong className="text-white">3장</strong> 선택 · T-0 캐스팅 직후 선택 화면 등장</p>
        <p className="text-white/30 text-xs mt-1">표준 카드풀 + 이 시나리오 커스텀 카드 합산에서 선택</p>
      </div>
    </div>
  );
}

// ── Milestones Tab ────────────────────────────────────────────────────────────

function MilestonesTab({
  milestones, loading, error, generating, saving,
  onGenerate, onSave, onDelete, onChange,
}: {
  milestones: MilestoneData[];
  loading: boolean;
  error: string;
  generating: boolean;
  saving: boolean;
  onGenerate: () => void;
  onSave: () => void;
  onDelete: (index: number) => void;
  onChange: (updated: MilestoneData[]) => void;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-white/60 text-sm">
            {milestones.length > 0 ? `${milestones.length}개 이정표` : "이정표 없음"}
          </p>
          <p className="text-white/30 text-xs mt-0.5">AI가 절대 벗어나면 안 되는 서사의 기둥</p>
        </div>
        <div className="flex gap-2">
          {milestones.length > 0 && (
            <button
              onClick={onSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg transition-colors disabled:opacity-40"
            >
              {saving ? "저장 중..." : "Firestore 저장"}
            </button>
          )}
          <button
            onClick={onGenerate}
            disabled={generating}
            className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-40"
          >
            {generating ? "생성 중..." : milestones.length > 0 ? "재생성" : "AI 이정표 생성"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">{error}</div>
      )}

      {generating && (
        <div className="flex items-center gap-3 p-4 bg-white/3 rounded-xl border border-white/10 mb-4">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin shrink-0" />
          <p className="text-white/50 text-sm">AI가 시나리오를 분석하고 이정표를 생성하고 있습니다...</p>
        </div>
      )}

      {milestones.length === 0 && !generating && (
        <div className="text-center py-12 text-white/30 text-sm">
          <p className="mb-2">이정표가 없습니다.</p>
          <p className="text-xs">AI 이정표 생성 버튼을 눌러 시작하세요.</p>
        </div>
      )}

      <div className="space-y-3">
        {milestones.map((m, i) => (
          <div key={i} className="border border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
              className="w-full text-left px-5 py-4 flex items-start gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-semibold text-sm">{m.title}</span>
                  <span className="text-xs text-white/30">{m.age}세{m.year ? ` · ${m.year}년` : ""}</span>
                  {m.isT0 && (
                    <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded font-medium">
                      T-0
                    </span>
                  )}
                  {m.isHistoricalFact && (
                    <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
                      역사적 사실
                    </span>
                  )}
                </div>
                <p className="text-white/40 text-xs mt-1 line-clamp-1">{m.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(i); }}
                  className="text-xs text-red-400/50 hover:text-red-400 px-2 py-1 transition-colors"
                >
                  삭제
                </button>
                <span className="text-white/30 text-xs">{expandedIndex === i ? "▲" : "▼"}</span>
              </div>
            </button>

            {expandedIndex === i && (
              <div className="border-t border-white/10 bg-white/2 px-5 py-4 space-y-4">
                {/* Description */}
                <div>
                  <p className="text-xs text-white/30 mb-1">상황 설명</p>
                  <textarea
                    value={m.description}
                    onChange={(e) => {
                      const updated = [...milestones];
                      updated[i] = { ...m, description: e.target.value };
                      onChange(updated);
                    }}
                    rows={3}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/70 text-xs focus:outline-none focus:border-white/30 resize-none"
                  />
                </div>

                {/* AI Directive */}
                <div>
                  <p className="text-xs text-white/30 mb-1">AI 지시문</p>
                  <textarea
                    value={m.aiDirective}
                    onChange={(e) => {
                      const updated = [...milestones];
                      updated[i] = { ...m, aiDirective: e.target.value };
                      onChange(updated);
                    }}
                    rows={3}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-amber-300/70 text-xs font-mono focus:outline-none focus:border-white/30 resize-none"
                  />
                </div>

                {/* Casting outcomes */}
                {m.castingOutcomes.length > 0 && (
                  <div>
                    <p className="text-xs text-white/30 mb-2">캐스팅별 결정 모먼트 ({m.castingOutcomes.length}종)</p>
                    <div className="space-y-2">
                      {m.castingOutcomes.map((co, ci) => (
                        <div key={ci} className="bg-white/3 rounded-lg p-3">
                          <p className="text-xs text-white/50 font-mono mb-1">{co.castingRoleId}</p>
                          <p className="text-xs text-white/60">{co.decisionPrompt}</p>
                          {(co.dramaticPathFlag || co.divergentPathFlag) && (
                            <div className="flex gap-3 mt-1.5 text-xs text-white/30">
                              {co.dramaticPathFlag && <span>정극: {co.dramaticPathFlag}</span>}
                              {co.divergentPathFlag && <span>분기: {co.divergentPathFlag}</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function defaultChapterState(): ChapterState {
  return {
    fetchDone: false, generating: false, saving: false,
    events: null, savedToDb: false, error: "",
    expanded: false, jsonMode: false, editJson: "",
  };
}

// Type helpers
interface ScenarioShape {
  title?: { ko?: string };
  subtitle?: { ko?: string };
  description?: { ko?: string };
  era?: string;
  status?: Status;
  heaviness?: number;
  cradleConfig?: { type?: string; cradleStartAge?: number; cradleEndAge?: number; eraStartYear?: number | null };
  mainStoryEndAge?: number;
  castingRoles?: { id?: string; name?: { ko?: string }; shortDescription?: { ko?: string }; endingIds?: string[] }[];
  endings?: { id?: string; castingRoleId?: string; title?: { ko?: string }; rarityPercentage?: number }[];
  iconicMoments?: unknown[];
  genre?: string[];
  isPremium?: boolean;
  coverImageUrl?: string;
}
