"use client";

import { useEffect, useRef, useState } from "react";
import { simulateur } from "@/config/simulateur";
import { fbTrackCustom } from "@/lib/fpixel";
import { isValidEstimateEmail, normalizeEstimateEmail } from "@/lib/activation";
import type { EtudeSnapshot } from "@/lib/email/templates/etude";

/* ──────────────────────────────────────────────────────────────
   Popup de capture email « Recevoir mon estimation gratuite ».

   Remplace l'ancien bloc inline « Garde ton étude » : le clic sur le
   bouton estimation ouvre cette modale, l'email part sur /api/etude
   (via onCapture), et on prévient explicitement de vérifier les spams
   et l'onglet Publicités/Promotions — là où l'étude atterrit souvent.

   Style « document » du simulateur : blanc, filet fin sim-line,
   accent sim-blue, zéro arrondi, zéro dégradé, zéro ombre.
   ────────────────────────────────────────────────────────────── */

export function EstimationModal({
  open,
  onClose,
  snapshot,
  onCapture,
  onAudit,
  auditLabel,
}: {
  open: boolean;
  onClose: () => void;
  snapshot: EtudeSnapshot;
  onCapture?: (email: string, snapshot: EtudeSnapshot) => Promise<boolean>;
  /** Accès au formulaire d'audit gratuit depuis la popup (facultatif). */
  onAudit?: () => void;
  auditLabel?: string;
}) {
  const t = simulateur.etude;
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  /* Reset à l'ouverture + focus sur le champ, et blocage du scroll
     de fond tant que la modale est ouverte. */
  useEffect(() => {
    if (!open) return;
    setEmail("");
    setState("idle");
    const id = window.setTimeout(() => inputRef.current?.focus(), 40);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = normalizeEstimateEmail(email);
    if (!isValidEstimateEmail(value) || state === "sending") return;
    setState("sending");
    try {
      const stored = onCapture
        ? await onCapture(value, snapshot)
        : await fetch("/api/etude", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: value, snapshot }),
          }).then(async (res) => {
            if (!res.ok) return false;
            const json = (await res.json().catch(() => null)) as { ok?: boolean } | null;
            return json?.ok === true;
          });
      if (!stored) throw new Error("capture non confirmée");
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071a33]/70 p-4 print:hidden"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.titre}
        className="w-full max-w-md border border-sim-line border-t-4 border-t-sim-blue bg-white px-6 py-6"
      >
        <div className="flex items-start justify-between gap-4">
          <p className="text-lg font-black text-sim-ink">{t.titre}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="-mr-1 -mt-1 shrink-0 p-1 text-xl leading-none text-sim-muted transition-colors hover:text-sim-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sim-blue"
          >
            ×
          </button>
        </div>

        {state === "done" ? (
          <div className="mt-3">
            <p className="text-sm font-semibold text-sim-ink">{t.merci}</p>
            <p className="mt-2 text-xs leading-relaxed text-sim-muted">{t.merciSpam}</p>
            {onAudit && (
              <button
                type="button"
                onClick={onAudit}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 bg-sim-blue px-5 text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sim-blue"
              >
                {auditLabel ?? "Recevoir mon audit gratuit"}
                <span aria-hidden>→</span>
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm leading-relaxed text-sim-muted">{t.sousTitre}</p>
            <form onSubmit={submit} className="mt-4 flex flex-col gap-2">
              <input
                ref={inputRef}
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
                className="h-11 w-full appearance-none rounded-none border border-sim-line bg-white px-3 text-sm text-sim-ink outline-none placeholder:text-sim-muted focus:border-sim-blue"
              />
              <button
                type="submit"
                disabled={state === "sending"}
                className="h-11 w-full bg-sim-blue px-5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sim-blue"
              >
                {t.bouton}
              </button>
            </form>
            {state === "error" && (
              <p className="mt-2 text-xs font-semibold text-sim-ink">{t.erreur}</p>
            )}
            <p className="mt-4 border-t border-sim-line pt-3 text-xs leading-relaxed text-sim-muted">
              {t.spam}
            </p>
            {onAudit && (
              <button
                type="button"
                onClick={onAudit}
                className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs font-black uppercase tracking-[0.1em] text-sim-blue underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sim-blue"
              >
                {auditLabel ?? "Recevoir mon audit gratuit"}
                <span aria-hidden>→</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
