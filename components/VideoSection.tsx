"use client";

import { motion, useReducedMotion } from "motion/react";
import { ContourWaves } from "./ContourWaves";
import { Notice } from "./Notice";
import { useTilt } from "./useTilt";
import { StepBadge } from "./StepBadge";

export function VideoSection() {
  const reduce = useReducedMotion();
  const tilt = useTilt(6);

  return (
    <section id="video" className="relative overflow-clip px-5 py-20 sm:px-8 sm:py-28">
      {/* Courbes de niveau « carte topographique » : couvrent toute la section
          et butent sur les quatre bords (clippées par overflow-clip). */}
      <ContourWaves />

      <div className="relative mx-auto max-w-4xl">
        <div className="mb-5 flex justify-center">
          <StepBadge n={1} />
        </div>

        <Notice />

        <motion.figure
          {...tilt.handlers}
          style={tilt.style}
          initial={{ opacity: 0, y: reduce ? 0 : 28, scale: reduce ? 1 : 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* Halo bleu diffus derrière le lecteur */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-10 -inset-y-12 -z-10 bg-[radial-gradient(circle,oklch(0.6_0.17_255/0.35),transparent_70%)] blur-2xl"
          />

          {/* Le lecteur : présent mais en 404 le temps de l'upload de la vidéo */}
          <div className="relative aspect-video overflow-hidden rounded-3xl border border-border bg-surface-2 shadow-[0_30px_80px_-30px_oklch(0.22_0.018_55/0.45)]">
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_30%,oklch(0.4_0.02_260/0.25),oklch(0.25_0.02_265/0.6))]"
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <span className="font-display text-5xl font-semibold tracking-tight text-white/85 sm:text-6xl">
                404
              </span>
              <p className="font-display text-lg font-semibold text-white">
                Vidéo bientôt disponible
              </p>
              <p className="max-w-xs text-sm text-white/70">
                Upload en cours — la présentation arrive très vite.
              </p>
            </div>
          </div>
        </motion.figure>
      </div>
    </section>
  );
}
