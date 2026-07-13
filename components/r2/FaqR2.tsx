"use client";

import { useState } from "react";
import { m, AnimatePresence, useReducedMotion } from "motion/react";
import { r2 } from "@/config/r2";
import { Reveal } from "@/components/Reveal";

const EASE = [0.16, 1, 0.3, 1] as const;

function FaqItem({
  q,
  a,
  i,
  open,
  onToggle,
  reduce,
}: {
  q: string;
  a: string;
  i: number;
  open: boolean;
  onToggle: () => void;
  reduce: boolean | null;
}) {
  return (
    <m.li
      initial={{ opacity: 0, y: reduce ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
      className="overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-primary"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-4 p-5 text-left sm:p-6"
      >
        <span className="font-display text-sm font-medium text-primary">
          {String(i + 1).padStart(2, "0")}
        </span>
        <span className="flex-1 text-base font-semibold leading-snug text-ink">
          {q}
        </span>
        <svg
          className={`size-5 shrink-0 text-muted transition-transform duration-300 ${open ? "rotate-45" : ""}`}
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden
        >
          <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
          >
            <p className="border-t border-border px-5 pb-5 pt-4 text-sm leading-relaxed text-muted sm:px-6 sm:text-base">
              {a}
            </p>
          </m.div>
        )}
      </AnimatePresence>
    </m.li>
  );
}

/** FAQ — les questions que le prospect se pose avant de décider. */
export function FaqR2() {
  const reduce = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const f = r2.faq;

  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <Reveal className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            {f.eyebrow}
          </p>
          <h2 className="mt-4 text-[clamp(1.7rem,4vw,2.6rem)] font-normal leading-tight text-ink">
            {f.title}
          </h2>
        </Reveal>

        <ul className="mt-12 space-y-3.5">
          {f.items.map((item, i) => (
            <FaqItem
              key={item.q}
              q={item.q}
              a={item.a}
              i={i}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              reduce={reduce}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
