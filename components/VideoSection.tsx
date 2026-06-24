"use client";

import { motion, useReducedMotion } from "motion/react";
import { site } from "@/config/site";
import { Notice } from "./Notice";
import { useTilt } from "./useTilt";
import { StepBadge } from "./StepBadge";

export function VideoSection() {
  const reduce = useReducedMotion();
  const tilt = useTilt(6);

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
            className="pointer-events-none absolute -inset-x-10 -inset-y-12 -z-10 bg-[radial-gradient(circle,oklch(0.6_0.17_255/0.4),transparent_70%)] blur-2xl"
          />

          <div className="relative aspect-video overflow-hidden rounded-3xl border border-border bg-surface-2 shadow-[0_30px_80px_-30px_oklch(0.22_0.018_55/0.45)]">
            {/* Fond dégradé bleu profond */}
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_50%,oklch(0.5_0.13_255/0.7),oklch(0.3_0.1_265/0.95))]"
            />

            {/* Ondes bleues qui irradient vers l'extérieur depuis le centre */}
            {!reduce &&
              [0, 1, 2, 3].map((i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className="absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[oklch(0.82_0.13_240/0.7)]"
                  initial={{ scale: 0.3, opacity: 0.65 }}
                  animate={{ scale: 3.4, opacity: 0 }}
                  transition={{
                    duration: 3.6,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: i * 0.9,
                  }}
                />
              ))}

            {/* Cœur lumineux au centre de l'onde */}
            <motion.span
              aria-hidden
              className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.88_0.12_235/0.85),transparent_70%)] blur-md"
              animate={reduce ? undefined : { scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.figure>
      </div>
    </section>
  );
}
