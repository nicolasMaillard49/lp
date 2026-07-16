import { NextResponse, type NextRequest } from "next/server";
import { getSupabase, AUDIT_TABLE } from "@/lib/supabase";
import { sendEmail } from "@/lib/email/client";
import { EMAIL_LOG_TABLE, claimRelance, settleRelance } from "@/lib/email/log";
import { DAY, planRelances, type EtudeRow } from "@/lib/email/relances";
import { relanceJ2Email, relanceJ5Email } from "@/lib/email/templates/relances";

export const runtime = "nodejs";

/* Cron quotidien (vercel.json, 09:00 UTC) — relances J+2/J+5.
   La suppression est évaluée ICI, à l'envoi, sur données fraîches :
   un prospect qui a réservé entre-temps ne reçoit rien. Le claim
   (insert email_log AVANT envoi, index unique partiel) rend le
   double envoi impossible même si le cron tourne deux fois. */

const ETUDE_TABLE = "etude_emails";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ ok: true, planned: 0, note: "no supabase" });

  const since = new Date(Date.now() - 30 * DAY).toISOString();
  const [captures, completed, logs] = await Promise.all([
    supabase
      .from(ETUDE_TABLE)
      .select("email, snapshot, created_at, unsub_token, unsubscribed_at")
      .gte("created_at", since),
    supabase.from(AUDIT_TABLE).select("email").eq("status", "completed").not("email", "is", null),
    supabase.from(EMAIL_LOG_TABLE).select("email, kind").in("kind", ["relance-j2", "relance-j5"]),
  ]);
  const failed = [captures.error, completed.error, logs.error].find(Boolean);
  if (failed) {
    console.error("[cron/relances]", failed.message);
    return NextResponse.json({ ok: false, error: "db error" }, { status: 500 });
  }

  const plans = planRelances({
    rows: (captures.data ?? []) as EtudeRow[],
    completedEmails: new Set(
      (completed.data ?? []).map((r) => String(r.email).trim().toLowerCase())
    ),
    logged: new Set((logs.data ?? []).map((l) => `${String(l.email).toLowerCase()}|${l.kind}`)),
    now: new Date(),
  });

  let sent = 0;
  let errors = 0;
  let skipped = 0;
  for (const plan of plans) {
    const claimId = await claimRelance(plan.email, plan.kind);
    if (!claimId) {
      skipped++; // déjà claim (course entre deux runs) — la base a tranché
      continue;
    }
    const tpl =
      plan.kind === "relance-j2"
        ? relanceJ2Email({ snapshot: plan.snapshot, unsubToken: plan.unsubToken })
        : relanceJ5Email({ snapshot: plan.snapshot, unsubToken: plan.unsubToken });
    const result = await sendEmail({ to: plan.email, subject: tpl.subject, html: tpl.html });
    await settleRelance(claimId, result);
    if (result.sent) sent++;
    else errors++;
  }

  return NextResponse.json({ ok: true, planned: plans.length, sent, errors, skipped });
}
