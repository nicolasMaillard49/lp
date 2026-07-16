import { NextResponse, type NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { C, esc } from "@/lib/email/layout";

export const runtime = "nodejs";

const ETUDE_TABLE = "etude_emails";

function isUuid(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
  );
}

/** Page sobre, même DA document que les emails. */
function page(title: string, bodyHtml: string): NextResponse {
  const html = `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:48px 16px;background:${C.panel};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${C.ink};">
  <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid ${C.line};padding:32px;">
    <p style="margin:0 0 8px;font-size:11px;font-weight:bold;letter-spacing:0.12em;text-transform:uppercase;color:${C.muted};">NMF Agence</p>
    <h1 style="margin:0 0 16px;font-size:20px;">${esc(title)}</h1>
    ${bodyHtml}
  </div>
</body>
</html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function neutre(): NextResponse {
  return page(
    "Lien invalide ou expiré",
    `<p style="margin:0;font-size:14px;line-height:1.7;">Ce lien de désinscription n'est pas (ou plus) valide. Si tu reçois encore des emails, réponds simplement à l'un d'eux.</p>`
  );
}

/** GET : confirmation en un clic — les scanners suivent les GET, pas les POST. */
export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("t");
  if (!isUuid(t)) return neutre();
  return page(
    "Ne plus recevoir d'emails",
    `<p style="margin:0 0 20px;font-size:14px;line-height:1.7;">Un clic et c'est réglé — tu ne recevras plus d'emails de notre part.</p>
     <form method="POST" action="/api/unsub">
       <input type="hidden" name="t" value="${esc(t)}">
       <button type="submit" style="display:block;width:100%;padding:14px 24px;background:${C.blue};border:0;color:#fff;font-size:15px;font-weight:bold;cursor:pointer;">Me désabonner</button>
     </form>`
  );
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const t = form?.get("t");
  if (!isUuid(t)) return neutre();

  const supabase = getSupabase();
  if (!supabase) return neutre();

  // Le token identifie UNE ligne → on désinscrit l'EMAIL (toutes ses lignes).
  const { data: hit } = await supabase
    .from(ETUDE_TABLE)
    .select("email")
    .eq("unsub_token", t)
    .maybeSingle();
  if (!hit?.email) return neutre();

  const { error } = await supabase
    .from(ETUDE_TABLE)
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("email", hit.email)
    .is("unsubscribed_at", null);
  if (error) {
    console.error("[api/unsub]", error.message);
    return neutre();
  }

  return page(
    "C'est fait",
    `<p style="margin:0;font-size:14px;line-height:1.7;">Tu ne recevras plus d'emails de notre part. Bonne continuation.</p>`
  );
}
