"use client";

import { motion, useReducedMotion } from "motion/react";
import { site } from "@/config/site";
import { useTilt } from "./useTilt";
import { StepBadge } from "./StepBadge";

const EASE = [0.16, 1, 0.3, 1] as const;

type Gift = (typeof site.resource.gifts)[number];

function GiftCard({
  g,
  i,
  button,
  reduce,
}: {
  g: Gift;
  i: number;
  button: string;
  reduce: boolean | null;
}) {
  const tilt = useTilt(7);

  return (
    <motion.a
      href={g.file}
      download
      {...tilt.handlers}
      style={tilt.style}
      initial={{ opacity: 0, y: reduce ? 0 : 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={reduce ? undefined : { scale: 1.02 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay: i * 0.12, ease: EASE }}
      className="group flex flex-col rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-primary"
    >
      {/* mini-couverture stylisée */}
      <div className="relative mb-6 aspect-[210/297] w-20 overflow-hidden rounded-lg border border-border bg-bg shadow-[0_14px_30px_-18px_oklch(0.22_0.018_55/0.6)]">
        <div
          aria-hidden
          className="absolute -right-5 -top-5 size-16 rounded-full blur-xl"
          style={{
            background: [
              "oklch(0.83 0.155 78 / 0.55)",
              "oklch(0.6 0.14 45 / 0.5)",
              "oklch(0.55 0.12 150 / 0.45)",
            ][i],
          }}
        />
        <div className="relative flex h-full flex-col p-2.5">
          <span className="text-[6px] font-bold text-ink">
            NMF<span className="text-primary">.</span>
          </span>
          <span className="mt-auto text-[7px] font-bold uppercase tracking-wide text-primary">
            {g.tag}
          </span>
          <div className="mt-1 flex gap-0.5">
            <span className="h-1 flex-1 rounded-full bg-primary/80" />
            <span className="h-1 flex-1 rounded-full bg-primary/40" />
            <span className="h-1 flex-1 rounded-full bg-primary/20" />
          </div>
        </div>
      </div>

      <p className="text-xs font-bold uppercase tracking-widest text-primary">
        {g.tag}
      </p>
      <h3 className="mt-2 font-display text-lg font-medium leading-snug text-ink">
        {g.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{g.desc}</p>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs font-semibold text-muted">{g.meta}</span>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink transition-colors group-hover:text-primary">
          {button}
          <svg className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 14.5V16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </span>
      </div>
    </motion.a>
  );
}

export function Resource() {
  const reduce = useReducedMotion();
  const r = site.resource;

  return (
    <section id="ressources" className="scroll-mt-24 overflow-x-clip px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mx-auto max-w-2xl text-center"
        >
          <StepBadge n={3} />
          <h2 className="mt-5 text-[clamp(1.7rem,4vw,2.6rem)] font-normal leading-tight text-ink">
            {r.eyebrow}
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted">{r.subtitle}</p>
        </motion.div>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {r.gifts.map((g, i) => (
            <GiftCard key={g.title} g={g} i={i} button={r.button} reduce={reduce} />
          ))}
        </div>
      </div>
    </section>
  );
}
