import type { Bucket, FunnelStep, TimePoint, LeadRow } from "@/lib/statsTypes";

// ── Palette Berry (Free MUI admin template) ──
export const BERRY = {
  bg: "#eef2f6",
  paper: "#ffffff",
  divider: "#e3e8ef",
  ink: "#121926",
  muted: "#697586",
  primary: "#673ab7", // violet
  primaryDark: "#5e35b1",
  primary800: "#4527a0",
  primaryLight: "#ede7f6",
  primary200: "#b39ddb",
  secondary: "#2196f3", // bleu
  secondaryDark: "#1e88e5",
  secondary800: "#1565c0",
  secondaryLight: "#e3f2fd",
  warningLight: "#fff8e1",
  warningDark: "#ffc107",
  error: "#f44336",
  success: "#00c853",
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
  const bg = variant === "purple" ? BERRY.primaryDark : BERRY.secondaryDark;
  const circle = variant === "purple" ? BERRY.primary800 : BERRY.secondary800;
  const labelColor = variant === "purple" ? BERRY.primary200 : "#90caf9";
  return (
    <div
      className="relative overflow-hidden rounded-xl p-6"
      style={{ background: bg, color: "#fff" }}
    >
      {/* Cercles décoratifs Berry (coin haut-droit) */}
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{ width: 210, height: 210, top: -85, right: -95, background: circle }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{ width: 210, height: 210, top: -125, right: -15, background: circle, opacity: 0.5 }}
      />
      <div className="relative">
        <div
          className="grid size-11 place-items-center rounded-lg"
          style={{ background: circle }}
        >
          {icon}
        </div>
        <p className="mt-4 text-3xl font-bold tabular-nums">{value}</p>
        <p className="mt-1 text-sm font-medium" style={{ color: labelColor }}>
          {label}
        </p>
        {sub && (
          <p className="mt-0.5 text-xs" style={{ color: labelColor, opacity: 0.8 }}>
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
      className="relative overflow-hidden rounded-xl p-4"
      style={{ background: BERRY.primaryDark, color: "#fff" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{ width: 160, height: 160, top: -95, right: -70, background: BERRY.primary800, opacity: 0.6 }}
      />
      <div className="relative flex items-center gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-lg" style={{ background: BERRY.primary800 }}>
          {icon}
        </div>
        <div>
          <p className="text-xl font-bold tabular-nums leading-tight">{value}</p>
          <p className="text-xs font-medium" style={{ color: BERRY.primary200 }}>{label}</p>
        </div>
      </div>
    </div>
  );
}

/** Petite carte claire — TotalIncomeLightCard de Berry. */
export function SmallLightCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: BERRY.paper, borderColor: BERRY.divider }}>
      <div className="flex items-center gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-lg" style={{ background: BERRY.warningLight, color: BERRY.warningDark }}>
          {icon}
        </div>
        <div>
          <p className="text-xl font-bold tabular-nums leading-tight" style={{ color: BERRY.ink }}>{value}</p>
          <p className="text-xs font-medium" style={{ color: BERRY.muted }}>{label}</p>
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
    <section className="rounded-xl border" style={{ background: BERRY.paper, borderColor: BERRY.divider }}>
      <div className="flex items-start justify-between gap-3 border-b px-5 py-4" style={{ borderColor: BERRY.divider }}>
        <div>
          <h2 className="text-[0.95rem] font-semibold" style={{ color: BERRY.ink, fontFamily: "inherit" }}>{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs" style={{ color: BERRY.muted }}>{subtitle}</p>}
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
              <span className="truncate text-sm font-medium" style={{ color: BERRY.ink }} title={b.label}>
                {b.label}
              </span>
              <span className="shrink-0 text-sm tabular-nums" style={{ color: BERRY.muted }}>
                {b.count} <span className="text-xs opacity-70">({share}%)</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full" style={{ background: BERRY.primaryLight }}>
              <div
                className="h-full rounded-full"
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
              className="grid size-6 shrink-0 place-items-center rounded-md text-xs font-bold tabular-nums"
              style={{ background: BERRY.primaryLight, color: BERRY.primaryDark }}
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
              <div className="h-2 overflow-hidden rounded-full" style={{ background: BERRY.primaryLight }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: BERRY.primary }} />
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

export function RatingDonut({ average, count }: { average: number; count: number }) {
  const pct = Math.max(0, Math.min(100, (average / 5) * 100));
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div
        className="grid size-40 place-items-center rounded-full"
        style={{ background: `conic-gradient(${BERRY.primary} ${pct}%, ${BERRY.primaryLight} 0)` }}
      >
        <div className="grid size-28 place-items-center rounded-full text-center" style={{ background: BERRY.paper }}>
          <div>
            <div className="text-3xl font-bold" style={{ color: BERRY.ink }}>{average.toFixed(1)}</div>
            <div className="text-xs" style={{ color: BERRY.muted }}>/ 5 moyenne</div>
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
          <linearGradient id="berryArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BERRY.primary} stopOpacity="0.25" />
            <stop offset="100%" stopColor={BERRY.primary} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area("visits")} fill="url(#berryArea)" stroke="none" />
        <path d={line("visits")} fill="none" stroke={BERRY.primary} strokeWidth="2.5" strokeLinecap="round" />
        <path d={line("submissions")} fill="none" stroke={BERRY.secondaryDark} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <div className="mt-2 flex gap-4 text-xs" style={{ color: BERRY.muted }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded" style={{ background: BERRY.primary }} /> Visites
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded" style={{ background: BERRY.secondaryDark }} /> Soumissions
        </span>
      </div>
    </div>
  );
}

export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  if (!leads.length) return <p className="text-sm" style={{ color: BERRY.muted }}>Aucun lead complété.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-left text-sm">
        <thead>
          <tr style={{ background: BERRY.bg }}>
            {["Date", "Nom", "Contact", "Ville", "Activité", "CA → objectif", "Problématique", "Seul ?", "Digital"].map((h) => (
              <th key={h} className="px-3 py-2.5 text-xs font-semibold first:rounded-l-lg last:rounded-r-lg" style={{ color: BERRY.muted }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((l, i) => (
            <tr key={i} className="border-b align-top transition-colors hover:bg-[#f8fafc]" style={{ borderColor: BERRY.divider }}>
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
              <td className="px-3 py-3">
                {l.reglable_seul == null ? (
                  <span style={{ color: BERRY.muted }}>—</span>
                ) : (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={
                      l.reglable_seul
                        ? { background: BERRY.bg, color: BERRY.muted }
                        : { background: BERRY.secondaryLight, color: BERRY.secondary800 }
                    }
                  >
                    {l.reglable_seul ? "Oui" : "Non"}
                  </span>
                )}
              </td>
              <td className="px-3 py-3 font-semibold tabular-nums" style={{ color: BERRY.primaryDark }}>
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
