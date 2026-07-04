"use client";

import { useEffect, useState } from "react";
import type { Stats } from "@/lib/statsTypes";
import {
  StatCard,
  SectionCard,
  BarList,
  FunnelChart,
  TimeChart,
  LeadsTable,
} from "@/components/admin/parts";

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
function duration(sec: number | null): string {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setStats)
      .catch(() => setError("Impossible de charger les stats."));
  }, []);

  if (error) {
    return <Centered>{error}</Centered>;
  }
  if (!stats) {
    return <Centered>Chargement…</Centered>;
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Audit — statistiques</h1>
          <p className="text-sm text-muted">Formulaire de qualification · funnel global</p>
        </div>
        <a
          href="/api/admin/export"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
        >
          Exporter les leads (CSV)
        </a>
      </header>

      {!stats.configured && (
        <div className="mb-6 rounded-xl border border-accent/40 bg-accent/5 p-4 text-sm text-ink">
          Supabase n'est pas configuré (variables d'env manquantes) : les stats sont vides.
        </div>
      )}

      {/* Totaux */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Visites" value={String(stats.totals.visits)} />
        <StatCard label="Visiteurs uniques" value={String(stats.totals.uniqueVisitors)} />
        <StatCard label="Ont commencé" value={String(stats.totals.started)} />
        <StatCard label="Complétés" value={String(stats.totals.completed)} />
        <StatCard
          label="Taux de complétion"
          value={pct(stats.totals.completionRate)}
          accent
        />
        <StatCard label="Durée médiane" value={duration(stats.totals.medianDurationSec)} />
        <StatCard
          label="Leads chauds"
          value={String(stats.totals.hotLeads)}
          sub="objectif ≥ 20k & pas seul"
          accent
        />
      </div>

      <div className="grid gap-6">
        <SectionCard title="Visites & soumissions dans le temps">
          <TimeChart points={stats.timeseries} />
        </SectionCard>

        <SectionCard title="Funnel — où ils décrochent">
          <FunnelChart funnel={stats.funnel} />
        </SectionCard>

        {/* Answer insights */}
        <div className="grid gap-6 lg:grid-cols-2">
          {stats.answerInsights.map((ai) => (
            <SectionCard
              key={ai.key}
              title={ai.question}
              right={
                ai.average != null ? (
                  <span className="text-sm font-medium text-electric">
                    moy. {ai.average.toFixed(1)}★
                  </span>
                ) : undefined
              }
            >
              <BarList buckets={ai.buckets} />
            </SectionCard>
          ))}
        </div>

        {/* Provenance */}
        <div className="grid gap-6 lg:grid-cols-2">
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

        <SectionCard title={`Leads complétés (${stats.leads.length})`}>
          <LeadsTable leads={stats.leads} />
        </SectionCard>
      </div>
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-[100svh] place-items-center px-5 text-muted">
      {children}
    </main>
  );
}
