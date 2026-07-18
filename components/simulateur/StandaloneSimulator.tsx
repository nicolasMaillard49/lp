"use client";

import { useCallback } from "react";
import { SimulateurTicket, type SimSnapshot } from "@/components/simulateur/SimulateurTicket";
import { useAuditSession } from "@/hooks/useAuditSession";
import type { ActivationMark } from "@/lib/activation";
import type { EtudeSnapshot } from "@/lib/email/templates/etude";
import { fbTrack, fbTrackCustom } from "@/lib/fpixel";

export function StandaloneSimulator({ ctaLabel }: { ctaLabel: string }) {
  const session = useAuditSession("/api/audit", { entrypoint: "simulator" });
  const markSession = session.mark;
  const requestEstimate = session.requestEstimate;

  const markActivation = useCallback((event: ActivationMark) => {
    markSession(event);
    if (event === "sim_used") {
      fbTrackCustom("NmfSimulatorUsed", { content_name: "simulateur-roi" });
    } else if (event === "result_viewed") {
      fbTrack("ViewContent", { content_name: "estimation-result" });
      fbTrackCustom("SimulateurResultat", { content_name: "estimation-result" });
    } else if (event === "cta_clicked") {
      fbTrackCustom("NmfCtaClicked", { content_name: "simulateur-roi" });
    }
  }, [markSession]);

  const saveEstimate = useCallback((email: string, estimate: SimSnapshot, snapshot: EtudeSnapshot) => {
    return requestEstimate(email, {
      activite: estimate.metier,
      ville: estimate.ville,
      budget_ads: estimate.ads,
      budget_lsa: estimate.lsa,
      sim_panier: estimate.panier,
      sim_transfo: estimate.transfo,
      sim_ca_estime: Math.round(estimate.ca),
    }, snapshot);
  }, [requestEstimate]);

  return (
    <SimulateurTicket
      ctaLabel={ctaLabel}
      ctaHref="/audit"
      onInteract={() => markActivation("sim_used")}
      onMark={markActivation}
      onEstimateRequested={saveEstimate}
    />
  );
}
