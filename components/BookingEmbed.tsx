"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { site } from "@/config/site";

/** Clé sessionStorage posée par AuditForm au submit — préremplit Koalendar. */
export const CONTACT_KEY = "nmf_contact";

declare global {
  interface Window {
    Koalendar?: { (...args: unknown[]): void; props?: unknown[] };
  }
}

/**
 * Calendrier Koalendar intégré à /bienvenue — le booking se fait SANS
 * quitter le domaine. Nécessaire parce que la redirection post-booking
 * de Koalendar est une fonctionnalité Pro : embarquer le calendrier
 * ici garde le Lead Meta (déclenché à l'arrivée sur la page) et la
 * séquence de préparation autour du créneau.
 *
 * Le widget officiel (widget.js) gère la hauteur tout seul ; le
 * min-height évite un saut de layout pendant son chargement.
 */
export function BookingEmbed() {
  const reduce = useReducedMotion();
  const mounted = useRef(false);

  useEffect(() => {
    /* Init une seule fois — un second appel `inline` dupliquerait le widget. */
    if (mounted.current) return;
    mounted.current = true;

    const url = new URL(site.booking.url);
    url.searchParams.set("embed", "true");
    try {
      const raw = sessionStorage.getItem(CONTACT_KEY);
      if (raw) {
        const c = JSON.parse(raw) as { name?: string; email?: string };
        if (c.name) url.searchParams.set("name", c.name);
        if (c.email) url.searchParams.set("email", c.email);
      }
    } catch {
      // sessionStorage indisponible → calendrier non prérempli, pas bloquant
    }

    const w = window;
    if (!w.Koalendar) {
      const stub = ((...args: unknown[]) => {
        (stub.props = stub.props ?? []).push(args);
      }) as NonNullable<Window["Koalendar"]>;
      w.Koalendar = stub;
    }
    w.Koalendar("inline", {
      url: url.toString(),
      selector: "#koalendar-embed",
    });

    if (!document.querySelector('script[src="https://koalendar.com/assets/widget.js"]')) {
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://koalendar.com/assets/widget.js";
      document.body.appendChild(s);
    }
  }, []);

  return (
    <section id="reserver" className="relative px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-8 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">
              La seule chose à faire maintenant
            </p>
            <h2 className="text-3xl text-ink sm:text-4xl">
              Réserve ton créneau
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              20 minutes, en visio. Choisis le jour et l'heure qui
              t'arrangent — la confirmation arrive par mail dans la foulée.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_30px_80px_-30px_oklch(0.22_0.018_55/0.35)]">
            {/* Rempli par widget.js — hauteur gérée par le widget. */}
            <div id="koalendar-embed" className="min-h-[560px]" />
          </div>

          <p className="mt-4 text-center text-sm text-muted">
            Un imprévu plus tard ? Tu pourras annuler ou reprogrammer
            depuis le mail de confirmation.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
