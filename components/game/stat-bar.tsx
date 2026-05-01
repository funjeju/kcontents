"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Stats, StatKey } from "@/lib/types";
import { STAT_LABELS } from "@/lib/types";
import { getStatColor } from "@/lib/utils";

interface StatBarProps {
  statKey: StatKey;
  value: number;
  delta?: number;
  size?: "sm" | "md";
}

export function StatBar({ statKey, value, delta, size = "md" }: StatBarProps) {
  const label = STAT_LABELS[statKey];
  const color = getStatColor(statKey);
  const pct = (value / 20) * 100;

  return (
    <div className={cn("flex items-center gap-3", size === "sm" ? "gap-2" : "gap-3")}>
      <span
        className={cn(
          "shrink-0 text-text-caption",
          size === "sm" ? "text-xs w-10" : "text-sm w-12"
        )}
      >
        {label.ko}
      </span>

      <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: `${pct}%` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <span
          className={cn(
            "font-mono tabular-nums font-medium text-text",
            size === "sm" ? "text-xs" : "text-sm"
          )}
        >
          {value}
        </span>
        {delta !== undefined && delta !== 0 && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "text-xs font-medium",
              delta > 0 ? "text-accent-jade" : "text-accent-maple"
            )}
          >
            {delta > 0 ? `+${delta}` : delta}
          </motion.span>
        )}
      </div>
    </div>
  );
}

interface StatsGridProps {
  stats: Stats;
  deltas?: Partial<Stats>;
  size?: "sm" | "md";
}

export function StatsGrid({ stats, deltas, size = "md" }: StatsGridProps) {
  const keys = Object.keys(stats) as StatKey[];
  return (
    <div className="space-y-2">
      {keys.map((key) => (
        <StatBar
          key={key}
          statKey={key}
          value={stats[key]}
          delta={deltas?.[key]}
          size={size}
        />
      ))}
    </div>
  );
}

// Compact inline stat display for ending cards
interface StatChipProps {
  statKey: StatKey;
  value: number;
}

export function StatChip({ statKey, value }: StatChipProps) {
  const label = STAT_LABELS[statKey];
  const color = getStatColor(statKey);
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-text-caption uppercase tracking-wide">{label.en.slice(0, 3)}</span>
      <span className="text-sm font-bold font-mono" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
