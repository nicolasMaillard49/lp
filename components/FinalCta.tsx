"use client";

import { motion, useReducedMotion } from "motion/react";
import { site } from "@/config/site";
import { Magnetic } from "./Magnetic";

export function FinalCta() {
  const reduce = useReducedMotion();

  return (
    <section id="contact" className="px-5 py-20 sm:px-8 sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:px-12 sm:py-20"
      >
        {/* Bande ambrée drenched — c'est ici qu'on dépense la couleur */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,oklch(0.72_0.155_67),oklch(0.6_0.15_55))]"
        />
        {/* Orbes flottants */}
        <motion.div
          aria-hidden
          animate={reduce ? undefined : { x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-16 -top-24 -z-10 size-80 rounded-full bg-[oklch(0.88_0.14_88/0.5)] blur-3xl"
        />
        <motion.div
          aria-hidden
          animate={reduce ? undefined : { x: [0, -25, 0], y: [0, 25, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-24 -left-16 -z-10 size-72 rounded-full bg-[oklch(0.5_0.14_35/0.45)] blur-3xl"
        />

        <h2 className="mx-auto max-w-2xl text-balance text-[clamp(1.9rem,5vw,3.2rem)] font-normal leading-tight text-white">
          {site.finalCta.title}
        </h2>
        <p className="mx-auto mt-4 max-w-md text-pretty text-white/85 sm:text-lg">
          {site.finalCta.subtitle}
        </p>

        <Magnetic className="mt-9 inline-block">
          <motion.a
            href="#video"
            whileHover={reduce ? undefined : { scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-ink shadow-lg"
          >
            <svg className="size-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
              <path d="M5 3.5v9l7-4.5-7-4.5Z" />
            </svg>
            {site.finalCta.button}
          </motion.a>
        </Magnetic>

        <p className="mt-5 text-sm font-medium text-white/75">
          {site.finalCta.reassurance}
        </p>
      </motion.div>
    </section>
  );
}
