"use client";

import { useRef, useState } from "react";
import {
  m,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import { r2 } from "@/config/r2";
import { Reveal } from "@/components/Reveal";

const EASE = [0.16, 1, 0.3, 1] as const;

type Phase = (typeof r2.offre.phases)[number];

/**
 * Déroulé des phases en « scrollytelling » : la scène reste épinglée à
 * l'écran et le scroll fait défiler les étapes une par une — gros numéro,
 * barre de progression, une seule étape lisible à la fois.
 */
function ProcessPin({ phases }: { phases: readonly Phase[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.min(phases.length - 1, Math.floor(v * phases.length));
    setActive(idx);
  });

  const p = phases[active];

  return (
    // 1 écran de scroll par étape — la scène reste collée pendant ce temps
    <div ref={ref} className="relative" style={{ height: `${phases.length * 100}svh` }}>
      <div className="sticky top-0 flex h-svh items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-6 sm:gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Gros numéro + progression */}
          <div className="relative flex flex-row items-center gap-6 lg:flex-col lg:items-start">
            <AnimatePresence mode="wait">
              <m.span
                key={active}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.35, ease: EASE }}
                aria-hidden
                className="font-display text-[clamp(6rem,16vw,12rem)] font-medium leading-none text-transparent"
                style={{ WebkitTextStroke: "2px oklch(0.67 0.15 64 / 0.55)" }}
              >
                {String(active + 1).padStart(2, "0")}
              </m.span>
            </AnimatePresence>

            <div className="flex-1 lg:mt-6 lg:w-full lg:flex-none">
              <p className="text-xs font-bold uppercase tracking-widest text-muted">
                Étape {active + 1} / {phases.length}
              </p>
              {/* rail de progression piloté par le scroll */}
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border lg:max-w-56">
                <m.div
                  className="h-full origin-left rounded-full bg-[linear-gradient(90deg,oklch(0.83_0.155_78),oklch(0.67_0.15_64))]"
                  style={{ scaleX: scrollYProgress }}
                />
              </div>
            </div>
          </div>

          {/* Carte de l'étape active */}
          <div className="relative min-h-[16rem] sm:min-h-[15rem]">
            <AnimatePresence mode="wait">
              <m.div
                key={active}
                initial={{ opacity: 0, y: 44 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -44 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="rounded-3xl border border-border bg-surface p-6 shadow-[0_30px_70px_-45px_oklch(0.22_0.018_55/0.55)] sm:p-9"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  {p.periode}
                </p>
                <h3 className="mt-3 font-display text-2xl font-medium leading-snug text-ink sm:text-3xl">
                  {p.title}
                </h3>
                <p className="mt-3 text-pretty text-base leading-relaxed text-muted sm:text-lg">
                  {p.text}
                </p>
                <p className="mt-6 flex items-center gap-2.5 border-t border-border pt-5 text-sm font-semibold text-ink sm:text-base">
                  <svg className="size-5 shrink-0 text-electric" viewBox="0 0 20 20" fill="none" aria-hidden>
                    <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.15" />
                    <path d="M6.2 10.4 8.7 13l5.1-5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {p.resultat}
                </p>
              </m.div>
            </AnimatePresence>
          </div>
        </div>

        {/* indice de scroll — disparaît sur la dernière étape */}
        <m.div
          aria-hidden
          animate={{ opacity: active < phases.length - 1 ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted"
        >
          Scrolle
          <m.svg
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="size-4"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </m.svg>
        </m.div>
      </div>
    </div>
  );
}

/** Fallback statique (reduced motion) : la frise verticale classique. */
function ProcessStatic({ phases }: { phases: readonly Phase[] }) {
  return (
    <ol className="relative mx-auto mt-16 max-w-2xl">
      {phases.map((p, i) => (
        <li key={p.periode} className="relative flex gap-5 pb-10 last:pb-0 sm:gap-7">
          {i < phases.length - 1 && (
            <span
              aria-hidden
              className="absolute left-[19px] top-12 h-[calc(100%-2.5rem)] w-px bg-gradient-to-b from-primary/50 to-border sm:left-[21px]"
            />
          )}
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-bg font-display text-base font-semibold text-primary sm:size-11"
          >
            {i + 1}
          </span>
          <div className="flex-1 rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">{p.periode}</p>
            <h3 className="mt-2 font-display text-lg font-medium text-ink sm:text-xl">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{p.text}</p>
            <p className="mt-4 flex items-center gap-2 border-t border-border pt-3.5 text-sm font-semibold text-ink">
              <svg className="size-4 shrink-0 text-electric" viewBox="0 0 20 20" fill="none" aria-hidden>
                <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.15" />
                <path d="M6.2 10.4 8.7 13l5.1-5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {p.resultat}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * L'offre noir sur blanc : durée, phases (scrollytelling épinglé), méthode,
 * outils et résultats attendus. C'est la « présentation d'offre » écrite —
 * le prospect doit repartir sans aucune zone d'ombre.
 */
export function OffreDetails() {
  const reduce = useReducedMotion();
  const o = r2.offre;

  return (
    <section id="offre" className="scroll-mt-24 overflow-x-clip px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-5xl">
        {/* En-tête + durée */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            {o.eyebrow}
          </p>
          <h2 className="mt-4 text-[clamp(1.8rem,4.5vw,2.8rem)] font-normal leading-tight text-ink">
            {o.title}
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted">{o.subtitle}</p>

          <div className="mt-7 inline-flex items-center gap-3 rounded-full border border-border bg-surface px-5 py-2.5">
            <svg className="size-5 text-primary" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm text-muted">
              {o.duree.label}{" : "}
              <span className="font-display text-base font-semibold text-ink">
                {o.duree.value}
              </span>
              {" — "}
              {o.duree.note}
            </span>
          </div>
        </Reveal>

        {/* Déroulé des phases — épinglé au scroll (statique en reduced-motion) */}
        {reduce ? <ProcessStatic phases={o.phases} /> : <ProcessPin phases={o.phases} />}

        {/* Méthode — pleine largeur, ton affirmé */}
        <Reveal className="mt-16">
          <div className="rounded-3xl border border-border bg-surface p-7 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              {o.methode.title}
            </p>
            <p className="mt-4 max-w-3xl font-display text-[clamp(1.2rem,2.6vw,1.65rem)] font-medium leading-snug text-ink">
              {o.methode.text}
            </p>
          </div>
        </Reveal>

        {/* Outils + résultats */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Reveal delay={0.05}>
            <div className="h-full rounded-3xl border border-border bg-surface p-7 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                {o.outils.title}
              </p>
              <ul className="mt-5 space-y-3.5">
                {o.outils.items.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm leading-relaxed text-ink sm:text-base">
                    <svg className="mt-0.5 size-5 shrink-0 text-primary" viewBox="0 0 20 20" fill="none" aria-hidden>
                      <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.12" />
                      <path d="M6.2 10.4 8.7 13l5.1-5.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="flex h-full flex-col rounded-3xl bg-ink p-7 text-white sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-primary-bright">
                {o.resultats.title}
              </p>
              <ul className="mt-5 space-y-3.5">
                {o.resultats.items.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm leading-relaxed text-white/90 sm:text-base">
                    <svg className="mt-0.5 size-5 shrink-0 text-primary-bright" viewBox="0 0 20 20" fill="none" aria-hidden>
                      <path d="M10 2.5 12 7.8l5.5.4-4.2 3.6 1.3 5.4L10 14.3l-4.6 2.9 1.3-5.4-4.2-3.6 5.5-.4L10 2.5Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                    </svg>
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-auto border-t border-white/15 pt-4 text-xs leading-relaxed text-white/60 sm:mt-6">
                {o.resultats.disclaimer}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
