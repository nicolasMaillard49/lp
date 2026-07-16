"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EmailEtude } from "@/components/simulateur/EmailEtude";
import { fbTrackCustom } from "@/lib/fpixel";
import {
  bassinPour,
  simulateur,
  suggestCommunes,
  tauxPour,
  zoneForCommune,
  zoneForVille,
  type Commune,
  type Metier,
} from "@/config/simulateur";

/* ──────────────────────────────────────────────────────────────
   Simulateur ROI — bleu & blanc.

   Parti pris : les réglages forment UNE PHRASE, pas un tableau de
   bord. « Je suis plombier à Bordeaux et je peux investir 600 € par
   mois. » Un artisan connaît ces trois choses. Il ne connaît pas son
   « taux de conversion » ni sa « transformation lead → chantier » —
   c'est du vocabulaire d'agence, et le lui demander d'entrée le fait
   fuir. Ces réglages existent toujours, repliés dans « Affiner ».

   Le résultat suit la même règle : un seul chiffre héros — ce qui
   rentre dans sa poche. Le CA, les leads, le CPC sont des étapes de
   calcul, pas des résultats : ils vivent dans « Comment on arrive là ».

   Zéro arrondi, zéro ombre, zéro dégradé. Le bleu ne sert qu'au
   résultat et à l'action.
   ────────────────────────────────────────────────────────────── */

const eur = (v: number) =>
  v.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";
const dec = (v: number) => v.toFixed(1).replace(".", ",");

type Params = {
  geo: number;
  ads: number;
  lsa: number;
  nmf: number;
  conv: number;
  transfo: number;
  panier: number;
  marge: number;
  /** Population de la commune — sert à dimensionner le marché local. */
  pop: number;
  /** Multiplicateur variantes de mots-clés (hypothèse, ×4 défaut). */
  variantes: number;
};

/** CTR en 1ʳᵉ position — skill google-ads-artisans. */
const CTR_POS1 = 0.28;

function compute(m: Metier, p: Params) {
  const cpc = m.cpc * p.geo;

  /* Le marché local est FINI, et il est MESURÉ (Keyword Planner,
     2026-07-14) : 40 recherches/mois pour « plombier » à Brive, pas
     les 424 que l'ancien modèle inventait. `clics = budget ÷ CPC`
     est une division sans borne — on ne peut pas acheter des
     recherches qui n'ont pas lieu. */
  const bassin = bassinPour(p.pop);
  const recherchesMotPrincipal = (tauxPour(m, bassin) * bassin) / 10_000;
  const recherches = recherchesMotPrincipal * p.variantes;
  const clicsDispo = recherches * CTR_POS1;
  const clicsVoulus = p.ads / cpc;
  const clics = Math.min(clicsVoulus, clicsDispo);
  /* Ce qui est payé pour rien une fois le marché saturé — c'est LE
     chiffre honnête : « au-delà, ton budget n'achète plus rien ». */
  const adsUtile = clics * cpc;
  const adsGaspille = Math.max(0, p.ads - adsUtile);
  const sature = clicsVoulus > clicsDispo;

  const leadsAds = clics * p.conv;
  const leadsLsa = p.lsa > 0 ? p.lsa / m.cpa : 0;
  const leads = leadsAds + leadsLsa;
  const chantiers = leads * p.transfo;
  const ca = chantiers * p.panier;
  const marge = ca * p.marge;
  const total = p.ads + p.lsa + p.nmf;
  return {
    cpc,
    clics,
    bassin,
    recherchesMotPrincipal,
    recherches,
    clicsDispo,
    adsGaspille,
    sature,
    leadsAds,
    leadsLsa,
    leads,
    chantiers,
    ca,
    marge,
    total,
    /* Le retour se juge sur la MARGE. Un ×23 sur le CA ne veut rien
       dire : un maçon qui fait 25 000 € de CA n'a pas gagné 25 000 €. */
    roi: total ? marge / total : 0,
  };
}

export type SimSnapshot = {
  metier: string;
  ville: string;
  zoneLabel: string;
  budget: number;
  ads: number;
  lsa: number;
  panier: number;
  transfo: number;
  chantiers: number;
  ca: number;
  roi: number;
};

/* ── Primitives ─────────────────────────────────────────────── */

const LABEL = "text-[10px] font-bold uppercase tracking-[0.12em] text-sim-muted";

/** Un champ qui vit DANS la phrase — souligné, pas encadré. */
const INLINE =
  "appearance-none rounded-none border-0 border-b-2 border-sim-blue bg-transparent px-1 pb-0.5 font-bold text-sim-blue outline-none focus:bg-sim-panel";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-[7px] text-sm tabular-nums">
      <span className="text-sim-muted">{label}</span>
      <span className="font-semibold text-sim-ink">{value}</span>
    </div>
  );
}

function Slider({
  label,
  hint,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className={LABEL}>{label}</span>
        <output className="text-sm font-bold tabular-nums text-sim-ink">
          {display}
        </output>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        aria-label={label}
        className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-none bg-sim-line accent-sim-blue"
      />
      {hint && <p className="mt-1.5 text-[11px] leading-snug text-sim-muted">{hint}</p>}
    </div>
  );
}

/* ── Ville, en ligne dans la phrase ─────────────────────────── */

function VilleInline({
  ville,
  onPick,
}: {
  ville: string;
  onPick: (v: string, c?: Commune) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const [distant, setDistant] = useState<Commune[]>([]);
  const box = useRef<HTMLSpanElement>(null);

  /* Les 492 grandes villes sont dans le bundle : réponse instantanée,
     le temps que la route (11 ms, mais un aller-retour quand même)
     rapporte les 34 465 villages. Le champ ne clignote jamais vide. */
  const local = useMemo(() => (open ? suggestCommunes(ville) : []), [ville, open]);
  const sugg = distant.length ? distant : local;

  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  /* Couverture totale — villages compris — via la route serveur.
     Débounce court : la route est locale, pas besoin d'attendre. */
  useEffect(() => {
    if (!open || ville.trim().length < 2) {
      setDistant([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/communes?q=${encodeURIComponent(ville)}`, {
          signal: ctrl.signal,
        });
        const j = await res.json();
        setDistant(j.communes ?? []);
      } catch {
        /* Route indisponible : la table locale prend le relais. */
      }
    }, 120);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [ville, open]);

  const choose = (c: Commune) => {
    onPick(c[0], c);
    setOpen(false);
  };

  return (
    <span ref={box} className="relative inline-block">
      <input
        type="text"
        value={ville}
        onChange={(e) => {
          onPick(e.target.value);
          setOpen(true);
          setHi(0);
        }}
        onBlur={() => setDistant([])}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!sugg.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHi((i) => (i + 1) % sugg.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHi((i) => (i - 1 + sugg.length) % sugg.length);
          } else if (e.key === "Enter") {
            e.preventDefault();
            choose(sugg[hi]);
          } else if (e.key === "Escape") setOpen(false);
        }}
        placeholder={simulateur.params.villePlaceholder}
        autoComplete="off"
        aria-label={simulateur.params.ville}
        size={Math.max(ville.length || 8, 6)}
        className={INLINE}
      />
      {open && sugg.length > 0 && (
        <ul className="absolute left-0 top-full z-20 mt-1 min-w-64 border border-sim-line bg-white text-left">
          {sugg.map((c, i) => (
            <li key={c[0] + c[2]}>
              <button
                type="button"
                onMouseEnter={() => setHi(i)}
                onClick={() => choose(c)}
                className={`flex w-full items-baseline justify-between gap-3 px-3 py-2 text-sm ${
                  i === hi ? "bg-sim-blue text-white" : "text-sim-ink"
                }`}
              >
                <span className="font-medium">
                  {c[0]} <span className="opacity-60">({c[2]})</span>
                </span>
                <span className="shrink-0 text-xs tabular-nums opacity-70">
                  {c[1].toLocaleString("fr-FR")} hab.
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </span>
  );
}

/* ── Composant ──────────────────────────────────────────────── */

export function SimulateurRoi({
  onContinue,
  ctaLabel,
}: {
  onContinue?: (snap: SimSnapshot) => void;
  ctaLabel?: string;
} = {}) {
  const s = simulateur;
  const metiers: readonly Metier[] = s.metiers;

  const [metierIdx, setMetierIdx] = useState(0);
  const [ville, setVille] = useState("Bordeaux");
  /* La commune CHOISIE dans la liste — porte sa population réelle.
     Sans elle, un village de 527 habitants héritait du marché d'une
     ville de 50 000 et le plafond de volume ne servait à rien. */
  const [commune, setCommune] = useState<Commune | null>(null);
  const pickVille = (v: string, c?: Commune) => {
    setVille(v);
    setCommune(c ?? null);
  };
  /* `total` = ce qu'il sort de sa poche, forfait de gestion COMPRIS.
     Le budget publicité s'en déduit. La répartition Ads/LSA est un
     arbitrage d'agence, pas une question à poser d'entrée : Affiner.
     La valeur d'ouverture est un réglage marketing → config, à côté
     de `gestionFixe` dont elle dépend. */
  const [total, setTotal] = useState<number>(s.budgetDefautTotal);
  const [partLsa, setPartLsa] = useState(50);
  const nmf = s.gestionFixe;
  const budget = Math.max(0, total - nmf);
  const [conv, setConv] = useState(metiers[0].conv);
  const [transfo, setTransfo] = useState(metiers[0].transfo);
  const [panier, setPanier] = useState(metiers[0].panier);
  const [marge, setMarge] = useState(metiers[0].margeDefaut);
  const [variantes, setVariantes] = useState(4);

  const [date, setDate] = useState<string | null>(null);
  useEffect(() => {
    setDate(new Date().toLocaleDateString("fr-FR"));
  }, []);

  const lsa = Math.round((budget * partLsa) / 100);
  const ads = budget - lsa;
  /* Une commune choisie dans la liste prime : on connaît sa population
     exacte, donc son marché. Sinon on retombe sur la table locale. */
  const match = commune ? zoneForCommune(commune) : zoneForVille(ville);
  const metier = metiers[metierIdx];
  const p: Params = {
    geo: match.zone.mult,
    ads,
    lsa,
    nmf,
    conv: conv / 100,
    transfo: transfo / 100,
    panier,
    marge: marge / 100,
    /* Sans commune reconnue : ville moyenne neutre, bassin type Brive. */
    pop: match.commune?.[1] ?? 47_000,
    variantes,
  };
  const r = compute(metier, p);

  /* Changer de métier recharge SES moyennes — conv ET marge : les
     constantes uniformes étaient le bug d'origine (dépannage et gros
     œuvre n'ont ni la même conversion ni la même marge). */
  const pickMetier = (i: number) => {
    setMetierIdx(i);
    setConv(metiers[i].conv);
    setTransfo(metiers[i].transfo);
    setPanier(metiers[i].panier);
    setMarge(metiers[i].margeDefaut);
  };

  const roiTxt = dec(r.roi);
  const perte = r.roi < 1;
  /* Ce qui reste réellement : la marge dégagée MOINS tout ce qu'il a
     sorti (pub + gestion). C'est le seul chiffre qu'un artisan
     reconnaît comme « ce que ça me rapporte ». */
  const net = r.marge - r.total;
  const verdict = perte
    ? s.verdicts.loss
    : r.roi < 1.5
      ? s.verdicts.low
      : r.roi < 3
        ? s.verdicts.mid(roiTxt)
        : s.verdicts.high(roiTxt);

  /* Retargeting Meta « SimulateurResultat » — alimente les audiences de
     relance personnalisée (« Tes X €/mois t'attendent »). Débouncé
     ~2,5 s après le DERNIER changement de réglage : on capture l'état
     stabilisé, pas chaque cran de curseur. L'état initial part aussi
     (un visiteur qui regarde sans toucher est retargetable), mais un
     état identique n'est jamais renvoyé (comparaison sur le payload). */
  const lastResultatSent = useRef<string | null>(null);
  const villeResultat = match.commune?.[0] ?? ville.trim();
  useEffect(() => {
    const payload = {
      metier: metier.nom,
      ville: villeResultat,
      budget_total: total,
      net_mensuel: Math.round(net),
      roi: +r.roi.toFixed(1),
      verdict: perte ? "perte" : r.roi < 1.5 ? "equilibre" : "rentable",
    };
    const key = JSON.stringify(payload);
    if (key === lastResultatSent.current) return;
    const timer = setTimeout(() => {
      lastResultatSent.current = key;
      fbTrackCustom("SimulateurResultat", payload);
    }, 2500);
    return () => clearTimeout(timer);
  }, [metier.nom, villeResultat, total, net, r.roi, perte]);

  const foldCls =
    "border border-sim-line [&[open]]:bg-sim-panel print:hidden";
  const summaryCls =
    "cursor-pointer select-none px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-sim-ink marker:text-sim-blue";

  return (
    <div className="font-helvetica text-sim-ink [font-variant-numeric:tabular-nums]">
      {/* ── La phrase ── */}
      <div className="border border-sim-line bg-white px-5 py-6 sm:px-8 sm:py-8 print:hidden">
        {/* `div` et non `p` : l'autocomplétion de ville rend un `ul`, et
            un `ul` dans un `p` est invalide — le navigateur referme le
            `p` tout seul, ce qui casse l'hydratation React. */}
        <div className="text-[clamp(1.1rem,2.4vw,1.5rem)] font-medium leading-loose">
          {s.phrase.a}{" "}
          <span className="relative inline-block">
            <select
              value={metierIdx}
              onChange={(e) => pickMetier(+e.target.value)}
              aria-label={s.params.metier}
              className={`${INLINE} pr-5`}
            >
              {metiers.map((m, i) => (
                <option key={m.nom} value={i}>
                  {m.nom.toLowerCase()}
                </option>
              ))}
            </select>
            <span
              aria-hidden
              className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-sim-blue"
            >
              ▾
            </span>
          </span>{" "}
          {s.phrase.b} <VilleInline ville={ville} onPick={pickVille} />{" "}
          {s.phrase.c}{" "}
          <span className="whitespace-nowrap font-bold text-sim-blue">
            {eur(total)}
          </span>{" "}
          {s.phrase.d}
        </div>

        {/* Le minimum démarre au forfait + 300 € de pub : en dessous, la
            gestion mange tout et le curseur promettrait une pub qui
            n'existe pas. */}
        <input
          type="range"
          min={nmf + 300}
          max={4000}
          step={50}
          value={total}
          onChange={(e) => setTotal(+e.target.value)}
          aria-label={s.params.budget}
          className="mt-5 h-1 w-full cursor-pointer appearance-none rounded-none bg-sim-line accent-sim-blue"
        />
        <p className="mt-2 flex flex-wrap gap-x-3 text-[11px] text-sim-muted">
          <span className="font-semibold text-sim-ink">
            {s.phrase.repartition(eur(budget), eur(nmf))}
          </span>
          <span>{match.raison}</span>
        </p>
      </div>

      {/* ── Le document — c'est LUI qui s'imprime ── */}
      <section id="estimation" className="mt-5 border border-sim-line bg-white">
        <header className="flex items-baseline justify-between gap-4 border-b-2 border-sim-ink px-5 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em]">
            Estimation mensuelle
          </p>
          <p className="text-[11px] text-sim-muted">
            NMF Agence{date ? ` · ${date}` : ""}
          </p>
        </header>

        <div className="border-b border-sim-line px-5 py-3">
          <p className="font-bold">
            {metier.nom}
            <span className="font-medium text-sim-muted">
              {" — "}
              {match.commune ? `${match.commune[0]} (${match.commune[2]})` : ville || "France"}
              {" · "}
              {eur(budget)} de pub + {eur(nmf)} de gestion
            </span>
          </p>
        </div>

        {/* Le résultat — UN chiffre : ce qui reste vraiment en poche une
            fois la pub et la gestion payées. Afficher la marge brute ici
            se contredisait avec le libellé « tu y perds » : le libellé
            annonçait une perte, le chiffre affichait un gain. */}
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
              {net >= 0 ? "+" : "−"} {eur(Math.abs(net))}
            </span>
            <span className={perte ? "text-sim-muted" : "text-white/80"}>
              {s.phrase.net}
            </span>
          </p>
          <p
            className={`mt-2 text-sm ${perte ? "text-sim-muted" : "text-white/70"}`}
          >
            {eur(r.marge)} {s.phrase.netDetail} {eur(r.total)} {s.phrase.netDetail2}
          </p>
          <p className={`mt-3 text-sm ${perte ? "text-sim-ink" : "text-white/90"}`}>
            {verdict}
          </p>
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

        <div className="grid grid-cols-2 border-t border-sim-line">
          <div className="flex items-center gap-3 border-r border-sim-line px-5 py-4">
            {/* Icônes plutôt que du texte (épure 2026-07-15) — trait fin,
                bleu action, cohérent avec le style document. */}
            <svg viewBox="0 0 24 24" className="size-7 shrink-0 text-sim-blue" fill="none" aria-hidden>
              <path d="M3 21h18M5 21V10l7-6 7 6v11M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <p className={LABEL}>{s.kpis.chantiers}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{dec(r.chantiers)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <svg viewBox="0 0 24 24" className="size-7 shrink-0 text-sim-blue" fill="none" aria-hidden>
              <path d="M17 7a6.5 6.5 0 1 0 0 10M5 10.5h8M5 13.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div>
              <p className={LABEL}>{s.kpis.ca}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{eur(r.ca)}</p>
            </div>
          </div>
        </div>

        {/* L'honnêteté tient en UNE ligne, et cette ligne EST le pli qui
            l'ouvre — une seule occurrence cliquable, une seule source
            (<Honnetete/>), partagée avec le PDF. */}
        <details className="border-t border-sim-line print:hidden">
          <summary className="cursor-pointer select-none px-5 py-2.5 text-[11px] font-semibold text-sim-muted marker:text-sim-blue">
            {s.hypothese.titre}
          </summary>
          <div className="px-5 pb-3">
            <Honnetete s={s} metier={metier} />
          </div>
        </details>
        {/* CPC estimé (pas mesuré) : la mention reste visible SANS clic —
            l'honnêteté sur un chiffre incertain n'est pas opt-in. */}
        {metier.estimated && (
          <p className="border-t border-sim-line px-5 py-2.5 text-[10px] leading-relaxed text-sim-muted print:hidden">
            {s.estimatedNote}
          </p>
        )}

        {/* Sur papier seulement : détail du calcul + cadrage COMPLET
            (texte, variables, sources) dans le PDF. */}
        <div className="hidden px-5 py-3 print:block">
          <Detail s={s} r={r} metier={metier} ads={ads} lsa={lsa} />
          <p className="mt-3 text-xs font-bold">{s.hypothese.titre}</p>
          <div className="mt-1">
            <Honnetete s={s} metier={metier} />
          </div>
        </div>
      </section>

      {/* ── Actions ── */}
      {/* UNE action, pas deux : le CTA de conversion est le seul bouton —
          pleine largeur, gros, avec sa réassurance. L'export PDF descend
          au rang de lien texte : il sert APRÈS la décision, pas à sa
          place, et deux boutons de même poids diluaient le funnel.
          Sans `onContinue` (page /simulateur), l'export redevient le
          seul bouton visible. */}
      {onContinue ? (
        <div className="mt-5 print:hidden">
          <button
            type="button"
            onClick={() =>
              onContinue({
                metier: metier.nom,
                ville: match.commune?.[0] ?? ville.trim(),
                zoneLabel: match.zone.label,
                budget,
                ads,
                lsa,
                panier,
                transfo,
                chantiers: r.chantiers,
                ca: r.ca,
                roi: r.roi,
              })
            }
            className="flex min-h-16 w-full items-center justify-center gap-3 bg-sim-blue px-6 py-5 text-xl font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sim-blue sm:text-2xl"
          >
            <span>{ctaLabel ?? s.cta}</span>
            <span aria-hidden>→</span>
          </button>
          <p className="mt-2.5 text-center text-xs font-semibold uppercase tracking-[0.12em] text-sim-muted">
            {s.ctaReassurance}
          </p>
          <p className="mt-4 text-center">
            <ExportPdf s={s} asLink />
          </p>
          {/* Le filet : capture email APRÈS le CTA, discret — il récupère
              ceux qui ne cliqueront pas, il ne détourne pas les autres.
              LP uniquement : sur /simulateur standalone, pas de funnel à
              rattraper. */}
          <div className="mt-6">
            <EmailEtude
              snapshot={{
                metier: metier.nom,
                ville: match.commune?.[0] ?? ville.trim(),
                budget: total,
                net: Math.round(net),
                roi: +r.roi.toFixed(1),
                ca: Math.round(r.ca),
                chantiers: +r.chantiers.toFixed(1),
              }}
            />
          </div>
        </div>
      ) : (
        <div className="mt-5 print:hidden">
          <ExportPdf s={s} />
        </div>
      )}

      {/* ── Tout le reste est replié : présent, mais pas dans les pattes ── */}
      <div className="mt-5 flex flex-col gap-px">
        <details className={foldCls}>
          <summary className={summaryCls}>{s.phrase.detail}</summary>
          <div className="border-t border-sim-line px-5 py-4">
            <Detail s={s} r={r} metier={metier} ads={ads} lsa={lsa} />
          </div>
        </details>

        <details className={foldCls}>
          <summary className={summaryCls}>{s.phrase.affiner}</summary>
          <div className="border-t border-sim-line px-5 py-5">
            <p className="mb-5 text-[11px] text-sim-muted">{s.phrase.affinerAide}</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <Slider
                label={s.params.repartition}
                hint={s.params.repartitionHint}
                value={partLsa}
                display={`${partLsa} % · ${eur(lsa)}`}
                min={0}
                max={100}
                step={5}
                onChange={setPartLsa}
              />
              <Slider
                label={s.params.variantes}
                hint={s.params.variantesHint}
                value={variantes}
                display={`×${dec(variantes)}`}
                min={1}
                max={8}
                step={0.5}
                onChange={setVariantes}
              />
              {/* Plage 2-20 % : 30 % de conversion n'existe dans aucune
                  donnée publiée. */}
              <Slider
                label={s.params.conv}
                hint={`${s.params.convHint} · médiane ${dec(metier.conv)} % (${metier.convSource})`}
                value={conv}
                display={`${dec(conv)} %`}
                min={2}
                max={20}
                step={0.1}
                onChange={setConv}
              />
              <Slider
                label={s.params.transfo}
                value={transfo}
                display={`${transfo} %`}
                min={10}
                max={70}
                step={5}
                onChange={setTransfo}
              />
              <Slider
                label={s.params.panier}
                value={panier}
                display={eur(panier)}
                min={100}
                max={8000}
                step={100}
                onChange={setPanier}
              />
              <Slider
                label={s.params.marge}
                hint={s.params.margeHint}
                value={marge}
                display={`${marge} %`}
                min={5}
                max={60}
                step={1}
                onChange={setMarge}
              />
              <div className="border border-sim-line bg-white px-3 py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className={LABEL}>{s.params.gestion}</span>
                  <span className="text-sm font-bold tabular-nums">{eur(nmf)}</span>
                </div>
                <p className="mt-1 text-[11px] text-sim-muted">{s.params.gestionHint}</p>
              </div>
            </div>
          </div>
        </details>

        <details className={foldCls}>
          <summary className={summaryCls}>{s.phrase.comparatif}</summary>
          <div className="overflow-x-auto border-t border-sim-line">
            <table className="w-full border-collapse text-sm tabular-nums">
              <thead>
                <tr>
                  {s.comparatif.cols.map((c, i) => (
                    <th
                      key={c}
                      className={`whitespace-nowrap border-b border-sim-line px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-sim-muted ${i === 0 ? "text-left" : "text-right"}`}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metiers.map((m, i) => {
                  /* Chaque métier avec SES presets — conv ET marge.
                     Comparer 13 métiers à constantes uniformes était
                     le bug d'origine. */
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
                        `×${dec(rr.roi)}`,
                      ].map((v, j) => (
                        <td
                          key={j}
                          className={`whitespace-nowrap border-b border-sim-line px-3 py-2 text-right ${
                            j === 5 ? `font-bold ${rr.roi < 1 ? "text-sim-blue" : ""}` : ""
                          }`}
                        >
                          {v}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="px-5 py-2.5 text-[10px] text-sim-muted">* {s.estimatedNote}</p>
          </div>
        </details>
      </div>
    </div>
  );
}

/**
 * Le cadrage d'honnêteté (texte + variables + sources) — UNE source pour
 * l'écran (pli du document) et le PDF : deux copies divergeaient déjà.
 */
function Honnetete({ s, metier }: { s: typeof simulateur; metier: Metier }) {
  return (
    <>
      <p className="text-[11px] leading-relaxed text-sim-muted">
        {s.hypothese.texte}
      </p>
      <ul className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {s.hypothese.variables.map((v) => (
          <li key={v} className="flex gap-1.5 text-[11px] leading-snug text-sim-muted">
            <span aria-hidden className="text-sim-blue">
              —
            </span>
            <span>{v}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-sim-line pt-3 text-[10px] leading-relaxed text-sim-muted">
        {s.footnote}
        {metier.estimated ? ` ${s.estimatedNote}` : ""}
      </p>
    </>
  );
}

/** Export PDF — un seul handler/libellé, deux habits (lien ou bouton). */
function ExportPdf({ s, asLink = false }: { s: typeof simulateur; asLink?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={
        asLink
          ? "text-xs font-semibold text-sim-muted underline underline-offset-4 transition-colors hover:text-sim-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sim-blue"
          : "h-11 w-full border border-sim-ink bg-white px-6 text-sm font-bold text-sim-ink transition-colors hover:bg-sim-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sim-blue"
      }
    >
      {s.exportPdf}
    </button>
  );
}

/** Les étapes du calcul — jargon assumé, mais rangé hors du chemin. */
function Detail({
  s,
  r,
  metier,
  ads,
  lsa,
}: {
  s: typeof simulateur;
  r: ReturnType<typeof compute>;
  metier: Metier;
  ads: number;
  lsa: number;
}) {
  return (
    <div className="grid gap-x-10 sm:grid-cols-2">
      <div>
        <p className={`mb-1 border-b border-sim-line pb-1 ${LABEL}`}>{s.detail.ads}</p>
        <Row label={s.detail.bassin} value={`${r.bassin.toLocaleString("fr-FR")} hab.`} />
        <Row label={s.detail.recherches} value={r.recherchesMotPrincipal.toFixed(0)} />
        <Row label={s.detail.marche} value={r.recherches.toFixed(0)} />
        <Row label={s.detail.clicsDispo} value={r.clicsDispo.toFixed(0)} />
        <Row label={s.detail.cpc} value={`${dec(r.cpc)} €`} />
        <Row label={s.detail.clics} value={r.clics.toFixed(0)} />
        <Row label={s.detail.leads} value={dec(r.leadsAds)} />
        <Row label={s.detail.cpl} value={r.leadsAds ? eur(ads / r.leadsAds) : "—"} />
      </div>
      <div>
        <p className={`mb-1 border-b border-sim-line pb-1 ${LABEL}`}>{s.detail.lsa}</p>
        <Row label={s.detail.cpa} value={`${metier.cpa} €`} />
        <Row label={s.detail.leadsLsa} value={dec(r.leadsLsa)} />
        <Row label={s.detail.cpl} value={r.leadsLsa ? eur(lsa / r.leadsLsa) : "—"} />
        <Row
          label={s.detail.cac}
          value={r.chantiers ? eur(r.total / r.chantiers) : "—"}
        />
      </div>
    </div>
  );
}
