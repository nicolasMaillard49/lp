"use client";

import { m, useReducedMotion } from "motion/react";
import { r2 } from "@/config/r2";
import { Magnetic } from "@/components/Magnetic";
import { Reveal } from "@/components/Reveal";
import { StepBadgeR2 } from "./StepBadgeR2";

/** Étape 2 — le questionnaire de préparation du rendez-vous de décision. */
export function QuestionnaireCta() {
  const reduce = useReducedMotion();
  const q = r2.questionnaire;

  return (
    <section id="questionnaire" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <Reveal className="text-center">
          <StepBadgeR2 n={2} />
          <h2 className="mt-5 text-[clamp(1.8rem,4.5vw,2.8rem)] font-normal leading-tight text-ink">
            {q.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted">
            {q.subtitle}
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-10">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-7 sm:p-9">
            {/* halo électrique discret dans le coin */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[oklch(0.58_0.22_252/0.1)] blur-2xl"
            />

            <ul className="space-y-3.5">
              {q.points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-ink sm:text-base">
                  <svg className="mt-0.5 size-5 shrink-0 text-electric" viewBox="0 0 20 20" fill="none" aria-hidden>
                    <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.12" />
                    <path d="M6.2 10.4 8.7 13l5.1-5.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {p}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col items-center gap-4 border-t border-border pt-7 sm:flex-row sm:justify-between">
              <span className="text-sm font-semibold text-muted">{q.meta}</span>
              <Magnetic className="w-full sm:w-auto">
                <m.a
                  href={q.href}
                  whileHover={reduce ? undefined : { scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-shine group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-electric px-7 text-base font-semibold text-white shadow-[0_8px_30px_-8px_oklch(0.58_0.22_252/0.55)] sm:w-auto"
                >
                  {q.button}
                  <svg
                    className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden
                  >
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </m.a>
              </Magnetic>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
