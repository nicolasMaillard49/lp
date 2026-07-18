# Activation Visiteurs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir davantage de visiteurs mobiles du simulateur en contacts exploitables et mesurer précisément chaque décrochage du funnel.

**Architecture:** La session `audit_leads` existante reste l'identité unique. De nouveaux événements idempotents enrichissent cette ligne, un composant de conversion léger enregistre l'email et le snapshot, et l'admin agrège les nouveaux jalons sans ajouter de SDK client.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase, Resend, Vitest, Tailwind CSS v4, Meta Pixel.

## Global Constraints

- Aucun nouveau SDK client ni nouvelle dépendance.
- Toutes les écritures restent idempotentes par `session_id`.
- Le CTA fixe est mobile uniquement et ne doit masquer aucun contenu.
- L'envoi email est best-effort et ne bloque jamais l'enregistrement Supabase.
- Les migrations `0008` à `0011` doivent être appliquées avant le déploiement du code (fait en production le 2026-07-19).
- Les changements doivent préserver les modifications non commitée déjà présentes dans le worktree.

---

### Task 1: Contrat des événements et migration

**Files:**
- Create: `lib/activation.ts`
- Create: `tests/activation.test.ts`
- Create: `supabase/migrations/0008_activation_funnel.sql`
- Modify: `hooks/useAuditSession.ts`
- Modify: `app/api/audit/route.ts`

**Interfaces:**
- Produces: `ActivationMark`, `isValidEstimateEmail(value)`, `normalizeEstimateEmail(value)` et les événements `scroll_25`, `scroll_50`, `scroll_75`, `result_viewed`, `cta_viewed`, `cta_clicked`, `estimate_requested`.

- [ ] **Step 1: Écrire les tests rouges de validation email et contrat d'événements**
- [ ] **Step 2: Lancer `npm test -- tests/activation.test.ts` et constater l'échec par module absent**
- [ ] **Step 3: Implémenter les helpers purs et étendre les types du hook**
- [ ] **Step 4: Ajouter les colonnes booléennes et `estimate_requested_at` dans la migration**
- [ ] **Step 5: Étendre l'API pour les marks idempotents et la demande d'estimation validée**
- [ ] **Step 6: Relancer le test ciblé jusqu'au vert**

### Task 2: Email d'estimation existant et nouvelle identité visuelle

**Files:**
- Modify: `components/simulateur/EmailEtude.tsx`
- Modify: `lib/email/layout.ts`
- Modify: `tests/email/templates.test.ts`
- Modify: `app/api/audit/route.ts`

**Interfaces:**
- Consumes: snapshot simulateur nettoyé par l'API.
- Produces: rattachement de la capture `/api/etude` existante à la session audit et coque email bleu/blanc commune.

- [ ] **Step 1: Écrire un test rouge vérifiant palette bleue et absence de dégradé/corail**
- [ ] **Step 2: Lancer le test et constater l'échec sur l'ancienne palette**
- [ ] **Step 3: Refaire la coque email commune sur les tokens du simulateur**
- [ ] **Step 4: Rattacher le succès de `/api/etude` à `estimate_requested` sur la session audit**
- [ ] **Step 5: Relancer les tests email ciblés**

### Task 3: Instrumentation du simulateur et micro-conversion

**Files:**
- Create: `components/simulateur/EstimateCapture.tsx`
- Create: `hooks/useActivationTracking.ts`
- Modify: `components/simulateur/SimulateurTicket.tsx`
- Modify: `components/lp/AcquisitionLp.tsx`
- Modify: `lib/fpixel.ts`

**Interfaces:**
- Consumes: `AuditSession.mark`, `SimSnapshot`, refs du résultat et du CTA.
- Produces: CTA mobile fixe, formulaire email, événements viewport/scroll/Meta et callback `onEstimateRequested`.

- [ ] **Step 1: Écrire les tests rouges des seuils de scroll dans `tests/activation.test.ts`**
- [ ] **Step 2: Implémenter un hook avec un écouteur passif et deux `IntersectionObserver` nettoyés**
- [ ] **Step 3: Exposer les refs résultat/CTA et le snapshot courant depuis `SimulateurTicket`**
- [ ] **Step 4: Ajouter `EstimateCapture` avec validation client, chargement, erreur et succès**
- [ ] **Step 5: Ajouter le CTA fixe mobile après interaction et réserver son espace**
- [ ] **Step 6: Envoyer les événements Meta dédupliqués sans bloquer l'UI**
- [ ] **Step 7: Lancer les tests ciblés et `npx tsc --noEmit`**

### Task 4: Statistiques et segments admin

**Files:**
- Modify: `lib/statsTypes.ts`
- Modify: `app/api/admin/stats/route.ts`
- Modify: `components/admin/parts.tsx`
- Modify: `app/admin/page.tsx`
- Create: `app/api/admin/estimates/[id]/route.ts`

**Interfaces:**
- Produces: totaux des nouveaux jalons, `activationFunnel`, `estimates`, onglet Estimations et suppression ciblée.

- [ ] **Step 1: Étendre les types avec les nouveaux totaux et `EstimateRow`**
- [ ] **Step 2: Agréger chaque jalon et construire le funnel avec taux par étape**
- [ ] **Step 3: Ajouter les KPI journaliers d'activation et le funnel lisible**
- [ ] **Step 4: Ajouter l'onglet Estimations et sa table avec confirmation de suppression**
- [ ] **Step 5: Ajouter le DELETE protégé, limité aux lignes `estimate_requested = true` non complétées**
- [ ] **Step 6: Lancer TypeScript et les tests**

### Task 5: Guide Meta et cohérence projet

**Files:**
- Create: `docs/meta-retargeting-simulateur.md`
- Modify: `D:/obsidian/MonCerveau/Projets/nmf-lp-confirmation-rdv.md`

**Interfaces:**
- Produces: procédure audiences 7/30 jours, exclusions et ordre d'optimisation.

- [ ] **Step 1: Documenter les audiences `ViewContent`, `NmfSimulatorUsed`, `Lead estimation-request`**
- [ ] **Step 2: Documenter les exclusions leads terminés et hors France**
- [ ] **Step 3: Mettre à jour le vault avec le nouveau funnel et la migration requise**

### Task 6: Vérification complète

**Files:**
- Verify all modified files.

**Interfaces:**
- Consumes: application complète et serveur local.
- Produces: preuves tests, build, rendu mobile/desktop et API.

- [ ] **Step 1: Lancer `npm test`**
- [ ] **Step 2: Lancer `npx tsc --noEmit`**
- [ ] **Step 3: Lancer `npm run build`**
- [ ] **Step 4: Relancer le serveur local sur un port libre**
- [ ] **Step 5: Vérifier `/` et `/admin` sur mobile et desktop dans un navigateur**
- [ ] **Step 6: Vérifier que le CTA fixe ne recouvre pas le contenu et que l'API refuse un email invalide**
- [ ] **Step 7: Examiner `git diff --check` et `git status --short` sans toucher aux changements antérieurs**
