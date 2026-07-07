"use client";

import { useState } from "react";
import type { Step } from "@/config/form";

interface Props {
  step: Step;
  value: unknown;
  onChange: (value: unknown) => void;
  /** Valider et passer à l'étape suivante (auto-advance / Entrée).
   *  On passe la valeur choisie pour éviter de lire un état encore périmé. */
  onCommit: (value?: unknown) => void;
  autoFocus?: boolean;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function StepField({ step, value, onChange, onCommit, autoFocus }: Props) {
  switch (step.type) {
    case "text":
    case "email":
    case "tel":
      return (
        <TextField
          step={step}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          onCommit={onCommit}
          autoFocus={autoFocus}
        />
      );
    case "select":
      return (
        <ChoiceGrid
          options={step.options ?? []}
          value={value}
          columns={2}
          letters
          onPick={(v) => {
            onChange(v);
            onCommit(v);
          }}
        />
      );
    case "choice":
      return (
        <ChoiceGrid
          options={step.options ?? []}
          value={value}
          columns={1}
          letters
          onPick={(v) => {
            onChange(v);
            onCommit(v);
          }}
        />
      );
    case "yesno":
      return (
        <ChoiceGrid
          options={["Oui", "Non"]}
          value={value === true ? "Oui" : value === false ? "Non" : undefined}
          columns={2}
          onPick={(v) => {
            const bool = v === "Oui";
            onChange(bool);
            onCommit(bool);
          }}
        />
      );
    case "stars":
      return (
        <Stars
          value={typeof value === "number" ? value : null}
          onPick={(v) => {
            onChange(v);
            onCommit(v);
          }}
        />
      );
    default:
      return null;
  }
}

function TextField({
  step,
  value,
  onChange,
  onCommit,
  autoFocus,
}: {
  step: Step;
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
  autoFocus?: boolean;
}) {
  const inputType =
    step.type === "email" ? "email" : step.type === "tel" ? "tel" : "text";
  const autoComplete =
    step.type === "email"
      ? "email"
      : step.type === "tel"
        ? "tel"
        : step.key === "nom_prenom"
          ? "name"
          : step.key === "ville"
            ? "address-level2"
            : "off";
  return (
    <input
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus={autoFocus}
      type={inputType}
      inputMode={step.type === "tel" ? "tel" : undefined}
      autoComplete={autoComplete}
      value={value}
      placeholder={step.placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onCommit();
        }
      }}
      className="h-16 w-full rounded-xl border border-border bg-surface px-5 text-xl text-ink outline-none transition-all duration-200 placeholder:text-muted/45 focus:border-primary focus:bg-bg focus:shadow-[0_0_0_3px_oklch(0.67_0.15_64/0.15)]"
    />
  );
}

function ChoiceGrid({
  options,
  value,
  onPick,
  columns = 2,
  letters = false,
}: {
  options: readonly string[];
  value: unknown;
  onPick: (v: string) => void;
  columns?: 1 | 2;
  letters?: boolean;
}) {
  return (
    <div
      className={`grid gap-2.5 ${columns === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}
    >
      {options.map((opt, i) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={selected}
            onClick={() => onPick(opt)}
            className={`group flex min-h-14 items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors duration-150 ${
              selected
                ? "border-primary bg-primary/[0.06]"
                : "border-border hover:border-ink/30"
            }`}
          >
            {letters && (
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-md border text-xs font-semibold transition-colors ${
                  selected
                    ? "border-primary bg-primary text-white"
                    : "border-border text-muted group-hover:border-ink/30"
                }`}
                aria-hidden
              >
                {LETTERS[i] ?? "•"}
              </span>
            )}
            <span className="flex-1 text-base font-medium text-ink">{opt}</span>
            <span
              className={`shrink-0 text-primary transition-opacity ${selected ? "opacity-100" : "opacity-0"}`}
              aria-hidden
            >
              <svg viewBox="0 0 16 16" fill="none" className="size-4">
                <path
                  d="M3.5 8.2 6.5 11l6-6.6"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        );
      })}
    </div>
  );
}

const STAR_LABELS = ["Aucune", "Débutant", "Notions", "À l'aise", "Avancé", "Expert"];

function Stars({
  value,
  onPick,
}: {
  value: number | null;
  onPick: (v: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value ?? 0;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <div
          className="flex items-center gap-1.5"
          onMouseLeave={() => setHover(null)}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
              onMouseEnter={() => setHover(n)}
              onFocus={() => setHover(n)}
              onClick={() => onPick(n)}
              className="rounded-md p-1 transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <svg
                viewBox="0 0 24 24"
                className={`size-10 transition-colors duration-150 ${
                  n <= active ? "text-primary" : "text-border"
                }`}
                fill="currentColor"
              >
                <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9L12 2.5z" />
              </svg>
            </button>
          ))}
        </div>
        <span className="min-w-20 text-base font-semibold text-ink">
          {STAR_LABELS[active] ?? ""}
        </span>
      </div>
      <button
        type="button"
        onClick={() => onPick(0)}
        className={`w-fit rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
          value === 0
            ? "border-primary bg-primary/[0.06] text-ink"
            : "border-border text-muted hover:border-ink/30 hover:text-ink"
        }`}
      >
        Aucune expérience
      </button>
    </div>
  );
}
