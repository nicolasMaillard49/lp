"use client";

import { m, useReducedMotion } from "motion/react";
import { r2 } from "@/config/r2";
import { Reveal } from "@/components/Reveal";
import { StepBadgeR2 } from "./StepBadgeR2";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Étape 3 — le cadre du rendez-vous de décision : on vient pour décider. */
export function CadreR2() {
  const reduce = useReducedMotion();
  const c = r2.cadre;

  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-2xl">
        <Reveal className="text-center">
          <StepBadgeR2 n={3} />
          <h2 className="mt-5 text-[clamp(1.8rem,4.5vw,2.8rem)] font-normal leading-tight text-ink">
            {c.title}
          </h2>
        </Reveal>

        <m.div
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
            {c.conditions}
          </p>
          <p className="mt-4 border-t border-white/15 pt-4 font-display text-base leading-relaxed text-white">
            {c.mindset}
          </p>
        </m.div>
      </div>
    </section>
  );
}
