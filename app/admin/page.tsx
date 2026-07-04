"use client";

import { useEffect, useState } from "react";
import type { Stats } from "@/lib/statsTypes";
import {
  StatCard,
  SectionCard,
  BarList,
  FunnelChart,
  TimeChart,
  RatingDonut,
  LeadsTable,
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

const TABS = ["Réponses", "Funnel", "Provenance", "Leads"] as const;
type Tab = (typeof TABS)[number];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("Réponses");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setStats)
      .catch(() => setError("Impossible de charger les stats."));
  }, []);

  if (error) return <Centered>{error}</Centered>;
  if (!stats) return <Centered>Chargement…</Centered>;

  const t = stats.totals;

  return (
    <div className="min-h-[100svh] bg-[oklch(0.985_0.004_80)]">
      {/* En-tête sticky */}
      <header className="sticky top-0 z-20 border-b border-border bg-[oklch(0.985_0.004_80)]/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-nmf.png" alt="NMF Agence" className="size-8 rounded-md" />
            <div>
              <h1 className="font-display text-xl font-semibold leading-none text-ink">
                Diagnostic<span className="text-primary">.</span>
              </h1>
              <p className="mt-0.5 font-sans text-xs text-muted">
                Statistiques du funnel
              </p>
            </div>
          </div>
          <a
            href="/api/admin/export"
            className="rounded-lg border border-border bg-white px-3.5 py-2 font-sans text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            Exporter CSV
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        {!stats.configured && (
          <div className="mb-6 rounded-xl border border-accent/40 bg-accent/5 p-4 font-sans text-sm text-ink">
            Supabase n'est pas configuré : les statistiques sont vides.
          </div>
        )}

        {/* Métriques */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Visites" value={String(t.visits)} />
          <StatCard label="Visiteurs uniques" value={String(t.uniqueVisitors)} />
          <StatCard label="Ont commencé" value={String(t.started)} />
          <StatCard label="Complétés" value={String(t.completed)} />
          <StatCard label="Taux de complétion" value={pct(t.completionRate)} accent />
          <StatCard label="Durée médiane" value={duration(t.medianDurationSec)} />
          <StatCard
            label="Leads chauds"
            value={String(t.hotLeads)}
            sub="objectif ≥ 20k & pas seul"
            accent
          />
        </div>

        {/* Courbe temporelle */}
        <div className="mb-6">
          <SectionCard title="Visites & soumissions dans le temps">
            <TimeChart points={stats.timeseries} />
          </SectionCard>
        </div>

        {/* Onglets */}
        <div className="mb-5 flex flex-wrap gap-2">
          {TABS.map((tb) => (
            <button
              key={tb}
              type="button"
              onClick={() => setTab(tb)}
              className={`rounded-full px-4 py-1.5 font-sans text-sm font-medium transition-colors ${
                tab === tb
                  ? "bg-ink text-white"
                  : "border border-border bg-white text-muted hover:text-ink"
              }`}
            >
              {tb}
            </button>
          ))}
        </div>

        {tab === "Réponses" && (
          <div className="grid gap-4 lg:grid-cols-2">
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
          <SectionCard
            title="Où les visiteurs décrochent"
            subtitle="Nombre de personnes ayant répondu à chaque question"
          >
            <FunnelChart funnel={stats.funnel} />
          </SectionCard>
        )}

        {tab === "Provenance" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Sources de trafic">
              <BarList buckets={stats.sources} />
            </SectionCard>
            <SectionCard title="Campagnes (UTM)">
              <BarList buckets={stats.campaigns} />
            </SectionCard>
            <SectionCard title="Appareils">
              <BarList buckets={stats.devices} />
            </SectionCard>
            <SectionCard title="Pays">
              <BarList buckets={stats.countries} />
            </SectionCard>
            <SectionCard title="Navigateurs">
              <BarList buckets={stats.browsers} />
            </SectionCard>
            <SectionCard title="Systèmes">
              <BarList buckets={stats.os} />
            </SectionCard>
          </div>
        )}

        {tab === "Leads" && (
          <SectionCard title={`Leads complétés (${stats.leads.length})`}>
            <LeadsTable leads={stats.leads} />
          </SectionCard>
        )}
      </main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-[100svh] place-items-center bg-[oklch(0.985_0.004_80)] px-5 font-sans text-muted">
      {children}
    </main>
  );
}
