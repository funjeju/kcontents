"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChoiceButtonProps {
  choiceId: string;
  text: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
  selected?: boolean;
  isFreeform?: boolean;
}

export function ChoiceButton({
  choiceId,
  text,
  onSelect,
  disabled,
  selected,
  isFreeform,
}: ChoiceButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => !disabled && onSelect(choiceId)}
      disabled={disabled}
      className={cn(
        "w-full text-left p-4 rounded-card border transition-all duration-fast",
        "text-base leading-relaxed text-text",
        selected
          ? "bg-accent-maple/5 border-accent-maple shadow-paper-md"
          : "bg-bg-card border-transparent hover:border-text/15 hover:bg-bg shadow-paper",
        disabled && "opacity-50 cursor-not-allowed",
        isFreeform && "border-dashed border-text/20"
      )}
    >
      <div className="flex items-start gap-3">
        {isFreeform ? (
          <span className="text-accent-maple text-lg leading-none mt-0.5">✏</span>
        ) : (
          <span
            className={cn(
              "shrink-0 text-xs font-bold mt-1 w-5 h-5 rounded-full flex items-center justify-center",
              selected ? "bg-accent-maple text-white" : "bg-bg text-text-caption border border-text/10"
            )}
          >
            {choiceId}
          </span>
        )}
        <span className={isFreeform ? "text-text-caption italic" : ""}>{text}</span>
      </div>
    </motion.button>
  );
}
