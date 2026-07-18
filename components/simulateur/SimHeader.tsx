"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { site } from "@/config/site";
import { simulateur } from "@/config/simulateur";

/**
 * Header de /simulateur. Client : le `?from=prep` se lit après mount,
 * pas via `searchParams` côté serveur — lire searchParams rendait toute
 * la page dynamique (SSR à la demande) alors qu'elle est statique.
 *
 * Deux publics : le prospect R2 arrive de /preparation (lien `?from=prep`
 * dans config/r2.ts) et doit pouvoir y revenir ; le trafic froid (ads,
 * direct) ne doit voir AUCUNE porte de sortie vers le parcours
 * préparation. Le SSR rend la variante froide ; le lien retour apparaît
 * à l'hydratation pour les seuls visiteurs `from=prep`.
 */
export function SimHeader() {
  const [fromPrep, setFromPrep] = useState(false);

  useEffect(() => {
    try {
      setFromPrep(new URLSearchParams(window.location.search).get("from") === "prep");
    } catch {
      /* URL illisible → variante froide, jamais bloquant */
    }
  }, []);

  return (
    <header className="border-b border-border font-helvetica">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link
          href={fromPrep ? "/preparation" : "/"}
          className="font-helvetica text-lg font-bold tracking-tight text-ink"
        >
          {site.name}
          <span className="text-primary">.</span>
        </Link>
        {fromPrep && (
          <Link
            href={simulateur.backHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
          >
            <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M9.5 3.5 5 8l4.5 4.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {simulateur.back}
          </Link>
        )}
      </div>
    </header>
  );
}
