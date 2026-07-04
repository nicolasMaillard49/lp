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
  return (
    <input
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus={autoFocus}
      type={inputType}
      inputMode={step.type === "tel" ? "tel" : undefined}
      value={value}
      placeholder={step.placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onCommit();
        }
      }}
      className="w-full border-b-2 border-border bg-transparent pb-3 text-2xl text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-electric sm:text-3xl"
    />
  );
}

function ChoiceGrid({
  options,
  value,
  onPick,
  columns = 2,
}: {
  options: readonly string[];
  value: unknown;
  onPick: (v: string) => void;
  columns?: 1 | 2;
}) {
  return (
    <div
      className={`grid gap-3 ${columns === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}
    >
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onPick(opt)}
            className={`group flex items-center justify-between gap-3 rounded-xl border px-5 py-4 text-left text-base font-medium transition-all ${
              selected
                ? "border-electric bg-electric/5 text-ink"
                : "border-border bg-surface text-ink hover:border-electric/60 hover:bg-electric/5"
            }`}
          >
            <span>{opt}</span>
            <span
              className={`grid size-5 shrink-0 place-items-center rounded-full border transition-colors ${
                selected
                  ? "border-electric bg-electric text-white"
                  : "border-border text-transparent group-hover:border-electric/60"
              }`}
              aria-hidden
            >
              <svg viewBox="0 0 16 16" fill="none" className="size-3">
                <path
                  d="M4 8.2 6.5 11l6-6.5"
                  stroke="currentColor"
                  strokeWidth="2"
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2" onMouseLeave={() => setHover(null)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onClick={() => onPick(n)}
            className="transition-transform hover:scale-110"
          >
            <svg
              viewBox="0 0 24 24"
              className={`size-10 transition-colors ${
                n <= active ? "text-electric" : "text-border"
              }`}
              fill="currentColor"
            >
              <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9L12 2.5z" />
            </svg>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onPick(0)}
        className={`w-fit rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
          value === 0
            ? "border-electric bg-electric/5 text-ink"
            : "border-border text-muted hover:border-electric/60"
        }`}
      >
        Aucune expérience
      </button>
    </div>
  );
}
