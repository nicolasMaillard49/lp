import type { Bucket, FunnelStep, TimePoint, LeadRow } from "@/lib/statsTypes";

// Palette admin (façon Tally : blanc, neutre, une touche ambre NMF).
const BAR_BG = "oklch(0.955 0.006 80)";
const BAR_FILL = "oklch(0.9 0.05 75)";

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-5 py-4 transition-colors ${
        accent ? "border-primary/25 bg-primary/[0.04]" : "border-border bg-white"
      }`}
    >
      <p className="font-sans text-[0.7rem] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className={`mt-1.5 font-sans text-3xl font-semibold tracking-tight tabular-nums ${
          accent ? "text-primary" : "text-ink"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 font-sans text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  children,
  right,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-sans text-base font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 font-sans text-xs text-muted">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

/** Barres horizontales façon Tally : le label est DANS une barre grise proportionnelle. */
export function BarList({ buckets }: { buckets: Bucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const total = buckets.reduce((s, b) => s + b.count, 0);
  if (!buckets.length) return <p className="font-sans text-sm text-muted">Aucune donnée.</p>;
  return (
    <ul className="flex flex-col gap-2.5">
      {buckets.map((b) => {
        const pct = (b.count / max) * 100;
        const share = total ? Math.round((b.count / total) * 100) : 0;
        return (
          <li key={b.label} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div
                className="flex h-9 items-center rounded-md px-3"
                style={{
                  width: `max(${pct}%, 7rem)`,
                  background: b.count ? BAR_FILL : BAR_BG,
                }}
              >
                <span className="truncate font-sans text-sm text-ink" title={b.label}>
                  {b.label}
                </span>
              </div>
            </div>
            <span className="w-16 shrink-0 text-right font-sans text-sm tabular-nums text-muted">
              {b.count}
              <span className="ml-1 text-xs text-muted/70">{share}%</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Funnel drop-off : une ligne par question, barre proportionnelle + abandons. */
export function FunnelChart({ funnel }: { funnel: FunnelStep[] }) {
  const max = Math.max(1, ...funnel.map((f) => f.answered));
  return (
    <ul className="flex flex-col gap-1.5">
      {funnel.map((f) => {
        const pct = (f.answered / max) * 100;
        return (
          <li key={f.step} className="flex items-center gap-3">
            <span className="w-5 shrink-0 text-right font-sans text-xs tabular-nums text-muted">
              {f.step}
            </span>
            <div className="min-w-0 flex-1">
              <p className="mb-1 truncate font-sans text-xs text-muted" title={f.label}>
                {f.label}
              </p>
              <div className="h-7 overflow-hidden rounded-md" style={{ background: BAR_BG }}>
                <div
                  className="flex h-full items-center rounded-md px-2"
                  style={{ width: `max(${pct}%, 2rem)`, background: BAR_FILL }}
                >
                  <span className="font-sans text-xs font-semibold tabular-nums text-ink">
                    {f.answered}
                  </span>
                </div>
              </div>
            </div>
            <span className="flex w-24 shrink-0 items-center justify-end gap-1 font-sans text-xs text-accent">
              {f.abandonHere > 0 && (
                <>
                  <svg viewBox="0 0 12 12" className="size-3" fill="none" aria-hidden>
                    <path
                      d="M6 2v6m0 0L3.5 5.5M6 8l2.5-2.5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {f.abandonHere} abandon{f.abandonHere > 1 ? "s" : ""}
                </>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Donut de note moyenne (étoiles), façon Tally. */
export function RatingDonut({ average, count }: { average: number; count: number }) {
  const pct = Math.max(0, Math.min(100, (average / 5) * 100));
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div
        className="grid size-40 place-items-center rounded-full"
        style={{
          background: `conic-gradient(oklch(0.83 0.155 78) ${pct}%, ${BAR_BG} 0)`,
        }}
      >
        <div className="grid size-28 place-items-center rounded-full bg-white text-center">
          <div>
            <div className="font-sans text-3xl font-semibold text-ink">
              {average.toFixed(1)}
            </div>
            <div className="font-sans text-xs text-muted">/ 5 moyenne</div>
          </div>
        </div>
      </div>
      <p className="font-sans text-xs text-muted">{count} réponse{count > 1 ? "s" : ""}</p>
    </div>
  );
}

export function TimeChart({ points }: { points: TimePoint[] }) {
  if (points.length < 2) {
    return <p className="font-sans text-sm text-muted">Pas encore assez de données.</p>;
  }
  const W = 720;
  const H = 160;
  const pad = 20;
  const maxY = Math.max(1, ...points.map((p) => Math.max(p.visits, p.submissions)));
  const x = (i: number) => pad + (i / (points.length - 1)) * (W - pad * 2);
  const y = (v: number) => H - pad - (v / maxY) * (H - pad * 2);
  const line = (key: "visits" | "submissions") =>
    points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ");
  const area = (key: "visits" | "submissions") =>
    `${line(key)} L${x(points.length - 1).toFixed(1)},${H - pad} L${x(0).toFixed(1)},${H - pad} Z`;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full min-w-[560px]">
        <path d={area("visits")} fill="oklch(0.83 0.155 78 / 0.12)" stroke="none" />
        <path d={line("visits")} fill="none" stroke="oklch(0.7 0.14 70)" strokeWidth="2" />
        <path d={line("submissions")} fill="none" stroke="oklch(0.58 0.22 252)" strokeWidth="2" />
      </svg>
      <div className="mt-2 flex gap-4 font-sans text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded bg-[oklch(0.7_0.14_70)]" /> Visites
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded bg-[oklch(0.58_0.22_252)]" /> Soumissions
        </span>
      </div>
    </div>
  );
}

export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  if (!leads.length) return <p className="font-sans text-sm text-muted">Aucun lead complété.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-left font-sans text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium text-muted">
            <th className="px-3 py-2.5">Date</th>
            <th className="px-3 py-2.5">Nom</th>
            <th className="px-3 py-2.5">Contact</th>
            <th className="px-3 py-2.5">Ville</th>
            <th className="px-3 py-2.5">Activité</th>
            <th className="px-3 py-2.5">CA → objectif</th>
            <th className="px-3 py-2.5">Problématique</th>
            <th className="px-3 py-2.5">Seul ?</th>
            <th className="px-3 py-2.5">Digital</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l, i) => (
            <tr
              key={i}
              className="border-b border-border/60 align-top transition-colors hover:bg-surface/60"
            >
              <td className="whitespace-nowrap px-3 py-2.5 text-muted tabular-nums">
                {l.created_at.slice(0, 10)}
              </td>
              <td className="px-3 py-2.5 font-medium text-ink">{l.nom_prenom}</td>
              <td className="px-3 py-2.5 text-muted">
                <div>{l.email}</div>
                <div className="tabular-nums">{l.telephone}</div>
              </td>
              <td className="px-3 py-2.5 text-muted">{l.ville}</td>
              <td className="px-3 py-2.5 text-muted">{l.activite}</td>
              <td className="px-3 py-2.5 text-muted">
                {short(l.ca_actuel)} → {short(l.ca_objectif)}
              </td>
              <td className="px-3 py-2.5 text-muted">{l.problematique}</td>
              <td className="px-3 py-2.5">
                {l.reglable_seul == null ? (
                  <span className="text-muted">—</span>
                ) : (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      l.reglable_seul
                        ? "bg-surface-2 text-muted"
                        : "bg-electric/10 text-electric"
                    }`}
                  >
                    {l.reglable_seul ? "Oui" : "Non"}
                  </span>
                )}
              </td>
              <td className="px-3 py-2.5 text-muted tabular-nums">
                {l.experience_digital == null ? "—" : `${l.experience_digital}★`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function short(v: string | null): string {
  if (!v) return "—";
  return v.replace(/\s*€\s*\/\s*mois/, "").replace(/\s*€/, "").trim();
}
