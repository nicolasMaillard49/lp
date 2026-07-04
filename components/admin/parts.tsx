import type { Bucket, FunnelStep, TimePoint, LeadRow } from "@/lib/statsTypes";

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
      className={`rounded-xl border p-4 ${
        accent ? "border-electric/40 bg-electric/5" : "border-border bg-surface"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function SectionCard({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg text-ink">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function BarList({ buckets }: { buckets: Bucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  if (!buckets.length) return <p className="text-sm text-muted">Aucune donnée.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {buckets.map((b) => (
        <li key={b.label} className="flex items-center gap-3">
          <span className="w-40 shrink-0 truncate text-sm text-ink" title={b.label}>
            {b.label}
          </span>
          <div className="h-5 flex-1 overflow-hidden rounded bg-surface-2">
            <div
              className="h-full rounded bg-[linear-gradient(90deg,oklch(0.83_0.155_78),oklch(0.58_0.22_252))]"
              style={{ width: `${(b.count / max) * 100}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-sm font-medium text-muted">
            {b.count}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function FunnelChart({ funnel }: { funnel: FunnelStep[] }) {
  const max = Math.max(1, ...funnel.map((f) => f.answered));
  return (
    <ul className="flex flex-col gap-2">
      {funnel.map((f) => {
        const pct = (f.answered / max) * 100;
        return (
          <li key={f.step} className="flex items-center gap-3">
            <span className="w-6 shrink-0 text-right text-xs font-semibold text-electric">
              {String(f.step).padStart(2, "0")}
            </span>
            <span
              className="w-56 shrink-0 truncate text-sm text-ink"
              title={f.label}
            >
              {f.label}
            </span>
            <div className="h-6 flex-1 overflow-hidden rounded bg-surface-2">
              <div
                className="flex h-full items-center justify-end rounded bg-[linear-gradient(90deg,oklch(0.83_0.155_78),oklch(0.67_0.15_64))] px-2"
                style={{ width: `${pct}%` }}
              >
                <span className="text-xs font-semibold text-white">{f.answered}</span>
              </div>
            </div>
            <span
              className="w-24 shrink-0 text-right text-xs text-muted"
              title="Abandons à cette étape"
            >
              {f.abandonHere > 0 ? `−${f.abandonHere} abandon${f.abandonHere > 1 ? "s" : ""}` : "—"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function TimeChart({ points }: { points: TimePoint[] }) {
  if (points.length < 2) {
    return <p className="text-sm text-muted">Pas encore assez de données.</p>;
  }
  const W = 720;
  const H = 160;
  const pad = 24;
  const maxY = Math.max(1, ...points.map((p) => Math.max(p.visits, p.submissions)));
  const x = (i: number) => pad + (i / (points.length - 1)) * (W - pad * 2);
  const y = (v: number) => H - pad - (v / maxY) * (H - pad * 2);
  const path = (key: "visits" | "submissions") =>
    points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ");

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full min-w-[560px]">
        <path d={path("visits")} fill="none" stroke="oklch(0.83 0.155 78)" strokeWidth="2" />
        <path
          d={path("submissions")}
          fill="none"
          stroke="oklch(0.58 0.22 252)"
          strokeWidth="2"
        />
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded bg-[oklch(0.83_0.155_78)]" /> Visites
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded bg-[oklch(0.58_0.22_252)]" /> Soumissions
        </span>
      </div>
    </div>
  );
}

export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  if (!leads.length) return <p className="text-sm text-muted">Aucun lead complété.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <th className="px-2 py-2">Date</th>
            <th className="px-2 py-2">Nom</th>
            <th className="px-2 py-2">Contact</th>
            <th className="px-2 py-2">Ville</th>
            <th className="px-2 py-2">Activité</th>
            <th className="px-2 py-2">CA → objectif</th>
            <th className="px-2 py-2">Problématique</th>
            <th className="px-2 py-2">Seul ?</th>
            <th className="px-2 py-2">Digital</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l, i) => (
            <tr key={i} className="border-b border-border/50 align-top">
              <td className="whitespace-nowrap px-2 py-2 text-muted">
                {l.created_at.slice(0, 10)}
              </td>
              <td className="px-2 py-2 font-medium text-ink">{l.nom_prenom}</td>
              <td className="px-2 py-2 text-muted">
                <div>{l.email}</div>
                <div>{l.telephone}</div>
              </td>
              <td className="px-2 py-2 text-muted">{l.ville}</td>
              <td className="px-2 py-2 text-muted">{l.activite}</td>
              <td className="px-2 py-2 text-muted">
                {short(l.ca_actuel)} → {short(l.ca_objectif)}
              </td>
              <td className="px-2 py-2 text-muted">{l.problematique}</td>
              <td className="px-2 py-2 text-muted">
                {l.reglable_seul == null ? "—" : l.reglable_seul ? "Oui" : "Non"}
              </td>
              <td className="px-2 py-2 text-muted">
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
  return v.replace(/\s*€\s*\/\s*mois/, "").replace(/\s*€/, "");
}
