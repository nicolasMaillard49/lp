"use client";

import { m, useReducedMotion } from "motion/react";
import { r2 } from "@/config/r2";
import { Reveal } from "@/components/Reveal";

const EASE = [0.16, 1, 0.3, 1] as const;

/** La promesse — l'engagement posé noir sur blanc, juste avant la décision. */
export function PromesseR2() {
  const reduce = useReducedMotion();
  const p = r2.promesse;

  return (
    <section className="relative overflow-hidden px-5 py-20 sm:px-8 sm:py-28">
      <div
        aria-hidden
        className="glow-honey pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2"
      />

      <div className="mx-auto max-w-2xl">
        <Reveal className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            {p.eyebrow}
          </p>
          <h2 className="mt-4 text-[clamp(1.8rem,4.5vw,2.8rem)] font-normal leading-tight text-ink">
            {p.title}
          </h2>
        </Reveal>

        <m.blockquote
          initial={{ opacity: 0, y: reduce ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mt-9 rounded-2xl border border-primary/40 bg-surface p-6 text-center sm:p-8"
        >
          <p className="text-pretty text-base leading-relaxed text-ink sm:text-lg">
            {p.text}
          </p>
          <footer className="mt-6 font-display text-base text-muted">
            — {p.signature}
          </footer>
        </m.blockquote>
      </div>
    </section>
  );
}
