"use client";

import { m, useReducedMotion } from "motion/react";
import { r2 } from "@/config/r2";
import { Magnetic } from "@/components/Magnetic";
import { Reveal } from "@/components/Reveal";

/** Clôture de la LP R2 — on renvoie vers la présentation, on rassure. */
export function FinalR2() {
  const reduce = useReducedMotion();
  const f = r2.finalCta;

  return (
    <section className="relative overflow-hidden px-5 py-24 sm:px-8 sm:py-32">
      <div
        aria-hidden
        className="glow-honey pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[90vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2"
      />

      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-[clamp(2rem,5vw,3.2rem)] font-normal leading-tight text-ink">
          {f.title}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-pretty leading-relaxed text-muted">
          {f.subtitle}
        </p>

        <div className="mt-9 flex justify-center">
          <Magnetic className="w-full sm:w-auto">
            <m.a
              href="#video"
              whileHover={reduce ? undefined : { scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="btn-shine inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-surface px-7 text-base font-semibold text-ink transition-colors hover:border-primary sm:w-auto"
            >
              {f.button}
              <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M8 13V3M4 7l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </m.a>
          </Magnetic>
        </div>

        <p className="mt-7 text-sm text-muted">{f.reassurance}</p>
      </Reveal>
    </section>
  );
}
