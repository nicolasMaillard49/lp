"use client";

import { m, useReducedMotion } from "motion/react";
import { r2 } from "@/config/r2";
import { useTilt } from "@/components/useTilt";
import { Reveal } from "@/components/Reveal";

const EASE = [0.16, 1, 0.3, 1] as const;

type CaseItem = (typeof r2.cases.items)[number];

function CaseCard({ c, i, reduce }: { c: CaseItem; i: number; reduce: boolean | null }) {
  const tilt = useTilt(6);

  return (
    <m.figure
      {...tilt.handlers}
      style={tilt.style}
      initial={{ opacity: 0, y: reduce ? 0 : 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay: i * 0.12, ease: EASE }}
      className="flex flex-col rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-primary sm:p-7"
    >
      {/* la stat en grand — c'est elle qui vend */}
      <p className="font-display text-[2.6rem] font-medium leading-none text-primary">
        {c.stat}
      </p>
      <p className="mt-2 text-sm font-semibold text-ink">{c.statLabel}</p>

      <blockquote className="mt-5 border-t border-border pt-5">
        <p className="text-sm leading-relaxed text-muted">« {c.quote} »</p>
      </blockquote>

      <figcaption className="mt-auto pt-5 text-sm">
        <span className="font-semibold text-ink">{c.author}</span>
        <span className="text-muted"> — {c.metier}</span>
      </figcaption>
    </m.figure>
  );
}

/** Études de cas chiffrées — le prospect doit pouvoir s'identifier avant de décider. */
export function CaseProof() {
  const reduce = useReducedMotion();
  const cs = r2.cases;

  return (
    <section className="overflow-x-clip px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            {cs.eyebrow}
          </p>
          <h2 className="mt-4 text-[clamp(1.7rem,4vw,2.6rem)] font-normal leading-tight text-ink">
            {cs.title}
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {cs.items.map((c, i) => (
            <CaseCard key={c.author} c={c} i={i} reduce={reduce} />
          ))}
        </div>
      </div>
    </section>
  );
}
