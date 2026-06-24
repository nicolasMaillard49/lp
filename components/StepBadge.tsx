import { site } from "@/config/site";

/** Badge numéroté « Étape N / total » — la colonne vertébrale du flow. */
export function StepBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-2.5 rounded-full border border-border bg-surface py-1.5 pl-1.5 pr-4 text-xs font-bold uppercase tracking-widest text-primary">
      <span className="flex size-6 items-center justify-center rounded-full bg-primary font-display text-[11px] text-white">
        {n}
      </span>
      Étape {n} / {site.totalSteps}
    </span>
  );
}
