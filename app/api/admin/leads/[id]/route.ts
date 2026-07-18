import { NextResponse, type NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id manquant" }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "supabase non configuré" }, { status: 500 });
  }

  const { data, error } = await supabase.rpc("purge_completed_lead", { p_id: id });

  if (error) {
    console.error("[api/admin/leads/delete]", error.message);
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }

  if (data !== true) {
    return NextResponse.json({ error: "lead introuvable" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
