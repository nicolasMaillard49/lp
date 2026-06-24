"use client";

import { motion, useReducedMotion } from "motion/react";
import { site } from "@/config/site";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Method() {
  const reduce = useReducedMotion();

  return (
    <section id="method" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mb-14 max-w-2xl sm:mb-20"
        >
          <h2 className="text-[clamp(1.8rem,4.5vw,3rem)] font-normal leading-tight text-ink">
            {site.method.title}
          </h2>
          <p className="mt-5 text-pretty text-lg leading-relaxed text-muted">
            {site.method.lead}
          </p>
        </motion.div>

        <ol className="grid gap-x-10 gap-y-12 sm:grid-cols-3">
          {site.method.steps.map((step, i) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: reduce ? 0 : 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: EASE }}
              className="flex flex-col"
            >
              <motion.span
                aria-hidden
                initial={{ scale: reduce ? 1 : 0.5, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.6, delay: i * 0.12 + 0.1, ease: EASE }}
                className="font-display text-5xl font-light leading-none text-primary/90"
              >
                {String(i + 1).padStart(2, "0")}
              </motion.span>

              <motion.span
                aria-hidden
                initial={{ scaleX: reduce ? 1 : 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.7, delay: i * 0.12 + 0.25, ease: EASE }}
                className="mt-5 mb-3 h-px w-12 origin-left bg-primary/50"
              />

              <h3 className="text-xl font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-pretty leading-relaxed text-muted">
                {step.text}
              </p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
