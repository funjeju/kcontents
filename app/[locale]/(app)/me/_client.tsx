"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Settings, ChevronRight, BookOpen, Trophy, Languages } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import type { SavedWord } from "@/app/api/me/korean-words/route";

interface LifeSummary {
  id: string;
  scenarioId: string;
  scenarioTitle?: string;
  characterName: string;
  isFinished: boolean;
  endingId: string | null;
  castingRole: string | null;
  completedChapters: number[];
  lastPlayedAt: string | null;
  currentChapterId: string | null;
  currentEventIndex: number | null;
}

export default function MePage() {
  const locale = useLocale();
  const isEn = locale === "en";
  const [user, setUser] = useState<User | null>(null);
  const [lives, setLives] = useState<LifeSummary[]>([]);
  const [koreanWords, setKoreanWords] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"lives" | "cards" | "words">("lives");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    fetch("/api/lives")
      .then((r) => r.json())
      .then((data) => { if (data.lives) setLives(data.lives as LifeSummary[]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab !== "words") return;
    fetch("/api/me/korean-words")
      .then((r) => r.json())
      .then((data) => setKoreanWords(data.words ?? []))
      .catch(() => {});
  }, [activeTab]);

  const completedLives = lives.filter((l) => l.isFinished).length;
  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? "게스트";

  const tabs = [
    { key: "lives" as const, label: isEn ? "My Lives" : "내 인생들", icon: BookOpen },
    { key: "cards" as const, label: isEn ? "Cards" : "카드 컬렉션", icon: Trophy },
    ...(isEn ? [{ key: "words" as const, label: "Korean Words", icon: Languages }] : []),
  ];

  const wordsByScenario = koreanWords.reduce<Record<string, SavedWord[]>>((acc, w) => {
    const key = w.scenarioTitle || "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(w);
    return acc;
  }, {});

  return (
    <div className="min-h-dvh bg-bg flex flex-col pb-20">
      <div className="max-w-game mx-auto w-full">
        {/* Profile header */}
        <div className="px-screen-x pt-8 pb-6 border-b border-text/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent-maple/10 border border-accent-maple/20 flex items-center justify-center">
                <span className="font-serif font-bold text-accent-maple text-lg">
                  {displayName[0]?.toUpperCase() ?? "?"}
                </span>
              </div>
              <div>
                <h1 className="font-serif font-bold text-text">{displayName}</h1>
                <p className="text-xs text-text-caption">{user?.email ?? ""}</p>
              </div>
            </div>
            <Link href="/settings">
              <button className="w-9 h-9 rounded-full border border-text/10 flex items-center justify-center text-text-muted hover:border-text/20 transition-colors">
                <Settings size={16} />
              </button>
            </Link>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 hanji-card p-3 text-center">
              <p className="font-serif text-xl font-bold text-text">{lives.length}</p>
              <p className="text-xs text-text-caption mt-0.5">{isEn ? "Lives" : "인생"}</p>
            </div>
            <div className="flex-1 hanji-card p-3 text-center">
              <p className="font-serif text-xl font-bold text-text">{completedLives}</p>
              <p className="text-xs text-text-caption mt-0.5">{isEn ? "Completed" : "완료"}</p>
            </div>
            <div className="flex-1 hanji-card p-3 text-center">
              {isEn ? (
                <>
                  <p className="font-serif text-xl font-bold text-accent-jade">{koreanWords.length || 0}</p>
                  <p className="text-xs text-text-caption mt-0.5">KR Words</p>
                </>
              ) : (
                <>
                  <p className="font-serif text-xl font-bold text-text">{completedLives}</p>
                  <p className="text-xs text-text-caption mt-0.5">카드</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-text/5">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                activeTab === key
                  ? "text-text border-b-2 border-accent-maple"
                  : "text-text-caption"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Lives */}
        {activeTab === "lives" && (
          <div className="px-screen-x py-4 space-y-3">
            {loading ? (
              <div className="py-12 text-center text-text-caption text-sm">{isEn ? "Loading..." : "불러오는 중..."}</div>
            ) : lives.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-text-muted text-sm mb-2">{isEn ? "No lives started yet" : "아직 시작한 인생이 없어요"}</p>
                <Link href="/scenarios/recommended">
                  <span className="text-accent-maple text-sm underline underline-offset-2">
                    {isEn ? "Browse scenarios" : "시나리오 찾아보기"}
                  </span>
                </Link>
              </div>
            ) : (
              lives.map((life, i) => {
                const lastCompletedChapter = life.completedChapters?.length
                  ? Math.max(...life.completedChapters) : 0;
                const resumeChapter = life.currentChapterId
                  ? parseInt(life.currentChapterId) || lastCompletedChapter + 1
                  : lastCompletedChapter + 1;
                const resumeEvent = life.currentEventIndex;
                const href = life.isFinished
                  ? `/me/lives/${life.id}`
                  : resumeEvent && resumeChapter > lastCompletedChapter
                  ? `/play/${life.id}/chapter/${resumeChapter}/event/${resumeEvent}`
                  : `/play/${life.id}/chapter/${resumeChapter}/intro`;

                return (
                  <motion.div key={life.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Link href={href}>
                      <div className="hanji-card p-4 flex items-center gap-3 hover:border-text/20 border border-text/10 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-accent-maple/10 border border-accent-maple/20 flex items-center justify-center shrink-0">
                          <span className="text-sm font-serif font-bold text-accent-maple">{life.characterName[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-medium text-text text-sm">{life.characterName}</p>
                            {life.isFinished ? (
                              <Badge variant="jade" className="text-[10px] px-1.5 py-0">{isEn ? "Done" : "완료"}</Badge>
                            ) : (
                              <Badge variant="muted" className="text-[10px] px-1.5 py-0">
                                {resumeEvent ? `Ch.${resumeChapter} · #${resumeEvent}` : `Ch.${resumeChapter}`}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-text-caption">{life.scenarioTitle ?? life.scenarioId}</p>
                          {life.castingRole && !life.isFinished && (
                            <p className="text-xs text-accent-maple mt-0.5">{life.castingRole}</p>
                          )}
                        </div>
                        <ChevronRight size={16} className="text-text-caption shrink-0" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* Cards */}
        {activeTab === "cards" && (
          <div className="px-screen-x py-6 text-center">
            <div className="hanji-card p-8">
              <Trophy size={32} className="text-text-caption mx-auto mb-3" />
              <p className="text-text-muted text-sm">{isEn ? "Card collection coming soon" : "카드 컬렉션은 곧 오픈됩니다"}</p>
              <p className="text-text-caption text-xs mt-1">{isEn ? "Complete a life to earn an ending card" : "인생을 완료하면 엔딩 카드를 받을 수 있어요"}</p>
            </div>
          </div>
        )}

        {/* Korean Words — EN only */}
        {activeTab === "words" && (
          <div className="px-screen-x py-4">
            {koreanWords.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-4xl mb-4">🇰🇷</p>
                <p className="text-text-muted text-sm mb-1">No words collected yet</p>
                <p className="text-text-caption text-xs leading-relaxed max-w-[240px] mx-auto">
                  Open the "Learn Korean" card while playing to start collecting words from each scene
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-xs text-text-caption">
                  {koreanWords.length} words · {Object.keys(wordsByScenario).length} {Object.keys(wordsByScenario).length === 1 ? "story" : "stories"}
                </p>
                {Object.entries(wordsByScenario).map(([scenarioTitle, words]) => (
                  <div key={scenarioTitle}>
                    <p className="text-xs text-accent-jade font-medium mb-3 flex items-center gap-1.5">
                      <span>📖</span> {scenarioTitle}
                    </p>
                    <div className="space-y-2">
                      {words.map((w, i) => (
                        <motion.div
                          key={w.word + i}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="hanji-card p-4"
                        >
                          <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
                            <span className="font-serif text-xl font-bold text-text">{w.word}</span>
                            <span className="text-xs text-text-caption italic">{w.romanization}</span>
                            <span className="text-xs text-text-muted">— {w.meaning}</span>
                          </div>
                          <p className="text-xs text-text-caption leading-relaxed">{w.culturalNote}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
