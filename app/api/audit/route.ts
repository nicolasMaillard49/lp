import { NextResponse, type NextRequest } from "next/server";
import { getSupabase, AUDIT_TABLE } from "@/lib/supabase";
import { readRequestContext, sanitizeAttribution } from "@/lib/tracking";
import { steps, TOTAL_STEPS } from "@/config/form";

export const runtime = "nodejs";

/** Ne garde que les clés de réponse connues, avec le bon type. */
function sanitizeAnswers(input: unknown): Record<string, unknown> {
  const o = (input ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const step of steps) {
    if (!(step.key in o)) continue;
    const raw = o[step.key];
    if (raw === null || raw === undefined || raw === "") continue;
    if (step.type === "stars") {
      const n = Number(raw);
      if (Number.isFinite(n)) out[step.key] = Math.max(0, Math.min(5, Math.round(n)));
    } else if (step.type === "yesno") {
      out[step.key] = raw === true || raw === "true" || raw === "oui";
    } else {
      out[step.key] = String(raw).slice(0, 2000);
    }
  }
  return out;
}

function isUuid(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
  );
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const { session_id, visitor_id, event } = body;
  if (!isUuid(session_id)) {
    return NextResponse.json({ ok: false, error: "session_id invalide" }, { status: 400 });
  }
  if (event !== "visit" && event !== "progress" && event !== "submit") {
    return NextResponse.json({ ok: false, error: "event invalide" }, { status: 400 });
  }

  const supabase = getSupabase();
  // Sans Supabase configuré (dev), on ne bloque pas l'UX : on répond ok.
  if (!supabase) return NextResponse.json({ ok: true, stored: false });

  const lastStepRaw = Number(body.last_step);
  const lastStep = Number.isFinite(lastStepRaw)
    ? Math.max(0, Math.min(TOTAL_STEPS, Math.round(lastStepRaw)))
    : 0;

  if (event === "visit") {
    const ctx = readRequestContext(req.headers);
    const attr = sanitizeAttribution(body.attribution);
    const { error } = await supabase
      .from(AUDIT_TABLE)
      .upsert(
        {
          session_id,
          visitor_id: isUuid(visitor_id) ? visitor_id : null,
          status: "visited",
          last_step: 0,
          ...ctx,
          ...attr,
        },
        { onConflict: "session_id", ignoreDuplicates: true }
      );
    if (error) return fail(error.message);
    return NextResponse.json({ ok: true, stored: true });
  }

  // progress | submit
  const answers = sanitizeAnswers(body.answers);
  const durationRaw = Number(body.duration_seconds);
  const payload: Record<string, unknown> = {
    session_id,
    visitor_id: isUuid(visitor_id) ? visitor_id : null,
    last_step: lastStep,
    ...answers,
  };

  if (event === "submit") {
    payload.status = "completed";
    payload.last_step = TOTAL_STEPS;
    payload.completed_at = new Date().toISOString();
    if (Number.isFinite(durationRaw) && durationRaw >= 0) {
      payload.duration_seconds = Math.round(durationRaw);
    }
  } else {
    payload.status = "started";
  }

  const { error } = await supabase
    .from(AUDIT_TABLE)
    .upsert(payload, { onConflict: "session_id" });
  if (error) return fail(error.message);

  return NextResponse.json({ ok: true, stored: true });
}

function fail(message: string) {
  console.error("[api/audit]", message);
  return NextResponse.json({ ok: false, error: "db error" }, { status: 500 });
}
