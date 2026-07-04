# Formulaire d'audit + funnel analytics — Design

- **Date** : 2026-07-04
- **Projet** : `nmf-lp-confirmation-rdv` (`D:\projets\lp`)
- **Statut** : validé → implémentation

## Contexte & objectif

La LP actuelle est une page de confirmation post-booking. On ajoute **en amont** un
**formulaire de qualification** (« Audit de situation ») qui sert de page d'atterrissage
aux Google Ads. Le prospect le remplit, ses données partent dans Supabase, puis il est
redirigé vers la LP. Un **dashboard analytics global** (parité Tally, voire mieux) donne
les stats form-level : visites, complétion, abandons par question, provenance, etc.

## Routing (même projet Next.js)

| Route | Rôle |
|-------|------|
| `/` | Formulaire d'audit (entrée ads) |
| `/bienvenue` | LP actuelle (déplacée depuis `app/page.tsx`, garde son intro « Bienvenue ») |
| `/admin` | Dashboard analytics, protégé par mot de passe |
| `/api/audit` | Route serveur : upsert des réponses / tracking |
| `/api/admin/*` | Routes serveur : login + lecture des stats |

Soumission du form → `router.push('/bienvenue')`.

## Formulaire — 11 étapes (une question par écran)

UX : barre de progression, boutons Précédent/Suivant, validation par champ, transitions
motion, `prefers-reduced-motion` respecté, DA identique à la LP (Fraunces + Manrope,
ambre + touches bleu électrique).

| # | Champ | Clé | Type | Options / validation |
|---|-------|-----|------|----------------------|
| 1 | Nom et prénom | `nom_prenom` | texte | requis |
| 2 | Email | `email` | email | requis, format |
| 3 | Ville | `ville` | texte | requis |
| 4 | Téléphone | `telephone` | tel | requis, format FR |
| 5 | Instagram (@pseudo) | `instagram` | texte | **optionnel** |
| 6 | Ton activité ? | `activite` | select | 12 métiers (`site.metiers`) + « Autre » |
| 7 | À quel stade d'évolution se situe ton activité ? | `ca_actuel` | select | `2 000–4 000 €` · `4 000–8 000 €` · `8 000–12 000 €` · `12 000–20 000 €` · `Plus de 20 000 €` |
| 8 | Ton objectif ? (CA mensuel visé) | `ca_objectif` | select | `2 000–5 000 €` · `5 000–10 000 €` · `10 000–20 000 €` · `20 000–50 000 €` · `Plus de 50 000 €` |
| 9 | La plus grosse problématique qui t'empêche de l'atteindre ? | `problematique` | choix unique | Manque de compétences en acquisition · en vente · Manque de stratégie · Ne sait pas déléguer |
| 10 | Penses-tu être en mesure de régler ça seul ? | `reglable_seul` | choix Oui/Non | booléen |
| 11 | Expérience avec le digital ? | `experience_digital` | étoiles 0–5 | 0 = Aucune |

Note : #7 est une question détournée pour capter le CA mensuel réel.
Tout le contenu (labels, options, fourchettes) est centralisé dans `config/form.ts`.

## Modèle de données — table Supabase `audit_leads`

Approche « brouillon upserté » : **une ligne par visiteur**, créée au chargement,
mise à jour à chaque étape.

```sql
create table if not exists public.audit_leads (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null unique,      -- clé d'upsert (générée client)
  visitor_id          uuid,                      -- persistant localStorage → visiteurs uniques
  status              text not null default 'visited', -- visited | started | completed
  last_step           int  not null default 0,   -- étape max atteinte → abandons
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  completed_at        timestamptz,
  duration_seconds    int,
  -- réponses
  nom_prenom          text,
  email               text,
  ville               text,
  telephone           text,
  instagram           text,
  activite            text,
  ca_actuel           text,
  ca_objectif         text,
  problematique       text,
  reglable_seul       boolean,
  experience_digital  int,   -- 0..5
  -- attribution / device
  referrer            text,
  utm_source          text,
  utm_medium          text,
  utm_campaign        text,
  utm_content         text,
  utm_term            text,
  device              text,  -- desktop | mobile | tablet
  browser             text,
  os                  text,
  country             text,
  city                text
);

alter table public.audit_leads enable row level security;
-- Aucune policy publique : lecture/écriture uniquement via service_role (serveur).
```

Cycle de vie : `visited` (chargement) → `started` (répond à l'étape 1) → `completed`
(soumission). `duration_seconds` = de la création à la dernière action.

## API serveur

- `POST /api/audit` — body `{ session_id, visitor_id, event: 'visit'|'progress'|'submit', last_step?, data? }`.
  Upsert sur `session_id` avec la `service_role key`. Parse device/browser/OS depuis
  `user-agent`, géo depuis les headers Vercel (`x-vercel-ip-country`, `x-vercel-ip-city`),
  attribution depuis referrer + query UTM transmis par le client.
- `POST /api/admin/login` — vérifie `ADMIN_PASSWORD`, pose un cookie `httpOnly` signé.
- `GET /api/admin/stats` — renvoie les agrégats (voir dashboard). Refuse sans cookie valide.
- `GET /api/admin/export` — CSV des leads `completed`.

## Dashboard `/admin` (parité Tally + extras)

Métriques globales (form-level) :
- **Visites**, **visiteurs uniques**, **démarrés** (`last_step ≥ 1`), **complétés**,
  **taux de complétion**, **durée médiane**.
- **Graphe temporel** visites vs soumissions (par jour).
- **Funnel / drop-off par question** : pour chaque étape, atteints vs répondants vs %
  d'abandon → graphe en barres « où ils décrochent ».
- **Answer insights** : bar/pie par question à choix (activité, stade, objectif,
  problématique, réglable seul), moyenne des étoiles (#11).
- **Provenance** : sources de trafic (referrer), **UTM par campagne**.
- **Device / navigateur / OS / géo** (pays, ville).
- **Extras > Tally** : filtre par campagne UTM / activité / ville, vue « leads chauds »
  (`ca_objectif ≥ 20k` **et** `reglable_seul = false`), **export CSV** (gratuit).
- **Table des leads** (per-prospect) avec filtres, en complément du global.

Graphes : barres/donuts en CSS + un sparkline léger (pas de grosse lib ; recharts optionnel
si besoin de la série temporelle interactive).

## Sécurité

- Écriture Supabase **serveur only** (service_role jamais exposée). Table en RLS `deny all`.
- `/admin/*` gardé par un **middleware** : cookie `httpOnly` signé, posé après login par
  mot de passe (`ADMIN_PASSWORD`). Pas d'auth multi-utilisateur (YAGNI).
- Lecture des stats côté serveur, le client ne reçoit que des agrégats.

## Variables d'environnement

`.env.local` (+ Vercel) :
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
ADMIN_COOKIE_SECRET=
```
Un `.env.local.example` documente ces clés. Sans elles, le form dégrade proprement
(l'UI fonctionne, les writes sont no-op en dev + un warning serveur).

## Plan d'implémentation (fichiers)

1. **Routing** : `app/page.tsx` (LP) → `app/bienvenue/page.tsx` ; nouveau `app/page.tsx` = form.
2. `config/form.ts` — steps, labels, options, fourchettes.
3. `lib/supabase.ts` — client service_role (server only).
4. `lib/tracking.ts` — parse UA / géo / attribution.
5. `app/api/audit/route.ts` — upsert.
6. Composants form : `components/form/AuditForm.tsx` + champs (`TextStep`, `SelectStep`,
   `ChoiceStep`, `StarsStep`, `YesNoStep`, `ProgressBar`).
7. Hook `useAuditSession` — session_id/visitor_id, envoi des events.
8. **Admin** : `middleware.ts`, `app/admin/login/page.tsx`, `app/admin/page.tsx`,
   `app/api/admin/{login,stats,export}/route.ts`, composants stats.
9. `.env.local.example`, migration SQL `supabase/migrations/0001_audit_leads.sql`.
10. Mise à jour note Obsidian.

## Hors périmètre (v1)

- A/B testing du form, multi-langue, auth multi-utilisateur, intégration CRM/Calendly
  automatique, notifications email à chaque lead (peut venir en v2).
