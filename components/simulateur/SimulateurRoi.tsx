"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { simulateur, type Metier } from "@/config/simulateur";

const EASE = [0.16, 1, 0.3, 1] as const;

const eur = (v: number) =>
  v.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";

type Params = {
  geo: number;
  ads: number;
  lsa: number;
  nmf: number;
  conv: number; // fraction
  transfo: number; // fraction
  panier: number;
};

function compute(m: Metier, p: Params) {
  const cpc = m.cpc * p.geo;
  const clics = p.ads / cpc;
  const leadsAds = clics * p.conv;
  const leadsLsa = p.lsa > 0 ? p.lsa / m.cpa : 0;
  const leads = leadsAds + leadsLsa;
  const chantiers = leads * p.transfo;
  const ca = chantiers * p.panier;
  const total = p.ads + p.lsa + p.nmf;
  return {
    cpc,
    clics,
    leadsAds,
    leadsLsa,
    leads,
    chantiers,
    ca,
    total,
    roi: total ? ca / total : 0,
  };
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
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-widest text-muted">
          {label}
        </span>
        <output className="text-sm font-bold tabular-nums text-ink">
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
        className="w-full accent-primary"
      />
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-sm tabular-nums">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

export function SimulateurRoi() {
  const reduce = useReducedMotion();
  const s = simulateur;

  const [metierIdx, setMetierIdx] = useState(0);
  const [zoneIdx, setZoneIdx] = useState<number>(s.defaultZone);
  const [ads, setAds] = useState(300);
  const [lsa, setLsa] = useState(300);
  const nmf = s.gestionFixe;
  const [conv, setConv] = useState(15);
  const [transfo, setTransfo] = useState(s.metiers[0].transfo);
  const [panier, setPanier] = useState(s.metiers[0].panier);

  const metier = s.metiers[metierIdx];
  const p: Params = {
    geo: s.zones[zoneIdx].mult,
    ads,
    lsa,
    nmf,
    conv: conv / 100,
    transfo: transfo / 100,
    panier,
  };
  const r = compute(metier, p);

  /* Changer de métier recharge ses moyennes (panier + transformation). */
  const pickMetier = (i: number) => {
    setMetierIdx(i);
    setTransfo(s.metiers[i].transfo);
    setPanier(s.metiers[i].panier);
  };

  const roiTxt = r.roi.toFixed(1).replace(".", ",");
  const verdict =
    r.roi >= 5
      ? s.verdicts.high(eur(r.total), eur(r.ca), roiTxt)
      : r.roi >= 2
        ? s.verdicts.mid(roiTxt)
        : s.verdicts.low(roiTxt);
  const verdictTone = r.roi >= 2 ? "text-primary" : "text-accent";

  const selectCls =
    "w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary";

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
      {/* ── Paramètres ── */}
      <motion.section
        initial={{ opacity: 0, y: reduce ? 0 : 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="rounded-2xl border border-border bg-surface"
      >
        <h2 className="border-b border-border px-6 py-4 font-display text-lg font-medium text-ink">
          {s.params.heading}
        </h2>
        <div className="flex flex-col gap-5 p-6">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-muted">
              {s.params.metier}
            </span>
            <select
              value={metierIdx}
              onChange={(e) => pickMetier(+e.target.value)}
              className={selectCls}
            >
              {s.metiers.map((m, i) => (
                <option key={m.nom} value={i}>
                  {m.nom}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-muted">
              {s.params.zone}
            </span>
            <select
              value={zoneIdx}
              onChange={(e) => setZoneIdx(+e.target.value)}
              className={selectCls}
            >
              {s.zones.map((z, i) => (
                <option key={z.label} value={i}>
                  {z.label}
                </option>
              ))}
            </select>
          </label>

          <Slider
            label={s.params.ads}
            hint={s.params.adsHint}
            value={ads}
            display={eur(ads)}
            min={300}
            max={1500}
            step={50}
            onChange={setAds}
          />
          <Slider
            label={s.params.lsa}
            hint={s.params.lsaHint}
            value={lsa}
            display={eur(lsa)}
            min={0}
            max={1500}
            step={50}
            onChange={setLsa}
          />
          <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-bg px-3 py-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-muted">
                {s.params.gestion}
              </span>
              <span className="text-sm font-bold tabular-nums text-ink">
                {eur(nmf)}
              </span>
            </div>
            <p className="text-xs text-muted">{s.params.gestionHint}</p>
          </div>
          <Slider
            label={s.params.conv}
            hint={s.params.convHint}
            value={conv}
            display={`${conv} %`}
            min={5}
            max={30}
            step={1}
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
        </div>
      </motion.section>

      {/* ── Résultats ── */}
      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
        className="flex flex-col gap-5"
      >
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {(
            [
              [s.kpis.leads, r.leads.toFixed(0), false],
              [s.kpis.chantiers, r.chantiers.toFixed(1).replace(".", ","), false],
              [s.kpis.ca, eur(r.ca), false],
              [s.kpis.roi, `×${roiTxt}`, true],
            ] as const
          ).map(([lab, val, hot]) => (
            <div
              key={lab}
              className={
                hot
                  ? "rounded-2xl bg-primary p-5 text-white shadow-[0_8px_30px_-8px_oklch(0.67_0.15_64/0.6)]"
                  : "rounded-2xl border border-border bg-surface p-5"
              }
            >
              <p
                className={`text-[11px] font-bold uppercase tracking-widest ${hot ? "text-white/75" : "text-muted"}`}
              >
                {lab}
              </p>
              <p
                className={`mt-1 font-display text-2xl font-semibold tabular-nums sm:text-3xl ${hot ? "text-white" : "text-ink"}`}
              >
                {val}
              </p>
            </div>
          ))}
        </div>

        <section className="rounded-2xl border border-border bg-surface">
          <h2 className="border-b border-border px-6 py-4 font-display text-lg font-medium text-ink">
            {s.detail.heading}
          </h2>
          <div className="flex flex-col gap-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-bg p-4">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">
                  {s.detail.ads}
                </h3>
                <DetailLine label={s.detail.cpc} value={`${r.cpc.toFixed(2).replace(".", ",")} €`} />
                <DetailLine label={s.detail.clics} value={r.clics.toFixed(0)} />
                <DetailLine label={s.detail.leads} value={r.leadsAds.toFixed(1).replace(".", ",")} />
                <DetailLine label={s.detail.cpl} value={r.leadsAds ? eur(ads / r.leadsAds) : "—"} />
              </div>
              <div className="rounded-xl border border-border bg-bg p-4">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">
                  {s.detail.lsa}
                </h3>
                <DetailLine label={s.detail.cpa} value={`${metier.cpa} €`} />
                <DetailLine label={s.detail.leadsLsa} value={r.leadsLsa.toFixed(1).replace(".", ",")} />
                <DetailLine label={s.detail.cpl} value={r.leadsLsa ? eur(lsa / r.leadsLsa) : "—"} />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-bg p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">
                {s.detail.facture}
              </h3>
              <DetailLine label={s.detail.media} value={eur(ads + lsa)} />
              <DetailLine label={s.detail.gestion} value={eur(nmf)} />
              <DetailLine label={s.detail.total} value={eur(r.total)} />
              <DetailLine
                label={s.detail.cac}
                value={r.chantiers ? eur(r.total / r.chantiers) : "—"}
              />
            </div>
            <p className={`border-l-4 border-primary pl-4 text-sm leading-relaxed ${verdictTone}`}>
              {verdict}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface">
          <h2 className="border-b border-border px-6 py-4 font-display text-lg font-medium text-ink">
            {s.comparatif.heading}{" "}
            <span className="text-xs font-normal text-muted">({s.comparatif.hint})</span>
          </h2>
          <div className="overflow-x-auto p-6 pt-3">
            <table className="w-full border-collapse tabular-nums">
              <thead>
                <tr>
                  {s.comparatif.cols.map((c, i) => (
                    <th
                      key={c}
                      className={`border-b border-border px-2.5 py-2 text-[11px] font-bold uppercase tracking-widest text-muted ${i === 0 ? "text-left" : "text-right"}`}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.metiers.map((m, i) => {
                  const rr = compute(m, {
                    ...p,
                    panier: m.panier,
                    transfo: m.transfo / 100,
                  });
                  const current = i === metierIdx;
                  return (
                    <tr key={m.nom} className={current ? "bg-primary/10" : undefined}>
                      <td
                        className={`whitespace-nowrap border-b border-border px-2.5 py-2 text-left text-sm ${current ? "font-bold text-primary" : "text-ink"}`}
                      >
                        {m.nom}
                      </td>
                      <td className="whitespace-nowrap border-b border-border px-2.5 py-2 text-right text-sm text-ink">
                        {(m.cpc * p.geo).toFixed(2).replace(".", ",")} €
                      </td>
                      <td className="whitespace-nowrap border-b border-border px-2.5 py-2 text-right text-sm text-ink">
                        {rr.leads.toFixed(0)}
                      </td>
                      <td className="whitespace-nowrap border-b border-border px-2.5 py-2 text-right text-sm text-ink">
                        {rr.chantiers.toFixed(1).replace(".", ",")}
                      </td>
                      <td className="whitespace-nowrap border-b border-border px-2.5 py-2 text-right text-sm text-ink">
                        {eur(m.panier)}
                      </td>
                      <td className="whitespace-nowrap border-b border-border px-2.5 py-2 text-right text-sm text-ink">
                        {eur(rr.ca)}
                      </td>
                      <td className="whitespace-nowrap border-b border-border px-2.5 py-2 text-right text-sm font-bold text-ink">
                        ×{rr.roi.toFixed(1).replace(".", ",")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-center text-xs leading-relaxed text-muted">{s.footnote}</p>
      </motion.div>
    </div>
  );
}
