import { NextResponse } from "next/server";
import { getSupabase, AUDIT_TABLE } from "@/lib/supabase";

export const runtime = "nodejs";

const COLUMNS = [
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

function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "supabase non configuré" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from(AUDIT_TABLE)
    .select(COLUMNS.join(","))
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(10000);

  if (error) {
    console.error("[api/admin/export]", error.message);
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const header = COLUMNS.join(";");
  const lines = rows.map((r) => COLUMNS.map((c) => csvCell(r[c])).join(";"));
  // BOM pour qu'Excel FR lise bien l'UTF-8.
  const csv = "﻿" + [header, ...lines].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="leads-audit.csv"`,
    },
  });
}
