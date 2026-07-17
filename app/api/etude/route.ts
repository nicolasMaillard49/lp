import { NextResponse, after, type NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/email/client";
import { baseUrl } from "@/lib/email/layout";
import { logEmail } from "@/lib/email/log";
import { etudeEmail, isEtudeSnapshot } from "@/lib/email/templates/etude";

export const runtime = "nodejs";

/* ──────────────────────────────────────────────────────────────
   Capture email « Reçois ton étude » — filet sous le simulateur.

   Stocke dans `etude_emails` (source des relances J+2/J+5 du cron)
   puis envoie l'étude ROI en best-effort : un échec d'envoi ne
   remonte jamais au prospect, la capture reste acquise.
   ────────────────────────────────────────────────────────────── */

const ETUDE_TABLE = "etude_emails";

/* Volontairement laxiste : rejeter un email valide coûte un prospect,
   accepter un email cassé coûte une ligne en base. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Clés du snapshot acceptées — whitelist explicite, comme la route
 * audit : le snapshot vient du client, tout le reste est jeté.
 */
const SNAP_STR = ["metier", "ville"] as const;
const SNAP_NUM = ["budget", "net", "roi", "ca", "chantiers"] as const;

function sanitizeSnapshot(input: unknown): Record<string, string | number> | null {
  const o = (input ?? {}) as Record<string, unknown>;
  const out: Record<string, string | number> = {};
  for (const k of SNAP_STR) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) out[k] = v.trim().slice(0, 200);
  }
  for (const k of SNAP_NUM) {
    const n = Number(o[k]);
    if (Number.isFinite(n)) out[k] = n;
  }
  return Object.keys(out).length ? out : null;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  if (!email || email.length > 320 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "email invalide" }, { status: 400 });
  }

  const supabase = getSupabase();
  /* Sans Supabase configuré : dégradation douce en dev seulement — en
     PROD répondre ok jetterait l'email capturé en silence. */
  if (!supabase) {
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ ok: true, stored: false });
    }
    console.error("[api/etude] Supabase non configuré en production — email non stockable");
    return NextResponse.json({ ok: false, error: "storage unavailable" }, { status: 503 });
  }

  const snapshot = sanitizeSnapshot(body.snapshot);
  const { data, error } = await supabase
    .from(ETUDE_TABLE)
    .insert({ email, snapshot })
    .select("id, unsub_token")
    .single();
  if (error || !data) {
    console.error("[api/etude]", error?.message ?? "insert sans retour");
    return NextResponse.json({ ok: false, error: "db error" }, { status: 500 });
  }

  /* Email #1 (étude ROI) — best-effort ET hors du chemin de réponse :
     after() envoie après que le prospect a reçu son { ok: true }. */
  after(async () => {
    try {
      if (isEtudeSnapshot(snapshot)) {
        const token = String(data.unsub_token);
        const { subject, html } = etudeEmail({ snapshot, unsubToken: token });
        const result = await sendEmail({
          to: email,
          subject,
          html,
          unsubUrl: `${baseUrl()}/api/unsub?t=${encodeURIComponent(token)}`,
        });
        await logEmail({ email, kind: "etude", refId: String(data.id), result });
      }
    } catch (e) {
      console.error("[api/etude] email", e);
    }
  });

  return NextResponse.json({ ok: true, stored: true });
}
