import { emails } from "@/config/emails";

/* ──────────────────────────────────────────────────────────────
   Coquille commune des emails — tables HTML + styles inline
   uniquement (les clients mail ignorent le CSS moderne).

   Rigueur « document » du simulateur (filets 1 px, zéro arrondi,
   zéro ombre, chiffres alignés à droite) MAIS signée NMF : le vrai
   logo en tête, pas un bandeau de texte gris. Un email arrive dans
   une boîte froide au milieu de cent autres — il doit dire de qui
   il vient avant d'être lu.

   Couleurs = équivalents hex des tokens OKLCH sim-* de globals.css
   (le prospect vient de voir ces chiffres en bleu sur le site : le
   mail prolonge le document, il ne le rejoue pas en fanfare).
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

/** Racine absolue du site pour les LIENS des emails. */
export function baseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_BASE_URL) {
    return process.env.NEXT_PUBLIC_APP_BASE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

/**
 * Racine des IMAGES des emails — jamais localhost, contrairement aux
 * liens : un email est lu depuis Gmail, pas depuis la machine de dev.
 * Une image en localhost = carré cassé chez le destinataire.
 */
export function assetUrl(path: string): string {
  const base = (process.env.EMAIL_ASSETS_BASE_URL ?? "https://bienvenue.nmf-agence.com").replace(
    /\/$/,
    ""
  );
  return `${base}${path}`;
}

/** Ligne label/valeur du bloc « document ». `valueHtml` est déjà échappé par l'appelant. */
export function row(label: string, valueHtml: string): string {
  return `<tr><td style="padding:11px 0;border-bottom:1px solid ${C.line};font-size:14px;color:${C.muted};">${esc(label)}</td><td align="right" style="padding:11px 0;border-bottom:1px solid ${C.line};font-size:14px;font-weight:bold;color:${C.ink};">${valueHtml}</td></tr>`;
}

/**
 * Le chiffre qui compte — un seul par email, sinon aucun ne compte.
 * `label` en capitales discrètes, la valeur en grand, l'appoint à côté.
 */
export function hero(args: { label: string; value: string; aside?: string }): string {
  const aside = args.aside
    ? `<div style="margin-top:6px;font-size:13px;color:${C.muted};">${esc(args.aside)}</div>`
    : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;"><tr><td style="padding:22px 24px;background:${C.panel};border:1px solid ${C.line};">
    <div style="font-size:11px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;color:${C.muted};">${esc(args.label)}</div>
    <div style="margin-top:8px;font-size:34px;line-height:1.1;font-weight:bold;color:${C.blue};">${esc(args.value)}</div>
    ${aside}
  </td></tr></table>`;
}

/** CTA pleine largeur, bleu plein — même dominance que sur la LP.
    Padding porté par le <td> : Outlook ignore celui d'un <a>. */
export function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0;width:100%;"><tr><td align="center" bgcolor="${C.blue}" style="background:${C.blue};padding:15px 24px;"><a href="${esc(href)}" style="display:block;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;">${esc(label)}</a></td></tr></table>`;
}

/** Sous-titre de réassurance sous le CTA. */
export function ctaNote(text: string): string {
  return `<p style="margin:10px 0 0;text-align:center;font-size:12px;color:${C.muted};">${esc(text)}</p>`;
}

export function layout(args: { preheader: string; body: string; unsubUrl?: string }): string {
  const f = emails.footer;
  const unsub = args.unsubUrl
    ? `<br><a href="${esc(args.unsubUrl)}" style="color:${C.muted};text-decoration:underline;">${esc(f.unsubLabel)}</a>`
    : "";
  return `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:${C.panel};">
  <!-- Preheader : la ligne d'aperçu dans la liste des mails. Le filler
       empêche le client d'y coller le début du corps. -->
  <div style="display:none;max-height:0;overflow:hidden;">${esc(args.preheader)}</div>
  <div style="display:none;max-height:0;overflow:hidden;">&#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.panel};padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${C.line};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${C.ink};">

        <tr><td style="padding:24px 32px;border-bottom:1px solid ${C.line};">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:11px;vertical-align:middle;"><img src="${esc(assetUrl("/logo-nmf-96.png"))}" width="34" height="34" alt="NMF Agence" style="display:block;width:34px;height:34px;border:0;"></td>
            <td style="vertical-align:middle;font-size:16px;font-weight:bold;color:${C.ink};">NMF Agence</td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:32px;">${args.body}</td></tr>

        <tr><td style="padding:20px 32px 24px;border-top:1px solid ${C.line};font-size:12px;line-height:1.7;color:${C.muted};">
          <strong style="color:${C.ink};">${esc(f.signature)}</strong><br>
          <a href="mailto:${esc(f.contact)}" style="color:${C.blue};text-decoration:none;">${esc(f.contact)}</a> — ${esc(f.repondre)}<br>
          <span style="color:${C.muted};">${esc(f.mentions)}</span>${unsub}
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
