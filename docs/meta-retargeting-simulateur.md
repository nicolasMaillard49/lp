# Retargeting Meta du simulateur

Guide d'exploitation court pour le funnel NMF. Ne pas fragmenter davantage tant que le volume reste faible.

## 1. Vérifier les signaux

Dans **Gestionnaire d'événements > Tester les événements**, vérifier avant toute campagne :

- `ViewContent` : arrivée sur le simulateur, une fois par session ;
- `SimulateurResultat` : résultat réellement vu (`result_viewed` côté Supabase) ;
- `NmfSimulatorUsed` : premier réglage manipulé (`sim_used` côté Supabase) ;
- `EtudeEmail` : email enregistré avec succès (`estimate_requested` côté Supabase) ;
- `InitiateCheckout` : ouverture du formulaire d'audit ;
- `Lead` : formulaire final terminé, jamais une simple capture email.

`result_viewed`, `sim_used` et `estimate_requested` sont aussi des jalons Supabase. Un champ uniquement stocké en base ne peut pas alimenter une audience Meta : il faut le dupliquer en event Pixel/CAPI ou utiliser son event Meta équivalent.

## 2. Audiences

| Nom conseillé | Inclusion | Rétention | Usage |
|---|---|---:|---|
| `NMF - RT - Visiteurs resultat - 7j` | `SimulateurResultat` | 7 jours | relance récente, reprise du calcul |
| `NMF - RT - Simulateur utilise - 30j` | `NmfSimulatorUsed` ou `SimulateurResultat` | 30 jours | visiteurs engagés n'ayant pas terminé |
| `NMF - RT - Email chaud - 30j` | `EtudeEmail` | 30 jours | intention forte, invitation à finir l'audit |

Pour limiter le chevauchement :

- audience email : prioritaire ;
- audience simulateur 30 j : exclure l'audience email et l'audience 7 j ;
- audience 7 j : exclure l'audience email ;
- si chaque segment est trop petit, les réunir dans un seul ad set de retargeting.

## 3. Exclusions obligatoires

- Exclure de tous les ad sets les `Lead` terminés, idéalement sur 180 jours.
- Exclure aussi les emails/sessions marqués `completed` si une audience CRM ou CAPI est disponible.
- Cibler uniquement les personnes **vivant en France** ; exclure les zones hors France au niveau de l'ad set.
- En prospection, exclure toutes les audiences de retargeting pour éviter le recouvrement.

## 4. Ordre d'optimisation

1. **`ViewContent`** au lancement : signal assez fréquent pour sortir de l'aveuglement.
2. **`InitiateCheckout` ou `EtudeEmail`** dès que l'event choisi remonte régulièrement. Prendre le plus proche du lead qui garde assez de volume.
3. **`Lead`** final lorsque le volume devient stable, cible pratique : environ 50 events sur 7 jours par ad set.

Ne pas optimiser trop tôt sur un event rare. Si `Lead` ne remonte que quelques fois par semaine, rester sur `InitiateCheckout`/`EtudeEmail` et suivre le taux vers `Lead` dans le dashboard.

## 5. Créatifs

Angles autorisés :

- « Ton estimation est prête. Reprends ton calcul. »
- « Tu as testé le simulateur. Termine ton audit gratuit. »
- « Ton secteur et ton budget sont posés. Voyons la suite. »

Ne jamais afficher ou prétendre connaître **le chiffre exact** du prospect dans la publicité. Les paramètres du simulateur servent à segmenter et mesurer, pas à injecter une promesse personnalisée. Parler d'**estimation**, d'**ordre de grandeur** et de **reprise du calcul** ; ne garantir ni chiffre d'affaires, ni nombre de chantiers.

## 6. Contrôle hebdomadaire

Suivre par segment : dépense, fréquence, CTR lien, coût par `ViewContent`, coût par event d'optimisation et taux final vers `Lead`. Rafraîchir les créatifs si la fréquence dépasse 3-4 ou si le CTR baisse nettement, sans modifier audience, créatif et optimisation le même jour.
