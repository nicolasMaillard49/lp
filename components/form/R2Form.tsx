"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { stepsR2, formR2, TOTAL_STEPS_R2 } from "@/config/form-r2";
import type { Step } from "@/config/form";
import { site } from "@/config/site";
import { useAuditSession } from "@/hooks/useAuditSession";
import { fbTrackCustom } from "@/lib/fpixel";
import { StepField } from "./StepField";
import { ProgressBar } from "./ProgressBar";

const EASE = [0.16, 1, 0.3, 1] as const;

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
  if (step.type === "scale") {
    return typeof value === "number" ? null : "Choisis une note.";
  }
  if (step.type === "yesno") {
    return typeof value === "boolean" ? null : "Choisis une réponse.";
  }
  const str = value == null ? "" : String(value).trim();
  if (!step.required) return null;
  if (!str) return "Ce champ est requis.";
  return null;
}

/** Questionnaire de préparation du R2 — même mécanique que le formulaire R1. */
export function R2Form() {
  const reduce = useReducedMotion();
  const { progress, submit } = useAuditSession("/api/r2");

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState(1);

  const step = stepsR2[index];
  const isLast = index === TOTAL_STEPS_R2 - 1;

  const setValue = useCallback(
    (v: unknown) => {
      setError(null);
      setAnswers((prev) => ({ ...prev, [step.key]: v }));
    },
    [step.key]
  );

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

      if (isLast) {
        setSubmitting(true);
        submit(nextAnswers);
        fbTrackCustom("QuestionnaireR2");
        setDone(true);
        return;
      }

      progress(index + 1, nextAnswers);
      setDirection(1);
      setIndex((i) => i + 1);
    },
    [answers, step, isLast, index, submitting, submit, progress]
  );

  const back = useCallback(() => {
    setError(null);
    setDirection(-1);
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const value = answers[step.key];
  const isEmptyOptional =
    !step.required &&
    (step.type === "text" || step.type === "textarea") &&
    (value == null || String(value).trim() === "");
  const showNextButton =
    step.type === "text" ||
    step.type === "email" ||
    step.type === "tel" ||
    step.type === "textarea";

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
            {formR2.title}
          </span>
        </div>

        {!done && <ProgressBar current={index + 1} total={TOTAL_STEPS_R2} />}
      </header>

      {/* Corps : une question par écran */}
      <div className="flex flex-1 flex-col justify-center py-12">
        {done ? (
          <DoneScreen reduce={!!reduce} />
        ) : (
          <AnimatePresence mode="wait" custom={direction}>
            <m.div
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
                    {isLast ? formR2.submitLabel : isEmptyOptional ? "Passer" : "Continuer"}
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
            </m.div>
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
    <m.div
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
        C'est noté, merci.
      </h1>
      <p className="mx-auto max-w-md text-muted">
        Tout est prêt pour notre rendez-vous. Si une question te vient d'ici
        là, note-la — on la traitera en premier.
      </p>
      <a
        href="/preparation"
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary"
      >
        <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden>
          <path d="M13 8H4M7.5 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Revenir à la présentation
      </a>
    </m.div>
  );
}
