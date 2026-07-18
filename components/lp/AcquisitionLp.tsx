"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { site } from "@/config/site";
import { simulateur } from "@/config/simulateur";
import {
  AuditForm,
  DRAFT_KEY,
  DRAFT_TTL_MS,
  SNAP_KEY,
} from "@/components/form/AuditForm";
import {
  SimulateurTicket,
  type SimSnapshot,
} from "@/components/simulateur/SimulateurTicket";
import { fbTrack } from "@/lib/fpixel";
import { useAuditSession } from "@/hooks/useAuditSession";

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
  /* La session s'ouvre ICI, à l'arrivée sur la LP — pas dans AuditForm
     (2026-07-17). Le hook y était appelé, or AuditForm n'est monté
     qu'après le clic CTA : `visit` mesurait donc l'ouverture du
     formulaire, et 606 visites Meta ne produisaient qu'1 ligne en base.
     On était aveugle sur exactement l'endroit où le trafic se perd —
     entre l'arrivée et le CTA. La session est passée à AuditForm pour
     que le même `session_id` porte visit → progress → submit. */
  const session = useAuditSession();
  const [snap, setSnap] = useState<SimSnapshot | null>(null);

  /* ViewContent à l'arrivée sur le simulateur : donne à Meta un signal
     d'intention en HAUT du funnel (avant InitiateCheckout), exploitable
     en optimisation comme en retargeting. Dédup par session, flag posé
     UNIQUEMENT si l'event est parti (le pixel peut ne pas être encore
     chargé — motif TrackLead, bug du 2026-07-13). */
  useEffect(() => {
    try {
      if (sessionStorage.getItem("nmf_vc_fired")) return;
      if (fbTrack("ViewContent", { content_name: "simulateur-roi" })) {
        sessionStorage.setItem("nmf_vc_fired", "1");
      }
    } catch {
      /* sessionStorage indisponible → on tente l'event sans dédup */
      fbTrack("ViewContent", { content_name: "simulateur-roi" });
    }
  }, []);

  /* Bouton retour = revenir au simulateur, pas quitter le site. Chaque
     passage au form pousse une entrée d'historique ; popstate ré-affiche
     le simulateur (les réponses du form survivent : brouillon continu). */
  useEffect(() => {
    const onPop = () => setSnap(null);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /* Reprise de session : si le visiteur avait quitté EN PLEIN form (un
     snap ET un brouillon de réponses existent), on le remet directement
     sur le form — AuditForm réhydrate ses réponses tout seul. Un snap
     sans brouillon (form jamais commencé) ne suffit pas : il repasse par
     le simulateur, comportement actuel. Lecture après mount uniquement,
     lire localStorage pendant le rendu casserait l'hydratation SSR. */
  useEffect(() => {
    try {
      const rawSnap = localStorage.getItem(SNAP_KEY);
      const rawDraft = localStorage.getItem(DRAFT_KEY);
      if (!rawSnap || !rawDraft) return;
      const stored = JSON.parse(rawSnap) as { ts?: number; snap?: SimSnapshot };
      const draft = JSON.parse(rawDraft) as { ts?: number };
      const fresh = (ts?: number) =>
        typeof ts === "number" && Date.now() - ts < DRAFT_TTL_MS;
      if (fresh(stored.ts) && fresh(draft.ts) && stored.snap) {
        /* setSnap direct, sans repasser par start() : un simple retour
           d'onglet ne doit pas re-déclencher InitiateCheckout. L'entrée
           d'historique, elle, est bien poussée — sinon le bouton retour
           d'une session reprise sortirait du site. */
        setSnap(stored.snap);
        window.history.pushState({ nmf: "form" }, "");
      }
    } catch {
      /* localStorage indisponible → parcours normal, jamais bloquant */
    }
  }, []);

  const start = useCallback((s: SimSnapshot) => {
    setSnap(s);
    window.history.pushState({ nmf: "form" }, "");
    /* Snapshot persisté pour la reprise de session : si l'onglet se ferme
       en plein form, le prochain passage ré-affiche directement le form.
       AuditForm purge cette clé (avec son brouillon) au submit réussi. */
    try {
      localStorage.setItem(SNAP_KEY, JSON.stringify({ ts: Date.now(), snap: s }));
    } catch {
      /* silencieux */
    }
    /* Intention réelle, pas une vue de page : Meta peut optimiser dessus.
       Les custom_data alimentent des audiences de relance « au chiffre
       près » : des ads de retargeting qui affichent le chiffre personnel
       du prospect (son net mensuel, son ROI, sa ville), pas un slogan
       générique. */
    fbTrack("InitiateCheckout", {
      content_name: `${s.metier} · ${s.ville}`,
      value: Math.round(s.ca),
      currency: "EUR",
      /* Net en poche = budget total (gestion comprise) × (ROI − 1) —
         `snap.budget` est le budget pub SANS le forfait de gestion. */
      net_mensuel: Math.round((s.budget + simulateur.gestionFixe) * (s.roi - 1)),
      roi: +s.roi.toFixed(1),
      budget_total: s.budget + simulateur.gestionFixe,
      ville: s.ville,
      metier: s.metier,
    });
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  if (!snap) {
    return (
      <>
        {before}
        <section id="simulateur" className="px-5 pb-20 sm:px-8 sm:pb-28">
          <div className="mx-auto max-w-6xl">
            <SimulateurTicket
              onContinue={start}
              onInteract={() => session.mark("sim_used")}
              ctaLabel={site.lp.cta}
            />
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
      session={session}
      known={known}
      recap={{
        title: [snap.metier, snap.ville || snap.zoneLabel, `${eur(snap.budget)}/mois`]
          .filter(Boolean)
          .join(" · "),
        detail: `≈ ${snap.chantiers.toFixed(1).replace(".", ",")} chantiers/mois · ${eur(snap.ca)} de CA estimé`,
        /* back() plutôt que setSnap(null) : l'entrée d'historique poussée
           à l'entrée du form est consommée, popstate fait le reste — le
           bouton « Modifier » et le bouton retour du navigateur suivent
           exactement le même chemin. */
        onEdit: () => window.history.back(),
      }}
    />
  );
}
