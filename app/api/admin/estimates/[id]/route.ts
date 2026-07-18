import { NextResponse, type NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "id invalide" }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "supabase non configuré" }, { status: 500 });
  }

  const { data, error } = await supabase.rpc("purge_estimate", { p_id: id });

  if (error) {
    console.error("[api/admin/estimates/delete]", error.message);
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }

  if (data !== true) {
    return NextResponse.json({ error: "estimation introuvable" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
