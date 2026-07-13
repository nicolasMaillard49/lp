import { r2 } from "@/config/r2";

/** Badge numéroté « Étape N / total » — version LP R2 (accent électrique). */
export function StepBadgeR2({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-2.5 rounded-full border border-border bg-surface py-1.5 pl-1.5 pr-4 text-xs font-bold uppercase tracking-widest text-electric">
      <span className="flex size-6 items-center justify-center rounded-full bg-electric font-display text-[11px] text-white">
        {n}
      </span>
      Étape {n} / {r2.totalSteps}
    </span>
  );
}
