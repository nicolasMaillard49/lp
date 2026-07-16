# Parcours email du funnel — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Les 5 emails du funnel (étude ROI, confirmation, notif interne, relances J+2/J+5) opérationnels de bout en bout — templates purs, envoi Resend, journal idempotent, cron de relance, désinscription, page de préview — sans rien casser des routes existantes.

**Architecture:** Module `lib/email/` en 3 couches : `client.ts` (unique porte de sortie Resend, ne jette jamais), `templates/*` (fonctions pures `{subject, html}`), `layout.ts` (coquille tables + styles inline). Textes dans `config/emails.ts`. Journal + idempotence dans la table `email_log` (index unique partiel = double relance impossible en base). Cron Vercel quotidien avec suppression évaluée à l'envoi.

**Tech Stack:** Next.js 16 App Router (routes `nodejs`), Supabase (service_role), API HTTP Resend en `fetch` direct (pas de SDK), Vitest (nouveau, tests des fonctions pures), TypeScript strict.

**Spec:** `docs/superpowers/specs/2026-07-16-parcours-email-design.md`

**Contexte repo à connaître:**
- Alias TS : `@/*` → `./*` (racine).
- `lib/supabase.ts` exporte `getSupabase(): SupabaseClient | null` (null si env absentes) et `AUDIT_TABLE = "audit_leads"`. Il importe `"server-only"`.
- `/api/etude` (`app/api/etude/route.ts`) : POST, valide l'email, `sanitizeSnapshot()` whitelist (`metier`, `ville` string ; `budget`, `net`, `roi`, `ca`, `chantiers` number), insert dans `etude_emails`.
- `/api/audit` (`app/api/audit/route.ts`) : POST, events `visit|progress|submit`, upsert sur `session_id`. Le submit pose `status: "completed"`.
- Type `EtudeSnapshot` exporté par `components/simulateur/EmailEtude.tsx` (composant client — n'importer que le **type**).
- Domaine prod : `bienvenue.nmf-agence.com` (la LP est sur `/`, la page booking sur `/bienvenue?reserver=1`).
- `public/cout-de-lattente.pdf` existe (asset de la relance J+5).
- Env déjà posées dans `.env.local` : `RESEND_API_KEY`, `RESEND_FROM`, `NOTIF_EMAIL`, `CRON_SECRET`.
- Aucun framework de test aujourd'hui — la Task 1 installe Vitest.
- Vérifs standard du repo : `npx tsc --noEmit` et `npx next lint`.

---

### Task 1: Outillage de test (Vitest)

**Files:**
- Modify: `package.json` (devDependency + script)
- Create: `vitest.config.ts`
- Create: `tests/stubs/server-only.ts`
- Create: `tests/smoke.test.ts` (supprimé en Task 2)

- [ ] **Step 1: Installer Vitest**

```bash
cd D:/projets/lp && npm install -D vitest
```

- [ ] **Step 2: Ajouter le script de test**

Dans `package.json`, section `scripts`, ajouter :

```json
"test": "vitest run"
```

- [ ] **Step 3: Créer la config**

`vitest.config.ts` :

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // "server-only" jette hors d'un vrai serveur React — stub vide en test.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: { environment: "node" },
});
```

`tests/stubs/server-only.ts` :

```ts
export {};
```

- [ ] **Step 4: Test fumée**

`tests/smoke.test.ts` :

```ts
import { expect, it } from "vitest";

it("vitest tourne", () => {
  expect(1 + 1).toBe(2);
});
```

- [ ] **Step 5: Vérifier**

Run: `npm test`
Expected: `1 passed`

Run: `npx tsc --noEmit`
Expected: 0 erreur (vitest apporte ses types).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts tests/
git commit -m "chore: outillage vitest (tests des fonctions pures email)"
```

---

### Task 2: Textes (`config/emails.ts`) + coquille (`lib/email/layout.ts`)

**Files:**
- Create: `config/emails.ts`
- Create: `lib/email/layout.ts`
- Create: `tests/email/layout.test.ts`
- Delete: `tests/smoke.test.ts`

- [ ] **Step 1: Écrire les tests qui échouent**

`tests/email/layout.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { esc, fmtEuro, layout } from "@/lib/email/layout";

describe("esc", () => {
  it("échappe le HTML injecté", () => {
    expect(esc(`Bordeaux <script>alert("x")</script>`)).toBe(
      "Bordeaux &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
    );
  });
});

describe("fmtEuro", () => {
  it("format fr avec arrondi", () => {
    // toLocaleString fr-FR utilise l'espace insécable étroite comme séparateur
    expect(fmtEuro(1499.6)).toMatch(/^1\s?500 €$/u);
    expect(fmtEuro(-143)).toBe("-143 €");
  });
});

describe("layout", () => {
  it("enveloppe le corps, footer sans désinscription par défaut", () => {
    const html = layout({ preheader: "Aperçu", body: "<p>CORPS</p>" });
    expect(html).toContain("<p>CORPS</p>");
    expect(html).toContain("NMF Agence");
    expect(html).not.toContain("Ne plus recevoir");
  });

  it("ajoute le lien de désinscription quand une URL est fournie", () => {
    const html = layout({
      preheader: "Aperçu",
      body: "<p>x</p>",
      unsubUrl: "https://exemple.fr/api/unsub?t=abc",
    });
    expect(html).toContain('href="https://exemple.fr/api/unsub?t=abc"');
    expect(html).toContain("Ne plus recevoir");
  });
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/email/layout'`.

- [ ] **Step 3: Écrire `config/emails.ts`**

```ts
/* ──────────────────────────────────────────────────────────────
   Textes du parcours email — 5 emails (voir la spec
   docs/superpowers/specs/2026-07-16-parcours-email-design.md).

   Même logique que site.ts / simulateur.ts : tout le wording est
   ici, modifiable sans toucher aux templates. Tutoiement, ton
   sobre « document » — pas de pression artificielle.
   ────────────────────────────────────────────────────────────── */

export const emails = {
  footer: {
    signature: "Nicolas Maillard — NMF Agence",
    mentions:
      "Tu reçois cet email parce que tu as laissé ton adresse sur bienvenue.nmf-agence.com.",
    unsubLabel: "Ne plus recevoir d'emails",
  },

  /** #1 — Étude ROI, envoyée immédiatement après la capture. */
  etude: {
    subject: (metier: string, ville: string) => `Ton étude Google Ads — ${metier} à ${ville}`,
    intro: "Comme promis, voici ton étude — tes réglages, tes chiffres.",
    netLabel: "Ce qui reste dans ta poche",
    note: "Une projection, pas une promesse : ni un plancher, ni un plafond. On l'affine avec tes vrais chiffres pendant l'audit.",
    cta: "Recevoir mon audit gratuit",
    ctaSub: "10 questions · 2 minutes · Sans engagement",
  },

  /** #2 — Confirmation au prospect, au submit du formulaire. */
  confirmation: {
    subject: "C'est noté — ton audit est en préparation",
    intro: (prenom: string | null) =>
      prenom ? `${prenom}, tes réponses sont bien arrivées.` : "Tes réponses sont bien arrivées.",
    body: "J'analyse ton activité et ta zone avant notre échange. Il ne reste qu'une chose à faire : réserver ton créneau, si ce n'est pas déjà fait.",
    cta: "Réserver mon créneau",
    ctaSub: "20 minutes · Gratuit · Sans engagement",
  },

  /** #3 — Notification interne (NOTIF_EMAIL), au submit du formulaire. */
  notif: {
    subject: (nom: string, activite: string, ville: string) =>
      `Nouveau lead — ${nom} (${activite} · ${ville})`,
    intro: "Nouveau formulaire complété sur la LP.",
    cta: "Ouvrir le dashboard",
  },

  /** #4 — Relance J+2 : son chiffre l'attend. */
  relanceJ2: {
    subjectAvecChiffre: (net: string) => `${net} par mois — ton étude t'attend`,
    subjectSansChiffre: "Ton étude Google Ads t'attend",
    intro: "Il y a deux jours, tu as fait ton étude sur le simulateur. Elle en était là :",
    body: "Ces chiffres ne bougeront pas tout seuls. La prochaine étape tient en 10 questions.",
    cta: "Recevoir mon audit gratuit",
    ctaSub: "10 questions · 2 minutes · Sans engagement",
  },

  /** #5 — Relance J+5 : le coût de l'attente (matière du PDF R2). */
  relanceJ5: {
    subject: "Le coût de l'attente",
    introAvecChiffre: (net: string) =>
      `Chaque mois qui passe sans campagne, c'est environ ${net} de marge qui ne rentre pas.`,
    introSansChiffre: "Chaque mois qui passe sans campagne, c'est de la marge qui ne rentre pas.",
    body: "Ce n'est pas une urgence artificielle : c'est le même calcul que ton étude, projeté dans le temps. Le raisonnement complet tient en 2 pages :",
    pdfLabel: "Le coût de l'attente (PDF, 2 pages)",
    cta: "Recevoir mon audit gratuit",
    ctaSub: "10 questions · 2 minutes · Sans engagement",
  },
} as const;
```

- [ ] **Step 4: Écrire `lib/email/layout.ts`**

```ts
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
```

- [ ] **Step 5: Supprimer le test fumée et vérifier**

```bash
rm tests/smoke.test.ts
```

Run: `npm test`
Expected: PASS (4 tests layout).

Run: `npx tsc --noEmit`
Expected: 0 erreur.

- [ ] **Step 6: Commit**

```bash
git add config/emails.ts lib/email/layout.ts tests/
git commit -m "feat(email): textes config/emails.ts + coquille layout DA document"
```

---

### Task 3: Template étude ROI

**Files:**
- Create: `lib/email/templates/etude.ts`
- Create: `tests/email/templates.test.ts`

- [ ] **Step 1: Écrire les tests qui échouent**

`tests/email/templates.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { etudeEmail, isEtudeSnapshot } from "@/lib/email/templates/etude";

const SNAPSHOT = {
  metier: "Plombier",
  ville: "Bordeaux",
  budget: 1500,
  net: 892,
  roi: 1.6,
  ca: 4460,
  chantiers: 6,
};

describe("etudeEmail", () => {
  it("sujet et chiffres du snapshot", () => {
    const { subject, html } = etudeEmail({ snapshot: SNAPSHOT, unsubToken: "tok-1" });
    expect(subject).toBe("Ton étude Google Ads — Plombier à Bordeaux");
    expect(html).toContain("Plombier");
    expect(html).toContain("Bordeaux");
    expect(html).toMatch(/892\s?€/u);
    expect(html).toMatch(/1\s?500 €/u);
  });

  it("lien de désinscription avec le token", () => {
    const { html } = etudeEmail({ snapshot: SNAPSHOT, unsubToken: "tok-1" });
    expect(html).toContain("/api/unsub?t=tok-1");
  });

  it("échappe une ville hostile", () => {
    const { html } = etudeEmail({
      snapshot: { ...SNAPSHOT, ville: `Bordeaux <script>x</script>` },
      unsubToken: "tok-1",
    });
    expect(html).not.toContain("<script>x</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("isEtudeSnapshot", () => {
  it("accepte un snapshot complet", () => {
    expect(isEtudeSnapshot(SNAPSHOT)).toBe(true);
  });
  it("refuse null et les snapshots partiels", () => {
    expect(isEtudeSnapshot(null)).toBe(false);
    expect(isEtudeSnapshot({ metier: "Plombier", ville: "Bordeaux" })).toBe(false);
  });
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npm test`
Expected: FAIL — module `etude` introuvable.

- [ ] **Step 3: Écrire `lib/email/templates/etude.ts`**

```ts
import type { EtudeSnapshot } from "@/components/simulateur/EmailEtude";
import { emails } from "@/config/emails";
import { C, baseUrl, button, esc, fmtEuro, layout, row } from "../layout";

/* #1 — Étude ROI : le snapshot du simulateur mis en page façon
   document, envoyé immédiatement après la capture (/api/etude).
   Fonction pure — aucun accès réseau/base. */

/** Le snapshot vient du jsonb (sanitizeSnapshot) : garde-fou avant d'envoyer. */
export function isEtudeSnapshot(
  v: Record<string, string | number> | null | undefined
): v is EtudeSnapshot & Record<string, string | number> {
  return (
    !!v &&
    typeof v.metier === "string" &&
    typeof v.ville === "string" &&
    typeof v.budget === "number" &&
    typeof v.net === "number" &&
    typeof v.roi === "number" &&
    typeof v.ca === "number" &&
    typeof v.chantiers === "number"
  );
}

export function etudeEmail(args: {
  snapshot: EtudeSnapshot;
  unsubToken: string;
}): { subject: string; html: string } {
  const s = args.snapshot;
  const t = emails.etude;
  const subject = t.subject(s.metier, s.ville);
  const unsubUrl = `${baseUrl()}/api/unsub?t=${encodeURIComponent(args.unsubToken)}`;

  const rows = [
    row("Métier", esc(s.metier)),
    row("Ville", esc(s.ville)),
    row("Budget mensuel (Ads + gestion)", esc(fmtEuro(s.budget))),
    row("Chantiers estimés / mois", esc(String(s.chantiers))),
    row("CA estimé / mois", esc(fmtEuro(s.ca))),
  ].join("");

  const roiTxt = s.roi.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  const body = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">${esc(t.intro)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    <p style="margin:20px 0 0;padding:16px;background:${C.panel};border:1px solid ${C.line};font-size:14px;">${esc(t.netLabel)} : <strong style="color:${C.blue};font-size:18px;">${esc(fmtEuro(s.net))}/mois</strong> — retour ×${esc(roiTxt)}</p>
    <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:${C.muted};">${esc(t.note)}</p>
    ${button(`${baseUrl()}/`, t.cta)}
    <p style="margin:8px 0 0;text-align:center;font-size:11px;color:${C.muted};">${esc(t.ctaSub)}</p>`;

  return { subject, html: layout({ preheader: t.intro, body, unsubUrl }) };
}
```

- [ ] **Step 4: Vérifier**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/email/templates/etude.ts tests/email/templates.test.ts
git commit -m "feat(email): template étude ROI (snapshot mis en page, unsub)"
```

---

### Task 4: Templates confirmation + notif interne

**Files:**
- Create: `lib/email/templates/confirmation.ts`
- Create: `lib/email/templates/notif-interne.ts`
- Modify: `tests/email/templates.test.ts` (ajout de blocs)

- [ ] **Step 1: Ajouter les tests qui échouent**

À la fin de `tests/email/templates.test.ts` :

```ts
import { confirmationEmail } from "@/lib/email/templates/confirmation";
import { notifInterneEmail } from "@/lib/email/templates/notif-interne";

describe("confirmationEmail", () => {
  it("personnalise avec le prénom", () => {
    const { subject, html } = confirmationEmail({ prenom: "Karim" });
    expect(subject).toBe("C'est noté — ton audit est en préparation");
    expect(html).toContain("Karim, tes réponses sont bien arrivées.");
    expect(html).toContain("/bienvenue?reserver=1");
  });

  it("fallback sans prénom", () => {
    const { html } = confirmationEmail({ prenom: null });
    expect(html).toContain("Tes réponses sont bien arrivées.");
  });
});

describe("notifInterneEmail", () => {
  it("sujet + champs renseignés seulement", () => {
    const { subject, html } = notifInterneEmail({
      lead: {
        nom_prenom: "Karim Benali",
        activite: "Plombier",
        ville: "Bordeaux",
        email: "karim@exemple.fr",
        problematique: "Pas assez de demandes <urgent>",
        reglable_seul: false,
        instagram: null,
        utm_source: "facebook",
      },
    });
    expect(subject).toBe("Nouveau lead — Karim Benali (Plombier · Bordeaux)");
    expect(html).toContain("karim@exemple.fr");
    expect(html).toContain("&lt;urgent&gt;"); // échappé
    expect(html).toContain("non"); // booléen lisible
    expect(html).not.toContain("Instagram"); // champ vide → pas de ligne
    expect(html).toContain("/admin");
  });

  it("sujet dégradé quand activité/ville manquent", () => {
    const { subject } = notifInterneEmail({ lead: { nom_prenom: "Test" } });
    expect(subject).toBe("Nouveau lead — Test (? · ?)");
  });
});
```

Note : `describe`/`expect`/`it` sont déjà importés en tête de fichier.

- [ ] **Step 2: Vérifier l'échec**

Run: `npm test`
Expected: FAIL — modules introuvables.

- [ ] **Step 3: Écrire `lib/email/templates/confirmation.ts`**

```ts
import { emails } from "@/config/emails";
import { C, baseUrl, button, esc, layout } from "../layout";

/* #2 — Confirmation au prospect après le submit du formulaire.
   Part AVANT la réservation (« réserve ton créneau ») — Koalendar
   confirme APRÈS : pas de doublon. Email de service : pas de lien
   de désinscription. */

export function confirmationEmail(args: { prenom: string | null }): {
  subject: string;
  html: string;
} {
  const t = emails.confirmation;
  const intro = t.intro(args.prenom);
  const body = `
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;font-weight:bold;">${esc(intro)}</p>
    <p style="margin:0;font-size:14px;line-height:1.7;">${esc(t.body)}</p>
    ${button(`${baseUrl()}/bienvenue?reserver=1`, t.cta)}
    <p style="margin:8px 0 0;text-align:center;font-size:11px;color:${C.muted};">${esc(t.ctaSub)}</p>`;
  return { subject: t.subject, html: layout({ preheader: intro, body }) };
}
```

- [ ] **Step 4: Écrire `lib/email/templates/notif-interne.ts`**

```ts
import { emails } from "@/config/emails";
import { baseUrl, button, esc, layout, row } from "../layout";

/* #3 — Notification interne vers NOTIF_EMAIL au submit du form :
   les réponses du lead, en clair, pour arrêter de surveiller
   Supabase à la main. Destinataire interne → pas d'unsub. */

const FIELDS: ReadonlyArray<readonly [key: string, label: string]> = [
  ["nom_prenom", "Nom"],
  ["email", "Email"],
  ["telephone", "Téléphone"],
  ["ville", "Ville"],
  ["activite", "Activité"],
  ["ca_actuel", "CA actuel"],
  ["ca_objectif", "Objectif CA"],
  ["problematique", "Problématique"],
  ["reglable_seul", "Réglable seul"],
  ["experience_digital", "Expérience digital (/5)"],
  ["ouvert_accompagnement", "Ouvert à un accompagnement"],
  ["investir_financierement", "Prêt à investir"],
  ["instagram", "Instagram"],
  ["budget_ads", "Budget Ads (simulateur)"],
  ["sim_ca_estime", "CA estimé (simulateur)"],
  ["utm_source", "utm_source"],
  ["utm_medium", "utm_medium"],
  ["utm_campaign", "utm_campaign"],
  ["utm_content", "utm_content"],
  ["device", "Device"],
];

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export function notifInterneEmail(args: { lead: Record<string, unknown> }): {
  subject: string;
  html: string;
} {
  const { lead } = args;
  const t = emails.notif;
  const subject = t.subject(
    str(lead.nom_prenom) ?? "—",
    str(lead.activite) ?? "?",
    str(lead.ville) ?? "?"
  );

  const rows = FIELDS.map(([key, label]) => {
    const v = lead[key];
    if (v === null || v === undefined || v === "") return "";
    const text = typeof v === "boolean" ? (v ? "oui" : "non") : String(v);
    return row(label, esc(text));
  }).join("");

  const body = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">${esc(t.intro)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    ${button(`${baseUrl()}/admin`, t.cta)}`;

  return { subject, html: layout({ preheader: subject, body }) };
}
```

- [ ] **Step 5: Vérifier**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/email/templates/confirmation.ts lib/email/templates/notif-interne.ts tests/email/templates.test.ts
git commit -m "feat(email): templates confirmation post-form + notification interne"
```

---

### Task 5: Templates relances J+2 et J+5

**Files:**
- Create: `lib/email/templates/relances.ts`
- Modify: `tests/email/templates.test.ts` (ajout de blocs)

Le snapshot des relances vient du jsonb en base : il peut être partiel ou nul — les deux templates prennent `Record<string, unknown> | null` et se dégradent proprement. Un `net <= 0` bascule sur les formulations sans chiffre (relancer « tes −143 € t'attendent » serait absurde).

- [ ] **Step 1: Ajouter les tests qui échouent**

À la fin de `tests/email/templates.test.ts` :

```ts
import { relanceJ2Email, relanceJ5Email } from "@/lib/email/templates/relances";

const SNAP_LOOSE: Record<string, unknown> = {
  metier: "Plombier",
  ville: "Bordeaux",
  budget: 1500,
  net: 892,
  roi: 1.6,
  ca: 4460,
  chantiers: 6,
};

describe("relanceJ2Email", () => {
  it("net positif → sujet avec le chiffre", () => {
    const { subject, html } = relanceJ2Email({ snapshot: SNAP_LOOSE, unsubToken: "tok-2" });
    expect(subject).toMatch(/^892 € par mois — ton étude t'attend$/u);
    expect(html).toContain("Plombier");
    expect(html).toContain("/api/unsub?t=tok-2");
  });

  it("net négatif ou snapshot nul → sujet générique", () => {
    expect(relanceJ2Email({ snapshot: { ...SNAP_LOOSE, net: -143 }, unsubToken: "t" }).subject).toBe(
      "Ton étude Google Ads t'attend"
    );
    expect(relanceJ2Email({ snapshot: null, unsubToken: "t" }).subject).toBe(
      "Ton étude Google Ads t'attend"
    );
  });
});

describe("relanceJ5Email", () => {
  it("intro avec chiffre + lien PDF + unsub", () => {
    const { subject, html } = relanceJ5Email({ snapshot: SNAP_LOOSE, unsubToken: "tok-5" });
    expect(subject).toBe("Le coût de l'attente");
    expect(html).toMatch(/892\s?€/u);
    expect(html).toContain("/cout-de-lattente.pdf");
    expect(html).toContain("/api/unsub?t=tok-5");
  });

  it("sans chiffre exploitable → intro générique", () => {
    const { html } = relanceJ5Email({ snapshot: null, unsubToken: "t" });
    expect(html).toContain("c'est de la marge qui ne rentre pas");
  });
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npm test`
Expected: FAIL — module `relances` introuvable.

- [ ] **Step 3: Écrire `lib/email/templates/relances.ts`**

```ts
import { emails } from "@/config/emails";
import { C, baseUrl, button, esc, fmtEuro, layout, row } from "../layout";

/* #4 et #5 — Relances envoyées par le cron quotidien à ceux qui ont
   laissé leur email sans compléter le formulaire. Snapshot depuis le
   jsonb en base → potentiellement partiel/nul, tout est optionnel.
   Prospection → lien de désinscription obligatoire. */

type LooseSnapshot = Record<string, unknown> | null;

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** Lignes de rappel des réglages — seulement ce qui existe dans le snapshot. */
function recapRows(s: LooseSnapshot): string {
  if (!s) return "";
  const metier = str(s.metier);
  const ville = str(s.ville);
  const budget = num(s.budget);
  const net = num(s.net);
  const rows = [
    metier ? row("Métier", esc(metier)) : "",
    ville ? row("Ville", esc(ville)) : "",
    budget !== null ? row("Budget mensuel", esc(fmtEuro(budget))) : "",
    net !== null ? row("Ce qui reste dans ta poche", esc(`${fmtEuro(net)}/mois`)) : "",
  ].join("");
  return rows
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 4px;">${rows}</table>`
    : "";
}

function unsubUrl(token: string): string {
  return `${baseUrl()}/api/unsub?t=${encodeURIComponent(token)}`;
}

export function relanceJ2Email(args: { snapshot: LooseSnapshot; unsubToken: string }): {
  subject: string;
  html: string;
} {
  const t = emails.relanceJ2;
  const net = num(args.snapshot?.net);
  const subject =
    net !== null && net > 0 ? t.subjectAvecChiffre(fmtEuro(net)) : t.subjectSansChiffre;
  const body = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">${esc(t.intro)}</p>
    ${recapRows(args.snapshot)}
    <p style="margin:16px 0 0;font-size:14px;line-height:1.7;">${esc(t.body)}</p>
    ${button(`${baseUrl()}/`, t.cta)}
    <p style="margin:8px 0 0;text-align:center;font-size:11px;color:${C.muted};">${esc(t.ctaSub)}</p>`;
  return {
    subject,
    html: layout({ preheader: t.intro, body, unsubUrl: unsubUrl(args.unsubToken) }),
  };
}

export function relanceJ5Email(args: { snapshot: LooseSnapshot; unsubToken: string }): {
  subject: string;
  html: string;
} {
  const t = emails.relanceJ5;
  const net = num(args.snapshot?.net);
  const intro =
    net !== null && net > 0 ? t.introAvecChiffre(fmtEuro(net)) : t.introSansChiffre;
  const body = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;font-weight:bold;">${esc(intro)}</p>
    <p style="margin:0;font-size:14px;line-height:1.7;">${esc(t.body)}</p>
    <p style="margin:12px 0 0;font-size:14px;"><a href="${baseUrl()}/cout-de-lattente.pdf" style="color:${C.blue};font-weight:bold;">${esc(t.pdfLabel)}</a></p>
    ${button(`${baseUrl()}/`, t.cta)}
    <p style="margin:8px 0 0;text-align:center;font-size:11px;color:${C.muted};">${esc(t.ctaSub)}</p>`;
  return {
    subject: t.subject,
    html: layout({ preheader: intro, body, unsubUrl: unsubUrl(args.unsubToken) }),
  };
}
```

- [ ] **Step 4: Vérifier**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/email/templates/relances.ts tests/email/templates.test.ts
git commit -m "feat(email): templates relances J+2 (son chiffre) et J+5 (coût de l'attente)"
```

---

### Task 6: Client d'envoi (`lib/email/client.ts`)

**Files:**
- Create: `lib/email/client.ts`
- Create: `tests/email/client.test.ts`

- [ ] **Step 1: Écrire les tests qui échouent**

`tests/email/client.test.ts` :

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "@/lib/email/client";

const ARGS = { to: "a@b.fr", subject: "Sujet", html: "<p>x</p>" };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("sendEmail", () => {
  it("sans RESEND_API_KEY → {sent:false, reason:'no-key'}, sans jeter", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    await expect(sendEmail(ARGS)).resolves.toEqual({ sent: false, reason: "no-key" });
  });

  it("réponse 200 → sent:true avec l'id provider", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ id: "em_123" }), { status: 200 }))
    );
    await expect(sendEmail(ARGS)).resolves.toEqual({ sent: true, providerId: "em_123" });
  });

  it("réponse 422 → sent:false avec le statut dans reason", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("invalid from", { status: 422 })));
    const r = await sendEmail(ARGS);
    expect(r.sent).toBe(false);
    if (!r.sent) expect(r.reason).toContain("422");
  });

  it("fetch qui jette → sent:false, jamais d'exception", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("réseau"))));
    const r = await sendEmail(ARGS);
    expect(r.sent).toBe(false);
    if (!r.sent) expect(r.reason).toBe("réseau");
  });
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npm test`
Expected: FAIL — module `client` introuvable.

- [ ] **Step 3: Écrire `lib/email/client.ts`**

```ts
import "server-only";

/* ──────────────────────────────────────────────────────────────
   Unique porte de sortie email — API HTTP Resend en fetch direct
   (pas de SDK : un POST JSON suffit).

   Contrat : NE JETTE JAMAIS. Sans clé → log console + {sent:false,
   reason:"no-key"} (tout le parcours tourne à vide en dev). Un
   échec d'envoi ne doit jamais casser la réponse HTTP de la route
   appelante — l'appelant logge le résultat dans email_log.
   ────────────────────────────────────────────────────────────── */

export type EmailKind =
  | "etude"
  | "confirmation"
  | "notif-interne"
  | "relance-j2"
  | "relance-j5";

export type SendResult =
  | { sent: true; providerId: string | null }
  | { sent: false; reason: string };

const FROM_FALLBACK = "NMF Agence <noreply@nmf-agence.com>";

export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY absente — envoi sauté :", args.to, "·", args.subject);
    return { sent: false, reason: "no-key" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? FROM_FALLBACK,
        to: args.to,
        subject: args.subject,
        html: args.html,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { sent: false, reason: `http ${res.status}: ${text.slice(0, 300)}` };
    }
    const data = (await res.json().catch(() => null)) as { id?: string } | null;
    return { sent: true, providerId: data?.id ?? null };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : "unknown" };
  }
}
```

- [ ] **Step 4: Vérifier**

Run: `npm test`
Expected: PASS (les 4 tests client, grâce au stub `server-only` de la Task 1).

- [ ] **Step 5: Commit**

```bash
git add lib/email/client.ts tests/email/client.test.ts
git commit -m "feat(email): client Resend fetch direct — ne jette jamais, no-key en dev"
```

---

### Task 7: Migration 0006 + journal (`lib/email/log.ts`)

**Files:**
- Create: `supabase/migrations/0006_email_parcours.sql`
- Create: `lib/email/log.ts`

Pas de test unitaire ici : `log.ts` est un passe-plat Supabase (I/O pur), vérifié en intégration aux Tasks 8-12.

- [ ] **Step 1: Écrire la migration**

`supabase/migrations/0006_email_parcours.sql` :

```sql
-- Parcours email (spec 2026-07-16) : désinscription + journal d'envois.

-- 1) Désinscription sur etude_emails — les relances J+2/J+5 sont de la
--    prospection : lien de désinscription obligatoire (RGPD). Le token
--    évite l'email en clair dans l'URL. La désinscription vaut pour
--    l'EMAIL (toutes ses lignes), pas pour la ligne seule.
alter table public.etude_emails
  add column if not exists unsub_token uuid not null default gen_random_uuid(),
  add column if not exists unsubscribed_at timestamptz;

create index if not exists etude_emails_unsub_token_idx
  on public.etude_emails (unsub_token);

-- 2) Journal des envois — traçabilité + idempotence.
create table if not exists public.email_log (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  kind         text not null,   -- etude | confirmation | notif-interne | relance-j2 | relance-j5
  ref_id       uuid,            -- id de la ligne source (etude_emails / audit_leads)
  sent_at      timestamptz not null default now(),
  ok           boolean not null default false,
  provider_id  text,            -- id Resend si envoyé
  error        text
);

create index if not exists email_log_email_idx on public.email_log (email);

-- Le verrou anti-double-relance : l'unicité est garantie PAR LA BASE,
-- pas par le code (cron qui tourne deux fois, race, replay…).
create unique index if not exists email_log_relance_unique
  on public.email_log (email, kind)
  where kind in ('relance-j2', 'relance-j5');

-- RLS deny-all (même politique que audit_leads / r2_responses /
-- etude_emails) : lecture/écriture uniquement via la service_role key.
alter table public.email_log enable row level security;
```

- [ ] **Step 2: Écrire `lib/email/log.ts`**

```ts
import "server-only";
import { getSupabase } from "@/lib/supabase";
import type { EmailKind, SendResult } from "./client";

/* Journal des envois — voir la migration 0006. Deux usages :
   - logEmail : trace après coup (emails directs, sans unicité) ;
   - claimRelance/settleRelance : « réserver puis envoyer » pour les
     relances — l'insert PREND le verrou (index unique partiel), un
     échec d'envoi REND le verrou (delete) pour retenter au cron
     suivant. Le double envoi est impossible au niveau base. */

export const EMAIL_LOG_TABLE = "email_log";

export async function logEmail(entry: {
  email: string;
  kind: EmailKind;
  refId?: string | null;
  result: SendResult;
}): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from(EMAIL_LOG_TABLE).insert({
    email: entry.email.toLowerCase(),
    kind: entry.kind,
    ref_id: entry.refId ?? null,
    ok: entry.result.sent,
    provider_id: entry.result.sent ? entry.result.providerId : null,
    error: entry.result.sent ? null : entry.result.reason,
  });
  if (error) console.error("[email/log]", error.message);
}

/** Réserve le créneau d'envoi. null = déjà pris (ou erreur) → ne pas envoyer. */
export async function claimRelance(
  email: string,
  kind: "relance-j2" | "relance-j5"
): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(EMAIL_LOG_TABLE)
    .insert({ email: email.toLowerCase(), kind, ok: false })
    .select("id")
    .single();
  if (error || !data) return null; // violation d'unicité incluse : déjà claim
  return String(data.id);
}

/** Solde le claim : envoyé → ok=true ; échec → delete (retente demain). */
export async function settleRelance(claimId: string, result: SendResult): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  if (result.sent) {
    const { error } = await supabase
      .from(EMAIL_LOG_TABLE)
      .update({ ok: true, provider_id: result.providerId, error: null })
      .eq("id", claimId);
    if (error) console.error("[email/log] settle", error.message);
  } else {
    const { error } = await supabase.from(EMAIL_LOG_TABLE).delete().eq("id", claimId);
    if (error) console.error("[email/log] release", error.message);
  }
}
```

- [ ] **Step 3: Vérifier**

Run: `npx tsc --noEmit`
Expected: 0 erreur.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0006_email_parcours.sql lib/email/log.ts
git commit -m "feat(email): migration 0006 (unsub + email_log) + journal claim/settle"
```

---

### Task 8: Branchement de l'étude sur `/api/etude`

**Files:**
- Modify: `app/api/etude/route.ts`

- [ ] **Step 1: Ajouter les imports**

En tête de `app/api/etude/route.ts`, après les imports existants :

```ts
import { sendEmail } from "@/lib/email/client";
import { logEmail } from "@/lib/email/log";
import { etudeEmail, isEtudeSnapshot } from "@/lib/email/templates/etude";
```

- [ ] **Step 2: Récupérer le token à l'insert et envoyer**

Dans `POST`, remplacer le bloc insert existant :

```ts
  const { error } = await supabase.from(ETUDE_TABLE).insert({
    email,
    snapshot: sanitizeSnapshot(body.snapshot),
  });
  if (error) {
    console.error("[api/etude]", error.message);
    return NextResponse.json({ ok: false, error: "db error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, stored: true });
```

par :

```ts
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

  /* Email #1 (étude ROI) — best-effort : un échec d'envoi ne doit
     jamais transformer une capture réussie en erreur à l'écran. */
  try {
    if (isEtudeSnapshot(snapshot)) {
      const { subject, html } = etudeEmail({
        snapshot,
        unsubToken: String(data.unsub_token),
      });
      const result = await sendEmail({ to: email, subject, html });
      await logEmail({ email, kind: "etude", refId: String(data.id), result });
    }
  } catch (e) {
    console.error("[api/etude] email", e);
  }

  return NextResponse.json({ ok: true, stored: true });
```

- [ ] **Step 3: Vérifier statiquement**

Run: `npx tsc --noEmit && npx next lint`
Expected: 0 erreur.

- [ ] **Step 4: Vérifier en dev (sans clé locale : renommer temporairement `RESEND_API_KEY` dans `.env.local` en `_RESEND_API_KEY` si on ne veut pas d'envoi réel, sinon laisser et vérifier la réception)**

```bash
# serveur dev lancé (npm run dev), puis :
curl -s -X POST http://localhost:3000/api/etude \
  -H "Content-Type: application/json" \
  -d '{"email":"test-parcours@nmf-agence.test","snapshot":{"metier":"Plombier","ville":"Bordeaux","budget":1500,"net":892,"roi":1.6,"ca":4460,"chantiers":6}}'
```

Expected: `{"ok":true,"stored":true}` — et dans la console du serveur soit `[email] RESEND_API_KEY absente…` (sans clé), soit un envoi réel. ⚠️ La ligne de test en base (et dans `email_log`) sera purgée en Task 14.

- [ ] **Step 5: Commit**

```bash
git add app/api/etude/route.ts
git commit -m "feat(email): envoi de l'étude ROI à la capture (/api/etude)"
```

---

### Task 9: Branchement confirmation + notif interne sur `/api/audit`

**Files:**
- Modify: `app/api/audit/route.ts`

- [ ] **Step 1: Ajouter les imports**

En tête de `app/api/audit/route.ts` :

```ts
import { sendEmail } from "@/lib/email/client";
import { logEmail } from "@/lib/email/log";
import { confirmationEmail } from "@/lib/email/templates/confirmation";
import { notifInterneEmail } from "@/lib/email/templates/notif-interne";
```

- [ ] **Step 2: Envoyer après l'upsert d'un submit**

Dans `POST`, remplacer la fin actuelle :

```ts
  const { error } = await supabase
    .from(AUDIT_TABLE)
    .upsert(payload, { onConflict: "session_id" });
  if (error) return fail(error.message);

  return NextResponse.json({ ok: true, stored: true });
```

par :

```ts
  const { error } = await supabase
    .from(AUDIT_TABLE)
    .upsert(payload, { onConflict: "session_id" });
  if (error) return fail(error.message);

  /* Emails #2 (confirmation prospect) + #3 (notif interne) au submit —
     best-effort : ne modifient jamais la réponse HTTP. */
  if (event === "submit") {
    try {
      const { data: lead } = await supabase
        .from(AUDIT_TABLE)
        .select("*")
        .eq("session_id", session_id)
        .single();
      if (lead) {
        const leadId = typeof lead.id === "string" ? lead.id : null;
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
      }
    } catch (e) {
      console.error("[api/audit] email", e);
    }
  }

  return NextResponse.json({ ok: true, stored: true });
```

- [ ] **Step 3: Vérifier statiquement**

Run: `npx tsc --noEmit && npx next lint`
Expected: 0 erreur.

- [ ] **Step 4: Vérifier en dev**

```bash
SID=$(python -c "import uuid;print(uuid.uuid4())")
curl -s -X POST http://localhost:3000/api/audit -H "Content-Type: application/json" \
  -d "{\"session_id\":\"$SID\",\"event\":\"submit\",\"last_step\":10,\"answers\":{\"nom_prenom\":\"Test Parcours\",\"email\":\"test-parcours@nmf-agence.test\",\"activite\":\"Plombier\",\"ville\":\"Bordeaux\"}}"
```

Expected: `{"ok":true,"stored":true}` + 2 tentatives d'envoi dans la console serveur (confirmation vers `test-parcours@…`, notif vers `NOTIF_EMAIL`). ⚠️ Lead de test purgé en Task 14.

- [ ] **Step 5: Commit**

```bash
git add app/api/audit/route.ts
git commit -m "feat(email): confirmation prospect + notification interne au submit du form"
```

---

### Task 10: Désinscription (`/api/unsub`)

**Files:**
- Create: `app/api/unsub/route.ts`

GET affiche une page de confirmation avec un bouton (formulaire POST) ; POST exécute. Deux temps obligatoires : les scanners d'emails (Outlook SafeLinks…) suivent les liens GET — un GET qui désinscrit directement désabonnerait des gens à leur insu. La désinscription vaut pour l'email entier (toutes ses lignes `etude_emails`), pas pour la ligne du token.

- [ ] **Step 1: Écrire la route**

`app/api/unsub/route.ts` :

```ts
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

const NEUTRE = page(
  "Lien invalide ou expiré",
  `<p style="margin:0;font-size:14px;line-height:1.7;">Ce lien de désinscription n'est pas (ou plus) valide. Si tu reçois encore des emails, réponds simplement à l'un d'eux.</p>`
);

/** GET : confirmation en un clic — les scanners suivent les GET, pas les POST. */
export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("t");
  if (!isUuid(t)) return NEUTRE;
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
  if (!isUuid(t)) return NEUTRE;

  const supabase = getSupabase();
  if (!supabase) return NEUTRE;

  // Le token identifie UNE ligne → on désinscrit l'EMAIL (toutes ses lignes).
  const { data: hit } = await supabase
    .from(ETUDE_TABLE)
    .select("email")
    .eq("unsub_token", t)
    .maybeSingle();
  if (!hit?.email) return NEUTRE;

  const { error } = await supabase
    .from(ETUDE_TABLE)
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("email", hit.email)
    .is("unsubscribed_at", null);
  if (error) {
    console.error("[api/unsub]", error.message);
    return NEUTRE;
  }

  return page(
    "C'est fait",
    `<p style="margin:0;font-size:14px;line-height:1.7;">Tu ne recevras plus d'emails de notre part. Bonne continuation.</p>`
  );
}
```

- [ ] **Step 2: Vérifier statiquement**

Run: `npx tsc --noEmit && npx next lint`
Expected: 0 erreur.

- [ ] **Step 3: Vérifier en dev**

```bash
curl -s "http://localhost:3000/api/unsub?t=pas-un-uuid" | grep -o "Lien invalide ou expiré"
curl -s "http://localhost:3000/api/unsub?t=00000000-0000-4000-8000-000000000000" | grep -o "Me désabonner"
```

Expected: les deux textes trouvés (token inconnu mais bien formé → page de confirmation ; le POST sur token inconnu rendrait la page neutre).

- [ ] **Step 4: Commit**

```bash
git add app/api/unsub/route.ts
git commit -m "feat(email): désinscription /api/unsub (GET confirme, POST exécute)"
```

---

### Task 11: Logique pure de sélection des relances

**Files:**
- Create: `lib/email/relances.ts`
- Create: `tests/email/relances.test.ts`

- [ ] **Step 1: Écrire les tests qui échouent**

`tests/email/relances.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { DAY, planRelances, type EtudeRow } from "@/lib/email/relances";

const NOW = new Date("2026-07-16T09:00:00Z");

function rowAt(daysAgo: number, over: Partial<EtudeRow> = {}): EtudeRow {
  return {
    email: "a@b.fr",
    snapshot: { metier: "Plombier", net: 892 },
    created_at: new Date(NOW.getTime() - daysAgo * DAY).toISOString(),
    unsub_token: "tok",
    unsubscribed_at: null,
    ...over,
  };
}

function plan(rows: EtudeRow[], over: Partial<Parameters<typeof planRelances>[0]> = {}) {
  return planRelances({
    rows,
    completedEmails: new Set(),
    logged: new Set(),
    now: NOW,
    ...over,
  });
}

describe("planRelances", () => {
  it("< 2 jours → rien", () => {
    expect(plan([rowAt(1)])).toEqual([]);
  });

  it("3 jours → J+2", () => {
    expect(plan([rowAt(3)])).toMatchObject([{ email: "a@b.fr", kind: "relance-j2" }]);
  });

  it("3 jours mais J+2 déjà loggée → rien", () => {
    expect(plan([rowAt(3)], { logged: new Set(["a@b.fr|relance-j2"]) })).toEqual([]);
  });

  it("6 jours, rien loggé → J+5 seulement (jamais deux le même jour)", () => {
    expect(plan([rowAt(6)])).toMatchObject([{ kind: "relance-j5" }]);
  });

  it("6 jours, J+5 loggée → rien (la fenêtre J+2 est passée)", () => {
    expect(plan([rowAt(6)], { logged: new Set(["a@b.fr|relance-j5"]) })).toEqual([]);
  });

  it("désabonné → rien", () => {
    expect(plan([rowAt(3, { unsubscribed_at: NOW.toISOString() })])).toEqual([]);
  });

  it("RDV pris (audit completed) → rien", () => {
    expect(plan([rowAt(3)], { completedEmails: new Set(["a@b.fr"]) })).toEqual([]);
  });

  it("> 30 jours → rien (anti-rafale du premier run)", () => {
    expect(plan([rowAt(31)])).toEqual([]);
  });

  it("plusieurs lignes même email → âge de la 1ʳᵉ capture, snapshot de la dernière", () => {
    const plans = plan([
      rowAt(3, { snapshot: { net: 100 }, unsub_token: "vieux" }),
      rowAt(1, { snapshot: { net: 892 }, unsub_token: "recent" }),
    ]);
    expect(plans).toMatchObject([
      { kind: "relance-j2", snapshot: { net: 892 }, unsubToken: "recent" },
    ]);
  });

  it("emails insensibles à la casse", () => {
    expect(
      plan([rowAt(3, { email: "A@B.fr" })], { completedEmails: new Set(["a@b.fr"]) })
    ).toEqual([]);
  });
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npm test`
Expected: FAIL — module `relances` (lib) introuvable.

- [ ] **Step 3: Écrire `lib/email/relances.ts`**

```ts
/* ──────────────────────────────────────────────────────────────
   Sélection des relances — logique PURE (aucun accès base), le
   cron lui donne les données et exécute son plan. Règles :
   - âge = 1ʳᵉ capture de l'email ; snapshot/token = ligne la plus
     récente (son dernier réglage) ;
   - suppression : désabonné, RDV pris, déjà envoyé, > 30 j ;
   - au plus UNE relance par email et par run : J+5 prime, et une
     fenêtre J+2 manquée (âge ≥ 5 j) ne s'envoie plus jamais.
   ────────────────────────────────────────────────────────────── */

export const DAY = 86_400_000;
const MAX_AGE = 30 * DAY;

export type EtudeRow = {
  email: string;
  snapshot: Record<string, unknown> | null;
  created_at: string;
  unsub_token: string;
  unsubscribed_at: string | null;
};

export type RelanceKind = "relance-j2" | "relance-j5";

export type RelancePlan = {
  email: string;
  kind: RelanceKind;
  snapshot: Record<string, unknown> | null;
  unsubToken: string;
};

export function planRelances(args: {
  rows: EtudeRow[];
  /** Emails (minuscules) présents dans audit_leads en status completed. */
  completedEmails: Set<string>;
  /** Entrées `email|kind` (email minuscules) déjà dans email_log. */
  logged: Set<string>;
  now: Date;
}): RelancePlan[] {
  const byEmail = new Map<string, EtudeRow[]>();
  for (const row of args.rows) {
    const key = row.email.trim().toLowerCase();
    if (!key) continue;
    const list = byEmail.get(key);
    if (list) list.push(row);
    else byEmail.set(key, [row]);
  }

  const plans: RelancePlan[] = [];
  for (const [email, rows] of byEmail) {
    if (args.completedEmails.has(email)) continue;
    if (rows.some((r) => r.unsubscribed_at)) continue;

    const sorted = [...rows].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const first = new Date(sorted[0].created_at).getTime();
    if (!Number.isFinite(first)) continue;
    const age = args.now.getTime() - first;
    if (age < 2 * DAY || age > MAX_AGE) continue;

    const kind: RelanceKind | null =
      age >= 5 * DAY
        ? args.logged.has(`${email}|relance-j5`)
          ? null
          : "relance-j5"
        : args.logged.has(`${email}|relance-j2`)
          ? null
          : "relance-j2";
    if (!kind) continue;

    const latest = sorted[sorted.length - 1];
    plans.push({ email, kind, snapshot: latest.snapshot, unsubToken: latest.unsub_token });
  }
  return plans;
}
```

- [ ] **Step 4: Vérifier**

Run: `npm test`
Expected: PASS (10 tests relances).

- [ ] **Step 5: Commit**

```bash
git add lib/email/relances.ts tests/email/relances.test.ts
git commit -m "feat(email): planRelances — règles de suppression pures et testées"
```

---

### Task 12: Route cron + `vercel.json`

**Files:**
- Create: `app/api/cron/relances/route.ts`
- Create: `vercel.json`

- [ ] **Step 1: Écrire la route**

`app/api/cron/relances/route.ts` :

```ts
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
```

- [ ] **Step 2: Créer `vercel.json`**

```json
{
  "crons": [{ "path": "/api/cron/relances", "schedule": "0 9 * * *" }]
}
```

(1 cron/jour = compatible plan Hobby. Vercel appelle la route en GET avec `Authorization: Bearer $CRON_SECRET`.)

- [ ] **Step 3: Vérifier statiquement**

Run: `npx tsc --noEmit && npx next lint`
Expected: 0 erreur.

- [ ] **Step 4: Vérifier en dev**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/cron/relances
# → 401 (pas de Bearer)
CRON=$(grep "^CRON_SECRET=" .env.local | cut -d= -f2)
curl -s http://localhost:3000/api/cron/relances -H "Authorization: Bearer $CRON"
# → {"ok":true,"planned":0,...} (rien d'éligible : les captures ont moins de 2 jours)
```

Expected: `401` puis un JSON `ok:true`.

- [ ] **Step 5: Commit**

```bash
git add app/api/cron/relances/route.ts vercel.json
git commit -m "feat(email): cron quotidien des relances J+2/J+5 (claim en base, CRON_SECRET)"
```

---

### Task 13: Page de préview `/dev/emails`

**Files:**
- Create: `app/dev/emails/page.tsx`

- [ ] **Step 1: Écrire la page**

`app/dev/emails/page.tsx` :

```tsx
import { notFound } from "next/navigation";
import { confirmationEmail } from "@/lib/email/templates/confirmation";
import { etudeEmail } from "@/lib/email/templates/etude";
import { notifInterneEmail } from "@/lib/email/templates/notif-interne";
import { relanceJ2Email, relanceJ5Email } from "@/lib/email/templates/relances";

/* Préview des 5 emails du parcours — DEV UNIQUEMENT (notFound() en
   prod). Les templates sont des fonctions pures : on les rend ici
   avec des données d'exemple, sans clé, sans envoi. */

export const dynamic = "force-dynamic";

const SNAPSHOT = {
  metier: "Plombier",
  ville: "Bordeaux",
  budget: 1500,
  net: 892,
  roi: 1.6,
  ca: 4460,
  chantiers: 6,
};

const LEAD = {
  nom_prenom: "Karim Benali",
  email: "karim@exemple.fr",
  telephone: "06 12 34 56 78",
  ville: "Bordeaux",
  activite: "Plombier",
  ca_actuel: "8 000 – 15 000 €",
  ca_objectif: "20 000 € et plus",
  problematique: "Pas assez de demandes régulières, dépendant du bouche-à-oreille.",
  reglable_seul: false,
  experience_digital: 2,
  budget_ads: 1000,
  sim_ca_estime: 4460,
  utm_source: "facebook",
  utm_campaign: "lp-acquisition",
  device: "mobile",
};

const TOKEN = "00000000-0000-4000-8000-000000000000";

export default function DevEmailsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const items = [
    { title: "1 · Étude ROI — immédiat, à la capture", ...etudeEmail({ snapshot: SNAPSHOT, unsubToken: TOKEN }) },
    { title: "2 · Confirmation — au submit du form", ...confirmationEmail({ prenom: "Karim" }) },
    { title: "3 · Notification interne — au submit du form", ...notifInterneEmail({ lead: LEAD }) },
    { title: "4 · Relance J+2 — email laissé, pas de RDV", ...relanceJ2Email({ snapshot: SNAPSHOT, unsubToken: TOKEN }) },
    { title: "5 · Relance J+5 — le coût de l'attente", ...relanceJ5Email({ snapshot: SNAPSHOT, unsubToken: TOKEN }) },
  ];

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 16px", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Parcours email — préview dev</h1>
      <p style={{ color: "#666", marginBottom: 32 }}>
        Rendu exact des 5 emails (données d&apos;exemple). Rien n&apos;est envoyé.
      </p>
      {items.map((item) => (
        <section key={item.title} style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, marginBottom: 4 }}>{item.title}</h2>
          <p style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
            Objet : <strong>{item.subject}</strong>
          </p>
          <iframe
            srcDoc={item.html}
            title={item.title}
            style={{ width: "100%", height: 680, border: "1px solid #ddd", background: "#fff" }}
          />
        </section>
      ))}
    </main>
  );
}
```

- [ ] **Step 2: Vérifier statiquement**

Run: `npx tsc --noEmit && npx next lint`
Expected: 0 erreur.

- [ ] **Step 3: Vérifier dans le navigateur**

Ouvrir `http://localhost:3000/dev/emails` : les 5 emails rendus dans des iframes, objets affichés, DA document (bleu/blanc, filets), lien de désinscription visible sur l'étude et les 2 relances, absent de la confirmation et de la notif interne.

- [ ] **Step 4: Commit**

```bash
git add app/dev/emails/page.tsx
git commit -m "feat(email): page de préview /dev/emails (dev only, rendu des 5 templates)"
```

---

### Task 14: Finitions + vérification complète

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Documenter les env dans `.env.example`**

Ajouter à la fin :

```dotenv
# ── Parcours email (Resend) ──
# Sans RESEND_API_KEY : rien ne part, tout est loggé en console (dev).
RESEND_API_KEY=re_...
RESEND_FROM=NMF Agence <noreply@nmf-agence.com>
# Boîte qui reçoit la notification interne « nouveau lead »
NOTIF_EMAIL=toi@exemple.fr
# Verrou de /api/cron/relances (chaîne aléatoire longue — Vercel l'envoie en Bearer)
CRON_SECRET=change-moi-64-caracteres
```

- [ ] **Step 2: Vérification complète**

```bash
npm test && npx tsc --noEmit && npx next lint && npx next build
```

Expected: tests PASS, 0 erreur TS/lint, build OK.

- [ ] **Step 3: Purger les données de test**

Supprimer de Supabase (SQL editor) les lignes créées aux Tasks 8-9 :

```sql
delete from public.email_log   where email like '%nmf-agence.test';
delete from public.etude_emails where email like '%nmf-agence.test';
delete from public.audit_leads  where email like '%nmf-agence.test';
```

(Si Supabase n'était pas configuré en local pendant les tests, rien à purger.)

- [ ] **Step 4: Commit final**

```bash
git add .env.example
git commit -m "docs(email): variables d'environnement du parcours email dans .env.example"
```

- [ ] **Step 5: Rappel de mise en service (hors code — Nicolas)**

1. Appliquer `supabase/migrations/0006_email_parcours.sql` via le dashboard Supabase.
2. Recopier `RESEND_API_KEY`, `RESEND_FROM`, `NOTIF_EMAIL`, `CRON_SECRET` dans Vercel (Production) — valeurs dans le vault, `Credentials.md` § « LP funnel ».
3. Valider visuellement `/dev/emails`, puis push → le cron s'active au déploiement.

---

## Auto-review du plan

- **Couverture spec** : 5 emails ✓ (Tasks 3-5, 8-9, 12) · client no-key/ne-jette-jamais ✓ (Task 6) · migration unsub + email_log + index unique partiel ✓ (Task 7) · `/api/unsub` ✓ (Task 10, renforcé GET→POST contre les scanners) · règles de suppression + 30 j + snapshot récent ✓ (Task 11) · cron + `vercel.json` + Bearer ✓ (Task 12) · préview ✓ (Task 13) · `.env.example` ✓ (Task 14) · « échec d'envoi ne casse jamais la réponse » ✓ (try/catch Tasks 8-9, best-effort).
- **Types cohérents** : `SendResult` consommé par `logEmail`/`settleRelance` ; `EtudeRow`/`RelancePlan` partagés entre `relances.ts` et le cron ; `EmailKind` unique dans `client.ts`.
- **Écarts assumés vs spec** : `email_log.error`/`provider_id` portés par `SendResult` (signature `logEmail` simplifiée) ; unsub en deux temps (GET confirme, POST exécute) — plus strict que la spec, justifié par les scanners de liens.
