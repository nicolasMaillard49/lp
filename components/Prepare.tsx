"use client";

import { motion, useReducedMotion } from "motion/react";
import { site } from "@/config/site";
import { StepBadge } from "./StepBadge";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Prepare() {
  const reduce = useReducedMotion();
  const p = site.presence;

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
          <StepBadge n={4} />
          <h2 className="mt-5 text-[clamp(1.8rem,4.5vw,2.8rem)] font-normal leading-tight text-ink">
            {p.title}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mt-9 rounded-2xl bg-ink p-6 text-white sm:p-8"
        >
          <p className="flex items-start gap-3 text-sm leading-relaxed text-white/85">
            <svg className="mt-0.5 size-5 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {p.conditions}
          </p>
          <p className="mt-4 border-t border-white/15 pt-4 font-display text-base leading-relaxed text-white">
            {p.mindset}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
