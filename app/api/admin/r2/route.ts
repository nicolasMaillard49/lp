import { NextResponse } from "next/server";
import { getSupabase, R2_TABLE } from "@/lib/supabase";
import { stepsR2 } from "@/config/form-r2";
import type {
  R2Stats,
  Bucket,
  FunnelStep,
  AnswerInsight,
  TimePoint,
  R2LeadRow,
} from "@/lib/statsTypes";

export const runtime = "nodejs";

interface Row {
  session_id: string;
  status: string;
  last_step: number;
  created_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  nom_prenom: string | null;
  note_r1: number | null;
  objectif: string | null;
  budget_investissement: string | null;
  infos_decision: string | null;
  pret_a_decider: boolean | null;
  raison_hesitation: string | null;
  utm_campaign: string | null;
}

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json(emptyStats(false));

  const { data, error } = await supabase
    .from(R2_TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("[api/admin/r2]", error.message);
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }

  const rows = (data ?? []) as Row[];

  // ── Totaux ──
  const visits = rows.length;
  const started = rows.filter((r) => r.last_step >= 1).length;
  const completedRows = rows.filter((r) => r.status === "completed");
  const completed = completedRows.length;
  const completionRate = started ? completed / started : 0;
  const medianDurationSec = median(
    completedRows.map((r) => r.duration_seconds).filter((n): n is number => n != null)
  );
  const notes = rows.map((r) => r.note_r1).filter((n): n is number => n != null);
  const averageNote = notes.length
    ? notes.reduce((a, b) => a + b, 0) / notes.length
    : null;
  const readyToDecide = completedRows.filter((r) => r.pret_a_decider === true).length;

  // ── Funnel (drop-off par question) ──
  const funnel: FunnelStep[] = stepsR2.map((s, i) => {
    const stepNo = i + 1;
    const answered = rows.filter((r) => r.last_step >= stepNo).length;
    const abandonHere = rows.filter(
      (r) => r.last_step === stepNo && r.status !== "completed"
    ).length;
    return { step: stepNo, label: s.question, answered, abandonHere };
  });

  // ── Answer insights (questions fermées uniquement) ──
  const answerInsights: AnswerInsight[] = stepsR2
    .filter((s) => ["select", "choice", "yesno", "scale"].includes(s.type))
    .map((s) => {
      if (s.type === "scale") {
        const buckets: Bucket[] = Array.from({ length: 11 }, (_, n) => ({
          label: `${n}/10`,
          count: notes.filter((v) => v === n).length,
        }));
        return {
          key: s.key,
          question: s.question,
          type: "scale",
          buckets,
          average: averageNote ?? undefined,
        };
      }
      if (s.type === "yesno") {
        const col = s.key as keyof Row;
        const vals = rows
          .map((r) => r[col] as boolean | null)
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
      // select : suit l'ordre des options de la config
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
      return { key: s.key, question: s.question, type: "select", buckets };
    });

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

  // ── Table des réponses (complétées) ──
  const leads: R2LeadRow[] = completedRows.slice(0, 500).map((r) => ({
    created_at: r.created_at,
    nom_prenom: r.nom_prenom,
    note_r1: r.note_r1,
    objectif: r.objectif,
    budget_investissement: r.budget_investissement,
    infos_decision: r.infos_decision,
    pret_a_decider: r.pret_a_decider,
    raison_hesitation: r.raison_hesitation,
    utm_campaign: r.utm_campaign,
  }));

  const stats: R2Stats = {
    configured: true,
    totals: {
      visits,
      started,
      completed,
      completionRate,
      medianDurationSec,
      averageNote,
      readyToDecide,
    },
    funnel,
    answerInsights,
    timeseries,
    leads,
  };
  return NextResponse.json(stats);
}

function emptyStats(configured: boolean): R2Stats {
  return {
    configured,
    totals: {
      visits: 0,
      started: 0,
      completed: 0,
      completionRate: 0,
      medianDurationSec: null,
      averageNote: null,
      readyToDecide: 0,
    },
    funnel: stepsR2.map((s, i) => ({
      step: i + 1,
      label: s.question,
      answered: 0,
      abandonHere: 0,
    })),
    answerInsights: [],
    timeseries: [],
    leads: [],
  };
}
