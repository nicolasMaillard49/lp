"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  form,
  steps as allSteps,
  visibleSteps,
  type Known,
  type Step,
} from "@/config/form";
import { site } from "@/config/site";
import { fbTrack } from "@/lib/fpixel";
import { useAuditSession } from "@/hooks/useAuditSession";
import { StepField } from "./StepField";
import { ProgressBar } from "./ProgressBar";

/**
 * Passe le contact à /bienvenue via sessionStorage (même domaine) —
 * BookingEmbed y préremplit le calendrier Koalendar. Pas d'URL : on ne
 * met jamais un email en query string.
 */
function stashContact(answers: Record<string, unknown>) {
  try {
    sessionStorage.setItem(
      "nmf_contact",
      JSON.stringify({
        name: answers.nom_prenom ? String(answers.nom_prenom) : undefined,
        email: answers.email ? String(answers.email) : undefined,
      })
    );
  } catch {
    // sessionStorage indisponible → calendrier non prérempli, pas bloquant
  }
}

const EASE = [0.16, 1, 0.3, 1] as const;

/** Ce que le simulateur a déjà appris — réaffiché pendant tout le form. */
export type Recap = {
  /** "Plombier · Bordeaux · 600 €/mois" */
  title: string;
  /** "14 chantiers/mois · 7 000 € de CA estimé" */
  detail?: string;
  /** Renvoie au simulateur pour corriger. */
  onEdit?: () => void;
};

/** Taille de la question (Fraunces) selon sa longueur, pour rester net à l'écran. */
function questionSizeClass(q: string): string {
  const n = q.length;
  if (n <= 28) return "text-4xl sm:text-5xl";
  if (n <= 48) return "text-3xl sm:text-4xl";
  if (n <= 80) return "text-[1.75rem] leading-tight sm:text-[2rem]";
  if (n <= 120) return "text-2xl leading-snug sm:text-[1.7rem]";
  return "text-xl leading-snug sm:text-2xl";
}

function validate(step: Step, value: unknown): string | null {
  if (step.type === "stars") {
    return typeof value === "number" ? null : "Choisis une note.";
  }
  if (step.type === "yesno") {
    return typeof value === "boolean" ? null : "Choisis une réponse.";
  }
  const str = value == null ? "" : String(value).trim();
  if (!step.required) return null;
  if (!str) return "Ce champ est requis.";
  if (step.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
    return "Adresse email invalide.";
  }
  if (step.type === "tel" && str.replace(/\D/g, "").length < 10) {
    return "Numéro de téléphone invalide.";
  }
  return null;
}

export function AuditForm({
  known = {},
  recap,
}: {
  /** Réponses déjà obtenues ailleurs (simulateur) — ces écrans sautent. */
  known?: Known;
  recap?: Recap;
}) {
  const reduce = useReducedMotion();
  const { progress, submit } = useAuditSession();

  /* La longueur du form se déduit de `known` : court sur le parcours ads
     (le simulateur a déjà parlé), complet en organique. */
  const steps = useMemo(() => visibleSteps(known), [known]);
  const total = steps.length;

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState(1);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const step = steps[index];
  const isLast = index === total - 1;

  const setValue = useCallback((v: unknown) => {
    setError(null);
    setAnswers((prev) => ({ ...prev, [step.key]: v }));
  }, [step.key]);

  const commit = useCallback(
    (override?: unknown) => {
      if (submitting) return;
      const value = override !== undefined ? override : answers[step.key];
      const nextAnswers =
        override !== undefined ? { ...answers, [step.key]: override } : answers;

      const err = validate(step, value);
      if (err) {
        setError(err);
        return;
      }
      setError(null);

      /* Ce que le simulateur sait fait partie du lead, pas juste de l'UI. */
      const payload = { ...known, ...nextAnswers };

      if (isLast) {
        setSubmitting(true);
        submit(payload);
        /* Signal d'intention pour Meta — le Lead, lui, se déclenche à
           l'arrivée sur /bienvenue (TrackLead), même domaine : aucune
           dépendance à un outil tiers pour la conversion. */
        fbTrack("SubmitApplication");
        stashContact(payload);
        setDone(true);
        /* Le lead est en base ; le créneau se choisit sur /bienvenue
           (calendrier Koalendar intégré, prérempli via stashContact). */
        window.setTimeout(
          () => window.location.assign(form.redirectTo),
          reduce ? 400 : 1600
        );
        return;
      }

      /* `last_step` doit rester comparable entre parcours : on remonte la
         position CANONIQUE de la question (config), pas l'index visible —
         sinon l'étape 3 du parcours ads et celle de l'organique seraient
         deux questions différentes dans le funnel d'abandon de /admin. */
      const canonical = allSteps.findIndex((s) => s.key === step.key) + 1;
      progress(canonical, payload);
      setDirection(1);
      setIndex((i) => i + 1);
    },
    [answers, step, isLast, index, submitting, submit, progress, reduce, known]
  );

  const back = useCallback(() => {
    setError(null);
    setDirection(-1);
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const value = answers[step.key];
  const isEmptyOptional =
    !step.required &&
    (step.type === "text" || step.type === "email" || step.type === "tel") &&
    (value == null || String(value).trim() === "");
  const showNextButton =
    step.type === "text" || step.type === "email" || step.type === "tel";

  /* Le disclaimer filtre — il ne sert qu'au moment d'engager, pas en
     accueil d'un inconnu qui n'a encore rien lu. */
  const showFilter = !done && step.phase === "contact" && showDisclaimer;

  return (
    <main className="mx-auto flex min-h-[100svh] w-full max-w-2xl flex-col px-5 py-8 sm:px-6">
      {/* En-tête : marque + progression */}
      <header>
        <div className="mb-6 flex items-center justify-between">
          <span className="font-helvetica text-lg font-bold tracking-tight text-ink">
            {site.name}
            <span className="text-primary">.</span>
          </span>
          <span className="hidden text-xs font-medium uppercase tracking-wide text-muted sm:inline">
            {form.title}
          </span>
        </div>

        {!done && <ProgressBar current={index + 1} total={total} />}

        {/* Ce qu'on sait déjà — montré, pas sauté en silence : sinon
            l'artisan ne perçoit pas qu'on a retenu ses réponses. */}
        {!done && recap && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/[0.04] px-4 py-3">
            <svg viewBox="0 0 16 16" className="mt-0.5 size-4 shrink-0 text-primary" fill="none" aria-hidden>
              <path d="M3.5 8.2 6.5 11l6-6.6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{recap.title}</p>
              {recap.detail && (
                <p className="mt-0.5 text-xs text-muted">{recap.detail}</p>
              )}
            </div>
            {recap.onEdit && (
              <button
                type="button"
                onClick={recap.onEdit}
                className="shrink-0 text-xs font-semibold text-primary underline-offset-2 hover:underline"
              >
                Modifier
              </button>
            )}
          </div>
        )}

        {showFilter && (
          <div className="mt-4 flex items-start gap-2.5 border-t border-border pt-4 text-xs leading-relaxed text-muted">
            <svg viewBox="0 0 20 20" className="mt-px size-4 shrink-0 text-accent" fill="none" aria-hidden>
              <path d="M10 2.5 18.5 17H1.5L10 2.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M10 8v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="10" cy="14.5" r="0.5" fill="currentColor" />
            </svg>
            <p className="min-w-0 flex-1">
              <span className="font-semibold text-ink">{form.disclaimerTitle}</span>{" "}
              {form.disclaimer}
            </p>
            <button
              type="button"
              onClick={() => setShowDisclaimer(false)}
              aria-label="Masquer l'avertissement"
              className="-mt-1 -mr-1 grid size-6 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-surface hover:text-ink"
            >
              <svg viewBox="0 0 16 16" fill="none" className="size-3.5">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
      </header>

      {/* Corps : une question par écran */}
      <div className="flex flex-1 flex-col justify-center py-12">
        {done ? (
          <DoneScreen reduce={!!reduce} />
        ) : (
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={index}
              custom={direction}
              initial={reduce ? false : { opacity: 0, x: direction * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: direction * -24 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <div className="mb-8">
                <h1
                  className={`font-helvetica font-bold tracking-tight text-balance text-ink ${questionSizeClass(step.question)}`}
                >
                  {step.question}
                </h1>
                {step.help && (
                  <p className="mt-3 max-w-prose text-sm text-ink/70">{step.help}</p>
                )}
              </div>

              <StepField
                key={step.key}
                step={step}
                value={value}
                onChange={setValue}
                onCommit={(v?: unknown) => commit(v)}
                autoFocus
              />

              {error && (
                <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-accent" role="alert">
                  <svg viewBox="0 0 16 16" className="size-4 shrink-0" fill="currentColor" aria-hidden>
                    <path d="M8 1.5 15 14H1L8 1.5Zm0 4.5v3.2M8 11.2v.1" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                  </svg>
                  {error}
                </p>
              )}

              {/* Navigation */}
              <div className="mt-10 flex items-center gap-5">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={back}
                    className="text-sm font-medium text-muted transition-colors hover:text-ink"
                  >
                    Précédent
                  </button>
                )}
                {showNextButton && (
                  <button
                    type="button"
                    onClick={() => commit()}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[oklch(0.61_0.15_64)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
                  >
                    {isLast ? form.submitLabel : isEmptyOptional ? "Passer" : "Continuer"}
                    <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden>
                      <path d="M3 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
                {!showNextButton && (
                  <p className="text-xs text-muted">
                    Sélectionne une réponse pour continuer.
                  </p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <footer className="flex justify-center pt-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-nmf-96.png" alt="NMF Agence" className="h-8 w-auto opacity-60" />
      </footer>
    </main>
  );
}

function DoneScreen({ reduce }: { reduce: boolean }) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="text-center"
    >
      <div className="mx-auto mb-6 grid size-14 place-items-center rounded-full bg-primary/10">
        <svg viewBox="0 0 24 24" fill="none" className="size-7 text-primary">
          <path d="M5 12.5 10 17l9-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="mb-2 font-helvetica text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        Merci, c'est enregistré.
      </h1>
      <p className="text-muted">
        Dernière étape : choisis ton créneau — on t'y emmène.
      </p>
    </motion.div>
  );
}
