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
    <section id="video" className="relative overflow-clip px-5 py-20 sm:px-8 sm:py-28">
      {/* Fond épuré : une fine texture de grain, sans motif. */}
      <div aria-hidden className="texture-grain pointer-events-none absolute inset-0 -z-10" />

      <div className="relative mx-auto max-w-4xl">
        <div className="mb-5 flex justify-center">
          <StepBadge n={1} />
        </div>

        <Notice />

        <motion.figure
          {...(playing ? {} : tilt.handlers)}
          style={playing ? undefined : tilt.style}
          initial={{ opacity: 0, y: reduce ? 0 : 28, scale: reduce ? 1 : 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* Halo bleu diffus derrière le lecteur */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-16 -inset-y-16 -z-10 bg-[radial-gradient(circle,oklch(0.68_0.06_250/0.22),transparent_70%)] blur-3xl"
          />

          <div className="relative aspect-video overflow-hidden rounded-3xl border border-border bg-surface-2 shadow-[0_30px_80px_-30px_oklch(0.22_0.018_55/0.45)]">
            {/* Fond dégradé bleu visible tant que le poster n'est pas chargé */}
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_30%,oklch(0.4_0.02_260/0.25),oklch(0.25_0.02_265/0.6))]"
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
