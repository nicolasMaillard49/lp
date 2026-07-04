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

/** Taille de police du titre selon la longueur de la question, pour rester compact. */
function questionSizeClass(q: string): string {
  const n = q.length;
  if (n <= 32) return "text-4xl sm:text-6xl";
  if (n <= 55) return "text-3xl sm:text-5xl";
  if (n <= 85) return "text-[1.7rem] leading-tight sm:text-4xl";
  return "text-2xl leading-snug sm:text-[2rem]";
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

export function AuditForm() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { progress, submit } = useAuditSession();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [direction, setDirection] = useState(1);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

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

        {!done && showDisclaimer && (
          <div className="relative mt-4 flex items-start gap-3 rounded-xl border border-accent/40 bg-accent/5 px-4 py-3 pr-10">
            <svg
              viewBox="0 0 20 20"
              className="mt-0.5 size-5 shrink-0 text-accent"
              fill="none"
              aria-hidden
            >
              <path
                d="M10 2.5 18.5 17H1.5L10 2.5Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M10 8v4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle cx="10" cy="14.5" r="0.4" fill="currentColor" stroke="currentColor" strokeWidth="0.8" />
            </svg>
            <p className="text-xs leading-relaxed text-ink sm:text-sm">
              <span className="font-bold text-accent">{form.disclaimerTitle}</span>{" "}
              {form.disclaimer}
            </p>
            <button
              type="button"
              onClick={() => setShowDisclaimer(false)}
              aria-label="Fermer l'avertissement"
              className="absolute right-2 top-2 grid size-7 place-items-center rounded-full text-accent/70 transition-colors hover:bg-accent/10 hover:text-accent"
            >
              <svg viewBox="0 0 16 16" fill="none" className="size-4">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        )}
      </header>

      {/* Corps */}
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-start pt-10 pb-8 sm:pt-16">
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
              <div className="relative isolate mb-8 py-4">
                {/* Halo vert, même style doux que les halos orange de l'aurora */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-x-12 -inset-y-16 -z-10 rounded-full blur-[90px]"
                  style={{
                    background:
                      "radial-gradient(62% 60% at 40% 42%, oklch(0.72 0.19 150 / 0.62), oklch(0.72 0.19 150 / 0) 72%)",
                  }}
                />
                <p className="mb-3 font-helvetica text-sm font-bold text-white/70">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h1
                  className={`font-helvetica font-bold text-balance text-white [text-shadow:0_2px_20px_oklch(0.3_0.12_240/0.6)] ${questionSizeClass(step.question)}`}
                >
                  {step.question}
                </h1>
                {step.help && (
                  <p className="mt-2 text-sm text-white/75 [text-shadow:0_1px_12px_oklch(0.3_0.1_240/0.5)]">
                    {step.help}
                  </p>
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

      {/* Logo NMF (favicon) en bas au centre */}
      <footer className="mx-auto mt-4 flex w-full justify-center pb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-nmf.png"
          alt="NMF Agence"
          className="h-10 w-auto opacity-85"
        />
      </footer>
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
