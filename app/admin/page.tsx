"use client";

// Dashboard admin — DA simulateur : bleu/blanc, Helvetica, cartes à traits nets.

import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import type {
  ActivationFunnelStep,
  ActivationTimePoint,
  R2Stats,
  Stats,
} from "@/lib/statsTypes";
import {
  ActivationFunnelChart,
  BERRY,
  GradientCard,
  SmallDarkCard,
  SmallLightCard,
  SectionCard,
  BarList,
  FunnelChart,
  TimeChart,
  RatingDonut,
  LeadsTable,
  EstimatesTable,
  R2Table,
} from "@/components/admin/parts";

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
function duration(sec: number | null): string {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

const parisDayFormatter = new Intl.DateTimeFormat("fr-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const activationStartFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeZone: "Europe/Paris",
});

function localDay(d = new Date()): string {
  return parisDayFormatter.format(d);
}

function dayOffset(days: number): string {
  const date = new Date(`${localDay()}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return localDay(date);
}

function emptyActivationDay(date: string): ActivationTimePoint {
  return {
    date,
    visits: 0,
    uniqueVisitors: 0,
    simUsed: 0,
    resultViewed: 0,
    ctaViewed: 0,
    ctaClicked: 0,
    estimateRequested: 0,
    formOpened: 0,
    started: 0,
    completed: 0,
  };
}

function funnelForDay(
  funnel: ActivationFunnelStep[],
  day: ActivationTimePoint
): ActivationFunnelStep[] {
  return funnel.map((step, index) => {
    const count = day[step.key];
    const previous = index === 0 ? null : day[funnel[index - 1].key];
    return {
      ...step,
      count,
      rateFromPrevious: previous == null ? null : previous > 0 ? count / previous : 0,
      rateFromVisits: day.visits > 0 ? count / day.visits : 0,
    };
  });
}

const MENU = [
  { key: "Réponses", label: "Réponses", icon: ChartIcon },
  { key: "Funnel", label: "Funnel", icon: FilterIcon },
  { key: "Provenance", label: "Provenance", icon: GlobeIcon },
  { key: "Leads", label: "Leads", icon: UsersIcon },
  { key: "Estimations", label: "Estimations", icon: EstimateIcon },
  { key: "R2", label: "Questionnaire R2", icon: FormIcon },
] as const;
type Tab = (typeof MENU)[number]["key"];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [r2Stats, setR2Stats] = useState<R2Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("Réponses");
  const [menuOpen, setMenuOpen] = useState(false);

  const loadStats = () => {
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setStats)
      .catch(() => setError("Impossible de charger les stats."));
    fetch("/api/admin/r2")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setR2Stats)
      .catch(() => {});
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="min-h-[100svh] font-helvetica [&_h1]:font-helvetica [&_h2]:font-helvetica [&_h3]:font-helvetica" style={{ background: BERRY.bg, color: BERRY.ink }}>
      {/* ── Topbar ── */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{ background: BERRY.paper, borderColor: BERRY.divider }}
      >
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          {/* Burger (mobile) */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            className="grid size-9 place-items-center rounded-lg border transition-colors active:translate-y-px lg:hidden"
            style={{ background: BERRY.primaryLight, borderColor: BERRY.divider, color: BERRY.primaryDark }}
          >
            <svg viewBox="0 0 20 20" fill="none" className="size-5">
              <path d="M3 5.5h14M3 10h14M3 14.5h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-nmf-96.png" alt="NMF Agence" className="size-8 rounded-lg border" style={{ borderColor: BERRY.divider }} />
          <div className="min-w-0">
            <h1 className="text-base font-black leading-none tracking-tight" style={{ fontFamily: "inherit" }}>Diagnostic</h1>
            <p className="mt-0.5 text-xs font-semibold" style={{ color: BERRY.muted }}>Dashboard NMF Agence</p>
          </div>
          <span className="flex-1" />
          <a
            href="/api/admin/export"
            className="rounded-lg px-4 py-2 text-sm font-black text-white transition-opacity hover:opacity-90"
            style={{ background: BERRY.primaryDark }}
          >
            Exporter CSV
          </a>
        </div>
      </header>

      <div className="flex">
        {/* ── Sidebar ── */}
        <aside
          className={`${menuOpen ? "block" : "hidden"} fixed inset-x-0 top-[57px] z-20 border-b p-4 lg:static lg:block lg:w-64 lg:shrink-0 lg:border-b-0 lg:p-5`}
          style={{ background: BERRY.paper, borderColor: BERRY.divider }}
        >
          <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.14em] lg:mt-2" style={{ color: BERRY.muted }}>
            Dashboard
          </p>
          <nav className="flex flex-col gap-1">
            {MENU.map(({ key, label, icon: Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setTab(key);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm font-bold transition-colors active:translate-y-px"
                  style={
                    active
                      ? { background: BERRY.primaryLight, borderColor: BERRY.primary200, color: BERRY.primaryDark }
                      : { background: BERRY.paper, borderColor: "transparent", color: BERRY.muted }
                  }
                >
                  <Icon />
                  {label}
                </button>
              );
            })}
          </nav>
          <div className="my-4 border-t" style={{ borderColor: BERRY.divider }} />
          <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: BERRY.muted }}>
            Raccourcis
          </p>
          <nav className="flex flex-col gap-1">
            <a
              href="/"
              target="_blank"
              className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm font-bold transition-colors hover:border-[#d8e3f2] hover:bg-[#eaf2ff]"
              style={{ color: BERRY.muted }}
            >
              <FormIcon /> Voir le formulaire
            </a>
            <a
              href="/bienvenue"
              target="_blank"
              className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm font-bold transition-colors hover:border-[#d8e3f2] hover:bg-[#eaf2ff]"
              style={{ color: BERRY.muted }}
            >
              <GlobeIcon /> Voir la LP
            </a>
            <a
              href="/preparation"
              target="_blank"
              className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm font-bold transition-colors hover:border-[#d8e3f2] hover:bg-[#eaf2ff]"
              style={{ color: BERRY.muted }}
            >
              <GlobeIcon /> Voir la LP R2
            </a>
          </nav>
        </aside>

        {/* ── Contenu ── */}
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          {error && <Centered>{error}</Centered>}
          {!error && !stats && <Centered>Chargement…</Centered>}
          {stats && tab !== "R2" && <Content stats={stats} tab={tab} onLeadDeleted={loadStats} />}
          {tab === "R2" &&
            (r2Stats ? <R2Content stats={r2Stats} /> : <Centered>Chargement…</Centered>)}
        </main>
      </div>
    </div>
  );
}

function Content({
  stats,
  tab,
  onLeadDeleted,
}: {
  stats: Stats;
  tab: Tab;
  onLeadDeleted: () => void;
}) {
  const t = stats.totals;
  const activationByDate = new Map(stats.activationTimeseries.map((point) => [point.date, point]));
  const today = activationByDate.get(localDay()) ?? emptyActivationDay(localDay());
  const yesterday = activationByDate.get(dayOffset(-1)) ?? emptyActivationDay(dayOffset(-1));
  const dailyFunnel = funnelForDay(stats.activationFunnel, today);
  const cumulative = new Map(stats.activationFunnel.map((step) => [step.key, step.count]));
  const activationVisits = cumulative.get("visits") ?? 0;
  const visitsDelta = today.visits - yesterday.visits;
  const showOverview = tab === "Réponses";
  return (
    <div className="space-y-5">
      {!stats.configured && (
        <div
          className="rounded-lg border p-4 text-sm"
          style={{ background: "#ffebee", borderColor: "#ffcdd2", color: "#c62828" }}
        >
          Supabase n'est pas configuré : les statistiques sont vides.
        </div>
      )}

      {showOverview && (
        <>
          {/* Priorité opérationnelle : lire la journée avant les totaux. */}
          <div>
            <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: BERRY.primary }}>
                  Aujourd'hui
                </p>
                <h2 className="mt-1 text-xl font-black tracking-tight" style={{ color: BERRY.ink }}>
                  Activité du jour
                </h2>
              </div>
              <p className="text-sm font-bold" style={{ color: BERRY.muted }}>
                Cohorte des visites arrivées aujourd’hui
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <DailyKpi
                label="Visites"
                value={String(today.visits)}
                detail={`${today.uniqueVisitors} visiteur${today.uniqueVisitors > 1 ? "s" : ""} unique${today.uniqueVisitors > 1 ? "s" : ""}`}
                delta={visitsDelta}
                icon={<EyeIcon />}
                primary
              />
              <DailyKpi
                label="Simulateur utilisé"
                value={String(today.simUsed)}
                detail={today.visits ? `${pct(today.simUsed / today.visits)} des visites` : "Aucune visite aujourd'hui"}
                icon={<SlidersIcon />}
              />
              <DailyKpi
                label="Estimations"
                value={String(today.estimateRequested)}
                detail={today.visits ? `${pct(today.estimateRequested / today.visits)} des visites` : "Aucune visite aujourd'hui"}
                icon={<EstimateIcon />}
              />
              <DailyKpi
                label="Leads complétés"
                value={String(today.completed)}
                detail={today.visits ? `${pct(today.completed / today.visits)} des visites` : "Aucune visite aujourd'hui"}
                icon={<CheckIcon />}
              />
            </div>
          </div>

          <SectionCard
            title="Funnel d’activation aujourd’hui"
            subtitle={stats.activationMeasuredSince
              ? `Cohorte du jour · mesure active depuis le ${activationStartFormatter.format(new Date(stats.activationMeasuredSince))}`
              : "Cohorte du simulateur · en attente des premières visites"}
          >
            <ActivationFunnelChart funnel={dailyFunnel} />
          </SectionCard>

          {/* Totaux globaux — utiles, mais secondaires face au suivi du jour. */}
          <div className="grid gap-5 lg:grid-cols-3">
            <GradientCard
              variant="purple"
              label="Taux de complétion"
              value={pct(t.completionRate)}
              sub={`${t.completed} complétés sur ${t.started} commencés`}
              icon={<CheckIcon />}
            />
            <GradientCard
              variant="blue"
              label="Visites mesurées"
              value={String(t.visits)}
              sub={`${t.uniqueVisitors} visiteurs uniques`}
              icon={<EyeIcon />}
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              <SmallDarkCard label="Leads chauds (objectif ≥ 20k & pas seul)" value={String(t.hotLeads)} icon={<FlameIcon />} />
              <SmallLightCard label="Durée médiane de remplissage" value={duration(t.medianDurationSec)} icon={<ClockIcon />} />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <SmallLightCard
              label={`Résultat vu · ${activationVisits ? pct((cumulative.get("resultViewed") ?? 0) / activationVisits) : "—"} des visites`}
              value={String(cumulative.get("resultViewed") ?? 0)}
              icon={<EyeIcon />}
            />
            <SmallLightCard
              label={`CTA cliqué · ${activationVisits ? pct((cumulative.get("ctaClicked") ?? 0) / activationVisits) : "—"} des visites`}
              value={String(cumulative.get("ctaClicked") ?? 0)}
              icon={<EstimateIcon />}
            />
            <SmallLightCard
              label={`Estimation demandée · ${activationVisits ? pct((cumulative.get("estimateRequested") ?? 0) / activationVisits) : "—"} des visites`}
              value={String(cumulative.get("estimateRequested") ?? 0)}
              icon={<EstimateIcon />}
            />
            <SmallLightCard
              label={`Ont ouvert le formulaire · ${activationVisits ? pct((cumulative.get("formOpened") ?? 0) / activationVisits) : "—"} des visites`}
              value={String(cumulative.get("formOpened") ?? 0)}
              icon={<FormIcon />}
            />
          </div>

          {/* Courbe temporelle */}
          <SectionCard title="Visites & soumissions dans le temps">
            <TimeChart points={stats.timeseries} />
          </SectionCard>
        </>
      )}

      {tab === "Réponses" && (
        <div className="grid gap-5 lg:grid-cols-2">
          {stats.answerInsights.map((ai) =>
            ai.type === "stars" ? (
              <SectionCard key={ai.key} title={ai.question}>
                <RatingDonut
                  average={ai.average ?? 0}
                  count={ai.buckets.reduce((s, b) => s + b.count, 0)}
                />
              </SectionCard>
            ) : (
              <SectionCard key={ai.key} title={ai.question}>
                <BarList buckets={ai.buckets} />
              </SectionCard>
            )
          )}
        </div>
      )}

      {tab === "Funnel" && (
        <>
          <SectionCard
            title="Funnel d’activation cumulé"
            subtitle="Sessions arrivées depuis le début de la mesure, sans mélanger les anciennes visites"
          >
            <ActivationFunnelChart funnel={stats.activationFunnel} />
          </SectionCard>
          <SectionCard title="Profondeur de lecture" subtitle="Dernier seuil de scroll atteint par session">
            <BarList
              buckets={[
                { label: "25 % de la page", count: t.scroll25 },
                { label: "50 % de la page", count: t.scroll50 },
                { label: "75 % de la page", count: t.scroll75 },
              ]}
            />
          </SectionCard>
          <SectionCard
            title="Où les visiteurs décrochent"
            subtitle="Nombre de personnes ayant répondu à chaque question"
          >
            <FunnelChart funnel={stats.funnel} />
          </SectionCard>
        </>
      )}

      {tab === "Provenance" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard title="Sources de trafic"><BarList buckets={stats.sources} /></SectionCard>
          <SectionCard title="Campagnes (UTM)"><BarList buckets={stats.campaigns} /></SectionCard>
          <SectionCard title="Appareils"><BarList buckets={stats.devices} /></SectionCard>
          <SectionCard title="Pays"><BarList buckets={stats.countries} /></SectionCard>
          <SectionCard title="Navigateurs"><BarList buckets={stats.browsers} /></SectionCard>
          <SectionCard title="Systèmes"><BarList buckets={stats.os} /></SectionCard>
        </div>
      )}

      {tab === "Leads" && (
        <SectionCard title={`Leads complétés (${stats.leads.length})`}>
          <LeadsTable leads={stats.leads} onDeleted={onLeadDeleted} />
        </SectionCard>
      )}

      {tab === "Estimations" && (
        <SectionCard
          title={`Estimations sans questionnaire complété (${stats.estimates.length})`}
          subtitle="Demandes d’estimation enregistrées, hors leads complétés"
        >
          <EstimatesTable estimates={stats.estimates} onDeleted={onLeadDeleted} />
        </SectionCard>
      )}
    </div>
  );
}

function DailyKpi({
  label,
  value,
  detail,
  icon,
  delta,
  primary = false,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  delta?: number;
  primary?: boolean;
}) {
  const deltaLabel =
    delta == null
      ? null
      : delta === 0
        ? "stable"
        : `${delta > 0 ? "+" : ""}${delta} vs hier`;
  const deltaColor = delta == null || delta === 0 ? BERRY.muted : delta > 0 ? BERRY.success : BERRY.error;
  return (
    <article
      className={`relative overflow-hidden rounded-lg border p-5 ${
        primary ? "md:col-span-2 xl:col-span-1" : ""
      }`}
      style={{
        background: primary ? `linear-gradient(135deg, ${BERRY.primaryDark}, ${BERRY.primary})` : BERRY.paper,
        borderColor: primary ? BERRY.primaryDark : BERRY.divider,
        color: primary ? "#fff" : BERRY.ink,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full"
        style={{ background: primary ? "rgb(255 255 255 / 0.12)" : BERRY.primaryLight }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p
            className="text-[10px] font-black uppercase tracking-[0.14em]"
            style={{ color: primary ? "rgb(255 255 255 / 0.72)" : BERRY.muted }}
          >
            {label}
          </p>
          <p className="mt-3 text-4xl font-black leading-none tabular-nums tracking-tight">
            {value}
          </p>
        </div>
        <div
          className="grid size-11 shrink-0 place-items-center rounded-lg border"
          style={{
            background: primary ? "rgb(255 255 255 / 0.12)" : BERRY.primaryLight,
            borderColor: primary ? "rgb(255 255 255 / 0.18)" : BERRY.divider,
            color: primary ? "#fff" : BERRY.primary,
          }}
        >
          {icon}
        </div>
      </div>
      <div className="relative mt-4 flex items-center justify-between gap-3">
        <p
          className="min-w-0 text-sm font-bold"
          style={{ color: primary ? "rgb(255 255 255 / 0.78)" : BERRY.muted }}
        >
          {detail}
        </p>
        {deltaLabel && (
          <span
            className="shrink-0 rounded-full px-2 py-1 text-[11px] font-black"
            style={{
              background: primary ? "rgb(255 255 255 / 0.12)" : BERRY.bg,
              color: primary ? "#fff" : deltaColor,
            }}
          >
            {deltaLabel}
          </span>
        )}
      </div>
    </article>
  );
}

/** Onglet Questionnaire R2 — réponses du questionnaire pré-décision. */
function R2Content({ stats }: { stats: R2Stats }) {
  const t = stats.totals;
  const noteInsight = stats.answerInsights.find((ai) => ai.type === "scale");
  const otherInsights = stats.answerInsights.filter((ai) => ai.type !== "scale");
  return (
    <div className="space-y-5">
      {!stats.configured && (
        <div
          className="rounded-lg border p-4 text-sm"
          style={{ background: "#ffebee", borderColor: "#ffcdd2", color: "#c62828" }}
        >
          Supabase n'est pas configuré : les statistiques sont vides.
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <GradientCard
          variant="purple"
          label="Questionnaires complétés"
          value={String(t.completed)}
          sub={`${pct(t.completionRate)} des ${t.started} commencés · ${t.visits} visites`}
          icon={<CheckIcon />}
        />
        <GradientCard
          variant="blue"
          label="Prêts à décider en fin d'appel"
          value={String(t.readyToDecide)}
          sub={`sur ${t.completed} questionnaires complétés`}
          icon={<EyeIcon />}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <SmallDarkCard
            label="Note moyenne du R1"
            value={t.averageNote == null ? "—" : `${t.averageNote.toFixed(1)}/10`}
            icon={<FlameIcon />}
          />
          <SmallLightCard label="Durée médiane de remplissage" value={duration(t.medianDurationSec)} icon={<ClockIcon />} />
        </div>
      </div>

      <SectionCard title="Visites & soumissions dans le temps">
        <TimeChart points={stats.timeseries} />
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        {noteInsight && (
          <SectionCard title={noteInsight.question}>
            <RatingDonut
              average={noteInsight.average ?? 0}
              count={noteInsight.buckets.reduce((s, b) => s + b.count, 0)}
              max={10}
            />
          </SectionCard>
        )}
        {otherInsights.map((ai) => (
          <SectionCard key={ai.key} title={ai.question}>
            <BarList buckets={ai.buckets} />
          </SectionCard>
        ))}
      </div>

      <SectionCard
        title="Où ils décrochent"
        subtitle="Nombre de personnes ayant répondu à chaque question"
      >
        <FunnelChart funnel={stats.funnel} />
      </SectionCard>

      <SectionCard
        title={`Réponses complétées (${stats.leads.length})`}
        right={
          <a
            href="/api/admin/export?form=r2"
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
            style={{ background: BERRY.primaryDark }}
          >
            Exporter CSV
          </a>
        }
      >
        <R2Table leads={stats.leads} />
      </SectionCard>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[60svh] place-items-center text-sm" style={{ color: BERRY.muted }}>
      {children}
    </div>
  );
}

/* ── Icônes (SVG inline, style MUI outlined) ── */
function ChartIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-5">
      <path d="M4 16V9M10 16V4M16 16v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function FilterIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-5">
      <path d="M3 5h14l-5.5 6v4.5l-3 1.5v-6L3 5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-5">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 10h14M10 3c2.5 2.3 2.5 11.7 0 14M10 3c-2.5 2.3-2.5 11.7 0 14" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-5">
      <circle cx="7.5" cy="7" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2.5 16c.7-2.6 2.7-4 5-4s4.3 1.4 5 4M13 4.3a3 3 0 0 1 0 5.4M15 12.4c1.3.6 2.2 1.8 2.6 3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function EstimateIcon() {
  return <Mail className="size-5" aria-hidden />;
}
function SlidersIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-5">
      <path d="M3 6h14M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="6" r="2" fill="currentColor" />
      <circle cx="13" cy="14" r="2" fill="currentColor" />
    </svg>
  );
}
function FormIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-5">
      <rect x="4" y="3" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 7.5h6M7 10.5h6M7 13.5h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path d="M5 12.5 10 17.5 19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path d="M12 3s5.5 4.5 5.5 10a5.5 5.5 0 0 1-11 0c0-2 .8-3.7 1.8-5.2.4 1 1.2 2 2.2 2.4C10 7.5 10.7 4.8 12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
