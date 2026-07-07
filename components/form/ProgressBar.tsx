"use client";

import { motion } from "motion/react";

export function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full">
      <div className="mb-2 flex items-baseline justify-between text-xs font-medium text-muted">
        <span className="tabular-nums">
          Étape <span className="text-ink">{current}</span> / {total}
        </span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div className="h-px w-full bg-border">
        <motion.div
          className="h-full bg-primary"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
