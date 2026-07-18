import type {
  ActivationFunnelStep,
  Bucket,
  EstimateRow,
  FunnelStep,
  LeadRow,
  R2LeadRow,
  TimePoint,
} from "@/lib/statsTypes";
import { Check, Trash2, X } from "lucide-react";
import { useState } from "react";

// Palette admin alignée sur le simulateur : bleu/blanc, Helvetica, traits nets.
export const BERRY = {
  bg: "#f7f9fc",
  paper: "#ffffff",
  divider: "#d8e3f2",
  ink: "#071a33",
  muted: "#607089",
  primary: "#075ad8",
  primaryDark: "#071a33",
  primary800: "#0a2b5c",
  primaryLight: "#eaf2ff",
  primary200: "#9db1cc",
  secondary: "#075ad8",
  secondaryDark: "#075ad8",
  secondary800: "#071a33",
  secondaryLight: "#eaf2ff",
  warningLight: "#eef5ff",
  warningDark: "#075ad8",
  error: "#b42318",
  success: "#067647",
};

/* ────────────────────────────────────────────────────────────
 * Cartes KPI « Berry » — dégradé violet/bleu + cercles décoratifs
 * (la signature visuelle du template).
 * ──────────────────────────────────────────────────────────── */
export function GradientCard({
  label,
  value,
  sub,
  variant = "purple",
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  variant?: "purple" | "blue";
  icon: React.ReactNode;
}) {
  const bg = variant === "purple" ? BERRY.primaryDark : BERRY.primary;
  const circle = variant === "purple" ? BERRY.primary800 : "#0b66ec";
  const labelColor = variant === "purple" ? "#c7d4e7" : "#ffffff";
  return (
    <div
      className="relative overflow-hidden rounded-lg border p-5"
      style={{ background: bg, color: "#fff" }}
    >
      {/* Cercles décoratifs Berry (coin haut-droit) */}
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{ width: 210, height: 210, top: -85, right: -95, background: circle, opacity: 0.48 }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{ width: 210, height: 210, top: -125, right: -15, background: circle, opacity: 0.36 }}
      />
      <div className="relative">
        <div
          className="grid size-11 place-items-center border border-white/25 bg-white/10"
        >
          {icon}
        </div>
        <p className="mt-4 text-4xl font-black leading-none tabular-nums">{value}</p>
        <p className="mt-2 text-sm font-bold" style={{ color: labelColor }}>
          {label}
        </p>
        {sub && (
          <p className="mt-0.5 text-xs" style={{ color: labelColor }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

/** Petite carte sombre (violet) — TotalIncomeDarkCard de Berry. */
export function SmallDarkCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div
      className="relative overflow-hidden rounded-lg border p-4"
      style={{ background: BERRY.primaryDark, color: "#fff" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{ width: 160, height: 160, top: -95, right: -70, background: BERRY.primary800, opacity: 0.55 }}
      />
      <div className="relative flex items-center gap-4">
        <div className="grid size-11 shrink-0 place-items-center border border-white/25 bg-white/10">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-black tabular-nums leading-tight">{value}</p>
          <p className="text-xs font-bold" style={{ color: "#b8c7dc" }}>{label}</p>
        </div>
      </div>
    </div>
  );
}

/** Petite carte claire — TotalIncomeLightCard de Berry. */
export function SmallLightCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4" style={{ background: BERRY.paper, borderColor: BERRY.divider }}>
      <div className="flex items-center gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-lg border" style={{ background: BERRY.warningLight, borderColor: BERRY.divider, color: BERRY.warningDark }}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-black tabular-nums leading-tight" style={{ color: BERRY.ink }}>{value}</p>
          <p className="text-xs font-bold" style={{ color: BERRY.muted }}>{label}</p>
        </div>
      </div>
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
    <section className="rounded-lg border" style={{ background: BERRY.paper, borderColor: BERRY.divider }}>
      <div className="flex items-start justify-between gap-3 border-b px-5 py-4" style={{ borderColor: BERRY.divider }}>
        <div>
          <h2 className="text-[0.95rem] font-black tracking-tight" style={{ color: BERRY.ink, fontFamily: "inherit" }}>{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs font-semibold" style={{ color: BERRY.muted }}>{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Barres horizontales — piste violet clair, remplissage violet Berry. */
export function BarList({ buckets }: { buckets: Bucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const total = buckets.reduce((s, b) => s + b.count, 0);
  if (!buckets.length) return <p className="text-sm" style={{ color: BERRY.muted }}>Aucune donnée.</p>;
  return (
    <ul className="flex flex-col gap-3">
      {buckets.map((b) => {
        const pct = (b.count / max) * 100;
        const share = total ? Math.round((b.count / total) * 100) : 0;
        return (
          <li key={b.label}>
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="truncate text-sm font-bold" style={{ color: BERRY.ink }} title={b.label}>
                {b.label}
              </span>
              <span className="shrink-0 text-sm tabular-nums" style={{ color: BERRY.muted }}>
                {b.count} <span className="text-xs">({share}%)</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden border" style={{ background: BERRY.primaryLight, borderColor: BERRY.divider }}>
              <div
                className="h-full"
                style={{ width: `${pct}%`, background: b.count ? BERRY.primary : "transparent" }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function FunnelChart({ funnel }: { funnel: FunnelStep[] }) {
  const max = Math.max(1, ...funnel.map((f) => f.answered));
  return (
    <ul className="flex flex-col gap-2.5">
      {funnel.map((f) => {
        const pct = (f.answered / max) * 100;
        return (
          <li key={f.step} className="flex items-center gap-3">
            <span
              className="grid size-6 shrink-0 place-items-center rounded-md border text-xs font-black tabular-nums"
              style={{ background: BERRY.primaryLight, borderColor: BERRY.divider, color: BERRY.primaryDark }}
            >
              {f.step}
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between gap-3">
                <p className="truncate text-xs" style={{ color: BERRY.muted }} title={f.label}>
                  {f.label}
                </p>
                <span className="shrink-0 text-xs font-semibold tabular-nums" style={{ color: BERRY.ink }}>
                  {f.answered}
                </span>
              </div>
              <div className="h-2 overflow-hidden border" style={{ background: BERRY.primaryLight, borderColor: BERRY.divider }}>
                <div className="h-full" style={{ width: `${pct}%`, background: BERRY.primary }} />
              </div>
            </div>
            <span className="w-24 shrink-0 text-right text-xs font-medium" style={{ color: f.abandonHere > 0 ? BERRY.error : "transparent" }}>
              {f.abandonHere > 0 ? `−${f.abandonHere} abandon${f.abandonHere > 1 ? "s" : ""}` : "—"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function RatingDonut({ average, count, max = 5 }: { average: number; count: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (average / max) * 100));
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div
        className="grid size-40 place-items-center rounded-full"
        style={{ background: `conic-gradient(${BERRY.primary} ${pct}%, ${BERRY.primaryLight} 0)` }}
      >
        <div className="grid size-28 place-items-center rounded-full border-2 text-center" style={{ background: BERRY.paper, borderColor: BERRY.primaryDark }}>
          <div>
            <div className="text-3xl font-black" style={{ color: BERRY.ink }}>{average.toFixed(1)}</div>
            <div className="text-xs" style={{ color: BERRY.muted }}>/ {max} moyenne</div>
          </div>
        </div>
      </div>
      <p className="text-xs" style={{ color: BERRY.muted }}>{count} réponse{count > 1 ? "s" : ""}</p>
    </div>
  );
}

export function TimeChart({ points }: { points: TimePoint[] }) {
  if (points.length < 2) {
    return <p className="text-sm" style={{ color: BERRY.muted }}>Pas encore assez de données.</p>;
  }
  const W = 860;
  const H = 260;
  const padL = 44;
  const padR = 18;
  const padT = 22;
  const padB = 44;
  const maxY = Math.max(1, ...points.map((p) => Math.max(p.visits, p.submissions)));
  const yMax = Math.max(1, Math.ceil(maxY / 5) * 5);
  const x = (i: number) => padL + (i / (points.length - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - v / yMax) * (H - padT - padB);
  const line = (k: "visits" | "submissions") =>
    points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join(" ");
  const area = (k: "visits" | "submissions") =>
    `${line(k)} L${x(points.length - 1).toFixed(1)},${H - padB} L${x(0).toFixed(1)},${H - padB} Z`;
  const ticks = Array.from({ length: 6 }, (_, i) => Math.round((yMax / 5) * i));
  const dateEvery = Math.max(1, Math.ceil(points.length / 6));
  const totalVisits = points.reduce((s, p) => s + p.visits, 0);
  const totalSubmissions = points.reduce((s, p) => s + p.submissions, 0);
  const peak = points.reduce((best, p) => (p.visits > best.visits ? p : best), points[0]);
  const conv = totalVisits ? Math.round((totalSubmissions / totalVisits) * 1000) / 10 : 0;
  const fmtDate = (date: string) => {
    const [, month, day] = date.split("-");
    return `${day}/${month}`;
  };

  return (
    <div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <ChartSummary label="Visites" value={String(totalVisits)} tone="blue" />
        <ChartSummary label="Soumissions" value={String(totalSubmissions)} tone="navy" />
        <ChartSummary label="Conversion" value={`${conv.toString().replace(".", ",")} %`} tone="muted" />
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white p-3" style={{ borderColor: BERRY.divider }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[260px] w-full min-w-[720px]" role="img" aria-label="Visites et soumissions par jour">
        <defs>
          <linearGradient id="adminVisitsArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BERRY.primary} stopOpacity="0.25" />
            <stop offset="100%" stopColor={BERRY.primary} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke={BERRY.divider} strokeDasharray={t === 0 ? undefined : "4 6"} />
            <text x={padL - 10} y={y(t) + 4} textAnchor="end" fontSize="11" fontWeight="700" fill={BERRY.muted}>
              {t}
            </text>
          </g>
        ))}
        <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB} stroke={BERRY.primaryDark} strokeWidth="1.5" />
        <line x1={padL} x2={padL} y1={padT} y2={H - padB} stroke={BERRY.primaryDark} strokeWidth="1.5" />

        <path d={area("visits")} fill="url(#adminVisitsArea)" stroke="none" />
        <path d={line("visits")} fill="none" stroke={BERRY.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d={line("submissions")} fill="none" stroke={BERRY.primaryDark} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <g key={p.date}>
            {i % dateEvery === 0 || i === points.length - 1 ? (
              <text x={x(i)} y={H - 16} textAnchor="middle" fontSize="11" fontWeight="700" fill={BERRY.muted}>
                {fmtDate(p.date)}
              </text>
            ) : null}
            <circle cx={x(i)} cy={y(p.visits)} r="4" fill="#fff" stroke={BERRY.primary} strokeWidth="2.5">
              <title>{`${p.date} · ${p.visits} visites · ${p.submissions} soumissions`}</title>
            </circle>
            <circle cx={x(i)} cy={y(p.submissions)} r="3.5" fill="#fff" stroke={BERRY.primaryDark} strokeWidth="2.5">
              <title>{`${p.date} · ${p.submissions} soumissions`}</title>
            </circle>
          </g>
        ))}
      </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold" style={{ color: BERRY.muted }}>
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-5 rounded-full" style={{ background: BERRY.primary }} /> Visites
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-5 rounded-full" style={{ background: BERRY.primaryDark }} /> Soumissions
          </span>
        </div>
        <span>
          Pic : {peak.visits} visites le {fmtDate(peak.date)}
        </span>
      </div>
    </div>
  );
}

const percentFormatter = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function ActivationFunnelChart({
  funnel,
}: {
  funnel: ActivationFunnelStep[];
}) {
  const max = Math.max(1, ...funnel.map((step) => step.count));

  return (
    <ol className="grid gap-3 lg:grid-cols-3">
      {funnel.map((step, index) => {
        const width = Math.max(0, Math.min(100, (step.count / max) * 100));
        return (
          <li
            key={step.key}
            className="min-w-0 border p-4"
            style={{ background: BERRY.bg, borderColor: BERRY.divider }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: BERRY.muted }}>
                  Étape {index + 1}
                </p>
                <p className="mt-1 truncate text-sm font-black" title={step.label} style={{ color: BERRY.ink }}>
                  {step.label}
                </p>
              </div>
              <strong className="shrink-0 text-2xl font-black tabular-nums" style={{ color: BERRY.primaryDark }}>
                {step.count}
              </strong>
            </div>
            <div className="mt-3 h-2 overflow-hidden border" style={{ background: BERRY.paper, borderColor: BERRY.divider }}>
              <div className="h-full" style={{ width: `${width}%`, background: BERRY.primary }} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-bold" style={{ color: BERRY.muted }}>
              <span>
                {step.rateFromPrevious == null
                  ? "Base du funnel"
                  : step.rateFromPrevious > 1 ||
                      (step.rateFromPrevious === 0 && step.count > 0)
                    ? "Branche directe"
                    : `${percentFormatter.format(step.rateFromPrevious)} de l’étape précédente`}
              </span>
              <span className="shrink-0">{percentFormatter.format(step.rateFromVisits)} des visites</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ChartSummary({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "navy" | "muted";
}) {
  const color =
    tone === "blue" ? BERRY.primary : tone === "navy" ? BERRY.primaryDark : BERRY.muted;
  return (
    <div className="rounded-lg border px-4 py-3" style={{ background: BERRY.bg, borderColor: BERRY.divider }}>
      <p className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: BERRY.muted }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-black tabular-nums leading-none" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

/** Badge oui/non — "Non" mis en évidence (bleu) car souvent le signal fort. */
function YesNoBadge({ value }: { value: boolean | null }) {
  if (value == null) return <span style={{ color: BERRY.muted }}>—</span>;
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-semibold"
      style={
        value
          ? { background: BERRY.bg, color: BERRY.muted }
          : { background: BERRY.secondaryLight, color: BERRY.secondary800 }
      }
    >
      {value ? "Oui" : "Non"}
    </span>
  );
}

export function LeadsTable({
  leads,
  onDeleted,
}: {
  leads: LeadRow[];
  onDeleted?: () => void;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function deleteLead(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Suppression impossible.");
        return;
      }
      setConfirmId(null);
      onDeleted?.();
    } catch {
      setError("Erreur réseau pendant la suppression.");
    } finally {
      setDeletingId(null);
    }
  }

  if (!leads.length) return <p className="text-sm" style={{ color: BERRY.muted }}>Aucun lead complété.</p>;
  return (
    <div>
      {error && (
        <p className="mb-3 text-sm font-bold" style={{ color: BERRY.error }}>
          {error}
        </p>
      )}
      <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
        <thead>
          <tr style={{ background: BERRY.bg }}>
            {["Date", "Nom", "Contact", "Ville", "Activité", "CA → objectif", "Problématique", "Seul ?", "Ouvert ?", "Investir ?", "Digital", "Action"].map((h) => (
              <th key={h} className="px-3 py-2.5 text-xs font-black" style={{ color: BERRY.muted }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((l, i) => (
            <tr key={i} className="border-b align-top transition-colors hover:bg-[#eef5ff]" style={{ borderColor: BERRY.divider }}>
              <td className="whitespace-nowrap px-3 py-3 tabular-nums" style={{ color: BERRY.muted }}>
                {l.created_at.slice(0, 10)}
              </td>
              <td className="px-3 py-3 font-medium" style={{ color: BERRY.ink }}>{l.nom_prenom}</td>
              <td className="px-3 py-3" style={{ color: BERRY.muted }}>
                <div>{l.email}</div>
                <div className="tabular-nums">{l.telephone}</div>
              </td>
              <td className="px-3 py-3" style={{ color: BERRY.muted }}>{l.ville}</td>
              <td className="px-3 py-3" style={{ color: BERRY.muted }}>{l.activite}</td>
              <td className="px-3 py-3" style={{ color: BERRY.muted }}>
                {short(l.ca_actuel)} → {short(l.ca_objectif)}
              </td>
              <td className="px-3 py-3" style={{ color: BERRY.muted }}>{l.problematique}</td>
              <td className="px-3 py-3"><YesNoBadge value={l.reglable_seul} /></td>
              <td className="px-3 py-3"><YesNoBadge value={l.ouvert_accompagnement} /></td>
              <td className="px-3 py-3"><YesNoBadge value={l.investir_financierement} /></td>
              <td className="px-3 py-3 font-semibold tabular-nums" style={{ color: BERRY.primaryDark }}>
                {l.experience_digital == null ? "—" : `${l.experience_digital}★`}
              </td>
              <td className="px-3 py-3">
                {confirmId === l.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={deletingId === l.id}
                      onClick={() => deleteLead(l.id)}
                      className="rounded-md px-2.5 py-1.5 text-xs font-black text-white disabled:opacity-50"
                      style={{ background: BERRY.error }}
                    >
                      {deletingId === l.id ? "..." : "Confirmer"}
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === l.id}
                      onClick={() => setConfirmId(null)}
                      className="rounded-md border px-2.5 py-1.5 text-xs font-black disabled:opacity-50"
                      style={{ borderColor: BERRY.divider, color: BERRY.muted }}
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(l.id)}
                    className="rounded-md border px-2.5 py-1.5 text-xs font-black transition-colors hover:bg-[#fee4e2]"
                    style={{ borderColor: BERRY.divider, color: BERRY.error }}
                  >
                    Supprimer
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  dateStyle: "short",
  timeStyle: "short",
});

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function EstimatesTable({
  estimates,
  onDeleted,
}: {
  estimates: EstimateRow[];
  onDeleted?: () => void;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function deleteEstimate(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/estimates/${id}`, { method: "DELETE" });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !body.ok) {
        setError(body.error ?? "Suppression impossible.");
        return;
      }
      setConfirmId(null);
      onDeleted?.();
    } catch {
      setError("Erreur réseau pendant la suppression.");
    } finally {
      setDeletingId(null);
    }
  }

  if (!estimates.length) {
    return <p className="text-sm" style={{ color: BERRY.muted }}>Aucune estimation incomplète.</p>;
  }

  return (
    <div>
      {error && (
        <p className="mb-3 text-sm font-bold" style={{ color: BERRY.error }}>
          {error}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead>
            <tr style={{ background: BERRY.bg }}>
              {[
                "ID",
                "Date",
                "Email",
                "Activité",
                "Ville",
                "CA estimé",
                "Campagne",
                "Action",
              ].map((heading) => (
                <th key={heading} className="px-3 py-2.5 text-xs font-black" style={{ color: BERRY.muted }}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {estimates.map((estimate) => (
              <tr
                key={estimate.id}
                className="border-b align-middle transition-colors hover:bg-[#eef5ff]"
                style={{ borderColor: BERRY.divider }}
              >
                <td className="whitespace-nowrap px-3 py-3 font-mono text-xs" style={{ color: BERRY.muted }} title={estimate.id}>
                  {estimate.id.slice(0, 8)}
                </td>
                <td className="whitespace-nowrap px-3 py-3 tabular-nums" style={{ color: BERRY.muted }}>
                  {dateTimeFormatter.format(new Date(estimate.requested_at))}
                </td>
                <td className="max-w-72 break-all px-3 py-3 font-bold" style={{ color: BERRY.ink }}>
                  {estimate.email ? <a href={`mailto:${estimate.email}`}>{estimate.email}</a> : "—"}
                </td>
                <td className="px-3 py-3" style={{ color: BERRY.muted }}>{estimate.activite ?? "—"}</td>
                <td className="px-3 py-3" style={{ color: BERRY.muted }}>{estimate.ville ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-3 font-black tabular-nums" style={{ color: BERRY.primaryDark }}>
                  {estimate.sim_ca_estime == null ? "—" : euroFormatter.format(estimate.sim_ca_estime)}
                </td>
                <td className="px-3 py-3" style={{ color: BERRY.muted }}>{estimate.utm_campaign ?? "—"}</td>
                <td className="px-3 py-3">
                  {confirmId === estimate.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        title="Confirmer la suppression"
                        aria-label="Confirmer la suppression"
                        disabled={deletingId === estimate.id}
                        onClick={() => deleteEstimate(estimate.id)}
                        className="grid size-8 place-items-center border text-white disabled:opacity-50"
                        style={{ background: BERRY.error, borderColor: BERRY.error }}
                      >
                        <Check size={16} aria-hidden />
                      </button>
                      <button
                        type="button"
                        title="Annuler"
                        aria-label="Annuler la suppression"
                        disabled={deletingId === estimate.id}
                        onClick={() => setConfirmId(null)}
                        className="grid size-8 place-items-center border disabled:opacity-50"
                        style={{ background: BERRY.paper, borderColor: BERRY.divider, color: BERRY.muted }}
                      >
                        <X size={16} aria-hidden />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      title="Supprimer l’estimation"
                      aria-label={`Supprimer l’estimation de ${estimate.email ?? "ce contact"}`}
                      onClick={() => setConfirmId(estimate.id)}
                      className="grid size-8 place-items-center border transition-colors hover:bg-[#fee4e2]"
                      style={{ background: BERRY.paper, borderColor: BERRY.divider, color: BERRY.error }}
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function short(v: string | null): string {
  if (!v) return "—";
  return v.replace(/\s*€\s*\/\s*mois/, "").replace(/\s*€/, "").trim();
}

/** Table des réponses au questionnaire R2. */
export function R2Table({ leads }: { leads: R2LeadRow[] }) {
  if (!leads.length) return <p className="text-sm" style={{ color: BERRY.muted }}>Aucune réponse complétée.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-left text-sm">
        <thead>
          <tr style={{ background: BERRY.bg }}>
            {["Date", "Nom", "Note R1", "Objectif", "Budget", "Infos pour décider", "Prêt à décider ?", "Si non, pourquoi", "Campagne"].map((h) => (
              <th key={h} className="px-3 py-2.5 text-xs font-black" style={{ color: BERRY.muted }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((l, i) => (
            <tr key={i} className="border-b align-top transition-colors hover:bg-[#eef5ff]" style={{ borderColor: BERRY.divider }}>
              <td className="whitespace-nowrap px-3 py-3 tabular-nums" style={{ color: BERRY.muted }}>
                {l.created_at.slice(0, 10)}
              </td>
              <td className="px-3 py-3 font-medium" style={{ color: BERRY.ink }}>{l.nom_prenom}</td>
              <td className="px-3 py-3 font-semibold tabular-nums" style={{ color: BERRY.primaryDark }}>
                {l.note_r1 == null ? "—" : `${l.note_r1}/10`}
              </td>
              <td className="px-3 py-3" style={{ color: BERRY.muted }}>{short(l.objectif)}</td>
              <td className="px-3 py-3" style={{ color: BERRY.muted }}>{short(l.budget_investissement)}</td>
              <td className="max-w-72 px-3 py-3" style={{ color: BERRY.muted }}>{l.infos_decision ?? "—"}</td>
              <td className="px-3 py-3">
                {l.pret_a_decider == null ? (
                  <span style={{ color: BERRY.muted }}>—</span>
                ) : (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={
                      l.pret_a_decider
                        ? { background: "#e8f5e9", color: "#1b5e20" }
                        : { background: "#ffebee", color: "#c62828" }
                    }
                  >
                    {l.pret_a_decider ? "Oui" : "Non"}
                  </span>
                )}
              </td>
              <td className="max-w-72 px-3 py-3" style={{ color: BERRY.muted }}>{l.raison_hesitation ?? "—"}</td>
              <td className="px-3 py-3" style={{ color: BERRY.muted }}>{l.utm_campaign ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
