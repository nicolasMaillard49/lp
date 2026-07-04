"use client";

import { motion } from "motion/react";

export function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted">
        <span>
          Étape {current} / {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <motion.div
          className="h-full rounded-full bg-[linear-gradient(90deg,oklch(0.83_0.155_78),oklch(0.67_0.15_64),oklch(0.58_0.22_252))]"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
