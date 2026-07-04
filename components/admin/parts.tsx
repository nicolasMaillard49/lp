import type { Bucket, FunnelStep, TimePoint, LeadRow } from "@/lib/statsTypes";

// ── Palette light-vivid (fond clair, data saturée) ──
const TRACK = "oklch(0.93 0.008 80)";
const AMBER = "oklch(0.8 0.16 78)";
const AMBER_DIM = "oklch(0.72 0.16 62)";
const ELECTRIC = "oklch(0.58 0.21 252)";
const RED = "oklch(0.6 0.22 25)";
const INK = "oklch(0.25 0.02 60)";
const MUTED = "oklch(0.5 0.015 60)";
const ON_BAR = "oklch(0.22 0.04 60)";

const barGrad = `linear-gradient(90deg, ${AMBER_DIM}, ${AMBER})`;
const barGlow = "0 6px 16px -6px oklch(0.8 0.16 78 / 0.55)";

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
      className={`relative overflow-hidden rounded-2xl border p-5 ${
        accent
          ? "border-[oklch(0.8_0.16_78/0.35)] bg-[oklch(0.97_0.045_84)]"
          : "border-black/8 bg-white"
      }`}
    >
      {accent && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full blur-2xl"
          style={{ background: "oklch(0.8 0.16 78 / 0.3)" }}
        />
      )}
      <p className="font-helvetica text-[0.7rem] font-semibold uppercase tracking-widest" style={{ color: MUTED }}>
        {label}
      </p>
      <p
        className="mt-2 font-helvetica text-4xl font-bold tabular-nums"
        style={{ color: accent ? AMBER_DIM : INK }}
      >
        {value}
      </p>
      {sub && <p className="mt-1 font-helvetica text-xs" style={{ color: MUTED }}>{sub}</p>}
    </div>
  );
}

/** Signature : jauge de complétion lumineuse. */
export function HeroRing({
  rate,
  completed,
  started,
}: {
  rate: number;
  completed: number;
  started: number;
}) {
  const R = 54;
  const C = 2 * Math.PI * R;
  const clamped = Math.max(0, Math.min(1, rate));
  const pct = Math.round(clamped * 100);
  return (
    <div className="relative flex items-center gap-6">
      <div className="relative shrink-0">
        <svg viewBox="0 0 130 130" className="size-36 -rotate-90">
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={AMBER} />
              <stop offset="100%" stopColor={ELECTRIC} />
            </linearGradient>
          </defs>
          <circle cx="65" cy="65" r={R} fill="none" stroke={TRACK} strokeWidth="11" />
          <circle
            cx="65"
            cy="65"
            r={R}
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C - C * clamped}
            style={{ filter: "drop-shadow(0 3px 8px oklch(0.8 0.16 78 / 0.5))" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-helvetica text-3xl font-bold tabular-nums" style={{ color: INK }}>
            {pct}%
          </span>
          <span className="font-helvetica text-[0.65rem] uppercase tracking-widest" style={{ color: MUTED }}>
            complétion
          </span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="font-helvetica text-sm" style={{ color: MUTED }}>
          <span className="font-bold" style={{ color: INK }}>{completed}</span> formulaires terminés
        </p>
        <p className="font-helvetica text-sm" style={{ color: MUTED }}>
          sur <span className="font-bold" style={{ color: INK }}>{started}</span> commencés
        </p>
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
    <section className="rounded-2xl border border-black/8 bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-helvetica text-base font-semibold" style={{ color: INK }}>{title}</h2>
          {subtitle && <p className="mt-0.5 font-helvetica text-xs" style={{ color: MUTED }}>{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

/** Barres à dégradé lumineux (magnitude = une seule teinte ambre). */
export function BarList({ buckets }: { buckets: Bucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const total = buckets.reduce((s, b) => s + b.count, 0);
  if (!buckets.length) return <p className="font-helvetica text-sm" style={{ color: MUTED }}>Aucune donnée.</p>;
  return (
    <ul className="flex flex-col gap-2.5">
      {buckets.map((b) => {
        const pct = (b.count / max) * 100;
        const share = total ? Math.round((b.count / total) * 100) : 0;
        const on = b.count > 0;
        return (
          <li key={b.label} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div
                className="flex h-9 items-center rounded-lg px-3"
                style={{
                  width: `max(${pct}%, 7rem)`,
                  background: on ? barGrad : TRACK,
                  boxShadow: on ? barGlow : "none",
                }}
              >
                <span
                  className="truncate font-helvetica text-sm font-medium"
                  style={{ color: on ? ON_BAR : MUTED }}
                  title={b.label}
                >
                  {b.label}
                </span>
              </div>
            </div>
            <span className="w-16 shrink-0 text-right font-helvetica text-sm tabular-nums" style={{ color: MUTED }}>
              {b.count}
              <span className="ml-1 text-xs opacity-70">{share}%</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function FunnelChart({ funnel }: { funnel: FunnelStep[] }) {
  const max = Math.max(1, ...funnel.map((f) => f.answered));
  return (
    <ul className="flex flex-col gap-1.5">
      {funnel.map((f) => {
        const pct = (f.answered / max) * 100;
        return (
          <li key={f.step} className="flex items-center gap-3">
            <span className="w-5 shrink-0 text-right font-helvetica text-xs tabular-nums" style={{ color: MUTED }}>
              {f.step}
            </span>
            <div className="min-w-0 flex-1">
              <p className="mb-1 truncate font-helvetica text-xs" style={{ color: MUTED }} title={f.label}>
                {f.label}
              </p>
              <div className="h-7 overflow-hidden rounded-lg" style={{ background: TRACK }}>
                <div
                  className="flex h-full items-center rounded-lg px-2"
                  style={{ width: `max(${pct}%, 2rem)`, background: barGrad, boxShadow: barGlow }}
                >
                  <span className="font-helvetica text-xs font-bold tabular-nums" style={{ color: ON_BAR }}>
                    {f.answered}
                  </span>
                </div>
              </div>
            </div>
            <span
              className="flex w-24 shrink-0 items-center justify-end gap-1 font-helvetica text-xs font-medium"
              style={{ color: f.abandonHere > 0 ? RED : "transparent" }}
            >
              {f.abandonHere > 0 && (
                <>
                  <svg viewBox="0 0 12 12" className="size-3" fill="none" aria-hidden>
                    <path
                      d="M6 2v6m0 0L3.5 5.5M6 8l2.5-2.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
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

export function RatingDonut({ average, count }: { average: number; count: number }) {
  const pct = Math.max(0, Math.min(100, (average / 5) * 100));
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div
        className="grid size-40 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${AMBER} ${pct}%, ${TRACK} 0)`,
          filter: "drop-shadow(0 4px 12px oklch(0.8 0.16 78 / 0.35))",
        }}
      >
        <div className="grid size-28 place-items-center rounded-full bg-white text-center">
          <div>
            <div className="font-helvetica text-3xl font-bold" style={{ color: INK }}>
              {average.toFixed(1)}
            </div>
            <div className="font-helvetica text-xs" style={{ color: MUTED }}>/ 5 moyenne</div>
          </div>
        </div>
      </div>
      <p className="font-helvetica text-xs" style={{ color: MUTED }}>
        {count} réponse{count > 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function TimeChart({ points }: { points: TimePoint[] }) {
  if (points.length < 2) {
    return <p className="font-helvetica text-sm" style={{ color: MUTED }}>Pas encore assez de données.</p>;
  }
  const W = 720;
  const H = 160;
  const pad = 20;
  const maxY = Math.max(1, ...points.map((p) => Math.max(p.visits, p.submissions)));
  const x = (i: number) => pad + (i / (points.length - 1)) * (W - pad * 2);
  const y = (v: number) => H - pad - (v / maxY) * (H - pad * 2);
  const line = (k: "visits" | "submissions") =>
    points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join(" ");
  const area = (k: "visits" | "submissions") =>
    `${line(k)} L${x(points.length - 1).toFixed(1)},${H - pad} L${x(0).toFixed(1)},${H - pad} Z`;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full min-w-[560px]">
        <defs>
          <linearGradient id="visArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={AMBER} stopOpacity="0.35" />
            <stop offset="100%" stopColor={AMBER} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area("visits")} fill="url(#visArea)" stroke="none" />
        <path d={line("visits")} fill="none" stroke={AMBER} strokeWidth="2.5" strokeLinecap="round" />
        <path d={line("submissions")} fill="none" stroke={ELECTRIC} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <div className="mt-2 flex gap-4 font-helvetica text-xs" style={{ color: MUTED }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded" style={{ background: AMBER }} /> Visites
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded" style={{ background: ELECTRIC }} /> Soumissions
        </span>
      </div>
    </div>
  );
}

export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  if (!leads.length) return <p className="font-helvetica text-sm" style={{ color: MUTED }}>Aucun lead complété.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-left font-helvetica text-sm">
        <thead>
          <tr className="border-b border-black/10 text-xs font-medium uppercase tracking-wide" style={{ color: MUTED }}>
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
            <tr key={i} className="border-b border-black/5 align-top transition-colors hover:bg-black/[0.02]">
              <td className="whitespace-nowrap px-3 py-2.5 tabular-nums" style={{ color: MUTED }}>
                {l.created_at.slice(0, 10)}
              </td>
              <td className="px-3 py-2.5 font-medium" style={{ color: INK }}>{l.nom_prenom}</td>
              <td className="px-3 py-2.5" style={{ color: MUTED }}>
                <div>{l.email}</div>
                <div className="tabular-nums">{l.telephone}</div>
              </td>
              <td className="px-3 py-2.5" style={{ color: MUTED }}>{l.ville}</td>
              <td className="px-3 py-2.5" style={{ color: MUTED }}>{l.activite}</td>
              <td className="px-3 py-2.5" style={{ color: MUTED }}>
                {short(l.ca_actuel)} → {short(l.ca_objectif)}
              </td>
              <td className="px-3 py-2.5" style={{ color: MUTED }}>{l.problematique}</td>
              <td className="px-3 py-2.5">
                {l.reglable_seul == null ? (
                  <span style={{ color: MUTED }}>—</span>
                ) : (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={
                      l.reglable_seul
                        ? { background: "oklch(0.93 0.008 80)", color: MUTED }
                        : { background: "oklch(0.58 0.21 252 / 0.12)", color: ELECTRIC }
                    }
                  >
                    {l.reglable_seul ? "Oui" : "Non"}
                  </span>
                )}
              </td>
              <td className="px-3 py-2.5 tabular-nums font-semibold" style={{ color: AMBER_DIM }}>
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
