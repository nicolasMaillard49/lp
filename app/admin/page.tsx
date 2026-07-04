"use client";

import { useEffect, useState } from "react";
import type { Stats } from "@/lib/statsTypes";
import {
  StatCard,
  HeroRing,
  SectionCard,
  BarList,
  FunnelChart,
  TimeChart,
  RatingDonut,
  LeadsTable,
} from "@/components/admin/parts";

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

  if (error) return <Shell><Centered>{error}</Centered></Shell>;
  if (!stats) return <Shell><Centered>Chargement…</Centered></Shell>;

  const t = stats.totals;

  return (
    <Shell>
      {/* En-tête sticky */}
      <header className="sticky top-0 z-20 border-b border-black/8 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-nmf.png" alt="NMF Agence" className="size-8 rounded-md" />
            <div>
              <h1 className="font-helvetica text-xl font-bold leading-none text-ink">
                Diagnostic<span style={{ color: "oklch(0.8 0.16 78)" }}>.</span>
              </h1>
              <p className="mt-0.5 font-helvetica text-xs text-muted">Statistiques du funnel</p>
            </div>
          </div>
          <a
            href="/api/admin/export"
            className="rounded-lg border border-black/10 bg-white px-3.5 py-2 font-helvetica text-sm font-medium text-ink transition-colors hover:border-black/40"
          >
            Exporter CSV
          </a>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-8">
        {!stats.configured && (
          <div className="mb-6 rounded-xl border border-[oklch(0.6_0.22_25/0.4)] bg-[oklch(0.6_0.22_25/0.06)] p-4 font-helvetica text-sm text-ink">
            Supabase n'est pas configuré : les statistiques sont vides.
          </div>
        )}

        {/* Hero : jauge de complétion + KPIs */}
        <div className="mb-4 grid gap-4 lg:grid-cols-3">
          <div className="flex items-center rounded-2xl border border-black/8 bg-white p-6">
            <HeroRing rate={t.completionRate} completed={t.completed} started={t.started} />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:col-span-2">
            <StatCard label="Visites" value={String(t.visits)} />
            <StatCard label="Visiteurs uniques" value={String(t.uniqueVisitors)} />
            <StatCard label="Ont commencé" value={String(t.started)} />
            <StatCard label="Durée médiane" value={duration(t.medianDurationSec)} />
            <StatCard
              label="Leads chauds"
              value={String(t.hotLeads)}
              sub="objectif ≥ 20k & pas seul"
              accent
            />
            <StatCard label="Complétés" value={String(t.completed)} accent />
          </div>
        </div>

        {/* Courbe temporelle */}
        <div className="mb-6">
          <SectionCard title="Visites & soumissions dans le temps">
            <TimeChart points={stats.timeseries} />
          </SectionCard>
        </div>

        {/* Onglets */}
        <div className="mb-5 flex flex-wrap gap-2">
          {TABS.map((tb) => {
            const active = tab === tb;
            return (
              <button
                key={tb}
                type="button"
                onClick={() => setTab(tb)}
                className="rounded-full px-4 py-1.5 font-helvetica text-sm font-semibold transition-all"
                style={
                  active
                    ? {
                        background: "linear-gradient(90deg, oklch(0.72 0.16 62), oklch(0.8 0.16 78))",
                        color: "oklch(0.22 0.04 60)",
                        boxShadow: "0 6px 16px -4px oklch(0.8 0.16 78 / 0.6)",
                      }
                    : { border: "1px solid oklch(0.9 0.01 80)", color: "oklch(0.5 0.015 60)", background: "#fff" }
                }
              >
                {tb}
              </button>
            );
          })}
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
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-[oklch(0.985_0.004_85)] text-ink">
      {/* Glows ambiants doux (light) */}
      <div
        aria-hidden
        className="pointer-events-none fixed -left-40 -top-40 size-[36rem] rounded-full blur-[120px]"
        style={{ background: "oklch(0.8 0.16 78 / 0.14)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -bottom-52 -right-40 size-[38rem] rounded-full blur-[130px]"
        style={{ background: "oklch(0.58 0.21 252 / 0.1)" }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[100svh] place-items-center px-5 font-helvetica text-muted">
      {children}
    </div>
  );
}
