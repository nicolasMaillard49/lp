import { emails } from "@/config/emails";

/* ──────────────────────────────────────────────────────────────
   Coquille des emails — le devis inversé.

   Le lecteur est un artisan. L'objet central de sa vie pro, c'est le
   DEVIS : il en écrit tous les jours, il le lit d'un coup d'œil, il
   sait où regarder (la ligne du bas). Le simulateur a déjà été bâti
   comme ça — « l'outil ne doit pas lire comme la LP, il doit lire
   comme un document d'estimation ». L'email prolonge ce document.

   La bascule : un devis annonce ce que ça COÛTE. Celui-ci annonce ce
   que ça RAPPORTE — même mise en page, même conduite de points, même
   filet double avant le total, mais un + à la place du −. C'est tout
   le funnel en une ligne de typo.

   Contraintes du média : tables + styles inline (le CSS moderne saute),
   polices système uniquement (Gmail retire @font-face), images
   absolues (voir assetUrl).
   ────────────────────────────────────────────────────────────── */

/** Corail relevé du logo déployé (#FF6E67/#FF7149) ; `corailTexte` en
    est la version qui passe le contraste sur blanc. */
export const C = {
  encre: "#16151A",
  papier: "#FFFFFF",
  /** Le bureau autour du document — gris tiède, surtout pas crème. */
  marge: "#EEEDEA",
  trait: "#DDDBD6",
  /** Les points de conduite : assez présents pour guider l'œil du
      libellé au chiffre, assez discrets pour rester du papier. */
  pointille: "#B2AEA6",
  gris: "#6E6B65",
  corail: "#FF6E67",
  corailTexte: "#D33A32",
} as const;

const F = {
  /** Georgia = le tenant-lieu système de Fraunces, la display du site. */
  display: "Georgia, 'Times New Roman', serif",
  corps: "-apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif",
  /** La machine à écrire du devis : références, libellés, chiffres. */
  machine: "'Courier New', Courier, monospace",
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

/** Ligne « objet » du document, sous l'en-tête. */
export function objet(text: string): string {
  return `<tr><td style="padding:13px 32px;background:${C.marge};border-bottom:1px solid ${C.trait};font-family:${F.machine};font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:${C.gris};">${esc(text)}</td></tr>`;
}

/**
 * Ligne de devis à conduite de points : libellé …… valeur.
 * La cellule du milieu porte les points ; les deux autres se règlent
 * sur leur contenu. `valueHtml` est déjà échappé par l'appelant.
 */
export function row(label: string, valueHtml: string): string {
  return `<tr>
    <td style="padding:9px 0 5px;font-family:${F.machine};font-size:13px;color:${C.gris};white-space:nowrap;">${esc(label)}</td>
    <td style="padding:9px 7px 4px;border-bottom:2px dotted ${C.pointille};width:100%;">&nbsp;</td>
    <td align="right" style="padding:9px 0 5px;font-family:${F.machine};font-size:14px;font-weight:bold;color:${C.encre};white-space:nowrap;">${valueHtml}</td>
  </tr>`;
}

/**
 * Ligne de fiche — pour la notif interne : libellé à gauche, valeur
 * qui s'enroule à droite. La conduite de points de `row()` est réservée
 * au devis (montants courts) ; ici les valeurs sont du texte libre et
 * `nowrap` ferait déborder le document.
 */
export function ficheRow(label: string, valueHtml: string): string {
  return `<tr>
    <td width="150" style="width:150px;padding:10px 14px 10px 0;border-bottom:1px solid ${C.trait};font-family:${F.machine};font-size:12px;color:${C.gris};vertical-align:top;">${esc(label)}</td>
    <td style="padding:10px 0;border-bottom:1px solid ${C.trait};font-family:${F.corps};font-size:14px;line-height:1.5;color:${C.encre};vertical-align:top;">${valueHtml}</td>
  </tr>`;
}

/**
 * Le total inversé — la signature du parcours. Filet double comme sur
 * un devis, libellé en capitales, puis le chiffre : un + et du corail
 * là où l'artisan a l'habitude de lire un montant à payer.
 */
export function hero(args: { label: string; value: string; aside?: string }): string {
  const aside = args.aside
    ? `<div style="margin-top:9px;font-family:${F.machine};font-size:12px;color:${C.gris};">${esc(args.aside)}</div>`
    : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0;"><tr>
    <td style="border-top:3px double ${C.encre};padding:18px 0 0;">
      <div style="font-family:${F.machine};font-size:12px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;color:${C.gris};">${esc(args.label)}</div>
      <div style="margin-top:6px;font-family:${F.display};font-size:38px;line-height:1.05;font-weight:bold;color:${C.encre};"><span style="color:${C.corailTexte};">+&nbsp;</span>${esc(args.value)}</div>
      ${aside}
    </td>
  </tr></table>`;
}

/** CTA pleine largeur. Encre, pas corail : la couleur appartient au
    chiffre. Padding porté par le <td> — Outlook ignore celui d'un <a>. */
export function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0;width:100%;"><tr><td align="center" bgcolor="${C.encre}" style="background:${C.encre};padding:16px 24px;"><a href="${esc(href)}" style="display:block;font-family:${F.corps};color:#ffffff;font-size:16px;font-weight:bold;letter-spacing:0.01em;text-decoration:none;">${esc(label)}</a></td></tr></table>`;
}

/** Réassurance sous le CTA. */
export function ctaNote(text: string): string {
  return `<p style="margin:11px 0 0;text-align:center;font-family:${F.machine};font-size:12px;color:${C.gris};">${esc(text)}</p>`;
}

/** Phrase d'ouverture — la seule ligne en display. */
export function ouverture(text: string): string {
  return `<p style="margin:0 0 22px;font-family:${F.display};font-size:23px;line-height:1.35;color:${C.encre};">${esc(text)}</p>`;
}

/** Paragraphe de corps. */
export function para(text: string, marginTop = 16): string {
  return `<p style="margin:${marginTop}px 0 0;font-family:${F.corps};font-size:15px;line-height:1.7;color:${C.encre};">${esc(text)}</p>`;
}

export function layout(args: {
  preheader: string;
  body: string;
  /** Ligne « objet » du document (métier · ville…). */
  objetLine?: string;
  unsubUrl?: string;
}): string {
  const f = emails.footer;
  const unsub = args.unsubUrl
    ? `<br><a href="${esc(args.unsubUrl)}" style="color:${C.gris};text-decoration:underline;">${esc(f.unsubLabel)}</a>`
    : "";
  return `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:${C.marge};">
  <!-- Preheader : la ligne d'aperçu dans la liste des mails. Le filler
       empêche le client d'y coller le début du corps. -->
  <div style="display:none;max-height:0;overflow:hidden;">${esc(args.preheader)}</div>
  <div style="display:none;max-height:0;overflow:hidden;">&#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.marge};padding:36px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.papier};border:1px solid ${C.trait};color:${C.encre};">

        <!-- En-tête du document -->
        <tr><td style="padding:26px 32px 22px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:12px;vertical-align:middle;"><img src="${esc(assetUrl("/logo-nmf-96.png"))}" width="36" height="36" alt="NMF Agence" style="display:block;width:36px;height:36px;border:0;"></td>
            <td style="vertical-align:middle;">
              <div style="font-family:${F.display};font-size:19px;font-weight:bold;line-height:1.15;color:${C.encre};">NMF Agence</div>
              <div style="font-family:${F.machine};font-size:11px;letter-spacing:0.05em;color:${C.gris};">Agence web · Bordeaux</div>
            </td>
          </tr></table>
        </td></tr>
        ${args.objetLine ? objet(args.objetLine) : `<tr><td style="border-bottom:1px solid ${C.trait};font-size:0;line-height:0;">&nbsp;</td></tr>`}

        <tr><td style="padding:32px;">${args.body}</td></tr>

        <tr><td style="padding:20px 32px 26px;border-top:1px solid ${C.trait};background:${C.marge};font-family:${F.machine};font-size:11px;line-height:1.75;color:${C.gris};">
          <strong style="color:${C.encre};">${esc(f.signature)}</strong><br>
          <a href="mailto:${esc(f.contact)}" style="color:${C.corailTexte};text-decoration:none;">${esc(f.contact)}</a> — ${esc(f.repondre)}<br>
          ${esc(f.mentions)}${unsub}
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
