"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { site } from "@/config/site";
import { Notice } from "./Notice";
import { useTilt } from "./useTilt";
import { StepBadge } from "./StepBadge";

export function VideoSection() {
  const reduce = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [errored, setErrored] = useState(false);
  const tilt = useTilt(6);

  function handlePlay() {
    setPlaying(true);
    // Laisse React monter les controls avant de lancer la lecture.
    requestAnimationFrame(() => {
      videoRef.current?.play().catch(() => setErrored(true));
    });
  }

  return (
    <section id="video" className="relative overflow-x-clip px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex justify-center">
          <StepBadge n={1} />
        </div>

        <Notice />

        <motion.h2
          initial={{ opacity: 0, y: reduce ? 0 : 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-10 max-w-2xl text-center text-[clamp(1.6rem,4vw,2.5rem)] font-semibold leading-tight text-ink"
        >
          {site.video.label}
        </motion.h2>

        <motion.figure
          {...(playing ? {} : tilt.handlers)}
          style={playing ? undefined : tilt.style}
          initial={{ opacity: 0, y: reduce ? 0 : 28, scale: reduce ? 1 : 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* Halo de miel diffus derrière le lecteur — la signature */}
          <div
            aria-hidden
            className="glow-honey pointer-events-none absolute -inset-x-10 -inset-y-12 -z-10 blur-2xl"
          />

          {/* Anneau dégradé qui tourne autour du lecteur */}
          <div
            aria-hidden
            className="shimmer-ring pointer-events-none absolute -inset-[2px] -z-[1] rounded-[calc(1.5rem+3px)] opacity-80 blur-[1.5px]"
          />

          <div className="relative aspect-video overflow-hidden rounded-3xl border border-border bg-surface-2 shadow-[0_30px_80px_-30px_oklch(0.22_0.018_55/0.45)]">
            {/* Fond dégradé visible tant que la vidéo n'a pas de poster */}
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(120%_120%_at_30%_20%,oklch(0.83_0.155_78/0.5),oklch(0.67_0.15_64/0.25)_55%,oklch(0.47_0.13_32/0.4))]"
            />

            {playing && !errored ? (
              <video
                ref={videoRef}
                className="absolute inset-0 size-full object-cover"
                src={site.video.src}
                poster={site.video.poster}
                controls
                playsInline
                onError={() => setErrored(true)}
              />
            ) : (
              <>
                {/* Poster (si fourni) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={site.video.poster}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"
                />

                {errored ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-white">
                    <p className="font-display text-xl font-semibold">
                      Vidéo bientôt disponible
                    </p>
                    <p className="max-w-xs text-sm text-white/80">
                      Ajoute ton fichier dans <code>/public</code> puis indique
                      son chemin dans <code>config/site.ts</code>.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handlePlay}
                    aria-label="Lire la vidéo de présentation"
                    className="group absolute inset-0 flex items-center justify-center"
                  >
                    <span className="relative flex size-20 items-center justify-center sm:size-24">
                      {!reduce && (
                        <span className="pulse-ring absolute inset-0 rounded-full bg-white/70" />
                      )}
                      <span className="relative flex size-20 items-center justify-center rounded-full bg-white text-ink shadow-xl transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:scale-105 sm:size-24">
                        <svg
                          className="ml-1 size-7 sm:size-8"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden
                        >
                          <path d="M8 5.5v13l11-6.5L8 5.5Z" />
                        </svg>
                      </span>
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        </motion.figure>
      </div>
    </section>
  );
}
