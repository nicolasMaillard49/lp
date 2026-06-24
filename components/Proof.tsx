"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { site } from "@/config/site";

const EASE = [0.16, 1, 0.3, 1] as const;
const INTERVAL = 5200;

export function Proof() {
  const reduce = useReducedMotion();
  const items = site.proof.testimonials;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Défilement automatique
  useEffect(() => {
    if (reduce || paused) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, INTERVAL);
    return () => clearInterval(id);
  }, [reduce, paused, items.length]);

  const current = items[index];

  return (
    <section className="px-5 py-16 sm:px-8 sm:py-24">
      <div
        className="mx-auto max-w-3xl text-center"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <span
          aria-hidden
          className="font-display text-6xl leading-none text-primary/40"
        >
          &ldquo;
        </span>

        {/* Hauteur stable pour éviter les sauts entre citations */}
        <div className="relative -mt-4 flex min-h-[180px] items-center justify-center sm:min-h-[160px]">
          <AnimatePresence mode="wait">
            <motion.figure
              key={index}
              initial={{ opacity: 0, y: reduce ? 0 : 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -14 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <blockquote>
                <p className="text-balance font-display text-[clamp(1.5rem,4vw,2.4rem)] font-medium leading-snug text-ink">
                  {current.quote}
                </p>
              </blockquote>
              <figcaption className="mt-6 text-sm font-medium text-muted">
                <span className="font-semibold text-ink">{current.author}</span>
                {" — "}
                {current.role}
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        {/* Indicateurs / navigation */}
        <div className="mt-8 flex items-center justify-center gap-2.5">
          {items.map((t, i) => (
            <button
              key={t.author}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Voir le témoignage de ${t.author}`}
              aria-current={i === index}
              className="group p-1.5"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-500 ${
                  i === index
                    ? "w-7 bg-primary"
                    : "w-1.5 bg-border group-hover:bg-muted"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
