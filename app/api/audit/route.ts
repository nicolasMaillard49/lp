import { NextResponse, after, type NextRequest } from "next/server";
import { getSupabase, AUDIT_TABLE } from "@/lib/supabase";
import { readRequestContext, sanitizeAttribution } from "@/lib/tracking";
import { steps, TOTAL_STEPS } from "@/config/form";
import { sendEmail } from "@/lib/email/client";
import { EMAIL_LOG_TABLE, logEmail } from "@/lib/email/log";
import { confirmationEmail } from "@/lib/email/templates/confirmation";
import { notifInterneEmail } from "@/lib/email/templates/notif-interne";

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

/**
 * Valeurs du simulateur attachées au lead (parcours ads) — colonnes
 * ajoutées par la migration 0004, appliquée en prod le 2026-07-14.
 * Whitelist explicite + coercition int : tout le reste est jeté.
 */
const SIM_KEYS = [
  "budget_ads",
  "budget_lsa",
  "sim_panier",
  "sim_transfo",
  "sim_ca_estime",
  "sim_bassin",
] as const;

function sanitizeSim(input: unknown): Record<string, number> {
  const o = (input ?? {}) as Record<string, unknown>;
  const out: Record<string, number> = {};
  for (const k of SIM_KEYS) {
    const n = Number(o[k]);
    if (Number.isFinite(n) && n >= 0) out[k] = Math.round(n);
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
  if (
    event !== "visit" &&
    event !== "progress" &&
    event !== "submit" &&
    event !== "sim_used" &&
    event !== "form_opened"
  ) {
    return NextResponse.json({ ok: false, error: "event invalide" }, { status: 400 });
  }

  const supabase = getSupabase();
  /* Sans Supabase configuré : en dev on dégrade proprement (UI OK, write
     no-op). En PROD c'est une panne de config — répondre ok jetterait le
     lead en silence. 503 : le client (sendConfirmed) retente, les logs
     Vercel remontent la panne. */
  if (!supabase) {
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ ok: true, stored: false });
    }
    console.error("[api/audit] Supabase non configuré en production — lead non stockable");
    return NextResponse.json({ ok: false, error: "storage unavailable" }, { status: 503 });
  }

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

  /* Jalons du funnel d'entrée (migration 0007) — un simple flag posé sur
     la ligne de session. L'upsert crée la ligne si le `visit` s'est perdu
     (elle naît alors `status: visited` par défaut de colonne). */
  if (event === "sim_used" || event === "form_opened") {
    const { error } = await supabase.from(AUDIT_TABLE).upsert(
      {
        session_id,
        visitor_id: isUuid(visitor_id) ? visitor_id : null,
        [event]: true,
      },
      { onConflict: "session_id" }
    );
    if (error) return fail(error.message);
    return NextResponse.json({ ok: true, stored: true });
  }

  // progress | submit
  const answers = sanitizeAnswers(body.answers);
  const sim = sanitizeSim(body.answers);
  const durationRaw = Number(body.duration_seconds);
  const payload: Record<string, unknown> = {
    session_id,
    visitor_id: isUuid(visitor_id) ? visitor_id : null,
    last_step: lastStep,
    ...answers,
    ...sim,
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

  /* Emails #2 (confirmation prospect) + #3 (notif interne) au submit —
     best-effort ET hors du chemin de réponse (after()). Un re-submit
     (retry réseau, double-clic) ne renvoie pas les emails : email_log
     fait foi sur (kind=confirmation, ref_id=lead). */
  if (event === "submit") {
    after(async () => {
      try {
        const { data: lead } = await supabase
          .from(AUDIT_TABLE)
          .select("*")
          .eq("session_id", session_id)
          .single();
        if (!lead) return;
        const leadId = typeof lead.id === "string" ? lead.id : null;

        if (leadId) {
          const { data: already } = await supabase
            .from(EMAIL_LOG_TABLE)
            .select("id")
            .eq("ref_id", leadId)
            .eq("kind", "confirmation")
            .eq("ok", true)
            .limit(1);
          if (already?.length) return;
        }

        const to = typeof lead.email === "string" ? lead.email.trim().toLowerCase() : "";
        if (to.includes("@")) {
          const prenom =
            typeof lead.nom_prenom === "string" && lead.nom_prenom.trim()
              ? lead.nom_prenom.trim().split(/\s+/)[0]
              : null;
          const conf = confirmationEmail({ prenom });
          const result = await sendEmail({ to, subject: conf.subject, html: conf.html });
          await logEmail({ email: to, kind: "confirmation", refId: leadId, result });
        }
        const notifTo = process.env.NOTIF_EMAIL;
        if (notifTo) {
          const notif = notifInterneEmail({ lead });
          const result = await sendEmail({ to: notifTo, subject: notif.subject, html: notif.html });
          await logEmail({ email: notifTo, kind: "notif-interne", refId: leadId, result });
        }
      } catch (e) {
        console.error("[api/audit] email", e);
      }
    });
  }

  return NextResponse.json({ ok: true, stored: true });
}

function fail(message: string) {
  console.error("[api/audit]", message);
  return NextResponse.json({ ok: false, error: "db error" }, { status: 500 });
}
