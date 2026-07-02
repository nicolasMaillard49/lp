"use client";

import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useReducedMotion,
} from "motion/react";
import { site } from "@/config/site";
import { Aurora } from "./Aurora";
import { Magnetic } from "./Magnetic";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();

  // Spotlight qui suit la souris (desktop)
  const mx = useMotionValue(50);
  const my = useMotionValue(40);
  const spotlight = useMotionTemplate`radial-gradient(280px circle at ${mx}% ${my}%, oklch(0.83 0.155 78 / 0.18), transparent 70%)`;

  function onMove(e: React.MouseEvent<HTMLElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 100);
    my.set(((e.clientY - r.top) / r.height) * 100);
  }

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.1, delayChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : 24, filter: reduce ? "blur(0px)" : "blur(10px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: EASE },
    },
  };
  const titleWords = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.12 } },
  };
  // opacity reste à 1 (titre = élément LCP : il doit être peint dès le SSR,
  // sans attendre l'hydratation JS). L'effet « flou → net » + slide est conservé.
  const word = {
    hidden: { opacity: 1, y: reduce ? 0 : 16, filter: reduce ? "blur(0px)" : "blur(8px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } },
  };

  return (
    <section
      id="top"
      onMouseMove={onMove}
      className="relative flex min-h-[92svh] flex-col items-center justify-center overflow-hidden px-5 pt-24 pb-16 text-center sm:px-8"
    >
      <Aurora />
      {/* Spotlight souris */}
      <motion.div
        aria-hidden
        style={{ background: spotlight }}
        className="pointer-events-none absolute inset-0 -z-10 hidden md:block"
      />
      {/* Halo de base */}
      <div
        aria-hidden
        className="glow-honey pointer-events-none absolute left-1/2 top-[40%] -z-10 h-[110vmin] w-[110vmin] -translate-x-1/2 -translate-y-1/2"
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-3xl lg:max-w-4xl"
      >
        <motion.p
          variants={item}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-4 py-1.5 text-sm font-medium text-muted backdrop-blur-sm"
        >
          <svg className="size-4 text-primary" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.15" />
            <path
              d="M5 8.2 7 10l4-4.2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {site.hero.badge}
        </motion.p>

        <motion.h1
          variants={titleWords}
          className="text-[clamp(2.3rem,6.4vw,4.5rem)] font-normal leading-[1.1] tracking-[-0.005em] text-ink"
        >
          {site.hero.title.split(" ").map((w, i) => (
            <motion.span
              key={`${w}-${i}`}
              variants={word}
              className="mr-[0.24em] inline-block"
            >
              {w}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          variants={item}
          className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg"
        >
          {site.hero.subtitle}
        </motion.p>

        <motion.div
          variants={item}
          className="mt-9 flex justify-center"
        >
          <Magnetic className="w-full sm:w-auto">
            <motion.a
              href="#video"
              whileHover={reduce ? undefined : { scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="btn-shine group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-white shadow-[0_8px_30px_-8px_oklch(0.67_0.15_64/0.6)] sm:w-auto"
            >
              {site.hero.ctaPrimary}
              <svg className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.a>
          </Magnetic>
        </motion.div>

        <motion.p variants={item} className="mt-7 text-sm text-muted">
          Présenté par{" "}
          <span className="font-semibold text-ink">{site.founder}</span>
          {" — fondateur de "}
          {site.name}
        </motion.p>
      </motion.div>

      {!reduce && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="absolute bottom-7 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-9 w-5 items-start justify-center rounded-full border border-border p-1"
          >
            <span className="size-1.5 rounded-full bg-muted" />
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
