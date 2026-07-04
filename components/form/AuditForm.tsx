"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { steps, form, TOTAL_STEPS, type Step } from "@/config/form";
import { site } from "@/config/site";
import { useAuditSession } from "@/hooks/useAuditSession";
import { Aurora } from "@/components/Aurora";
import { StepField } from "./StepField";
import { ProgressBar } from "./ProgressBar";

const EASE = [0.16, 1, 0.3, 1] as const;

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

export function AuditForm() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { progress, submit } = useAuditSession();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [direction, setDirection] = useState(1);

  const step = steps[index];
  const isLast = index === TOTAL_STEPS - 1;

  const setValue = useCallback((v: unknown) => {
    setError(null);
    setAnswers((prev) => ({ ...prev, [step.key]: v }));
  }, [step.key]);

  const commit = useCallback(
    (override?: unknown) => {
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
        submit(nextAnswers);
        setDone(true);
        window.setTimeout(
          () => router.push(form.redirectTo),
          reduce ? 300 : 1300
        );
        return;
      }

      progress(index + 1, nextAnswers);
      setDirection(1);
      setIndex((i) => i + 1);
    },
    [answers, step, isLast, index, submit, progress, router, reduce]
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

  return (
    <main className="relative flex min-h-[100svh] flex-col overflow-hidden px-5 py-6 sm:px-8">
      <Aurora />
      <div
        aria-hidden
        className="glow-honey pointer-events-none absolute left-1/2 top-0 -z-10 h-[90vmin] w-[90vmin] -translate-x-1/2"
      />

      {/* En-tête : logo + progression */}
      <header className="mx-auto w-full max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            {site.name}
            <span className="text-primary">.</span>
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            {form.title}
          </span>
        </div>
        {!done && <ProgressBar current={index + 1} total={TOTAL_STEPS} />}
      </header>

      {/* Corps */}
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-8">
        {done ? (
          <DoneScreen />
        ) : (
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={index}
              custom={direction}
              initial={reduce ? false : { opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <p className="mb-2 font-display text-sm font-semibold text-electric">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h1 className="mb-2 font-display text-2xl leading-tight text-ink sm:text-3xl">
                {step.question}
              </h1>
              {step.help && (
                <p className="mb-6 text-sm text-muted">{step.help}</p>
              )}
              {!step.help && <div className="mb-6" />}

              <StepField
                key={step.key}
                step={step}
                value={value}
                onChange={setValue}
                onCommit={(v?: unknown) => commit(v)}
                autoFocus
              />

              {error && (
                <p className="mt-3 text-sm font-medium text-accent">{error}</p>
              )}

              {/* Navigation */}
              <div className="mt-8 flex items-center gap-3">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={back}
                    className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-muted transition-colors hover:border-ink hover:text-ink"
                  >
                    Précédent
                  </button>
                )}
                {showNextButton && (
                  <button
                    type="button"
                    onClick={() => commit()}
                    className="btn-shine inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_oklch(0.67_0.15_64/0.6)]"
                  >
                    {isLast ? form.submitLabel : isEmptyOptional ? "Passer" : "Continuer"}
                  </button>
                )}
              </div>
              {!showNextButton && (
                <p className="mt-4 text-xs text-muted">
                  Sélectionne une réponse pour continuer.
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </main>
  );
}

function DoneScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="text-center"
    >
      <div className="mx-auto mb-6 grid size-16 place-items-center rounded-full bg-electric/10">
        <svg viewBox="0 0 24 24" fill="none" className="size-8 text-electric">
          <path
            d="M5 12.5 10 17l9-10"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1 className="mb-2 font-display text-2xl text-ink sm:text-3xl">
        Merci, c'est enregistré.
      </h1>
      <p className="text-muted">On prépare ton audit… redirection en cours.</p>
    </motion.div>
  );
}
