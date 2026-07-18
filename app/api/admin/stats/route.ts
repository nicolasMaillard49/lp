import { NextResponse } from "next/server";
import { getSupabase, AUDIT_TABLE } from "@/lib/supabase";
import { steps } from "@/config/form";
import type {
  Stats,
  Bucket,
  FunnelStep,
  AnswerInsight,
  TimePoint,
  LeadRow,
} from "@/lib/statsTypes";

export const runtime = "nodejs";

interface Row {
  session_id: string;
  visitor_id: string | null;
  status: string;
  last_step: number;
  created_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  nom_prenom: string | null;
  email: string | null;
  ville: string | null;
  telephone: string | null;
  instagram: string | null;
  activite: string | null;
  ca_actuel: string | null;
  ca_objectif: string | null;
  problematique: string | null;
  reglable_seul: boolean | null;
  experience_digital: number | null;
  ouvert_accompagnement: boolean | null;
  investir_financierement: boolean | null;
  referrer: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  sim_used: boolean | null;
  form_opened: boolean | null;
}

/** Deux plus hautes fourchettes d'objectif = "leads chauds". */
const HOT_OBJECTIVES = new Set([
  "20 000 – 50 000 € / mois",
  "Plus de 50 000 € / mois",
]);

function bucketize(values: (string | null | undefined)[], fallback = "(inconnu)"): Bucket[] {
  const map = new Map<string, number>();
  for (const v of values) {
    const key = v && v.trim() ? v.trim() : fallback;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function referrerHost(ref: string | null): string | null {
  if (!ref) return null;
  try {
    return new URL(ref).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(emptyStats(false));
  }

  const { data, error } = await supabase
    .from(AUDIT_TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("[api/admin/stats]", error.message);
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }

  const rows = (data ?? []) as Row[];

  // ── Totaux ──
  const visits = rows.length;
  const uniqueVisitors = new Set(
    rows.map((r) => r.visitor_id).filter(Boolean) as string[]
  ).size;
  /* `sim_used === true` et non truthy : la colonne peut manquer (migration
     0007 pas encore passée) — les cartes affichent alors 0, pas NaN. */
  const simUsed = rows.filter((r) => r.sim_used === true).length;
  const formOpened = rows.filter((r) => r.form_opened === true).length;
  const started = rows.filter((r) => r.last_step >= 1).length;
  const completedRows = rows.filter((r) => r.status === "completed");
  const completed = completedRows.length;
  const completionRate = started ? completed / started : 0;
  const medianDurationSec = median(
    completedRows.map((r) => r.duration_seconds).filter((n): n is number => n != null)
  );
  const hotLeads = completedRows.filter(
    (r) => r.ca_objectif && HOT_OBJECTIVES.has(r.ca_objectif) && r.reglable_seul === false
  ).length;

  // ── Funnel (drop-off par question) ──
  const funnel: FunnelStep[] = steps.map((s, i) => {
    const stepNo = i + 1;
    const answered = rows.filter((r) => r.last_step >= stepNo).length;
    const abandonHere = rows.filter(
      (r) => r.last_step === stepNo && r.status !== "completed"
    ).length;
    return { step: stepNo, label: s.question, answered, abandonHere };
  });

  // ── Answer insights ──
  const answerInsights: AnswerInsight[] = steps
    .filter((s) => ["select", "choice", "yesno", "stars"].includes(s.type))
    .map((s) => {
      if (s.type === "stars") {
        const vals = rows
          .map((r) => r.experience_digital)
          .filter((n): n is number => n != null);
        const buckets: Bucket[] = [0, 1, 2, 3, 4, 5].map((n) => ({
          label: `${n} ★`,
          count: vals.filter((v) => v === n).length,
        }));
        const average = vals.length
          ? vals.reduce((a, b) => a + b, 0) / vals.length
          : undefined;
        return { key: s.key, question: s.question, type: "stars", buckets, average };
      }
      if (s.type === "yesno") {
        const ycol = s.key as keyof Row;
        const vals = rows
          .map((r) => r[ycol] as boolean | null)
          .filter((v) => v != null);
        return {
          key: s.key,
          question: s.question,
          type: "yesno",
          buckets: [
            { label: "Oui", count: vals.filter((v) => v === true).length },
            { label: "Non", count: vals.filter((v) => v === false).length },
          ],
        };
      }
      // select | choice : suit l'ordre des options de la config
      const col = s.key as keyof Row;
      const counts = new Map<string, number>();
      for (const r of rows) {
        const v = r[col];
        if (typeof v === "string" && v) counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      const buckets: Bucket[] = (s.options ?? []).map((opt) => ({
        label: opt,
        count: counts.get(opt) ?? 0,
      }));
      return {
        key: s.key,
        question: s.question,
        type: s.type as "select" | "choice",
        buckets,
      };
    });

  // ── Provenance ──
  const sources = bucketize(
    rows.map((r) => r.utm_source ?? referrerHost(r.referrer) ?? "Direct"),
    "Direct"
  );
  const campaigns = bucketize(
    rows.map((r) => r.utm_campaign),
    "(aucune campagne)"
  );
  const devices = bucketize(rows.map((r) => r.device));
  const browsers = bucketize(rows.map((r) => r.browser));
  const os = bucketize(rows.map((r) => r.os));
  const countries = bucketize(rows.map((r) => r.country));

  // ── Série temporelle ──
  const tsMap = new Map<string, { visits: number; submissions: number }>();
  const bump = (date: string, key: "visits" | "submissions") => {
    const cur = tsMap.get(date) ?? { visits: 0, submissions: 0 };
    cur[key]++;
    tsMap.set(date, cur);
  };
  for (const r of rows) {
    bump(r.created_at.slice(0, 10), "visits");
    if (r.completed_at) bump(r.completed_at.slice(0, 10), "submissions");
  }
  const timeseries: TimePoint[] = [...tsMap.entries()]
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // ── Table des leads (complétés) ──
  const leads: LeadRow[] = completedRows.slice(0, 500).map((r) => ({
    created_at: r.created_at,
    nom_prenom: r.nom_prenom,
    email: r.email,
    ville: r.ville,
    telephone: r.telephone,
    activite: r.activite,
    ca_actuel: r.ca_actuel,
    ca_objectif: r.ca_objectif,
    problematique: r.problematique,
    reglable_seul: r.reglable_seul,
    experience_digital: r.experience_digital,
    ouvert_accompagnement: r.ouvert_accompagnement,
    investir_financierement: r.investir_financierement,
    utm_campaign: r.utm_campaign,
  }));

  const stats: Stats = {
    configured: true,
    totals: {
      visits,
      uniqueVisitors,
      simUsed,
      formOpened,
      started,
      completed,
      completionRate,
      medianDurationSec,
      hotLeads,
    },
    funnel,
    answerInsights,
    sources,
    campaigns,
    devices,
    browsers,
    os,
    countries,
    timeseries,
    leads,
  };
  return NextResponse.json(stats);
}

function emptyStats(configured: boolean): Stats {
  return {
    configured,
    totals: {
      visits: 0,
      uniqueVisitors: 0,
      simUsed: 0,
      formOpened: 0,
      started: 0,
      completed: 0,
      completionRate: 0,
      medianDurationSec: null,
      hotLeads: 0,
    },
    funnel: steps.map((s, i) => ({
      step: i + 1,
      label: s.question,
      answered: 0,
      abandonHere: 0,
    })),
    answerInsights: [],
    sources: [],
    campaigns: [],
    devices: [],
    browsers: [],
    os: [],
    countries: [],
    timeseries: [],
    leads: [],
  };
}
