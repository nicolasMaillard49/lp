import { emails } from "@/config/emails";

/* ──────────────────────────────────────────────────────────────
   Coquille commune des emails — tables HTML + styles inline
   uniquement (les clients mail ignorent le CSS moderne). DA
   « document » du simulateur : bleu/blanc, filets 1 px, zéro
   arrondi, zéro ombre. Couleurs = équivalents hex des tokens
   OKLCH sim-* de globals.css.
   ────────────────────────────────────────────────────────────── */

export const C = {
  ink: "#1f2b40",
  muted: "#5c6a84",
  line: "#d9dfe9",
  panel: "#f6f8fb",
  blue: "#1c4fd8",
} as const;

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function fmtEuro(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} €`;
}

/** Racine absolue du site pour les liens des emails. */
export function baseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_BASE_URL) return process.env.NEXT_PUBLIC_APP_BASE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

/** Ligne label/valeur du bloc « document ». `valueHtml` est déjà échappé par l'appelant. */
export function row(label: string, valueHtml: string): string {
  return `<tr><td style="padding:8px 0;border-bottom:1px solid ${C.line};font-size:13px;color:${C.muted};">${esc(label)}</td><td align="right" style="padding:8px 0;border-bottom:1px solid ${C.line};font-size:13px;font-weight:bold;color:${C.ink};">${valueHtml}</td></tr>`;
}

/** CTA pleine largeur, bleu plein — même dominance que sur la LP. */
export function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px;width:100%;"><tr><td align="center" style="background:${C.blue};"><a href="${href}" style="display:block;padding:14px 24px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">${esc(label)}</a></td></tr></table>`;
}

export function layout(args: { preheader: string; body: string; unsubUrl?: string }): string {
  const unsub = args.unsubUrl
    ? ` · <a href="${args.unsubUrl}" style="color:${C.muted};">${esc(emails.footer.unsubLabel)}</a>`
    : "";
  return `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:${C.panel};">
  <div style="display:none;max-height:0;overflow:hidden;">${esc(args.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.panel};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${C.line};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${C.ink};">
        <tr><td style="padding:20px 28px;border-bottom:1px solid ${C.line};font-size:11px;font-weight:bold;letter-spacing:0.12em;text-transform:uppercase;color:${C.muted};">NMF Agence</td></tr>
        <tr><td style="padding:28px;">${args.body}</td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid ${C.line};font-size:11px;line-height:1.6;color:${C.muted};">${esc(emails.footer.signature)}<br>${esc(emails.footer.mentions)}${unsub}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
