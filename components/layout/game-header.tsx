"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronLeft } from "lucide-react";
import { StatsGrid } from "@/components/game/stat-bar";
import type { Stats } from "@/lib/types";
import { cn } from "@/lib/utils";

interface GameHeaderProps {
  chapter: number;
  age: number;
  year: number;
  eventProgress: { current: number; total: number };
  stats: Stats;
  backHref?: string;
  phase: "cradle" | "casting" | "main";
}

export function GameHeader({
  chapter,
  age,
  year,
  eventProgress,
  stats,
  backHref,
  phase,
}: GameHeaderProps) {
  const [statsOpen, setStatsOpen] = useState(false);

  const phaseLabel = {
    cradle: "전사",
    casting: "T-0",
    main: "Main Story",
  }[phase];

  return (
    <>
      <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur-sm border-b border-text/5">
        <div className="max-w-game mx-auto px-screen-x h-14 flex items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className="text-text-muted hover:text-text transition-colors"
            >
              <ChevronLeft size={20} />
            </Link>
          ) : (
            <div className="w-5" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <span className="font-medium text-text">{age}세</span>
              <span>·</span>
              <span>{year}년</span>
              <span>·</span>
              <span className="text-text-caption text-xs">{phaseLabel}</span>
            </div>
            <div className="mt-0.5 h-1 bg-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-maple/40 rounded-full transition-all duration-300"
                style={{
                  width: `${(eventProgress.current / eventProgress.total) * 100}%`,
                }}
              />
            </div>
          </div>

          <button
            onClick={() => setStatsOpen((v) => !v)}
            className="text-text-muted hover:text-text transition-colors p-1"
            aria-label="스탯 보기"
          >
            {statsOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {statsOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed top-14 left-0 right-0 z-30 bg-bg-card/95 backdrop-blur-sm border-b border-text/5 shadow-paper-md"
          >
            <div className="max-w-game mx-auto px-screen-x py-4">
              <StatsGrid stats={stats} size="sm" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
