"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Banknote,
  BriefcaseBusiness,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  CircleDollarSign,
  Download,
  Gauge,
  Hammer,
  MapPin,
  PhoneCall,
  ReceiptText,
  Search,
  Settings2,
  ShieldCheck,
  Target,
} from "lucide-react";
import { EmailEtude } from "@/components/simulateur/EmailEtude";
import type { EtudeSnapshot } from "@/lib/email/templates/etude";
import { useActivationTracking } from "@/hooks/useActivationTracking";
import type { ActivationMark } from "@/lib/activation";
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

const eur = (v: number) =>
  v.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";
const dec = (v: number) => v.toFixed(1).replace(".", ",");
const parJour = (v: number) => v / 30;
const CTR_POS1 = 0.28;

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

type Params = {
  geo: number;
  ads: number;
  lsa: number;
  nmf: number;
  conv: number;
  transfo: number;
  panier: number;
  marge: number;
  pop: number;
  variantes: number;
};

function compute(m: Metier, p: Params) {
  const cpc = m.cpc * p.geo;
  const bassin = bassinPour(p.pop);
  const recherchesMotPrincipal = (tauxPour(m, bassin) * bassin) / 10_000;
  const recherches = recherchesMotPrincipal * p.variantes;
  const clicsDispo = recherches * CTR_POS1;
  const clicsVoulus = p.ads / cpc;
  const clics = Math.min(clicsVoulus, clicsDispo);
  const adsUtile = clics * cpc;
  const adsGaspille = Math.max(0, p.ads - adsUtile);
  const leadsAds = clics * p.conv;
  const leadsLsa = p.lsa > 0 ? p.lsa / m.cpa : 0;
  const leads = leadsAds + leadsLsa;
  const chantiers = leads * p.transfo;
  const ca = chantiers * p.panier;
  const marge = ca * p.marge;
  const total = p.ads + p.lsa + p.nmf;

  return {
    cpc,
    bassin,
    recherchesMotPrincipal,
    recherches,
    clicsDispo,
    clics,
    adsGaspille,
    sature: clicsVoulus > clicsDispo,
    leadsAds,
    leadsLsa,
    leads,
    chantiers,
    ca,
    marge,
    total,
    roi: total ? marge / total : 0,
  };
}

/* CA des réglages par défaut (plombier · Bordeaux · budget défaut),
   calculé une fois au chargement du module. Le SSR peint ainsi le chiffre
   FINAL : démarrer à « 0 € » puis compter jusqu'à ~5 000 € faisait
   grossir l'élément LCP pendant ~1 s après hydratation — Lighthouse
   datait le LCP au dernier agrandissement (2,8 s au lieu de ~0,8 s).
   L'anim de count-up ne joue plus qu'aux interactions. Les littéraux
   doivent rester alignés sur les useState par défaut du composant. */
const CA_INITIAL = (() => {
  const m = simulateur.metiers[0];
  const nmf = simulateur.gestionFixe;
  const budget = Math.max(0, simulateur.budgetDefautTotal - nmf);
  const lsa = m.lsa ? Math.round((budget * 50) / 100) : 0;
  const match = zoneForCommune(["Bordeaux", 267991, "33"]);
  return Math.round(
    compute(m, {
      geo: match.zone.mult,
      ads: budget - lsa,
      lsa,
      nmf,
      conv: m.conv / 100,
      transfo: m.transfo / 100,
      panier: m.panier,
      marge: m.margeDefaut / 100,
      pop: 267991,
      variantes: 4,
    }).ca
  );
})();

export function SimulateurTicket({
  onContinue,
  onInteract,
  onMark,
  onEstimateRequested,
  ctaLabel,
  ctaHref,
}: {
  onContinue?: (snap: SimSnapshot) => void;
  /** Premier réglage touché (métier, ville, slider) — appelé UNE fois.
      Sert au jalon `sim_used` du funnel /admin. */
  onInteract?: () => void;
  onMark?: (event: ActivationMark) => void;
  onEstimateRequested?: (
    email: string,
    snap: SimSnapshot,
    snapshot: EtudeSnapshot
  ) => Promise<boolean>;
  ctaLabel?: string;
  ctaHref?: string;
} = {}) {
  const metiers = simulateur.metiers;
  const [metierIdx, setMetierIdx] = useState(0);
  const [ville, setVille] = useState("Bordeaux");
  const [commune, setCommune] = useState<Commune | null>(["Bordeaux", 267991, "33"]);
  const [total, setTotal] = useState<number>(simulateur.budgetDefautTotal);
  const [partLsa, setPartLsa] = useState(50);
  const [conv, setConv] = useState(metiers[0].conv);
  const [transfo, setTransfo] = useState(metiers[0].transfo);
  const [panier, setPanier] = useState(metiers[0].panier);
  const [variantes, setVariantes] = useState(4);
  const [date, setDate] = useState<string | null>(null);
  const [animatedCa, setAnimatedCa] = useState(CA_INITIAL);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [conversionReached, setConversionReached] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const conversionRef = useRef<HTMLDivElement>(null);
  const estimateRef = useRef<HTMLDivElement>(null);
  /* Miroir de animatedCa lisible hors cycle React : le restart
     d'animation (retour d'onglet caché) doit repartir de la valeur
     réellement affichée, pas d'une closure périmée. */
  const animatedCaRef = useRef(CA_INITIAL);
  const markConversionReached = useCallback(() => setConversionReached(true), []);

  useActivationTracking({
    mark: hasInteracted ? onMark : undefined,
    resultRef,
    ctaRef: conversionRef,
    onCtaVisible: markConversionReached,
  });

  useEffect(() => {
    setDate(new Date().toLocaleDateString("fr-FR"));
  }, []);

  const metier = metiers[metierIdx];
  const nmf = simulateur.gestionFixe;
  const budget = Math.max(0, total - nmf);
  const lsa = metier.lsa ? Math.round((budget * partLsa) / 100) : 0;
  const ads = budget - lsa;
  const match = commune ? zoneForCommune(commune) : zoneForVille(ville);
  const p: Params = {
    geo: match.zone.mult,
    ads,
    lsa,
    nmf,
    conv: conv / 100,
    transfo: transfo / 100,
    panier,
    marge: metier.margeDefaut / 100,
    pop: match.commune?.[1] ?? 47_000,
    variantes,
  };
  const r = compute(metier, p);
  const budgetJour = parJour(budget);
  const cac = r.chantiers ? r.total / r.chantiers : 0;
  const marcheUtile = ads ? Math.max(0, Math.min(100, ((ads - r.adsGaspille) / ads) * 100)) : 0;
  const villeLabel = match.commune ? `${match.commune[0]} (${match.commune[2]})` : ville || "France";
  const currentSnapshot: SimSnapshot = {
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
  };
  const compatibles = metiers.filter((m) => m.lsa).map((m) => m.nom);
  const incompatibles = metiers.filter((m) => !m.lsa).map((m) => m.nom);

  const interacted = useRef(false);
  const touch = () => {
    if (interacted.current) return;
    interacted.current = true;
    setHasInteracted(true);
    onInteract?.();
  };

  const pickMetier = (i: number) => {
    touch();
    setMetierIdx(i);
    setConv(metiers[i].conv);
    setTransfo(metiers[i].transfo);
    setPanier(metiers[i].panier);
  };

  useEffect(() => {
    const target = Math.round(r.ca);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const setCa = (v: number) => {
      animatedCaRef.current = v;
      setAnimatedCa(v);
    };
    let raf = 0;
    const animate = () => {
      const start = performance.now();
      const from = animatedCaRef.current;
      const delta = target - from;
      const duration = 950;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const overshoot = t < 0.82 ? 0 : Math.sin((t - 0.82) * Math.PI * 5) * (1 - t) * 0.025;
        setCa(t >= 1 ? target : Math.round(from + delta * Math.min(1.02, eased + overshoot)));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    /* Chrome coupe requestAnimationFrame dès que l'onglet est caché
       OU simplement recouvert par une autre fenêtre (occlusion Windows).
       Sans ce garde-fou le compteur reste figé pour toujours — même
       revenu au premier plan, l'effet ne se relançait pas. */
    if (reduce || document.hidden) {
      setCa(target);
    } else {
      animate();
    }
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (document.hidden) setCa(target);
      else if (!reduce && animatedCaRef.current !== target) animate();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [r.ca]);

  return (
    <div className={`font-helvetica text-[#071a33] [font-variant-numeric:tabular-nums] ${hasInteracted ? "pb-24 md:pb-0" : ""}`}>
      {/* Ordre mobile (les deux wrappers de colonne sont en `contents`,
          leurs panneaux deviennent des items de la grille) : CA potentiel
          → Réglages → Ticket → Canaux. Sur lg, les wrappers redeviennent
          deux colonnes équilibrées : Ticket + Canaux à gauche, CA
          potentiel + Réglages à droite — items-start évite d'étirer la
          plus courte (vide interne). */}
      <div id="estimation" className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <div className="contents lg:flex lg:flex-col lg:gap-6">
      <section className="order-3 border-2 border-[#071a33] bg-white lg:order-none">
        <div className="flex items-center justify-between border-b-2 border-[#071a33] px-4 py-3 sm:px-5">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
            <ReceiptText className="size-4 text-[#075ad8]" aria-hidden />
            Ticket
          </p>
          <p className="text-xs font-semibold text-[#607089]">
            NMF Agence{date ? ` · ${date}` : ""}
          </p>
        </div>

        <div className="px-4 py-5 sm:px-6 sm:py-6">
          <div className="border-t-2 border-[#071a33] pt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#607089]">
                  <Banknote className="size-4 text-[#075ad8]" aria-hidden />
                  / jour
                </p>
                <p className="mt-1 text-4xl font-black tabular-nums text-[#075ad8] sm:text-5xl">
                  {eur(budgetJour)}/jour
                  <span className="ml-2">
                    <Info text="Budget journalier dépensé pour faire tourner la campagne, une fois la gestion NMF payée." />
                  </span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-black text-[#607089] sm:text-right">
                <MiniStat
                  icon={<Search className="size-4" />}
                  value={`${eur(budget)}/mois`}
                  label="Ads"
                  info="Budget publicitaire mensuel, réparti entre Google Ads et Local Services Ads. La gestion NMF n'est pas dedans."
                />
                <MiniStat
                  icon={<Settings2 className="size-4" />}
                  value={`${eur(nmf)}/mois`}
                  label="NMF"
                  info="Forfait de gestion NMF, fixe : campagnes, annonces, suivi et optimisation. Ne varie pas avec ton budget."
                />
              </div>
            </div>
            <input
              type="range"
              min={nmf + 300}
              max={4000}
              step={50}
              value={total}
              onChange={(e) => {
                touch();
                setTotal(+e.target.value);
              }}
              aria-label="Budget publicité / jour"
              className="mt-5 h-1 w-full cursor-pointer appearance-none bg-[#c9d5e6] accent-[#075ad8]"
            />
            <p className="mt-2 text-xs font-semibold text-[#607089]">{match.raison}</p>
            {metier.estimated && (
              <p className="mt-2 text-xs font-semibold text-[#607089]">{simulateur.estimatedNote}</p>
            )}
            {!metier.lsa && (
              <p className="mt-2 text-xs font-semibold text-[#607089]">{simulateur.lsaNote}</p>
            )}
          </div>
        </div>

        <div className="grid border-t-2 border-[#071a33] sm:grid-cols-3">
          <Metric
            icon={<CircleDollarSign />}
            label="CA"
            value={eur(animatedCa)}
            note="signé / mois"
            info="Chiffre d'affaires estimé des chantiers signés dans le mois : leads × taux de transformation × panier moyen de ton métier."
          />
          <Metric
            icon={<Gauge />}
            label="Marché"
            value={`${dec(marcheUtile)} %`}
            note={r.sature ? `${eur(r.adsGaspille)} saturés` : "absorbable"}
            info="Part de ton budget que les recherches Google de ta zone peuvent vraiment absorber. En dessous de 100 %, le surplus ne trouve plus de recherches à acheter — il est dépensé pour rien."
          />
          <Metric
            icon={<Hammer />}
            label="Chantier"
            value={r.chantiers ? eur(cac) : "0 €"}
            note={`${dec(r.chantiers)} / mois`}
            info="Ce qu'un chantier signé te coûte : le coût mensuel total (pub + gestion) divisé par le nombre de chantiers du mois."
            last
          />
        </div>
      </section>

        <Panel icon={<ChartNoAxesColumnIncreasing className="size-4" />} title="Canaux" className="order-4 lg:order-none">
          <IconRow icon={<Search className="size-4" />} label="Google Ads" value={`${eur(ads)} / mois`} />
          <IconRow icon={<ShieldCheck className="size-4" />} label="Local Services" value={metier.lsa ? `${eur(lsa)} / mois` : "non actif"} />
          <IconRow icon={<Settings2 className="size-4" />} label="Gestion" value={`${eur(nmf)} / mois`} />
        </Panel>
      </div>

      <aside className="contents lg:flex lg:flex-col lg:gap-6">
        {/* Pas d'overflow-hidden : les infobulles des DarkStat doivent
            pouvoir déborder du panneau (le seul décor absolu est une
            ligne inset, rien ne dépasse). */}
        <div ref={resultRef} className="relative order-1 border-2 border-[#071a33] bg-[#071a33] p-5 text-white sm:p-6 lg:order-none">
          <div className="pointer-events-none absolute inset-x-5 top-20 h-px bg-white/15" />
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/60">
            <Target className="size-4 text-white" aria-hidden />
            CA potentiel
          </p>
          <div className="mt-5 flex items-start gap-3">
            <div className="grid size-12 shrink-0 place-items-center border border-white/25 bg-white/10">
              <ChartNoAxesColumnIncreasing className="size-7 animate-[ticket-rise_950ms_cubic-bezier(0.16,1,0.3,1)_both] text-white" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-[clamp(3.4rem,9vw,6.6rem)] font-black leading-[0.88] tracking-tight tabular-nums text-white">
                {eur(animatedCa)}
                <span className="ml-2 inline-block text-base">
                  <Info
                    dark
                    text="Chiffre d'affaires estimé que ces chantiers génèrent chaque mois. Calibré sur les moyennes nationales de ton métier — un ordre de grandeur pour décider, pas une promesse."
                  />
                </span>
              </p>
              <p className="mt-3 text-sm font-bold leading-relaxed text-white/75">
                chantiers signés / mois · {metier.nom} à {villeLabel}
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2">
            <DarkStat
              icon={<PhoneCall />}
              value={dec(r.leads)}
              label="leads"
              info="Contacts entrants estimés par mois (appels, formulaires) via Google Ads et Local Services Ads."
            />
            <DarkStat
              icon={<Hammer />}
              value={dec(r.chantiers)}
              label="chantiers"
              info="Chantiers signés estimés : les leads multipliés par ton taux de transformation (réglable plus bas)."
            />
            <DarkStat
              icon={<CircleDollarSign />}
              value={r.chantiers ? eur(cac) : "0 €"}
              label="/ chantier"
              info="Ce qu'un chantier signé te coûte : coût mensuel total (pub + gestion) divisé par les chantiers du mois."
            />
          </div>
        </div>

        <Panel icon={<Settings2 className="size-4" />} title="Réglages" className="order-2 lg:order-none">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <FieldShell icon={<BriefcaseBusiness className="size-4" />} label="Métier">
              <div className="relative">
                <select
                  value={metierIdx}
                  onChange={(e) => pickMetier(+e.target.value)}
                  aria-label="Métier"
                  className="h-12 w-full appearance-none border-0 bg-[#eef5ff] px-3 pr-10 text-xl font-black text-[#075ad8] outline-none"
                >
                  {metiers.map((m, i) => (
                    <option key={m.nom} value={i}>
                      {m.nom.toLowerCase()}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-[#075ad8]" aria-hidden />
              </div>
            </FieldShell>

            <FieldShell icon={<MapPin className="size-4" />} label="Ville">
              <VilleField
                ville={ville}
                onPick={(v, c) => {
                  touch();
                  setVille(v);
                  setCommune(c ?? null);
                }}
              />
            </FieldShell>
          </div>
        </Panel>

      </aside>
      </div>

      <div ref={conversionRef} className="mt-5 scroll-mt-6 print:hidden">
        {(onContinue || ctaHref) && (
          <>
            <button
              type="button"
              onClick={() => {
                onMark?.("cta_clicked");
                if (onContinue) {
                  onContinue(currentSnapshot);
                  return;
                }
                if (ctaHref) window.location.assign(ctaHref);
              }}
              className="flex min-h-16 w-full items-center justify-center gap-3 bg-[#075ad8] px-6 py-5 text-xl font-black text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#075ad8] sm:text-2xl"
            >
              <span>{ctaLabel ?? simulateur.cta}</span>
              <span aria-hidden>→</span>
            </button>
            <p className="mt-2.5 text-center text-xs font-black uppercase tracking-[0.12em] text-[#607089]">
              {simulateur.ctaReassurance}
            </p>
            <p className="mt-4">
              <ExportPdf asLink />
            </p>
            <div ref={estimateRef} className="mt-6 scroll-mt-24">
              <EmailEtude
                snapshot={{
                  metier: metier.nom,
                  ville: match.commune?.[0] ?? ville.trim(),
                  budget: total,
                  net: Math.round(r.marge - r.total),
                  roi: +r.roi.toFixed(1),
                  ca: Math.round(r.ca),
                  chantiers: +r.chantiers.toFixed(1),
                }}
                onCapture={onEstimateRequested
                  ? (email, snapshot) => onEstimateRequested(email, currentSnapshot, snapshot)
                  : undefined}
              />
            </div>
          </>
        )}
        {!onContinue && !ctaHref && <ExportPdf />}
      </div>

      {hasInteracted && !conversionReached && onContinue && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d8e3f2] bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:hidden print:hidden">
          <button
            type="button"
            onClick={() => {
              onMark?.("cta_clicked");
              estimateRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="flex min-h-12 w-full items-center justify-center gap-2 bg-[#075ad8] px-4 text-base font-black text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#075ad8]"
          >
            Recevoir mon estimation gratuite
            <span aria-hidden>→</span>
          </button>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-px print:hidden">
        <Fold title={simulateur.phrase.detail}>
          <DetailRows
            r={r}
            metier={metier}
            ads={ads}
            lsa={lsa}
            compatibles={compatibles}
            incompatibles={incompatibles}
          />
        </Fold>

        <Fold title={simulateur.phrase.affiner}>
          <p className="mb-5 text-[11px] text-[#607089]">{simulateur.phrase.affinerAide}</p>
          <div className="grid gap-5 sm:grid-cols-2">
            {metier.lsa && (
              <Slider
                label="Part Local Services Ads"
                value={partLsa}
                display={`${partLsa} % · ${eur(lsa)}`}
                min={0}
                max={100}
                step={5}
                onChange={(v) => {
                  touch();
                  setPartLsa(v);
                }}
              />
            )}
            <Slider label="Variantes recherches" value={variantes} display={`x${dec(variantes)}`} min={1} max={8} step={0.5} onChange={(v) => { touch(); setVariantes(v); }} />
            <Slider label="Conversion site" value={conv} display={`${dec(conv)} %`} min={2} max={20} step={0.1} onChange={(v) => { touch(); setConv(v); }} />
            <Slider label="Lead vers chantier" value={transfo} display={`${transfo} %`} min={10} max={70} step={5} onChange={(v) => { touch(); setTransfo(v); }} />
            <Slider label="Panier moyen" value={panier} display={eur(panier)} min={100} max={8000} step={100} onChange={(v) => { touch(); setPanier(v); }} />
            <div className="border-2 border-[#071a33] bg-white px-3 py-2.5">
              <Row label="Gestion NMF" value={`${eur(nmf)} / mois`} />
              <p className="mt-1 text-[11px] text-[#607089]">{simulateur.params.gestionHint}</p>
            </div>
          </div>
        </Fold>

        <Fold title={simulateur.phrase.comparatif}>
          <Comparatif metiers={metiers} current={metierIdx} params={p} total={r.total} />
        </Fold>

        <Fold title={simulateur.hypothese.titre}>
          <p className="text-[11px] leading-relaxed text-[#607089]">
            {simulateur.hypothese.texte}
          </p>
          <ul className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {simulateur.hypothese.variables.map((v) => (
              <li key={v} className="flex gap-1.5 text-[11px] leading-snug text-[#607089]">
                <span aria-hidden className="text-[#075ad8]">-</span>
                <span>{v}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-[#d8e0ec] pt-3 text-[10px] leading-relaxed text-[#607089]">
            {simulateur.footnote}
          </p>
        </Fold>
      </div>
    </div>
  );
}

function FieldShell({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#607089]">
        <span className="text-[#075ad8]" aria-hidden>{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}

function VilleField({
  ville,
  onPick,
}: {
  ville: string;
  onPick: (v: string, c?: Commune) => void;
}) {
  const [hi, setHi] = useState(0);
  const [open, setOpen] = useState(false);
  const [distant, setDistant] = useState<Commune[]>([]);
  const box = useRef<HTMLSpanElement>(null);
  const hasQuery = ville.trim().length >= 2;
  const local = useMemo(() => (hasQuery ? suggestCommunes(ville) : []), [ville, hasQuery]);
  const sugg = distant.length ? distant : local;

  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  useEffect(() => {
    if (!hasQuery) {
      setDistant([]);
      return;
    }
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/communes?q=${encodeURIComponent(ville)}`, {
          signal: ctrl.signal,
        });
        const json = await res.json();
        setDistant(json.communes ?? []);
      } catch {}
    }, 120);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [ville, hasQuery]);

  const choose = (c: Commune) => {
    onPick(c[0], c);
    setDistant([]);
    setOpen(false);
  };

  return (
    <span ref={box} className="relative inline-block max-w-full">
      <input
        value={ville}
        onChange={(e) => {
          onPick(e.target.value);
          setOpen(true);
          setHi(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!sugg.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHi((i) => (i + 1) % sugg.length);
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setHi((i) => (i - 1 + sugg.length) % sugg.length);
          }
          if (e.key === "Enter") {
            e.preventDefault();
            choose(sugg[hi]);
          }
        }}
        aria-label="Ta ville"
        autoComplete="off"
        className="h-14 w-full border-0 bg-[#eef5ff] px-3 text-2xl font-black text-[#075ad8] outline-none sm:text-3xl"
      />
      {open && hasQuery && sugg.length > 0 && (
        <ul className="absolute left-0 top-full z-30 mt-1 w-[min(24rem,calc(100vw-3rem))] border-2 border-[#071a33] bg-white text-base shadow-[0_16px_30px_rgb(7_26_51/0.16)]">
          {sugg.map((c, i) => (
            <li key={c[0] + c[2]}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(c);
                }}
                onMouseEnter={() => setHi(i)}
                className={`flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left ${
                  i === hi ? "bg-[#075ad8] text-white" : "text-[#071a33]"
                }`}
              >
                <span className="min-w-0 flex-1 truncate">
                  {c[0]} ({c[2]})
                </span>
                <span className="shrink-0 text-xs opacity-70">
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

/* Petit « i » en exposant à droite d'un chiffre : l'explication vit au
   survol (desktop) ET au tap (mobile — pas de hover en webview Insta).
   La bulle reste proche de l'icône, mais sa position horizontale est
   clampée au viewport : près du bord, elle se décale au lieu de dépasser. */
function Info({
  text,
  dark = false,
}: {
  text: string;
  dark?: boolean;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState({ left: 16, top: 0, width: 240 });

  useEffect(() => {
    if (!open) return;

    const place = () => {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const margin = 16;
      const width = Math.min(240, window.innerWidth - margin * 2);
      const centered = rect.left + rect.width / 2 - width / 2;
      const left = Math.max(margin, Math.min(centered, window.innerWidth - width - margin));
      setPos({ left, top: rect.bottom + 6, width });
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  return (
    <span
      className="relative inline-block align-super"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label="Plus d'infos"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        className={`grid size-4 cursor-help place-items-center rounded-full border text-[9px] font-black leading-none transition-colors ${
          dark
            ? "border-white/40 text-white/70 hover:border-white hover:text-white"
            : "border-[#9db1cc] text-[#607089] hover:border-[#075ad8] hover:text-[#075ad8]"
        }`}
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          className="fixed z-50 block border-2 border-[#071a33] bg-white p-3 text-left text-[11px] font-semibold normal-case leading-relaxed tracking-normal text-[#071a33] shadow-[4px_4px_0_#071a33]"
          style={{ left: pos.left, top: pos.top, width: pos.width }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

function MiniStat({
  icon,
  value,
  label,
  info,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  info?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-none bg-[#eef5ff] px-2 py-1.5">
      <span className="text-[#075ad8]" aria-hidden>{icon}</span>
      <span>
        <span className="block text-[#071a33]">
          {value}
          {info && (
            <span className="ml-1"><Info text={info} align="right" /></span>
          )}
        </span>
        <span className="block text-[10px] uppercase tracking-[0.12em]">{label}</span>
      </span>
    </div>
  );
}

function DarkStat({
  icon,
  value,
  label,
  info,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  info?: string;
}) {
  return (
    <div className="min-w-0 border border-white/20 p-2">
      <span className="text-white/70" aria-hidden>{icon}</span>
      <p className="mt-2 flex items-baseline gap-1 text-sm font-black tabular-nums">
        <span className="truncate">{value}</span>
        {info && <Info text={info} dark />}
      </p>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">{label}</p>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  note,
  info,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  info?: string;
  last?: boolean;
}) {
  return (
    <div className={`px-4 py-4 sm:px-5 sm:py-5 ${last ? "" : "border-b-2 border-[#071a33] sm:border-b-0 sm:border-r-2"}`}>
      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#607089]">
        <span className="text-[#075ad8]" aria-hidden>{icon}</span>
        <span className="flex-1">{label}</span>
        {info && <Info text={info} align={last ? "right" : "left"} />}
      </p>
      <p className="mt-2 text-2xl font-black tabular-nums text-[#075ad8] sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-semibold text-[#607089]">{note}</p>
    </div>
  );
}

function Panel({
  icon,
  title,
  children,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-2 border-[#071a33] bg-white p-5 ${className}`}>
      <p className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#607089]">
        <span className="text-[#075ad8]" aria-hidden>{icon}</span>
        {title}
      </p>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function Fold({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="border-2 border-[#071a33] bg-white [&[open]]:bg-[#f7f9fc]">
      <summary className="cursor-pointer select-none px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#071a33] marker:text-[#075ad8]">
        {title}
      </summary>
      <div className="border-t-2 border-[#071a33] px-5 py-4">{children}</div>
    </details>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[#d8e0ec] pb-2 text-sm">
      <span className="font-semibold text-[#607089]">{label}</span>
      <span className="font-black text-[#071a33]">{value}</span>
    </div>
  );
}

function IconRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#d8e0ec] pb-2 text-sm">
      <span className="flex min-w-0 items-center gap-2 font-semibold text-[#607089]">
        <span className="shrink-0 text-[#075ad8]" aria-hidden>{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 font-black text-[#071a33]">{value}</span>
    </div>
  );
}

function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
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
        <span className="text-xs font-black text-[#071a33]">{label}</span>
        <output className="text-xs font-black tabular-nums text-[#075ad8]">{display}</output>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        aria-label={label}
        className="mt-2 h-1 w-full cursor-pointer appearance-none bg-[#c9d5e6] accent-[#075ad8]"
      />
    </div>
  );
}

function List({
  title,
  items,
  active,
}: {
  title: string;
  items: string[];
  active: boolean;
}) {
  return (
    <div className={active ? "bg-[#e8f1ff] p-3" : "bg-[#f4f6fa] p-3"}>
      <p className="text-xs font-black text-[#071a33]">{title}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li key={item} className="bg-white px-2 py-1 text-[11px] font-bold text-[#40506a]">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DetailRows({
  r,
  metier,
  ads,
  lsa,
  compatibles,
  incompatibles,
}: {
  r: ReturnType<typeof compute>;
  metier: Metier;
  ads: number;
  lsa: number;
  compatibles: string[];
  incompatibles: string[];
}) {
  return (
    <div>
      <div className="grid gap-x-10 sm:grid-cols-2">
        <div>
          <p className="mb-1 border-b border-[#d8e0ec] pb-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#607089]">
            Google Ads
          </p>
          <Row label="Bassin de vie estimé" value={`${r.bassin.toLocaleString("fr-FR")} hab.`} />
          <Row label="Recherches / mois" value={r.recherchesMotPrincipal.toFixed(0)} />
          <Row label="Marché élargi" value={r.recherches.toFixed(0)} />
          <Row label="Clics disponibles" value={r.clicsDispo.toFixed(0)} />
          <Row label="CPC ajusté zone" value={`${dec(r.cpc)} €`} />
          <Row label="Clics / mois" value={r.clics.toFixed(0)} />
          <Row label="Leads / mois" value={dec(r.leadsAds)} />
          <Row label="Coût / lead" value={r.leadsAds ? eur(ads / r.leadsAds) : "-"} />
        </div>
        <div>
          <p className="mb-1 border-b border-[#d8e0ec] pb-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#607089]">
            Local Services Ads
          </p>
          <Row label="Coût / appel" value={`${metier.cpa} €`} />
          <Row label="Leads payés au contact" value={dec(r.leadsLsa)} />
          <Row label="Coût / lead" value={r.leadsLsa ? eur(lsa / r.leadsLsa) : "-"} />
          <Row label="Coût / chantier" value={r.chantiers ? eur(r.total / r.chantiers) : "-"} />
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <List title="Compatibles en France" items={compatibles} active={metier.lsa} />
        <List title="Non compatibles confirmés" items={incompatibles} active={!metier.lsa} />
      </div>
    </div>
  );
}

function Comparatif({
  metiers,
  current,
  params,
}: {
  metiers: readonly Metier[];
  current: number;
  params: Params;
  total: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm tabular-nums">
        <thead>
          <tr>
            {simulateur.comparatif.cols.map((c, i) => (
              <th
                key={c}
                className={`whitespace-nowrap border-b border-[#d8e0ec] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#607089] ${i === 0 ? "text-left" : "text-right"}`}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metiers.map((m, i) => {
            const rr = compute(m, {
              ...params,
              lsa: m.lsa ? params.lsa : 0,
              ads: m.lsa ? params.ads : params.ads + params.lsa,
              panier: m.panier,
              transfo: m.transfo / 100,
              conv: m.conv / 100,
              marge: m.margeDefaut / 100,
            });
            const on = i === current;
            return (
              <tr key={m.nom}>
                <td className={`whitespace-nowrap border-b border-[#d8e0ec] px-3 py-2 text-left ${on ? "font-black text-[#075ad8]" : ""}`}>
                  {m.nom}
                  {m.estimated && <span title={simulateur.estimatedNote}> *</span>}
                </td>
                {[
                  `${dec(m.cpc * params.geo)} €`,
                  `${dec(m.conv)} %`,
                  rr.leads.toFixed(0),
                  dec(rr.chantiers),
                  eur(rr.ca),
                  rr.chantiers ? eur(rr.total / rr.chantiers) : "-",
                ].map((v, j) => (
                  <td key={j} className={`whitespace-nowrap border-b border-[#d8e0ec] px-3 py-2 text-right ${j === 5 ? "font-black" : ""}`}>
                    {v}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="px-3 py-2 text-[10px] text-[#607089]">* {simulateur.estimatedNote}</p>
    </div>
  );
}

function ExportPdf({ asLink = false }: { asLink?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={
        asLink
          ? "mx-auto inline-flex items-center justify-center gap-2 text-xs font-black text-[#607089] underline underline-offset-4 transition-colors hover:text-[#071a33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#075ad8]"
          : "inline-flex h-11 w-full items-center justify-center gap-2 border-2 border-[#071a33] bg-white px-6 text-sm font-black text-[#071a33] transition-colors hover:bg-[#e8f1ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#075ad8]"
      }
    >
      <Download className="size-4" aria-hidden />
      {simulateur.exportPdf}
    </button>
  );
}
