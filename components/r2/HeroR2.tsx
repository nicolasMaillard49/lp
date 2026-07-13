"use client";

import { m, useReducedMotion } from "motion/react";
import { site } from "@/config/site";
import { r2 } from "@/config/r2";
import { Magnetic } from "@/components/Magnetic";

/** Coche / point / cercle selon l'état d'une étape du parcours. */
function JourneyIcon({ done, current }: { done?: boolean; current?: boolean }) {
  if (done) {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-white">
        <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M4 8.4 6.8 11l5.2-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  if (current) {
    return (
      <span className="relative flex size-7 shrink-0 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-electric/15" />
        <span className="size-2.5 rounded-full bg-electric" />
      </span>
    );
  }
  return (
    <span className="flex size-7 shrink-0 items-center justify-center">
      <span className="size-2.5 rounded-full border-2 border-border bg-bg" />
    </span>
  );
}

/**
 * Hero de la LP R2 — split : le message à gauche, le tracker de parcours
 * (diagnostic ✓ → proposition → décision) à droite.
 * Entrées en CSS pur (.enter) : elles jouent dès le premier paint serveur,
 * le LCP n'attend pas l'hydratation.
 */
export function HeroR2() {
  const reduce = useReducedMotion();
  const h = r2.hero;

  return (
    <section
      id="top"
      className="relative flex min-h-[88svh] items-center overflow-hidden px-5 pb-16 pt-28 sm:px-8"
    >
      {/* Halo de miel décentré + voile bleu discret : même famille que la R1,
          balance différente (la décision est plus froide que l'accueil). */}
      <div
        aria-hidden
        className="glow-honey pointer-events-none absolute -left-[10%] top-[10%] -z-10 h-[90vmin] w-[90vmin]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[15%] bottom-[0%] -z-10 h-[70vmin] w-[70vmin] rounded-full bg-[radial-gradient(circle,oklch(0.58_0.22_252/0.12),transparent_70%)]"
      />
      <div aria-hidden className="texture-grain pointer-events-none absolute inset-0 -z-10" />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        {/* Colonne message */}
        <div>
          <p className="enter enter-1 mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-4 py-1.5 text-sm font-medium text-muted backdrop-blur-sm">
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
            {h.badge}
          </p>

          <h1 className="enter enter-2 text-[clamp(2.2rem,5.2vw,3.9rem)] font-normal leading-[1.08] tracking-[-0.005em] text-ink">
            {h.title}
          </h1>

          <p className="enter enter-3 mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
            {h.subtitle}
          </p>

          <div className="enter enter-4 mt-9 flex flex-wrap items-center gap-5">
            <Magnetic className="w-full sm:w-auto">
              <m.a
                href="#video"
                whileHover={reduce ? undefined : { scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="btn-shine group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-white shadow-[0_8px_30px_-8px_oklch(0.67_0.15_64/0.6)] sm:w-auto"
              >
                {h.ctaPrimary}
                <svg
                  className="size-4 transition-transform duration-300 group-hover:translate-y-0.5"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M8 3v10M4 9l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </m.a>
            </Magnetic>
            <p className="text-sm text-muted">
              Présenté par <span className="font-semibold text-ink">{site.founder}</span>
              {" — fondateur de "}
              {site.name}
            </p>
          </div>
        </div>

        {/* Colonne tracker de parcours */}
        <aside
          aria-label="Où tu en es dans le parcours"
          className="enter enter-3 relative rounded-3xl border border-border bg-surface/80 p-6 shadow-[0_30px_70px_-40px_oklch(0.22_0.018_55/0.5)] backdrop-blur-sm sm:p-8"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-muted">
            Où tu en es
          </p>
          <ol className="mt-6">
            {h.journey.map((j, i) => (
              <li
                key={j.label}
                className="enter relative flex gap-4 pb-7 last:pb-0"
                style={{ animationDelay: `${0.45 + i * 0.14}s` }}
              >
                {/* trait vertical entre les étapes */}
                {i < h.journey.length - 1 && (
                  <span
                    aria-hidden
                    className={`absolute left-[13px] top-8 h-[calc(100%-2rem)] w-px ${
                      j.done ? "bg-primary/50" : "bg-border"
                    }`}
                  />
                )}
                <JourneyIcon done={"done" in j && j.done} current={"current" in j && j.current} />
                <div className="pt-0.5">
                  <p
                    className={`font-display text-base font-semibold ${
                      "current" in j && j.current ? "text-electric" : "text-ink"
                    }`}
                  >
                    {j.label}
                    {"current" in j && j.current && (
                      <span className="ml-2 rounded-full bg-electric/10 px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wider text-electric">
                        Tu es ici
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{j.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}
