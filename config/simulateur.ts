/* ──────────────────────────────────────────────────────────────
   Simulateur ROI — contenu + presets par métier.

   Provenance des chiffres — à garder à jour, ils pilotent un ROI
   affiché à des prospects :
   · cpc  → skill google-ads-artisans. ⚠️ Source INTERNE, pas un
            benchmark public : aucune source FR rigoureuse n'existe
            (les blogs d'agences se contredisent de 1,50 € à 20 €
            sur les mêmes métiers). À sourcer au Keyword Planner.
   · conv → LocaliQ / WordStream « 2025 Search Ad Benchmarks for
            Home Services » — 3 211 campagnes, avril 2024→mars 2025,
            MÉDIANES par catégorie. ⚠️ Données US : les enchères FR
            sont moins chères, mais le comportement d'achat (cycle de
            décision par métier) est le meilleur proxy disponible.
            https://localiq.com/blog/home-services-search-advertising-benchmarks/
   · cpa  → coût par appel LSA constaté 20-50 €. Non sourcé.
            ⚠️ Vérifier que le LSA existe en France pour maçon /
            couvreur / terrassier : il fournit la moitié des leads
            du scénario par défaut. Risque binaire.
   · panier / transfo / marge → presets maison, ajustables.

   ⚠️ CORRECTIF 2026-07-14 — `conv` était une constante UI à 15 %
   appliquée à TOUS les métiers. C'est la variable la plus dispersée
   du secteur (2,6 % → 17,6 %, facteur 6,8), et les métiers à gros
   panier sont ceux qui convertissent le PLUS MAL (gros chantier =
   décision longue). L'erreur était donc corrélée au panier puis
   multipliée par lui : d'où Couvreur ×34 et Maçon ×23, les deux
   chiffres vitrine et les deux plus faux.
   ────────────────────────────────────────────────────────────── */

export type Metier = {
  nom: string;
  /** CPC national moyen (€) — multiplié par la zone. */
  cpc: number;
  /** Coût par appel LSA (€). */
  cpa: number;
  /** Panier moyen d'un chantier (€) — preset, ajustable. */
  panier: number;
  /** Transformation lead → chantier (%) — preset, ajustable. */
  transfo: number;
  /** Conversion clic → lead (%) — médiane LocaliQ de la catégorie. */
  conv: number;
  /** Catégorie LocaliQ d'où sort `conv` — affichée, pas de magie. */
  convSource: string;
  /**
   * Recherches mensuelles du MOT PRINCIPAL, pour 10 000 habitants de
   * bassin — **MESURÉ au Keyword Planner le 2026-07-14** (compte
   * Couvreur Peter, historique de dépense → chiffres exacts, période
   * juil. 2025–juin 2026) sur deux ancrages réels :
   *   [0] petite ville  — Brive-la-Gaillarde, bassin 101 000
   *   [1] métropole     — Bordeaux, bassin 1 370 000
   * Deux valeurs parce que le taux N'EST PAS constant : le serrurier
   * fait ×9 entre Brive (2,0) et Bordeaux (17,5) — on se fait moins
   * claquer la porte d'un appartement en zone pavillonnaire.
   * Le mot principal seul sous-estime le marché (personne ne tape
   * juste « plombier ») → multiplié par `variantes` dans le calcul.
   */
  taux: readonly [petiteVille: number, metropole: number];
  /**
   * Marge brute par défaut (%) — preset MAISON, ajustable par le
   * visiteur. Dépannage/main-d'œuvre haut (plombier, serrurier),
   * gros œuvre bas (maçon, terrassier : matériaux + sous-traitance).
   * Une constante unique à 30 % refaisait l'erreur du `conv` uniforme.
   */
  margeDefaut: number;
  /**
   * `true` = CPC estimé par analogie, PAS sourcé du skill.
   * (Les enchères réelles du Keyword Planner ont validé les 13 CPC
   * le 2026-07-14 — le flag reste pour l'honnêteté de provenance.)
   */
  estimated?: boolean;
};

/* Ancrages des mesures de `taux` (population de bassin). */
const BASSIN_PETIT = 100_000;
const BASSIN_METRO = 1_370_000;

/**
 * Taux de recherche interpolé pour un bassin donné — linéaire en
 * log(bassin) entre les deux ancrages mesurés, borné aux extrêmes.
 */
export function tauxPour(m: Metier, bassin: number): number {
  const [r1, r2] = m.taux;
  const t =
    (Math.log(Math.max(bassin, 1)) - Math.log(BASSIN_PETIT)) /
    (Math.log(BASSIN_METRO) - Math.log(BASSIN_PETIT));
  return r1 + (r2 - r1) * Math.min(1, Math.max(0, t));
}

/**
 * Bassin de vie approximé depuis la population communale — calibré
 * sur les couvertures Google/aires d'attraction INSEE mesurées :
 * Bordeaux 267 991 hab. → bassin 1,37 M (×5,1) ; Brive 47 095 →
 * 101 k (×2,15) ; village hors attraction → sa propre population.
 * Contrôle Paris : 2,1 M × 5,1 ≈ 10,7 M ≈ l'Île-de-France. Cohérent.
 */
export function bassinPour(pop: number): number {
  if (pop >= 200_000) return Math.round(pop * 5.1);
  if (pop >= 20_000) return Math.round(pop * 2.15);
  return pop;
}

/** Médiane « Home Services » toutes catégories — défaut LocaliQ. */
const CONV_DEFAUT = 7.3;

import { COMMUNES, type Commune } from "./communes";

export type { Commune };

export type ZoneId =
  | "paris"
  | "metropole"
  | "grande-ville"
  | "ville-moyenne"
  | "rural";

export type Zone = {
  id: ZoneId;
  label: string;
  /** Multiplicateur appliqué au CPC national. */
  mult: number;
};

export const simulateur = {
  meta: {
    title: "Simulateur ROI — NMF Agence",
    description:
      "Ton métier, ta ville, ton budget : estime en direct combien de chantiers et de chiffre d'affaires la publicité Google peut te rapporter chaque mois.",
  },

  back: "Retour à la présentation",
  backHref: "/preparation#ressources",

  eyebrow: "L'outil NMF",
  title: "Estime ton retour sur investissement",
  subtitle:
    "Choisis ton métier, tape ta ville, règle ton budget. Les curseurs partent des moyennes nationales de ton métier — remplace-les par tes vrais chiffres, l'estimation se recalcule en direct. C'est un ordre de grandeur pour décider, pas une garantie de résultat. Tu peux l'emporter en PDF.",

  /**
   * La phrase d'entrée — l'artisan lit une phrase, il ne remplit pas un
   * formulaire. Il connaît son métier, sa ville, son budget : rien
   * d'autre ne doit être visible au premier écran. Le reste (conversion,
   * transformation, LSA) est du vocabulaire d'agence, replié dans
   * « Affiner ».
   */
  phrase: {
    a: "Je suis",
    b: "à",
    /* « Je peux investir 600 € » puis « pour 1 100 € investis » dans le
       résultat : il annonçait 600, l'outil lui répondait 1 100 — le
       forfait gestion tombait après coup. Le curseur porte maintenant
       ce qu'il SORT vraiment de sa poche, gestion comprise. */
    c: "et je peux mettre",
    d: "par mois, tout compris.",
    /** Décomposition, sous la phrase — il voit où va son argent. */
    repartition: (pub: string, gestion: string) =>
      `${pub} de publicité Google + ${gestion} de gestion NMF`,
    tropBas: "En dessous, il ne reste plus assez pour la publicité une fois la gestion payée.",
    resultat: "Voilà ce que tu peux espérer",
    net: "dans ta poche, chaque mois",
    netDetail: "de marge dégagée, moins",
    netDetail2: "de pub et de gestion.",
    affiner: "Affiner avec mes vrais chiffres",
    affinerAide: "Si tu connais tes taux, remplace les moyennes de ton métier.",
    detail: "Comment on arrive là",
    comparatif: "Voir les autres métiers",
    perte: "À ce budget, tu y perds",
  },

  params: {
    heading: "Paramètres",
    metier: "Métier",
    ville: "Ta ville",
    villePlaceholder: "Bordeaux",
    budget: "Budget publicité / mois",
    budgetHint: "Réparti entre Google Ads et Local Services Ads",
    repartition: "Part en Local Services Ads",
    repartitionHint: "Le reste part en Google Ads. Le LSA se paie au contact reçu.",
    zone: "Zone",
    /** La ville est dans la table : on sait. */
    zoneDetected: "Zone déduite de ta ville.",
    /** Ville inconnue : on suppose, et on le dit. */
    zoneGuessed: "On part sur une ville moyenne — corrige si ce n'est pas ta réalité.",
    zoneManual: "Zone choisie à la main.",
    ads: "Budget Google Ads / mois",
    adsHint: "Minimum conseillé : 10 €/jour (300 €/mois)",
    lsa: "Budget Local Services Ads / mois",
    lsaHint: "Payé au lead (appel ou message reçu)",
    gestion: "Gestion NMF / mois",
    gestionHint: "Forfait fixe — pilotage, optimisation et suivi des appels",
    conv: "Conversion du site (Ads)",
    convHint: "Visiteurs → appel ou formulaire",
    transfo: "Transformation lead → chantier",
    panier: "Panier moyen chantier",
    variantes: "Variantes de recherche comptées",
    variantesHint:
      "Personne ne tape juste « plombier » : on tape « plombier + ta ville », « fuite d'eau », « dépannage »… Le mot principal seul sous-estime le marché ; ce facteur l'élargit. ×4 par défaut — hypothèse, pas mesure.",
    marge: "Ta marge brute",
    /* On ne prétend PAS connaître sa marge : aucune source primaire
       FR fiable n'existe (les blogs se contredisent de 1 à 10 %, et
       le « taux de marge » INSEE à 22,1 % est un EBE/VA — pas une
       marge nette). C'est lui qui sait. Et le lui demander rend
       l'outil plus crédible, pas moins. */
    margeHint: "Ce qu'il te reste sur un chantier, une fois le matériel et la main-d'œuvre payés",
  },

  kpis: {
    leads: "Leads / mois",
    chantiers: "Chantiers / mois",
    ca: "CA généré",
    marge: "Marge générée",
    /* Court : le libellé tient sur une ligne, la grille des KPI reste
       alignée. « Retour sur investissement » cassait en deux. */
    roi: "Retour sur marge",
  },

  detail: {
    heading: "Détail par canal",
    ads: "Google Ads",
    cpc: "CPC ajusté zone",
    /* Sans l'unité, « 357 » se lisait comme un chiffre quotidien. */
    clics: "Clics / mois",
    recherches: "Recherches / mois (mot principal, mesuré)",
    marche: "Marché élargi (× variantes)",
    bassin: "Bassin de vie estimé",
    clicsDispo: "Clics disponibles au maximum",
    leads: "Leads / mois",
    sature: (perdu: string) =>
      `Marché saturé — ${perdu}/mois de budget n'achètent plus rien : il n'y a pas assez de recherches sur ta zone. Baisse le budget, ou élargis ton secteur.`,
    cpl: "Coût / lead",
    lsa: "Local Services Ads",
    cpa: "Coût / appel",
    leadsLsa: "Leads (payés au contact)",
    facture: "Investissement / mois",
    media: "Média Google (Ads + LSA)",
    gestion: "Gestion NMF",
    total: "Total investi",
    cac: "Coût d'acquisition par chantier",
  },

  /**
   * Verdicts calés sur le RETOUR SUR MARGE, pas sur le CA.
   * Un retour ×1 sur la marge = tu rentres exactement dans tes frais.
   * Les anciens seuils (« très rentable » dès ×5 sur le CA) qualifiaient
   * de rentable une perte sèche pour un artisan à 25 % de marge, qui a
   * besoin de ×4 sur le CA rien que pour l'équilibre.
   */
  verdicts: {
    high: (marge: string, total: string, roi: string) =>
      `Très rentable — ${total} investis, ${marge} de marge estimée, soit ×${roi} sur ce que tu mets. Et chaque client satisfait en amène d'autres.`,
    mid: (marge: string, total: string, roi: string) =>
      `Rentable — ${marge} de marge pour ${total} investis (×${roi}). La récurrence client (réachat, urgences répétées) s'ajoute encore au calcul.`,
    low: (marge: string, total: string, roi: string) =>
      `Tout juste à l'équilibre — ${marge} de marge pour ${total} investis (×${roi}). À ce niveau tu travailles pour payer ta pub. Le levier n'est pas le budget : c'est le panier, le canal, ou la vitesse de rappel.`,
    loss: (total: string, roi: string) =>
      `Tu perds de l'argent — ${total} investis ne reviennent pas (×${roi} sur ta marge). Sur ce métier, à ce budget, Google Ads n'est pas le bon canal : on en parle, il y a mieux à faire.`,
  },

  comparatif: {
    heading: "Comparatif tous métiers",
    hint: "mêmes budgets, moyennes par métier",
    cols: ["Métier", "CPC", "Conv.", "Leads", "Chantiers", "CA", "Retour"],
  },

  footnote:
    "Taux de conversion : médianes LocaliQ / WordStream 2025 (3 211 campagnes Home Services). Données américaines — le meilleur repère public disponible, aucun équivalent français rigoureux n'existe. CPC : moyennes France, à affiner. Les vrais chiffres se mesurent après 2 mois de campagne, avec un suivi des appels indépendant.",

  /**
   * Avertissement affiché EN HAUT du document, pas en bas.
   * Un devis chiffré au centime donne l'illusion de la certitude : sans
   * ce cadrage, l'artisan lit l'estimation comme un plancher garanti
   * (« au minimum je ferai ça »). Ce n'en est pas un.
   */
  hypothese: {
    titre: "Une projection, pas une promesse.",
    texte:
      "Ces chiffres sortent de moyennes nationales appliquées à ton métier. Ton résultat réel dépendra de la qualité de ton site, de la concurrence dans ta ville, de la saison, de ta réactivité au téléphone et de ta façon de vendre. Deux artisans du même métier, avec le même budget, n'obtiennent pas le même résultat. Ce n'est ni un plancher, ni un plafond : c'est un ordre de grandeur pour décider si ça vaut le coup d'en parler.",
    /** Les variables qu'un artisan reconnaît — pas du jargon marketing. */
    variables: [
      "La santé de ton site — un site lent ou confus fait fuir les clics que tu as payés",
      "La concurrence locale — combien d'artisans se disputent les mêmes mots dans ta ville",
      "La saison — la demande n'est pas la même en janvier et en juin",
      "Ta réactivité — un appel manqué est un chantier perdu, même bien ciblé",
      "Ton secteur et ton panier réel — les moyennes ne sont pas ton entreprise",
    ],
  },

  /** CTA sous les résultats — LP uniquement (absent sur /simulateur). */
  cta: "Voir ce que ça donne chez toi",
  exportPdf: "Exporter en PDF",

  /** Affiché quand le métier sélectionné a un CPC estimé (`estimated`). */
  estimatedNote:
    "Pour ton métier, le CPC est une estimation et non une moyenne mesurée — on l'affine avec tes vrais chiffres pendant l'appel.",

  /** Forfait gestion NMF (€/mois) — valeur fixe, non réglable par le visiteur. */
  gestionFixe: 500,

  /** Multiplicateurs — skill google-ads-artisans. */
  zones: [
    { id: "paris", label: "Paris", mult: 1.8 },
    { id: "metropole", label: "Lyon / Marseille / Bordeaux", mult: 1.3 },
    { id: "grande-ville", label: "Toulouse / Nice / Nantes / Strasbourg", mult: 1.2 },
    { id: "ville-moyenne", label: "Ville moyenne (50-200k hab.)", mult: 1.0 },
    { id: "rural", label: "Zone rurale (< 20k hab.)", mult: 0.7 },
  ] satisfies Zone[],

  /** Zone retenue quand la ville saisie n'est pas dans la table. */
  defaultZone: "ville-moyenne" as ZoneId,

  /*
   * `taux` [petite ville, métropole] — MESURES Keyword Planner du
   * 2026-07-14 (chiffres exacts, compte avec historique) :
   * volumes bruts /mois → Brive (bassin 101 k) / Bordeaux (1,37 M) :
   *   plombier 40/880 · serrurier 20/2 400 · chauffagiste 70/1 300
   *   électricien 50/720 · maçon 30/480 · peintre 10/90
   *   menuisier 20/480 · carreleur 10/140 · paysagiste 70/880
   *   déménageur 10/170 · couvreur 40/480 · plaquiste 10/260
   *   terrassier 10/70   (France : 60,5 k · 74 k · 90,5 k · 60,5 k ·
   *   60,5 k · 6,6 k · 33,1 k · 12,1 k · 90,5 k · 14,8 k · 49,5 k ·
   *   18,1 k · 5,4 k)
   * ⚠️ « 10 » = plancher d'arrondi Google : les petits taux Brive
   * sont des bornes hautes. Prudent, donc acceptable.
   */
  metiers: [
    // ── CPC : skill (validé par les enchères réelles le 2026-07-14) ──
    { nom: "Plombier", cpc: 4.2, cpa: 30, panier: 500, transfo: 45, conv: 7.6, convSource: "Plumbing", taux: [4.0, 6.4], margeDefaut: 45 },
    { nom: "Serrurier", cpc: 6.0, cpa: 35, panier: 300, transfo: 45, conv: CONV_DEFAUT, convSource: "Home Services (moyenne — pas de catégorie dédiée)", taux: [2.0, 17.5], margeDefaut: 50 },
    { nom: "Chauffagiste", cpc: 5.0, cpa: 35, panier: 1500, transfo: 35, conv: 7.5, convSource: "Heating & Furnaces", taux: [6.9, 9.5], margeDefaut: 35 },
    { nom: "Électricien", cpc: 3.5, cpa: 25, panier: 800, transfo: 40, conv: 9.1, convSource: "Electricians", taux: [5.0, 5.3], margeDefaut: 40 },
    { nom: "Maçon", cpc: 2.8, cpa: 25, panier: 3500, transfo: 30, conv: 2.6, convSource: "Construction & Contractors", taux: [3.0, 3.5], margeDefaut: 25 },
    { nom: "Peintre", cpc: 2.5, cpa: 20, panier: 2000, transfo: 30, conv: 10.8, convSource: "Paint & Painting", taux: [1.0, 0.7], margeDefaut: 35 },
    { nom: "Menuisier", cpc: 2.2, cpa: 20, panier: 1800, transfo: 35, conv: CONV_DEFAUT, convSource: "Home Services (moyenne — pas de catégorie dédiée)", taux: [2.0, 3.5], margeDefaut: 35 },
    { nom: "Carreleur", cpc: 2.0, cpa: 20, panier: 2500, transfo: 30, conv: CONV_DEFAUT, convSource: "Home Services (moyenne — pas de catégorie dédiée)", taux: [1.0, 1.0], margeDefaut: 30 },
    { nom: "Paysagiste", cpc: 1.8, cpa: 20, panier: 1200, transfo: 35, conv: 6.4, convSource: "Landscaping", taux: [6.9, 6.4], margeDefaut: 40 },
    { nom: "Déménageur", cpc: 3.0, cpa: 25, panier: 900, transfo: 35, conv: CONV_DEFAUT, convSource: "Home Services (moyenne — pas de catégorie dédiée)", taux: [1.0, 1.2], margeDefaut: 40 },
    { nom: "Couvreur", cpc: 3.2, cpa: 30, panier: 6000, transfo: 30, conv: 3.7, convSource: "Roofing & Gutters", estimated: true, taux: [4.0, 3.5], margeDefaut: 30 },
    { nom: "Plaquiste", cpc: 2.0, cpa: 20, panier: 2500, transfo: 30, conv: CONV_DEFAUT, convSource: "Home Services (moyenne — pas de catégorie dédiée)", estimated: true, taux: [1.0, 1.9], margeDefaut: 30 },
    { nom: "Terrassier", cpc: 2.2, cpa: 25, panier: 4000, transfo: 30, conv: 2.6, convSource: "Construction & Contractors", estimated: true, taux: [1.0, 0.5], margeDefaut: 25 },
  ] satisfies Metier[],
} as const;

/* ──────────────────────────────────────────────────────────────
   Ville → zone : c'est un ALGORITHME, pas un choix laissé au visiteur.
   On connaît les 34 969 communes de France et leur population (INSEE) ;
   faire s'auto-classer un artisan en « ville moyenne » ou « rural »
   revenait à lui faire deviner notre coefficient — et sortait Angers
   (159 022 hab.) et un village de 300 âmes au même multiplicateur.

   ⚠️ Les paliers du skill ne sont PAS populationnels, ils sont
   concurrentiels : Toulouse (514 819 hab.) est en ×1,2 quand Bordeaux
   (267 991 hab.) est en ×1,3. Un algo purement démographique
   contredirait donc la source — d'où l'ordre de priorité ci-dessous :
   une ville tarifée par le skill gagne toujours sur la population.
   ────────────────────────────────────────────────────────────── */

/** "Saint-Étienne" → "saintetienne". Rend le matching tolérant. */
export function normalizeVille(v: string): string {
  // NFD décompose « é » en « e » + accent combinant, que [^a-z] retire ensuite.
  return v.normalize("NFD").toLowerCase().replace(/[^a-z]/g, "");
}

const fmtMult = (m: number) => m.toFixed(1).replace(".", ",");

/** Villes explicitement tarifées par le skill — priorité absolue. */
const VILLE_SOURCEE: Record<string, ZoneId> = {
  paris: "paris",
  lyon: "metropole",
  marseille: "metropole",
  bordeaux: "metropole",
  toulouse: "grande-ville",
  nice: "grande-ville",
  nantes: "grande-ville",
  strasbourg: "grande-ville",
};

/** Index nom normalisé → commune, construit une seule fois. */
const INDEX = new Map<string, Commune>(
  COMMUNES.map((c) => [normalizeVille(c[0]), c])
);

export function zoneById(id: ZoneId): Zone {
  return simulateur.zones.find((z) => z.id === id) ?? simulateur.zones[3];
}

export type ZoneMatch = {
  zone: Zone;
  /** La commune reconnue, si on l'a trouvée. */
  commune?: Commune;
  /** D'où sort le multiplicateur — affiché à l'artisan, pas de magie. */
  origine:
    | "sourcee"
    | "population"
    | "extrapolee"
    | "rurale-par-defaut"
    | "a-preciser"
    | "vide";
  raison: string;
};

/**
 * Déduit la zone d'une ville saisie. Ordre de priorité :
 *  1. ville tarifée par le skill → palier sourcé
 *  2. commune ≥ 200k non tarifée → ×1,2 par analogie (EXTRAPOLÉ :
 *     seules Montpellier, Lille et Rennes sont dans ce cas, pairs
 *     directs de Nantes/Nice déjà tarifés ×1,2)
 *  3. commune ≥ 20k → ×1,0. Le skill définit « 50-200k → ×1,0 » et
 *     « < 20k → rural », mais rien entre 20k et 50k. On étend ×1,0
 *     vers le bas plutôt que d'inventer un palier intermédiaire.
 *  4. absente de la table → < 20k, donc rurale par construction
 */
/**
 * Zone d'une commune déjà identifiée (choisie dans la liste). Sépare le
 * classement du *matching* : les villages viennent de `/api/communes` et
 * ne sont pas dans la table locale, mais on connaît leur population.
 */
export function zoneForCommune(commune: Commune): ZoneMatch {
  const [nom, pop, dept] = commune;
  const sourcee = VILLE_SOURCEE[normalizeVille(nom)];
  const hab = pop.toLocaleString("fr-FR") + " hab.";

  if (sourcee) {
    const zone = zoneById(sourcee);
    return {
      zone,
      commune,
      origine: "sourcee",
      raison: `${nom} (${dept}) — ${hab}, palier de référence (×${fmtMult(zone.mult)}).`,
    };
  }
  if (pop >= 200000) {
    return {
      zone: zoneById("grande-ville"),
      commune,
      origine: "extrapolee",
      raison: `${nom} (${dept}) — ${hab}, grande métropole.`,
    };
  }
  if (pop >= 20000) {
    return {
      zone: zoneById("ville-moyenne"),
      commune,
      origine: "population",
      /* `hab` porte déjà son point (« 47 095 hab. ») — pas de second. */
      raison: `${nom} (${dept}) — ${hab}`,
    };
  }
  return {
    zone: zoneById("rural"),
    commune,
    origine: "rurale-par-defaut",
    raison: `${nom} (${dept}) — ${hab}, zone rurale : moins de concurrence, mais moins de recherches aussi.`,
  };
}

export function zoneForVille(ville: string): ZoneMatch {
  const key = normalizeVille(ville);
  const commune = INDEX.get(key);
  const sourcee = VILLE_SOURCEE[key];

  if (sourcee) {
    const zone = zoneById(sourcee);
    const nom = commune?.[0] ?? ville;
    return {
      zone,
      commune,
      origine: "sourcee",
      raison: nom + " — palier de référence (×" + fmtMult(zone.mult) + ").",
    };
  }

  if (!commune) {
    if (!key) {
      return {
        zone: zoneById(simulateur.defaultZone),
        origine: "vide",
        raison: "Tape ta ville pour ajuster l'estimation à ta zone.",
      };
    }
    /* Une saisie en cours (« Ang », « Le Kremlin ») N'EST PAS une commune
       rurale : sans ce garde-fou, l'outil affirmait « zone rurale » à
       chaque lettre tapée, et Le Kremlin-Bicêtre (24 110 hab.) sortait
       en ×0,7 tant que l'artisan n'avait pas cliqué la suggestion. */
    if (suggestCommunes(ville, 1).length) {
      return {
        zone: zoneById(simulateur.defaultZone),
        origine: "a-preciser",
        raison: "Choisis ta commune dans la liste pour ajuster l'estimation.",
      };
    }
    return {
      zone: zoneById("rural"),
      origine: "rurale-par-defaut",
      raison:
        "Aucune commune de plus de 20 000 habitants sous ce nom — zone rurale, la concurrence y est plus faible.",
    };
  }

  const [nom, pop, dept] = commune;
  const hab = pop.toLocaleString("fr-FR") + " hab.";

  if (pop >= 200000) {
    return {
      zone: zoneById("grande-ville"),
      commune,
      origine: "extrapolee",
      raison: nom + " (" + dept + ") — " + hab + ", grande métropole.",
    };
  }

  return {
    zone: zoneById("ville-moyenne"),
    commune,
    origine: "population",
    raison: nom + " (" + dept + ") — " + hab,
  };
}

/** Suggestions d'autocomplétion — les plus peuplées d'abord (table triée). */
export function suggestCommunes(q: string, limit = 6): Commune[] {
  const key = normalizeVille(q);
  if (key.length < 2) return [];
  const out: Commune[] = [];
  for (const c of COMMUNES) {
    if (normalizeVille(c[0]).startsWith(key)) {
      out.push(c);
      if (out.length === limit) break;
    }
  }
  return out;
}
