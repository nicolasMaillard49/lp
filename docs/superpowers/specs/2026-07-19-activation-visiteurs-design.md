# Activation des visiteurs du simulateur

## Objectif

Transformer davantage des visiteurs Meta majoritairement mobiles en prospects identifiables, sans allonger le chargement initial ni forcer immédiatement le questionnaire complet.

Le parcours cible est :

`visite -> interaction simulateur -> résultat consulté -> estimation sauvegardée ou audit demandé -> questionnaire -> lead`

## Expérience mobile

- Le simulateur reste l'expérience principale et conserve son calcul actuel.
- Après la première modification du métier, de la ville ou du budget, un CTA fixe apparaît en bas de l'écran : **Recevoir mon estimation gratuite**.
- Le CTA ne masque pas le contenu : la page réserve l'espace nécessaire en bas sur mobile.
- Le clic amène vers une zone de conversion placée juste après le résultat, sans changer de route.
- Cette zone propose d'abord une micro-conversion : saisir son email pour sauvegarder l'estimation.
- Une fois l'estimation enregistrée, le visiteur voit la confirmation puis peut poursuivre vers **Recevoir mon audit gratuit** et le questionnaire existant.
- Sur desktop, aucune barre fixe n'est ajoutée. La zone de conversion reste visible dans le flux normal.

## Micro-conversion

La demande d'estimation contient : email, métier, ville, budgets Ads/LSA, panier, transformation, CA estimé et ROI. Elle réutilise la session existante afin de ne pas créer un doublon Supabase.

L'API valide et normalise l'email côté serveur. Une demande répétée pour la même session met à jour la ligne existante. L'interface gère les états chargement, succès et erreur sans perdre les réglages du simulateur.

La ligne reste distincte d'un lead terminé grâce à un jalon `estimate_requested`; elle n'apparaît donc pas dans la table des leads qualifiés. Elle apparaît dans un nouveau segment **Estimations** de l'admin, avec une action de suppression identique à celle des leads.

L'envoi d'un email contenant l'estimation est best-effort via l'infrastructure Resend existante. Une panne d'email ne doit pas annuler l'enregistrement du prospect.

## Mesure du funnel

Les jalons suivants sont dédupliqués une fois par session :

- `visit` : arrivée réelle sur la page ;
- `scroll_25`, `scroll_50`, `scroll_75` : profondeur maximale atteinte ;
- `sim_used` : première manipulation du simulateur ;
- `result_viewed` : bloc CA potentiel réellement entré dans le viewport ;
- `cta_viewed` : zone de conversion réellement visible ;
- `cta_clicked` : clic sur le CTA fixe ou principal ;
- `estimate_requested` : email valide enregistré ;
- `form_opened`, `started`, `completed` : parcours de qualification existant.

Les événements comportementaux sont stockés sous forme de colonnes booléennes dans `audit_leads`. Ce choix reste compatible avec le modèle actuel, évite une table d'événements volumineuse et suffit pour analyser ce funnel court.

Meta reçoit en parallèle :

- `ViewContent` à l'arrivée ;
- `NmfSimulatorUsed` à la première interaction ;
- `ViewContent` avec `content_name: estimation-result` lorsque le résultat est vu ;
- `Lead` avec `content_name: estimation-request` à la micro-conversion ;
- `InitiateCheckout` à l'ouverture du questionnaire complet ;
- le `Lead` final existant après qualification.

Les événements intermédiaires permettent de créer des audiences 7 et 30 jours. L'optimisation de campagne commencera sur l'événement disposant d'un volume suffisant, puis descendra progressivement vers le lead final.

## Dashboard admin

La vue journalière devient prioritaire et affiche : visites, visiteurs uniques, simulateurs utilisés, résultats vus, CTA vus, clics CTA, estimations demandées, formulaires ouverts et leads terminés.

Le funnel affiche les volumes et taux entre chaque jalon. Les graphiques et filtres de provenance existants restent inchangés. Les statistiques antérieures à la migration restent lisibles mais ne sont pas assimilées à des zéros fiables pour les nouveaux jalons ; l'interface affiche la date de début de mesure.

Un onglet **Estimations** liste les contacts ayant demandé leur résultat sans terminer le questionnaire. Il permet de supprimer uniquement ces contacts, avec confirmation.

## Qualité, sécurité et performance

- Aucun nouveau SDK client : IntersectionObserver, scroll passif et API existante uniquement.
- Les événements de scroll sont regroupés dans un seul écouteur passif, avec travail minimal.
- Les observateurs sont déconnectés au démontage.
- Email limité en longueur, normalisé et validé côté serveur.
- L'endpoint conserve les protections serveur Supabase actuelles et ne divulgue aucune clé.
- Les écritures sont idempotentes par `session_id`.
- La migration SQL doit être appliquée en production avant le déploiement du code.

## Vérification

- Tests unitaires sur la validation email, la construction du payload d'estimation et les taux du funnel.
- Test d'intégration manuel mobile : apparition du CTA, absence de recouvrement, navigation vers la conversion et conservation du simulateur.
- Test API : demande valide, email invalide, répétition de requête et absence de configuration Supabase en développement.
- TypeScript, suite Vitest et build Next.js complets.
- Contrôle visuel desktop et mobile dans le navigateur local.

## Hors code

La création des campagnes et audiences dans Meta Ads Manager reste une action externe. Le site fournira tous les événements nécessaires, ainsi qu'une courte fiche de configuration avec les fenêtres 7/30 jours et les exclusions recommandées (leads déjà terminés et trafic hors France).
