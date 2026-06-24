"use client";

import { motion, useReducedMotion } from "motion/react";
import { site } from "@/config/site";
import { StepBadge } from "./StepBadge";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Agenda() {
  const reduce = useReducedMotion();
  const a = site.agenda;

  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-center"
        >
          <StepBadge n={2} />
          <h2 className="mt-5 text-[clamp(1.8rem,4.5vw,2.8rem)] font-normal leading-tight text-ink">
            {a.title}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted">{a.subtitle}</p>
        </motion.div>

        <div className="mt-9 rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <ol className="space-y-4">
            {a.steps.map((s, i) => (
              <motion.li
                key={s}
                initial={{ opacity: 0, x: reduce ? 0 : -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
                className="flex items-start gap-4"
              >
                <span
                  aria-hidden
                  className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-bg font-display text-sm font-semibold text-primary"
                >
                  {i + 1}
                </span>
                <span className="pt-0.5 font-medium text-ink">{s}</span>
              </motion.li>
            ))}
          </ol>

          <p className="mt-6 flex items-center gap-2 border-t border-border pt-5 text-sm text-muted">
            <svg className="size-4 shrink-0 text-primary" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            {a.note}
          </p>
        </div>
      </div>
    </section>
  );
}
