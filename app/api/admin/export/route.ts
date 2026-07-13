import { NextResponse, type NextRequest } from "next/server";
import { getSupabase, AUDIT_TABLE, R2_TABLE } from "@/lib/supabase";

export const runtime = "nodejs";

const AUDIT_COLUMNS = [
  "created_at",
  "nom_prenom",
  "email",
  "telephone",
  "ville",
  "instagram",
  "activite",
  "ca_actuel",
  "ca_objectif",
  "problematique",
  "reglable_seul",
  "experience_digital",
  "ouvert_accompagnement",
  "investir_financierement",
  "utm_source",
  "utm_campaign",
  "device",
  "country",
  "city",
  "duration_seconds",
] as const;

const R2_COLUMNS = [
  "created_at",
  "nom_prenom",
  "note_r1",
  "objectif",
  "budget_investissement",
  "infos_decision",
  "pret_a_decider",
  "raison_hesitation",
  "utm_source",
  "utm_campaign",
  "device",
  "country",
  "city",
  "duration_seconds",
] as const;

function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "supabase non configuré" }, { status: 500 });
  }

  const isR2 = req.nextUrl.searchParams.get("form") === "r2";
  const table = isR2 ? R2_TABLE : AUDIT_TABLE;
  const columns: readonly string[] = isR2 ? R2_COLUMNS : AUDIT_COLUMNS;
  const filename = isR2 ? "reponses-r2.csv" : "leads-audit.csv";

  const { data, error } = await supabase
    .from(table)
    .select(columns.join(","))
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(10000);

  if (error) {
    console.error("[api/admin/export]", error.message);
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const header = columns.join(";");
  const lines = rows.map((r) => columns.map((c) => csvCell(r[c])).join(";"));
  // BOM pour qu'Excel FR lise bien l'UTF-8.
  const csv = "﻿" + [header, ...lines].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
