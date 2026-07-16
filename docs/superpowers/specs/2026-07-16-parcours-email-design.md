# Parcours email du funnel — design

**Date** : 2026-07-16 · **Statut** : validé par Nicolas (brainstorm en 4 sections)

## Objectif

Construire le parcours email complet du funnel LP (étude ROI, confirmation, notification
interne, relances J+2/J+5) de sorte qu'il soit **opérationnel immédiatement** : la clé
Resend existe déjà (compte partagé scrapProsp/AFMO), le domaine `nmf-agence.com` est
vérifié, les 4 variables d'env sont posées dans `.env.local`. Il ne reste à Nicolas que
la migration Supabase et les env vars Vercel.

## Les 5 emails

| # | Email | Déclencheur | Destinataire |
|---|-------|-------------|--------------|
| 1 | **Étude ROI** | `/api/etude`, après insert réussi | prospect |
| 2 | **Confirmation post-form** | `/api/audit`, `event === "submit"` | prospect |
| 3 | **Notification interne** | idem #2 | `NOTIF_EMAIL` |
| 4 | **Relance J+2** — « ton chiffre t'attend » | cron quotidien | prospect capté sans RDV |
| 5 | **Relance J+5** — « le coût de l'attente » (matière : `cout-de-lattente.pdf`) | cron quotidien | idem |

- **Format** : HTML dans le corps du mail, pas de pièce jointe (délivrabilité, domaine
  sans historique d'envoi transactionnel volumineux). Snapshot du simulateur mis en page
  façon « document » (DA du simulateur : bleu/blanc, filets 1 px, zéro arrondi/ombre).
- **Pas de doublon Koalendar** : la confirmation part au submit du form, *avant* la
  réservation (« réserve ton créneau ») ; Koalendar confirme *après*. Deux moments.

## Architecture — `lib/email/`

- **`client.ts`** — unique porte de sortie. `sendEmail({to, subject, html, kind, refId})`
  enveloppe l'API HTTP Resend (fetch direct, pas de SDK). **Sans `RESEND_API_KEY` : log
  console + `{sent: false, reason: "no-key"}`, ne jette jamais.** Un échec d'envoi ne
  casse jamais la réponse HTTP de la route appelante (log dans `email_log` + console,
  le prospect reçoit son `{ok: true}`).
- **`templates/`** — une fonction pure par mail (`etude.ts`, `confirmation.ts`,
  `notif-interne.ts`, `relance-j2.ts`, `relance-j5.ts`). Entrée typée → `{subject, html}`.
  Aucun accès réseau/base → rendables dans le navigateur.
- **`layout.ts`** — coquille commune : tableaux HTML + styles inline (compat clients
  mail), pied de page mentions + lien de désabonnement.
- **`config/emails.ts`** — tous les textes, éditables sans toucher au code (même logique
  que `site.ts` / `simulateur.ts`).

## Prévisualisation

`app/dev/emails/page.tsx` — `notFound()` en production. Rend les 5 templates dans des
iframes avec données d'exemple réalistes (plombier, Bordeaux, 1 500 €). Itération
visuelle sans clé, sans envoi.

## Données — migration `0006_email_parcours.sql`

1. `etude_emails` + `unsub_token uuid default gen_random_uuid()` +
   `unsubscribed_at timestamptz`. Token dans l'URL de désinscription (pas d'email en
   clair). Route **`/api/unsub`** (GET, page de confirmation sobre). Obligatoire RGPD :
   les relances sont de la prospection.
2. Table **`email_log`** (`id`, `email`, `kind`, `ref_id`, `sent_at`, `ok`,
   `provider_id`, `error`) — journal + idempotence. **Index unique partiel sur
   `(email, kind)` pour `kind in ('relance-j2','relance-j5')`** : le double envoi de
   relance est impossible au niveau base, pas seulement au niveau code.
3. RLS deny-all partout (politique des tables existantes).

## Relances — `/api/cron/relances`

- **Approche retenue (A)** : cron Vercel quotidien, suppression évaluée **au moment de
  l'envoi** sur données fraîches (vs `scheduled_at` Resend, rejeté : état chez Resend,
  annulation à orchestrer, risque de relancer quelqu'un qui a réservé, non testable
  sans clé).
- `vercel.json` à créer : `{"crons": [{"path": "/api/cron/relances", "schedule": "0 9 * * *"}]}`
  (1 cron/jour max en plan Hobby — compatible).
- Protection : `Authorization: Bearer ${CRON_SECRET}` (envoyé par Vercel).
- **Règles de suppression** (toutes doivent passer) :
  - pas de `unsubscribed_at` ;
  - aucun `audit_leads` même email en `status = 'completed'` (RDV pris → silence) ;
  - aucune ligne `email_log` pour ce `(email, kind)` ;
  - `created_at` **< 30 jours** (anti-rafale du premier run sur backlog).
- `etude_emails` est insert-only → regrouper par email, prendre le **snapshot le plus
  récent** (son dernier réglage).

## Variables d'environnement

Posées dans `.env.local` le 2026-07-16 ; à recopier dans Vercel (Production).
Valeurs dans le vault Obsidian, `Credentials.md` § « LP funnel ».

| Var | Rôle |
|-----|------|
| `RESEND_API_KEY` | envoi (compte partagé, existante) |
| `RESEND_FROM` | `NMF Agence <noreply@nmf-agence.com>` (domaine vérifié) |
| `NOTIF_EMAIL` | boîte de Nicolas pour la notif interne |
| `CRON_SECRET` | verrou de `/api/cron/relances` (généré 2026-07-16) |

## Reste à la charge de Nicolas

1. Appliquer `0006_email_parcours.sql` via le dashboard Supabase (comme `0005`).
2. Recopier les 4 env vars dans Vercel.

## Hors périmètre (assumé)

- Rate limiting de `/api/etude` (dette réelle, sujet séparé).
- Onglet admin pour `etude_emails` (la notif interne couvre le besoin de visibilité).

## Tests / vérification

- `tsc --noEmit` + `next lint` propres.
- Page `/dev/emails` : rendu visuel des 5 templates validé par Nicolas.
- `/api/etude` et `/api/audit` (submit) : envoi loggé en console sans clé, réponse HTTP
  inchangée en cas d'échec simulé.
- `/api/cron/relances` appelée à la main avec le Bearer : suppression correcte sur cas
  de test (désabonné, RDV pris, déjà envoyé, > 30 j), et 401 sans Bearer.
- `/api/unsub` : token valide → `unsubscribed_at` posé + page de confirmation ; token
  inconnu → message neutre.
