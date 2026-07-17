# Simulateur — CA vs coût, la marge redevient interne

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Le simulateur et les emails cessent d'afficher un « net dans ta poche » et un verdict de rentabilité — deux affirmations qui dépendent des charges de l'artisan, que nous ne connaissons pas. Ils affichent le CA que la campagne peut générer et ce qu'elle coûte. La marge reste **calculée en interne** (qualification du lead, audiences Meta), jamais rendue au prospect.

**Architecture:** La règle est une frontière, pas une suppression. `compute()` continue de retourner `marge` et `roi` — ils alimentent le pixel Meta et le `snapshot` jsonb, deux surfaces internes. Ce qui change est **le rendu** : le bloc héros de `SimulateurRoi.tsx`, le bandeau des 3 emails prospect, le slider « Ta marge brute », les verdicts et la colonne « Retour ». Aucune migration SQL : `etude_emails.snapshot` est un `jsonb` libre et garde `net`/`roi` comme trace interne.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Vitest, Tailwind v4.

**Décisions actées (Nicolas, 2026-07-17):**
1. Le chiffre héros = **CA généré vs coût total**. Aucune marge estimée, aucun « dans ta poche ».
2. `margeDefaut` **reste** dans `config/simulateur.ts` — strictement interne.
3. C'est à l'artisan de déduire ses charges et de juger sa rentabilité. Pas à nous.

**Ce qui NE bouge PAS (et pourquoi c'est important):**
- `roi = marge / total` garde sa définition → `AcquisitionLp.tsx:87` (`net_mensuel` re-dérivé de `roi`) reste correct sans y toucher.
- Le type `EtudeSnapshot` et `isEtudeSnapshot()` gardent `net`/`roi` → les lignes `etude_emails` déjà en prod passent toujours le garde-fou.
- `lib/tracking.ts` et `components/form/AuditForm.tsx` : faux positifs du grep (« Android » contient `roi`, « net » en prose). **Ne pas y toucher.**
- Le pixel Meta garde `net_mensuel` / `roi` / `verdict` → les audiences de retargeting existantes ne cassent pas.

**Contexte repo:**
- Alias TS : `@/*` → `./*` (racine).
- Vérifs standard : `npx tsc --noEmit` et `npx next lint`. Tests : `npm test` (Vitest).
- `compute()` (`SimulateurRoi.tsx:57-104`) retourne déjà `ca`, `total`, `chantiers`, `marge`, `roi`, `sature`, `adsGaspille`.
- Le CAC est déjà calculé inline dans `<Detail>` (`SimulateurRoi.tsx:900`) : `r.total / r.chantiers`.
- L'export PDF est un `window.print()` sur le DOM (`SimulateurRoi.tsx:850-864`) — pas de lib PDF. Le bloc héros n'est pas `print:hidden`, il s'imprime. Le corriger corrige le PDF.

---

### Task 1: Le remplaçant du verdict — le CAC

Le verdict (« Très rentable ×5 ») est un jugement de rentabilité : il dépend de la marge. On le remplace par un fait qu'on maîtrise — ce que coûte un chantier signé — et on rend le jugement à l'artisan.

**Files:**
- Modify: `config/simulateur.ts:166-188` (bloc `phrase`)
- Modify: `config/simulateur.ts:261-278` (bloc `verdicts`)

- [ ] **Step 1: Réécrire le bloc `phrase`**

Dans `config/simulateur.ts`, remplacer les clés `resultat`, `net`, `netDetail`, `netDetail2`, `perte` du bloc `phrase` par :

```ts
    resultat: "Voilà ce que ça peut générer",
    /* Le CA, pas la marge : c'est le seul chiffre du résultat qui ne
       dépende pas des charges de l'artisan. « Signés » et pas
       « facturés » : on parle de chantiers gagnés, pas d'encaissement. */
    ca: "de chantiers signés, chaque mois",
    /** Sous le chiffre : ce que ça coûte, sans arrondi ni pudeur. */
    coutDetail: (total: string, pub: string, gestion: string) =>
      `pour ${total} par mois tout compris — ${pub} de publicité Google + ${gestion} de gestion NMF.`,
    /* Remplace les verdicts. Un fait, pas un jugement : on ne sait pas
       si c'est rentable POUR LUI (ça dépend de ses charges), mais on
       sait exactement ce qu'un chantier lui coûte en pub. C'est lui
       qui conclut — et il est le seul à pouvoir le faire. */
    cac: (cac: string, panier: string) =>
      `Soit ${cac} investis par chantier signé, sur un panier moyen de ${panier}. À toi de voir ce que ça vaut une fois tes charges déduites.`,
    /* Le SEUL état négatif qu'on puisse affirmer sans connaître sa
       marge : si le CA généré est inférieur à ce qu'il investit, c'est
       une perte quelle que soit sa marge (marge ≤ 100 % du CA). Toute
       autre affirmation de perte serait une invention. */
    perte: "À ce budget, la campagne coûte plus qu'elle ne rapporte",
```

- [ ] **Step 2: Supprimer le bloc `verdicts`**

Supprimer entièrement `config/simulateur.ts:261-278` (le commentaire de justification ET l'objet `verdicts`), et le remplacer par :

```ts
  /* Les verdicts (« Très rentable ×5 ») ont été supprimés le 2026-07-17.
     Ils étaient calés sur `roi = marge / total`, donc sur une marge que
     nous PRÉSUPPOSIONS. Un ×4 sur le CA est une perte pour un maçon à
     25 % de marge et un gain net pour un serrurier à 50 % : le même
     verdict ne peut pas être vrai pour les deux. On affiche désormais le
     CA généré, le coût, et le coût par chantier (`phrase.cac`) — trois
     faits — et c'est l'artisan qui juge, lui seul connaissant ses
     charges. Ne pas les réintroduire sur le CA : c'est exactement le bug
     que le correctif du 14/07 avait supprimé. */
```

- [ ] **Step 3: Vérifier que rien ne référence plus `verdicts`**

Run: `npx tsc --noEmit`
Expected: erreurs UNIQUEMENT dans `components/simulateur/SimulateurRoi.tsx` (`s.verdicts` L381-387, `s.phrase.net`/`netDetail`/`netDetail2` L518/524). C'est normal — la Task 2 les corrige. Aucune erreur ailleurs.

- [ ] **Step 4: Commit**

```bash
git add config/simulateur.ts
git commit -m "refactor(simulateur): le CAC remplace les verdicts de rentabilite

Les verdicts etaient cales sur roi = marge / total, donc sur une marge
presupposee. Un x4 sur le CA est une perte a 25 % de marge et un gain a
50 % : le meme verdict ne peut pas etre vrai pour les deux metiers.

On n'affirme plus la rentabilite -- elle depend de ses charges, qu'on ne
connait pas. On affiche le cout par chantier signe, c'est un fait.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Le bloc héros — CA vs coût

**Files:**
- Modify: `components/simulateur/SimulateurRoi.tsx:375-387` (calculs héros)
- Modify: `components/simulateur/SimulateurRoi.tsx:501-539` (rendu héros)

- [ ] **Step 1: Remplacer les calculs du héros**

Remplacer `SimulateurRoi.tsx:375-387` (de `const roiTxt` jusqu'à la fin du ternaire `verdict`) par :

```ts
  /* `perte` ne se juge PLUS sur la marge (on ne la connaît pas) mais sur
     un fait arithmétique : si le CA généré est inférieur à ce qu'il
     investit, c'est une perte quelle que soit sa marge — la marge est au
     mieux 100 % du CA. C'est le seul état négatif honnête. */
  const perte = r.ca < r.total;
  /* Le coût d'acquisition d'un chantier — même formule que <Detail>. */
  const cac = r.chantiers ? r.total / r.chantiers : 0;
  /* INTERNE — jamais rendu. Alimente le pixel Meta (audiences) et le
     snapshot jsonb. La marge de l'artisan ne s'affiche pas : c'est lui
     qui connaît ses charges, pas nous. */
  const net = r.marge - r.total;
```

- [ ] **Step 2: Vérifier que le payload Meta compile toujours**

`SimulateurRoi.tsx:397-413` référence `net`, `r.roi` et `perte` — les trois existent toujours. Le champ `verdict` du payload (L404) utilisait les seuils supprimés : le remplacer par un signal interne basé sur le CA.

Remplacer L404 par :

```ts
      verdict: perte ? "perte" : r.roi < 1.5 ? "equilibre" : "rentable",
```

(inchangé — `r.roi` existe toujours, seul `perte` a changé de définition. Le signal reste comparable pour les audiences.)

- [ ] **Step 3: Réécrire le rendu du bloc héros**

Remplacer `SimulateurRoi.tsx:501-539` (le commentaire ET tout le `<div className={...perte...}>`) par :

```tsx
        {/* Le résultat — DEUX faits : le CA que la campagne peut générer,
            et ce qu'elle coûte. Pas de marge, pas de « dans ta poche »,
            pas de verdict : sa rentabilité dépend de ses charges, qu'on
            ne connaît pas. Le CAC en bas lui donne de quoi juger seul. */}
        <div className={`px-5 py-6 ${perte ? "bg-white" : "bg-sim-blue text-white"}`}>
          <p
            className={`text-[10px] font-bold uppercase tracking-[0.12em] ${perte ? "text-sim-muted" : "text-white/70"}`}
          >
            {perte ? s.phrase.perte : s.phrase.resultat}
          </p>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              className={`text-4xl font-bold tabular-nums sm:text-5xl ${perte ? "text-sim-blue" : ""}`}
            >
              {eur(r.ca)}
            </span>
            <span className={perte ? "text-sim-muted" : "text-white/80"}>
              {s.phrase.ca}
            </span>
          </p>
          <p
            className={`mt-2 text-sm ${perte ? "text-sim-muted" : "text-white/70"}`}
          >
            {s.phrase.coutDetail(eur(r.total), eur(budget), eur(nmf))}
          </p>
          {r.chantiers > 0 && (
            <p className={`mt-3 text-sm ${perte ? "text-sim-ink" : "text-white/90"}`}>
              {s.phrase.cac(eur(cac), eur(panier))}
            </p>
          )}
          {/* Le marché local est fini. Le dire est un argument de vente :
              « je ne te vends pas un budget que ta ville ne peut pas
              absorber » — pas une faiblesse de l'outil. */}
          {r.sature && (
            <p
              className={`mt-3 border-l-2 pl-3 text-sm ${perte ? "border-sim-blue text-sim-ink" : "border-white/50 text-white/90"}`}
            >
              {s.detail.sature(eur(r.adsGaspille))}
            </p>
          )}
        </div>
```

- [ ] **Step 4: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: erreurs restantes uniquement sur `marge`/`margeDefaut` (L329, L372, L775) — la Task 3 les traite.

- [ ] **Step 5: Commit**

```bash
git add components/simulateur/SimulateurRoi.tsx
git commit -m "refactor(simulateur): le chiffre heros devient le CA genere, plus le net

Le heros affichait marge - (pub + gestion) sous le libelle << dans ta
poche >>. La marge venait d'un preset par metier : on devinait le chiffre
le plus personnel de son entreprise, puis on annoncait le resultat comme
son revenu. Sa poche reelle est apres URSSAF, IS, vehicule, assurance,
salaire -- on n'en sait rien.

Il affiche desormais le CA que la campagne peut generer et ce qu'elle
coute. L'etat << perte >> ne se juge plus sur la marge mais sur un fait :
CA < investi est une perte quelle que soit la marge.

Le net reste calcule pour le pixel Meta et le snapshot -- interne, jamais
rendu.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Le slider « Ta marge brute » disparaît, `margeDefaut` devient interne

`margeDefaut` reste dans la config (décision 2) mais cesse d'être un réglage visible. L'état React `marge` n'a plus de raison d'exister : il vaut toujours `metier.margeDefaut`.

**Files:**
- Modify: `components/simulateur/SimulateurRoi.tsx:329` (state)
- Modify: `components/simulateur/SimulateurRoi.tsx:357` (params)
- Modify: `components/simulateur/SimulateurRoi.tsx:364-373` (`pickMetier`)
- Modify: `components/simulateur/SimulateurRoi.tsx:728-737` (slider)
- Modify: `config/simulateur.ts:218-224` (labels `params.marge`)
- Modify: `config/simulateur.ts:59-65` (commentaire du champ `margeDefaut`)

- [ ] **Step 1: Supprimer l'état `marge`**

Supprimer `SimulateurRoi.tsx:329` :

```ts
  const [marge, setMarge] = useState(metiers[0].margeDefaut);
```

- [ ] **Step 2: Brancher `p.marge` directement sur le preset**

Remplacer `SimulateurRoi.tsx:357` (`marge: marge / 100,`) par :

```ts
    /* INTERNE — le preset du métier, plus un réglage visible. Sert au
       pixel Meta et au snapshot, jamais à l'affichage. */
    marge: metier.margeDefaut / 100,
```

- [ ] **Step 3: Retirer `setMarge` de `pickMetier`**

Dans `SimulateurRoi.tsx:364-373`, supprimer la ligne `setMarge(metiers[i].margeDefaut);` et corriger le commentaire. Le bloc devient :

```ts
  /* Changer de métier recharge SES moyennes. La marge suit le preset du
     métier sans passer par un état : elle n'est plus réglable (elle
     n'est plus affichée). */
  const pickMetier = (i: number) => {
    setMetierIdx(i);
    setConv(metiers[i].conv);
    setTransfo(metiers[i].transfo);
    setPanier(metiers[i].panier);
  };
```

- [ ] **Step 4: Supprimer le slider marge**

Supprimer `SimulateurRoi.tsx:728-737` (le `<Slider label={s.params.marge} ... />` entier).

- [ ] **Step 5: Supprimer les labels du slider**

Dans `config/simulateur.ts`, supprimer les clés `marge` et `margeHint` du bloc `params` (L218-224, commentaire inclus), et les remplacer par :

```ts
    /* `marge` / `margeHint` supprimés le 2026-07-17 : le curseur « Ta
       marge brute » a disparu avec l'affichage du net. On ne lui demande
       plus sa marge parce qu'on ne lui affiche plus rien qui en dépende.
       Le preset `margeDefaut` reste, en interne uniquement. */
```

- [ ] **Step 6: Corriger le commentaire de `margeDefaut` sur le type `Metier`**

Remplacer le commentaire de `config/simulateur.ts:59-65` par :

```ts
  /**
   * Marge brute par défaut (%) — preset MAISON, **INTERNE UNIQUEMENT**.
   *
   * ⚠️ Ne JAMAIS rendre ce chiffre, ni rien qui en dérive, à l'artisan.
   * Sa marge dépend de ses charges (URSSAF, IS/IR, véhicule, assurance,
   * salaire) : la présupposer puis lui annoncer son « net » était le bug
   * corrigé le 2026-07-17. Ce preset ne sert plus qu'à nous — qualifier
   * un lead (pixel Meta, snapshot) et savoir si Google Ads a du sens
   * pour ce métier. C'est LUI qui sait s'il est rentable, pas nous.
   *
   * Dépannage/main-d'œuvre haut (plombier, serrurier), gros œuvre bas
   * (maçon, terrassier : matériaux + sous-traitance). Une constante
   * unique à 30 % refaisait l'erreur du `conv` uniforme.
   */
  margeDefaut: number;
```

- [ ] **Step 7: Corriger le commentaire d'en-tête du fichier**

Dans `config/simulateur.ts:20`, remplacer :

```
   · panier / transfo / marge → presets maison, ajustables.
```

par :

```
   · panier / transfo → presets maison, ajustables par le visiteur.
   · marge → preset maison INTERNE, jamais affiché (voir `margeDefaut`).
```

- [ ] **Step 8: Vérifier**

Run: `npx tsc --noEmit`
Expected: erreur restante UNIQUEMENT sur `m.margeDefaut` L775 (comparatif) — Task 4.

- [ ] **Step 9: Commit**

```bash
git add components/simulateur/SimulateurRoi.tsx config/simulateur.ts
git commit -m "refactor(simulateur): le curseur << Ta marge brute >> disparait

Le commentaire de config disait << On ne pretend PAS connaitre sa marge,
c'est lui qui sait >> -- et margeDefaut la preremplissait par metier six
lignes plus bas, que pickMetier rechargeait a chaque changement, ecrasant
ce qu'il aurait corrige. Le code se contredisait lui-meme.

On ne lui demande plus sa marge parce qu'on ne lui affiche plus rien qui
en depende. Le preset reste, interne : pixel Meta et snapshot.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Le comparatif — le CAC remplace la colonne « Retour »

La colonne « Retour » affiche `×roi` avec la `margeDefaut` de chaque métier : c'est le dernier endroit qui rend une marge présupposée. Sur le CA elle serait pire (non comparable entre un couvreur à 6 000 € de panier et un serrurier à 300 €). On la remplace par le coût par chantier — factuel et réellement comparable.

**Files:**
- Modify: `config/simulateur.ts:283` (`comparatif.cols`)
- Modify: `components/simulateur/SimulateurRoi.tsx:766-806`

- [ ] **Step 1: Changer l'en-tête de colonne**

Dans `config/simulateur.ts`, remplacer la ligne `cols` du bloc `comparatif` par :

```ts
    /* « Retour » (×roi sur marge présupposée) remplacé le 2026-07-17 par
       le coût par chantier : comparable entre métiers, et ne prétend rien
       sur une rentabilité qui dépend des charges de chacun. */
    cols: ["Métier", "CPC", "Conv.", "Leads", "Chantiers", "CA", "€ / chantier"],
```

- [ ] **Step 2: Recalculer la dernière colonne**

Dans `SimulateurRoi.tsx:766-806`, remplacer le corps de la fonction de map par (le `compute` garde `marge` — interne, il alimente `rr.roi` qu'on n'affiche plus, mais le type `Params` l'exige) :

```tsx
                {metiers.map((m, i) => {
                  /* Chaque métier avec SES presets. `marge` reste passée
                     (le type Params l'exige, elle alimente rr.roi en
                     interne) mais n'est plus rendue nulle part. */
                  const rr = compute(m, {
                    ...p,
                    panier: m.panier,
                    transfo: m.transfo / 100,
                    conv: m.conv / 100,
                    marge: m.margeDefaut / 100,
                  });
                  const on = i === metierIdx;
                  return (
                    <tr key={m.nom} className={on ? "bg-white" : undefined}>
                      <td
                        className={`whitespace-nowrap border-b border-sim-line px-3 py-2 text-left ${on ? "font-bold text-sim-blue" : ""}`}
                      >
                        {m.nom}
                        {m.estimated && (
                          <span title={s.estimatedNote} className="ml-1 cursor-help">
                            *
                          </span>
                        )}
                      </td>
                      {[
                        `${dec(m.cpc * p.geo)} €`,
                        `${dec(m.conv)} %`,
                        rr.leads.toFixed(0),
                        dec(rr.chantiers),
                        eur(rr.ca),
                        rr.chantiers ? eur(rr.total / rr.chantiers) : "—",
                      ].map((v, j) => (
                        <td
                          key={j}
                          className={`whitespace-nowrap border-b border-sim-line px-3 py-2 text-right ${
                            j === 5 ? `font-bold ${rr.ca < rr.total ? "text-sim-blue" : ""}` : ""
                          }`}
                        >
                          {v}
                        </td>
                      ))}
                    </tr>
                  );
                })}
```

- [ ] **Step 3: Vérifier**

Run: `npx tsc --noEmit && npx next lint`
Expected: 0 erreur, 0 warning. Le simulateur compile entièrement.

- [ ] **Step 4: Commit**

```bash
git add components/simulateur/SimulateurRoi.tsx config/simulateur.ts
git commit -m "refactor(simulateur): le comparatif affiche le cout par chantier

La colonne << Retour >> etait le dernier endroit qui rendait une marge
presupposee (xroi calcule avec la margeDefaut de chaque metier). Sur le
CA elle serait pire : un x8 chez un couvreur a 6000 EUR de panier et un
x8 chez un serrurier a 300 EUR ne veulent pas dire la meme chose.

EUR/chantier est comparable entre metiers et ne juge rien.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Les textes des emails prospect

Trois emails affirment le net ou la marge. `config/emails.ts` est la seule source de wording.

**Files:**
- Modify: `config/emails.ts:23-35` (bloc `etude`)
- Modify: `config/emails.ts:58-69` (bloc `relanceJ2`)
- Modify: `config/emails.ts:71-85` (bloc `relanceJ5`)

- [ ] **Step 1: Réécrire le bloc `etude`**

Remplacer `config/emails.ts:23-35` par :

```ts
  /** #1 — Étude ROI, envoyée immédiatement après la capture. */
  etude: {
    subject: (metier: string, ville: string) => `Ton étude Google Ads — ${metier} à ${ville}`,
    /* Bandeau : le CA, pas le net. « Il te resterait X dans la poche »
       présupposait sa marge ET ses charges — voir le plan du 2026-07-17. */
    bandeauAvant: "Ta campagne pourrait générer",
    bandeauApres: "de chantiers par mois.",
    bandeauSub: (metier: string, ville: string) =>
      `${metier} à ${ville} — voici d'où sort ce chiffre.`,
    intro: "Comme promis, voici ton étude — tes réglages, tes chiffres.",
    note: "Une projection, pas une promesse : ni un plancher, ni un plafond. C'est du chiffre d'affaires, pas du bénéfice — à toi d'en déduire tes charges. On l'affine avec tes vrais chiffres pendant l'audit.",
    cta: "Recevoir mon audit gratuit",
    ctaSub: "10 questions · 2 minutes · Sans engagement",
  },
```

- [ ] **Step 2: Réécrire le bloc `relanceJ2`**

Remplacer `config/emails.ts:58-69` par :

```ts
  /** #4 — Relance J+2 : son chiffre l'attend. */
  relanceJ2: {
    /* `ca` et non `net` : le chiffre est du CA, l'objet le dit. */
    subjectAvecChiffre: (ca: string) => `${ca} de chantiers par mois — ton étude t'attend`,
    subjectSansChiffre: "Ton étude Google Ads t'attend",
    bandeauAvant: "Ton étude t'attend toujours :",
    bandeauApres: "de chantiers par mois.",
    bandeauSansChiffre: "Ton étude Google Ads t'attend toujours.",
    bandeauSub: "Tu l'as faite il y a deux jours. Les chiffres n'ont pas bougé.",
    body: "Ces chiffres ne bougeront pas tout seuls. La prochaine étape tient en 10 questions — deux minutes, et je te dis ce que ça donne vraiment pour ta zone.",
    cta: "Recevoir mon audit gratuit",
    ctaSub: "10 questions · 2 minutes · Sans engagement",
  },
```

- [ ] **Step 3: Réécrire le bloc `relanceJ5`**

Remplacer `config/emails.ts:71-85` par :

```ts
  /** #5 — Relance J+5 : le coût de l'attente (matière du PDF R2). */
  relanceJ5: {
    subject: "Le coût de l'attente",
    /* « de la marge qui ne rentre pas » affirmait un bénéfice qu'on ne
       peut pas connaître. Du CA qui ne rentre pas, c'est vrai et c'est
       vérifiable — la nuance est tout le sujet du 2026-07-17. */
    bandeauAvant: "Chaque mois sans campagne, ce sont",
    bandeauApres: "de chantiers qui ne rentrent pas.",
    bandeauSansChiffre: "Chaque mois sans campagne, ce sont des chantiers qui ne rentrent pas.",
    bandeauSub: "Ce n'est pas une urgence inventée : c'est ton propre calcul, dans le temps.",
    introAvecChiffre: (ca: string) =>
      `Chaque mois qui passe sans campagne, c'est environ ${ca} de chantiers qui ne rentrent pas.`,
    introSansChiffre: "Chaque mois qui passe sans campagne, ce sont des chantiers qui ne rentrent pas.",
    body: "Ce n'est pas une urgence artificielle : c'est le même calcul que ton étude, projeté dans le temps. Le raisonnement complet tient en 2 pages :",
    pdfLabel: "Le coût de l'attente (PDF, 2 pages)",
    cta: "Recevoir mon audit gratuit",
    ctaSub: "10 questions · 2 minutes · Sans engagement",
  },
```

- [ ] **Step 4: Vérifier**

Run: `npx tsc --noEmit`
Expected: 0 erreur (les templates passent déjà un `string` à ces fonctions, seul le nom du paramètre change).

- [ ] **Step 5: Commit**

```bash
git add config/emails.ts
git commit -m "refactor(email): les textes parlent de CA, plus de net ni de marge

<< Chaque mois, il te resterait X dans la poche >> et << c'est de la
marge qui ne rentre pas >> affirmaient un benefice qui depend de ses
charges. Du CA qui ne rentre pas, c'est vrai et verifiable.

La note de l'etude dit maintenant explicitement : c'est du chiffre
d'affaires, pas du benefice, a toi d'en deduire tes charges.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Le template de l'étude (email #1) — TDD

**Files:**
- Modify: `tests/email/templates.test.ts:17-40`
- Modify: `lib/email/templates/etude.ts:58-87`

- [ ] **Step 1: Écrire le test qui échoue**

Dans `tests/email/templates.test.ts`, le `SNAPSHOT` de tête (L7-15) garde `net: 892, roi: 1.6` — le type `EtudeSnapshot` est inchangé, ils restent la trace interne. Ajouter dans le `describe("etudeEmail")` :

```ts
  it("affiche le CA en bandeau, jamais le net ni la marge", () => {
    const { html } = etudeEmail({ snapshot: SNAPSHOT, unsubToken: "tok" });
    // Le CA de SNAPSHOT est 12 000 → il doit être le chiffre du bandeau.
    expect(html).toMatch(/12\s?000\s?€/u);
    // Le net (892) ne doit apparaître NULLE PART dans l'email.
    expect(html).not.toMatch(/892/u);
    // Ni le mot « poche », ni un ×ROI.
    expect(html).not.toMatch(/poche/iu);
    expect(html).not.toMatch(/×\s?1,6/u);
  });
```

- [ ] **Step 2: Lancer le test pour le voir échouer**

Run: `npm test -- templates`
Expected: FAIL — `expect(html).not.toMatch(/892/u)` échoue (le net est encore dans le bandeau et le preheader).

- [ ] **Step 3: Réécrire le template**

Remplacer `lib/email/templates/etude.ts:58-87` par :

```ts
  /* Le chiffre est déjà dans le bandeau : ici on montre d'où il sort.
     Métier et ville sont dans le sous-titre du bandeau — les répéter
     volerait des lignes aux chiffres.
     La ligne « Retour sur ce que tu investis ×N » a sauté le 2026-07-17 :
     ce ×N était marge/investi, avec une marge que nous présupposions. */
  const rows = [
    row("Budget mensuel (Ads + gestion)", esc(fmtEuro(s.budget))),
    row("Chantiers estimés / mois", esc(String(s.chantiers))),
    row("CA estimé / mois", esc(fmtEuro(s.ca))),
  ].join("");

  const body = `
    ${para(t.intro, 0)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0;">${rows}</table>
    ${mention(t.note)}
    ${button(`${baseUrl()}/`, t.cta)}
    ${ctaNote(t.ctaSub)}`;

  return {
    subject,
    html: layout({
      preheader: `${fmtEuro(s.ca)} de chantiers par mois — ton étude ${s.metier} à ${s.ville}.`,
      bande: bandeau(
        `${esc(t.bandeauAvant)}<br>${big(fmtEuro(s.ca))} ${esc(t.bandeauApres)}`,
        t.bandeauSub(s.metier, s.ville)
      ),
      body,
      unsubUrl,
    }),
  };
}
```

Puis supprimer la ligne devenue morte `lib/email/templates/etude.ts:61` :

```ts
  const roiTxt = s.roi.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
```

- [ ] **Step 4: Lancer les tests**

Run: `npm test -- templates`
Expected: PASS. L'ancien test L23 (`expect(html).toMatch(/892\s?€/u)`) échoue encore — le corriger en remplaçant `892` par `12 000` :

```ts
    expect(html).toMatch(/12\s?000\s?€/u);
```

Relancer : PASS.

- [ ] **Step 5: Vérifier que le type guard n'a pas bougé**

Run: `npx tsc --noEmit`
Expected: 0 erreur. `isEtudeSnapshot` exige toujours `net`/`roi` → les lignes `etude_emails` déjà en prod passent toujours.

- [ ] **Step 6: Commit**

```bash
git add lib/email/templates/etude.ts tests/email/templates.test.ts
git commit -m "refactor(email): l'etude affiche le CA en bandeau, plus le net

Le bandeau affichait big(net) sous << il te resterait ... dans la poche >>
et le tableau une ligne << Retour sur ce que tu investis xN >> ou N etait
marge/investi. Les deux presupposaient sa marge.

Le type EtudeSnapshot garde net et roi : ils restent la trace interne
dans le jsonb, et isEtudeSnapshot ne bouge pas -- les lignes deja en prod
passent toujours le garde-fou.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Les relances J+2 / J+5 — TDD

Le piège : `num(args.snapshot?.net)` retourne `null` si le champ manque et bascule **silencieusement** sur la variante « sans chiffre ». On bascule sur `ca`, qui est présent dans tous les snapshots (whitelist `SNAP_NUM` de `/api/etude`).

**Files:**
- Modify: `tests/email/templates.test.ts:95-135`
- Modify: `lib/email/templates/relances.ts:48-108`

- [ ] **Step 1: Écrire les tests qui échouent**

Dans `tests/email/templates.test.ts`, `SNAP_LOOSE` (L95-103) garde `net: 892, roi: 1.6` et doit contenir `ca: 12000`. Remplacer les assertions du `describe("relanceJ2Email")` et `describe("relanceJ5Email")` par :

```ts
  it("met le CA dans l'objet, jamais le net", () => {
    const { subject, html } = relanceJ2Email({ snapshot: SNAP_LOOSE, unsubToken: "tok" });
    expect(subject).toMatch(/^12\s?000\s?€ de chantiers par mois — ton étude t'attend$/u);
    expect(html).not.toMatch(/892/u);
  });

  it("retombe sur l'objet générique sans CA exploitable", () => {
    const { subject } = relanceJ2Email({
      snapshot: { metier: "Plombier", ca: 0 },
      unsubToken: "tok",
    });
    expect(subject).toBe("Ton étude Google Ads t'attend");
  });
```

et pour J+5 :

```ts
  it("parle de chantiers qui ne rentrent pas, jamais de marge", () => {
    const { html } = relanceJ5Email({ snapshot: SNAP_LOOSE, unsubToken: "tok" });
    expect(html).toMatch(/12\s?000\s?€/u);
    expect(html).toContain("de chantiers qui ne rentrent pas");
    expect(html).not.toMatch(/marge/iu);
    expect(html).not.toMatch(/892/u);
  });
```

- [ ] **Step 2: Lancer pour voir échouer**

Run: `npm test -- templates`
Expected: FAIL — les templates lisent encore `snapshot.net`.

- [ ] **Step 3: Basculer les deux templates sur `ca`**

Dans `lib/email/templates/relances.ts`, remplacer L52-55 (J+2) par :

```ts
  const t = emails.relanceJ2;
  /* `ca` et non `net` (2026-07-17) : le net presupposait sa marge. `ca`
     est dans la whitelist SNAP_NUM de /api/etude, donc présent partout.
     ⚠️ Les lignes créées AVANT cette date ont un snapshot avec `net` mais
     aussi `ca` — la bascule est rétro-compatible. */
  const ca = num(args.snapshot?.ca);
  const avecChiffre = ca !== null && ca > 0;
  const subject = avecChiffre ? t.subjectAvecChiffre(fmtEuro(ca)) : t.subjectSansChiffre;
```

et L69 par :

```ts
          ? `${esc(t.bandeauAvant)}<br>${big(fmtEuro(ca))} ${esc(t.bandeauApres)}`
```

Puis, pour J+5, remplacer L83-85 par :

```ts
  const t = emails.relanceJ5;
  /* Voir relanceJ2Email : `ca` remplace `net` depuis le 2026-07-17. */
  const ca = num(args.snapshot?.ca);
  const avecChiffre = ca !== null && ca > 0;
```

et L97 / L100 par :

```ts
      preheader: avecChiffre ? t.introAvecChiffre(fmtEuro(ca)) : t.introSansChiffre,
```

```ts
          ? `${esc(t.bandeauAvant)}<br>${big(fmtEuro(ca))} ${esc(t.bandeauApres)}`
```

- [ ] **Step 4: Lancer les tests**

Run: `npm test`
Expected: PASS sur toute la suite.

- [ ] **Step 5: Corriger les fixtures menteuses de `relances.test.ts`**

`tests/email/relances.test.ts` (L9, L62-63, L66) utilise `snapshot: { net: 892 }`. Ces tests portent sur `planRelances` (le snapshot y est opaque) et passeraient quand même — mais la fixture ment. Remplacer chaque `net:` par `ca:` et `892` par `12000`, `100` par `12000`.

Run: `npm test -- relances`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/email/templates/relances.ts tests/email/templates.test.ts tests/email/relances.test.ts
git commit -m "refactor(email): les relances J+2/J+5 basculent du net vers le CA

<< son chiffre >> du J+2 etait exactement net = marge - total, le meme
chiffre presuppose que le simulateur. Et le J+5 affirmait << c'est de la
marge qui ne rentre pas >>.

Bascule sur ca, present dans la whitelist SNAP_NUM de /api/etude donc
dans tous les snapshots, anciens compris. Sans ce changement, num(net)
serait tombe sur null pour les nouveaux prospects et les relances
seraient passees en variante << sans chiffre >> en silence.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Les samples de `/dev/emails`

**Files:**
- Modify: `app/dev/emails/samples.ts:10-18`

- [ ] **Step 1: Vérifier que le sample a bien un `ca` cohérent**

Lire `app/dev/emails/samples.ts:10-18`. Le `SNAPSHOT` doit garder `net: 892, roi: 1.6` (type `EtudeSnapshot` inchangé) et avoir un `ca` réaliste. Si `ca` vaut autre chose que `12000`, l'aligner pour que la préview montre le même chiffre que les tests :

```ts
const SNAPSHOT: EtudeSnapshot = {
  metier: "Plombier",
  ville: "Bordeaux",
  budget: 1500,
  /* net et roi restent : trace interne du jsonb, plus jamais affichée. */
  net: 892,
  roi: 1.6,
  ca: 12000,
  chantiers: 24,
};
```

- [ ] **Step 2: Vérifier**

Run: `npx tsc --noEmit && npx next lint`
Expected: 0 erreur, 0 warning.

- [ ] **Step 3: Commit**

```bash
git add app/dev/emails/samples.ts
git commit -m "chore(dev): sample d'email aligne sur le CA affiche

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Vérification de bout en bout

- [ ] **Step 1: Suite complète**

```bash
cd D:/projets/lp && npx tsc --noEmit && npx next lint && npm test
```

Expected: 0 erreur TS, 0 erreur/warning lint, tous les tests verts.

- [ ] **Step 2: Chasse aux résidus**

```bash
cd D:/projets/lp && grep -rniE "dans la poche|il te resterait|de marge qui ne rentre|Retour sur ce que tu investis|Tres rentable|verdicts" --include=*.ts --include=*.tsx . | grep -v node_modules
```

Expected: **aucun résultat**, sauf les commentaires historiques qui expliquent la suppression (`config/simulateur.ts`, `config/emails.ts`).

- [ ] **Step 3: Vérifier à l'œil dans le navigateur**

Serveur déjà lancé sur `http://localhost:3000`. Vérifier :
1. Le héros affiche un CA (« X € de chantiers signés, chaque mois »), pas un « + 892 € dans ta poche ».
2. La ligne de coût sous le chiffre : « pour 1 500 € par mois tout compris — 1 000 € de publicité Google + 500 € de gestion NMF ».
3. La ligne CAC en bas du bloc bleu.
4. Aucun verdict (« Très rentable », « tu travailles pour payer ta pub »).
5. « Affiner » : plus de curseur « Ta marge brute ». Les curseurs Conversion / Transformation / Panier restent.
6. « Voir les autres métiers » : dernière colonne « € / chantier ».
7. `Ctrl+P` : le PDF montre le même bloc héros (CA + coût + CAC), pas de net.
8. `/dev/emails` : les 5 emails. L'étude et les relances affichent le CA en bandeau, aucun « 892 », aucun « dans la poche ».

- [ ] **Step 4: Vérifier le pixel (interne, doit SURVIVRE)**

Console navigateur sur `/`, régler un curseur, attendre ~3 s. L'event `SimulateurResultat` doit partir avec `net_mensuel`, `roi` et `verdict` **toujours présents** — ce sont nos audiences, elles ne doivent pas casser.

---

## Notes pour plus tard (hors périmètre de ce plan)

- `budgetDefautTotal: 1500` (`config/simulateur.ts:355`) existait pour que la page ouvre sur un verdict « Rentable » crédible. Les verdicts ayant disparu, ce réglage a perdu sa justification — à re-décider sur ce qui est honnête, plus sur ce qui affiche bien.
- `kpis.marge` et `kpis.roi` (`config/simulateur.ts:230-234`) sont du **code mort** déjà avant ce plan (aucun consommateur). À supprimer dans un ménage séparé.
- La notification interne (`lib/email/templates/notif-interne.ts`) lit `audit_leads`, qui n'a aucune colonne marge/net/roi. Y faire remonter le net estimé demanderait une migration + un ajout à la whitelist `known` de `AcquisitionLp.tsx:113-122`. Utile pour la qualification des leads, mais c'est un autre chantier.
