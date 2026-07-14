"use client";

import { useCallback, useState, type ReactNode } from "react";
import { site } from "@/config/site";
import { AuditForm } from "@/components/form/AuditForm";
import {
  SimulateurRoi,
  type SimSnapshot,
} from "@/components/simulateur/SimulateurRoi";
import { fbTrack } from "@/lib/fpixel";

const eur = (v: number) =>
  v.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";

/**
 * Parcours ads sur UNE route : simulateur → formulaire.
 *
 * Une seule route = un seul arbre React = un seul état. C'est ce qui
 * permet de passer les réponses du simulateur au form sans session à
 * synchroniser (deux routes = deux montages = deux `session_id`, donc
 * deux lignes Supabase sans lien).
 *
 * `before` / `after` sont rendus côté serveur et passés en ReactNode :
 * le hero et les preuves restent des composants serveur.
 */
export function AcquisitionLp({
  before,
  after,
}: {
  before?: ReactNode;
  after?: ReactNode;
}) {
  const [snap, setSnap] = useState<SimSnapshot | null>(null);

  const start = useCallback((s: SimSnapshot) => {
    setSnap(s);
    /* Intention réelle, pas une vue de page : Meta peut optimiser dessus. */
    fbTrack("InitiateCheckout", {
      content_name: s.metier,
      value: Math.round(s.ca),
      currency: "EUR",
    });
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  if (!snap) {
    return (
      <>
        {before}
        <section id="simulateur" className="px-5 pb-20 sm:px-8 sm:pb-28">
          <div className="mx-auto max-w-6xl">
            <SimulateurRoi onContinue={start} ctaLabel={site.lp.cta} />
          </div>
        </section>
        {after}
      </>
    );
  }

  /* Ce que le simulateur a appris = des réponses du form, pas juste de
     l'UI. Les colonnes simulateur (migration 0004) sont en prod depuis
     le 2026-07-14 : le snapshot part en entier avec le lead. */
  const known = {
    activite: snap.metier,
    ville: snap.ville,
    investir_financierement: snap.budget > 0,
    budget_ads: snap.ads,
    budget_lsa: snap.lsa,
    sim_panier: snap.panier,
    sim_transfo: snap.transfo,
    sim_ca_estime: Math.round(snap.ca),
  };

  return (
    <AuditForm
      known={known}
      recap={{
        title: [snap.metier, snap.ville || snap.zoneLabel, `${eur(snap.budget)}/mois`]
          .filter(Boolean)
          .join(" · "),
        detail: `≈ ${snap.chantiers.toFixed(1).replace(".", ",")} chantiers/mois · ${eur(snap.ca)} de CA estimé`,
        onEdit: () => setSnap(null),
      }}
    />
  );
}
