import { emails } from "@/config/emails";

/* Coquille commune des emails, alignée sur le simulateur. Les aplats,
   tables et styles inline restent lisibles dans Gmail et Outlook. */
export const C = {
  bleu: "#075ad8",
  navy: "#071a33",
  blanc: "#FFFFFF",
  fond: "#f7f9fc",
  trait: "#d8e3f2",
  encre: "#071a33",
  gris: "#071a33",
  /** Alias conservé pour les templates existants. */
  corailTexte: "#075ad8",
} as const;

const SANS = "Helvetica,Arial,sans-serif";

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
 * Racine des IMAGES — jamais localhost, contrairement aux liens : un
 * email se lit depuis Gmail, pas depuis la machine de dev. Seuls les
 * assets déjà en ligne sont utilisables.
 */
export function assetUrl(path: string): string {
  const base = (process.env.EMAIL_ASSETS_BASE_URL ?? "https://bienvenue.nmf-agence.com").replace(
    /\/$/,
    ""
  );
  return `${base}${path}`;
}

/**
 * Le bandeau de marque — le seul endroit où l'email hausse la voix.
 * Il porte LE message de l'email, et rien d'autre. Le chiffre vit dans
 * la phrase (`big()`), pas dans une carte de statistique.
 */
export function bandeau(titleHtml: string, sub?: string): string {
  const subHtml = sub
    ? `<div style="margin-top:12px;font-family:${SANS};font-size:15px;line-height:1.55;font-weight:500;color:${C.blanc};">${esc(sub)}</div>`
    : "";
  return `<tr><td bgcolor="${C.bleu}" style="background:${C.bleu};padding:36px 36px 38px;">
    <div style="font-family:${SANS};font-size:27px;line-height:1.3;font-weight:bold;letter-spacing:0;color:${C.blanc};">${titleHtml}</div>
    ${subHtml}
  </td></tr>`;
}

/** Le chiffre, agrandi DANS la phrase du bandeau — pas isolé dans un encart. */
export function big(value: string): string {
  return `<span style="font-size:46px;letter-spacing:0;">${esc(value)}</span>`;
}

/** Ligne de chiffres : libellé à gauche, valeur à droite, un filet dessous. */
export function row(label: string, valueHtml: string): string {
  return `<tr>
    <td style="padding:13px 12px 13px 0;border-bottom:1px solid ${C.trait};font-family:${SANS};font-size:15px;color:${C.gris};">${esc(label)}</td>
    <td align="right" style="padding:13px 0;border-bottom:1px solid ${C.trait};font-family:${SANS};font-size:16px;font-weight:bold;color:${C.encre};white-space:nowrap;">${valueHtml}</td>
  </tr>`;
}

/**
 * Ligne de fiche (notif interne) : la valeur est du texte libre et doit
 * pouvoir s'enrouler — `row()` la garderait sur une ligne et ferait
 * déborder le document.
 */
export function ficheRow(label: string, valueHtml: string): string {
  return `<tr>
    <td width="150" style="width:150px;padding:11px 14px 11px 0;border-bottom:1px solid ${C.trait};font-family:${SANS};font-size:13px;color:${C.gris};vertical-align:top;">${esc(label)}</td>
    <td style="padding:11px 0;border-bottom:1px solid ${C.trait};font-family:${SANS};font-size:15px;line-height:1.5;color:${C.encre};vertical-align:top;">${valueHtml}</td>
  </tr>`;
}

/** CTA pleine largeur sur aplat navy.
    Padding porté par le <td> — Outlook ignore celui d'un <a>. */
export function button(href: string, label: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0 0;width:100%;"><tr><td align="center" bgcolor="${C.navy}" style="background:${C.navy};padding:17px 24px;border-radius:6px;"><a href="${esc(href)}" style="display:block;font-family:${SANS};color:${C.blanc};font-size:16px;font-weight:bold;text-decoration:none;">${esc(label)}</a></td></tr></table>`;
}

/** Réassurance sous le CTA. */
export function ctaNote(text: string): string {
  return `<p style="margin:12px 0 0;text-align:center;font-family:${SANS};font-size:13px;color:${C.gris};">${esc(text)}</p>`;
}

/** Paragraphe de corps. */
export function para(text: string, marginTop = 18): string {
  return `<p style="margin:${marginTop}px 0 0;font-family:${SANS};font-size:16px;line-height:1.65;color:${C.encre};">${esc(text)}</p>`;
}

/** Mention discrète (projection, avertissement). */
export function mention(text: string): string {
  return `<p style="margin:20px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.gris};">${esc(text)}</p>`;
}

export function layout(args: {
  preheader: string;
  /** Le bandeau de marque, construit par `bandeau()`. */
  bande: string;
  body: string;
  unsubUrl?: string;
  /** Email destiné à NMF : ni justification de réception, ni désinscription. */
  interne?: boolean;
}): string {
  const f = emails.footer;
  const unsub = args.unsubUrl
    ? `<br><a href="${esc(args.unsubUrl)}" style="color:${C.gris};text-decoration:underline;">${esc(f.unsubLabel)}</a>`
    : "";
  const mentions = args.interne ? f.mentionsInterne : f.mentions;
  return `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="light only"></head>
<body bgcolor="${C.fond}" style="margin:0;padding:0;background:${C.fond};">
  <!-- Preheader : la ligne d'aperçu dans la liste des mails. Le filler
       empêche le client d'y coller le début du corps. -->
  <div style="display:none;max-height:0;overflow:hidden;">${esc(args.preheader)}</div>
  <div style="display:none;max-height:0;overflow:hidden;">&#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847;</div>
  <table role="presentation" width="100%" bgcolor="${C.fond}" cellpadding="0" cellspacing="0" style="width:100%;background:${C.fond};">
    <tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="600" bgcolor="${C.blanc}" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.blanc};border:1px solid ${C.trait};border-radius:8px;overflow:hidden;">

        <!-- En-tête de marque sur fond blanc. -->
        <tr><td style="padding:24px 36px 22px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:11px;vertical-align:middle;"><img src="${esc(assetUrl("/logo-nmf-96.png"))}" width="30" height="30" alt="NMF Agence" style="display:block;width:30px;height:30px;border:0;"></td>
            <td style="vertical-align:middle;font-family:${SANS};font-size:17px;font-weight:bold;letter-spacing:0;color:${C.navy};">NMF Agence</td>
          </tr></table>
        </td></tr>

        ${args.bande}

        <tr><td style="padding:32px 36px 36px;">${args.body}</td></tr>

        <tr><td style="padding:22px 36px 26px;border-top:1px solid ${C.trait};font-family:${SANS};font-size:13px;line-height:1.7;color:${C.gris};">
          <strong style="color:${C.encre};">${esc(f.signature)}</strong><br>
          <a href="mailto:${esc(f.contact)}" style="color:${C.corailTexte};text-decoration:none;font-weight:bold;">${esc(f.contact)}</a> — ${esc(f.repondre)}<br>
          <span style="font-size:12px;">${esc(mentions)}${unsub}</span>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
