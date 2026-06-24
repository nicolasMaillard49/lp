"use client";

import { motion, useReducedMotion } from "motion/react";
import { site } from "@/config/site";

export function Notice() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      role="note"
      initial={{ opacity: 0, y: reduce ? 0 : 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto mb-10 flex max-w-2xl items-start gap-4 rounded-2xl border border-[oklch(0.83_0.12_75/0.5)] bg-[oklch(0.97_0.04_82/0.7)] p-5 sm:items-center"
    >
      <motion.span
        aria-hidden
        animate={reduce ? undefined : { scale: [1, 1.12, 1], rotate: [0, -6, 6, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-white"
      >
        <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3 2 20h20L12 3Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.15"
          />
          <path d="M12 10v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </motion.span>

      <div>
        <p className="font-display text-base font-semibold text-ink">
          {site.notice.title}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-ink/70">
          {site.notice.text}
        </p>
      </div>
    </motion.div>
  );
}
