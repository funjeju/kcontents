"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Settings, ChevronRight, Star, BookOpen, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MOCK_USER = {
  displayName: "김나연",
  email: "user@example.com",
  joinedDate: "2024년 3월",
  totalLives: 3,
  completedLives: 2,
  cardCount: 5,
};

const MOCK_LIVES = [
  {
    id: "life_001",
    scenarioTitle: "미스터 션샤인 정서",
    characterName: "김아연",
    status: "completed",
    endingTitle: "독립의 불꽃",
    endingRarity: 4.2,
    roleName: "개화의 신사",
    playedAt: "2024-03-15",
  },
  {
    id: "life_002",
    scenarioTitle: "미스터 션샤인 정서",
    characterName: "이수민",
    status: "completed",
    endingTitle: "약재상의 일기",
    endingRarity: 18.5,
    roleName: "증인",
    playedAt: "2024-03-20",
  },
  {
    id: "life_003",
    scenarioTitle: "미스터 션샤인 정서",
    characterName: "박소희",
    status: "in_progress",
    currentChapter: 4,
    roleName: null,
    playedAt: "2024-03-25",
  },
];

export default function MePage() {
  const [activeTab, setActiveTab] = useState<"lives" | "cards">("lives");

  return (
    <div className="min-h-dvh bg-bg flex flex-col pb-20">
      <div className="max-w-game mx-auto w-full">
        {/* Profile header */}
        <div className="px-screen-x pt-8 pb-6 border-b border-text/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent-maple/10 border border-accent-maple/20 flex items-center justify-center">
                <span className="font-serif font-bold text-accent-maple text-lg">
                  {MOCK_USER.displayName[0]}
                </span>
              </div>
              <div>
                <h1 className="font-serif font-bold text-text">{MOCK_USER.displayName}</h1>
                <p className="text-xs text-text-caption">{MOCK_USER.joinedDate}부터</p>
              </div>
            </div>
            <Link href="/settings">
              <button className="w-9 h-9 rounded-full border border-text/10 flex items-center justify-center text-text-muted hover:border-text/20 transition-colors">
                <Settings size={16} />
              </button>
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex gap-4">
            <div className="flex-1 hanji-card p-3 text-center">
              <p className="font-serif text-xl font-bold text-text">{MOCK_USER.totalLives}</p>
              <p className="text-xs text-text-caption mt-0.5">인생</p>
            </div>
            <div className="flex-1 hanji-card p-3 text-center">
              <p className="font-serif text-xl font-bold text-text">{MOCK_USER.completedLives}</p>
              <p className="text-xs text-text-caption mt-0.5">완료</p>
            </div>
            <div className="flex-1 hanji-card p-3 text-center">
              <p className="font-serif text-xl font-bold text-text">{MOCK_USER.cardCount}</p>
              <p className="text-xs text-text-caption mt-0.5">카드</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-text/5">
          {[
            { key: "lives", label: "내 인생들", icon: BookOpen },
            { key: "cards", label: "카드 컬렉션", icon: Trophy },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
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

        {/* Lives list */}
        {activeTab === "lives" && (
          <div className="px-screen-x py-4 space-y-3">
            {MOCK_LIVES.map((life, i) => (
              <motion.div
                key={life.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={life.status === "completed" ? `/me/lives/${life.id}` : `/play/${life.id}/chapter/4/intro`}>
                  <div className="hanji-card p-4 flex items-center gap-3 hover:border-text/20 border border-text/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-accent-maple/10 border border-accent-maple/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-serif font-bold text-accent-maple">
                        {life.characterName[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-text text-sm">{life.characterName}</p>
                        {life.status === "completed" ? (
                          <Badge variant="jade" className="text-[10px] px-1.5 py-0">완료</Badge>
                        ) : (
                          <Badge variant="muted" className="text-[10px] px-1.5 py-0">
                            챕터 {life.currentChapter}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-text-caption">{life.scenarioTitle}</p>
                      {life.status === "completed" && life.endingTitle && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star size={10} className="text-accent-gold fill-accent-gold" />
                          <span className="text-xs text-text-muted">{life.endingTitle}</span>
                          <span className="text-xs text-text-caption">({life.endingRarity}%)</span>
                        </div>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-text-caption shrink-0" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Cards tab */}
        {activeTab === "cards" && (
          <div className="px-screen-x py-6 text-center">
            <div className="hanji-card p-8">
              <Trophy size={32} className="text-text-caption mx-auto mb-3" />
              <p className="text-text-muted text-sm">카드 컬렉션은 곧 오픈됩니다</p>
              <p className="text-text-caption text-xs mt-1">인생을 완료하면 엔딩 카드를 받을 수 있어요</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
