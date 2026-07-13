"use client";

import Link from "next/link";
import { m, useReducedMotion } from "motion/react";
import { r2 } from "@/config/r2";
import { useTilt } from "@/components/useTilt";
import { Reveal } from "@/components/Reveal";

const EASE = [0.16, 1, 0.3, 1] as const;

type Gift = (typeof r2.ressources.gifts)[number];

/**
 * Carte vedette — le simulateur ROI, mis en avant au-dessus des PDF.
 * Répond à l'objection la plus fréquente : « et pour MON métier ? ».
 */
function FeaturedCard({ reduce }: { reduce: boolean | null }) {
  const f = r2.ressources.featured;

  return (
    <m.div
      initial={{ opacity: 0, y: reduce ? 0 : 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: EASE }}
      className="relative overflow-hidden rounded-2xl border border-primary/35 bg-surface p-7 sm:p-9"
    >
      {/* halo ambré discret — signale que cette carte est la pièce maîtresse */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full blur-3xl"
        style={{ background: "oklch(0.83 0.155 78 / 0.3)" }}
      />

      <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
        <div>
          <p className="font-display text-lg font-medium leading-snug text-ink">
            {f.objection}
          </p>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-primary">
            {f.tag}
          </p>
          <h3 className="mt-2 font-display text-2xl font-medium leading-snug text-ink sm:text-[1.7rem]">
            {f.title}
          </h3>
          <p className="mt-3 max-w-xl leading-relaxed text-muted">{f.desc}</p>

          <div className="mt-6 flex flex-wrap items-center gap-5">
            <m.span
              whileHover={reduce ? undefined : { scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex"
            >
              <Link
                href={f.href}
                className="btn-shine group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-white shadow-[0_8px_30px_-8px_oklch(0.67_0.15_64/0.6)]"
              >
                {f.button}
                <svg
                  className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M3 8h10m0 0-4-4m4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </m.span>
            <span className="text-xs font-semibold text-muted">{f.meta}</span>
          </div>
        </div>

        {/* aperçu stylisé de l'outil : curseurs + retour affiché */}
        <div
          aria-hidden
          className="hidden w-56 shrink-0 rounded-xl border border-border bg-bg p-4 shadow-[0_14px_30px_-18px_oklch(0.22_0.018_55/0.6)] md:block"
        >
          <div className="flex flex-col gap-3">
            {[70, 45, 85].map((w, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="h-1.5 w-12 rounded-full bg-border" />
                <div className="relative h-1.5 rounded-full bg-border">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-primary/70"
                    style={{ width: `${w}%` }}
                  />
                  <span
                    className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-primary bg-bg"
                    style={{ left: `calc(${w}% - 6px)` }}
                  />
                </div>
              </div>
            ))}
            <div className="mt-1 rounded-lg bg-primary px-3 py-2 text-center">
              <span className="block text-[9px] font-bold uppercase tracking-widest text-white/75">
                Retour estimé
              </span>
              <span className="font-display text-xl font-bold text-white">
                ×7,4
              </span>
            </div>
          </div>
        </div>
      </div>
    </m.div>
  );
}

/**
 * Carte ressource orientée objection : chaque cadeau répond d'avance à un
 * doute fréquent (« c'est cher », « je peux le faire seul », « ça marche ? »).
 */
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
    <m.a
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
      {/* le doute auquel la ressource répond — l'accroche de la carte */}
      <p className="font-display text-lg font-medium leading-snug text-ink">
        {g.objection}
      </p>

      <div className="mt-5 border-t border-border pt-5">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          {g.tag}
        </p>
        <h3 className="mt-2 text-base font-semibold leading-snug text-ink">
          {g.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{g.desc}</p>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs font-semibold text-muted">{g.meta}</span>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink transition-colors group-hover:text-primary">
          {button}
          <svg className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 14.5V16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </span>
      </div>
    </m.a>
  );
}

/** Apport de valeur / prétraitement des objections avant la décision. */
export function RessourcesR2() {
  const reduce = useReducedMotion();
  const r = r2.ressources;

  return (
    <section id="ressources" className="scroll-mt-24 overflow-x-clip px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            {r.eyebrow}
          </p>
          <h2 className="mt-4 text-[clamp(1.7rem,4vw,2.6rem)] font-normal leading-tight text-ink">
            {r.title}
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted">{r.subtitle}</p>
        </Reveal>

        <div className="mt-14">
          <FeaturedCard reduce={reduce} />
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {r.gifts.map((g, i) => (
            <GiftCard key={g.title} g={g} i={i} button={r.button} reduce={reduce} />
          ))}
        </div>
      </div>
    </section>
  );
}
