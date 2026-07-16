"use client";

import { useState } from "react";
import { simulateur } from "@/config/simulateur";
import { fbTrackCustom } from "@/lib/fpixel";

/* ──────────────────────────────────────────────────────────────
   « Garde ton étude » — le filet sous le funnel.

   Aujourd'hui, la première donnée de recontact arrive à la question
   contact du formulaire : tout abandon avant = prospect perdu. Ce
   bloc capture l'email juste après le résultat du simulateur, au
   moment de motivation maximale — et il reste DISCRET : il ne doit
   pas concurrencer le CTA principal « Recevoir mon audit gratuit ».

   Le snapshot fige les réglages (métier, ville, budget, net, roi…)
   pour personnaliser la relance. Pas de provider email branché :
   la route /api/etude stocke seulement (voir son commentaire).

   Style « document » bleu/blanc : zéro arrondi, zéro dégradé,
   zéro ombre.
   ────────────────────────────────────────────────────────────── */

/** Réglages du simulateur figés au moment de la capture — le type
    vit dans lib/email (serveur), ré-exporté ici pour les consommateurs
    existants du composant. */
import type { EtudeSnapshot } from "@/lib/email/templates/etude";
export type { EtudeSnapshot };

/* Même philosophie que côté serveur : laxiste — rejeter un email
   valide coûte un prospect. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function EmailEtude({ snapshot }: { snapshot: EtudeSnapshot }) {
  const t = simulateur.etude;
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value) || state === "sending") return;
    setState("sending");
    try {
      const res = await fetch("/api/etude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, snapshot }),
      });
      if (!res.ok) throw new Error();
      /* Audience Meta « a laissé son email » — plus chaude qu'un simple
         visiteur du simulateur, moins qu'un Lead : à relancer en priorité. */
      fbTrackCustom("EtudeEmail", {
        metier: snapshot.metier,
        ville: snapshot.ville,
        net_mensuel: Math.round(snapshot.net),
      });
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="border border-sim-line bg-white px-5 py-4 print:hidden">
      {state === "done" ? (
        <p className="text-sm font-semibold text-sim-ink">{t.merci}</p>
      ) : (
        <>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-sim-muted">
            {t.titre}
          </p>
          <form onSubmit={submit} className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (state === "error") setState("idle");
              }}
              placeholder={t.placeholder}
              autoComplete="email"
              aria-label={t.titre}
              required
              className="h-10 min-w-0 flex-1 appearance-none rounded-none border border-sim-line bg-white px-3 text-sm text-sim-ink outline-none placeholder:text-sim-muted focus:border-sim-blue"
            />
            <button
              type="submit"
              disabled={state === "sending"}
              className="h-10 shrink-0 bg-sim-blue px-5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sim-blue"
            >
              {t.bouton}
            </button>
          </form>
          {state === "error" && (
            <p className="mt-2 text-xs font-semibold text-sim-ink">{t.erreur}</p>
          )}
        </>
      )}
    </div>
  );
}
