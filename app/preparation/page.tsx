import type { Metadata } from "next";
import { ScrollProgress } from "@/components/ScrollProgress";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { IntroR2 } from "@/components/r2/IntroR2";
import { HeroR2 } from "@/components/r2/HeroR2";
import { OffreVideo } from "@/components/r2/OffreVideo";
import { OffreDetails } from "@/components/r2/OffreDetails";
import { QuestionnaireCta } from "@/components/r2/QuestionnaireCta";
import { CaseProof } from "@/components/r2/CaseProof";
import { RessourcesR2 } from "@/components/r2/RessourcesR2";
import { FaqR2 } from "@/components/r2/FaqR2";
import { PromesseR2 } from "@/components/r2/PromesseR2";
import { CadreR2 } from "@/components/r2/CadreR2";
import { FinalR2 } from "@/components/r2/FinalR2";
import { TrackR2 } from "@/components/r2/TrackR2";

export const metadata: Metadata = {
  title: "NMF Agence — La proposition, avant ta décision",
  description:
    "Ton diagnostic est fait. Découvre l'offre en détail — durée, étapes, méthode, résultats — et prépare notre rendez-vous de décision.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "NMF Agence — La proposition, avant ta décision",
    description:
      "Tout ce qu'il faut savoir avant notre prochain rendez-vous : présentation, détail de l'offre et questionnaire de préparation.",
    type: "website",
  },
};

/**
 * LP de R2 — le prospect a fait son diagnostic (R1), cette page prépare
 * l'appel de décision : présentation d'offre, détail noir sur blanc,
 * questionnaire de préparation, preuve sociale, cadre du rendez-vous.
 */
export default function Preparation() {
  return (
    <>
      <TrackR2 />
      <IntroR2 />
      <ScrollProgress />
      <Header />
      <main>
        <HeroR2 />
        {/* Flow de préparation — 3 étapes numérotées */}
        <OffreVideo />
        <OffreDetails />
        {/* Réassurance — études de cas puis apport de valeur anti-objections */}
        <CaseProof />
        <RessourcesR2 />
        {/* FAQ + promesse (mêmes blocs que la LP R2 du coach) : on lève les
            derniers doutes juste avant de demander l'engagement */}
        <FaqR2 />
        <PromesseR2 />
        {/* Le questionnaire vient en DERNIER : le prospect répond (budget,
            décision, objections) après avoir vu l'offre, les preuves et
            les ressources — pas avant. */}
        <QuestionnaireCta />
        <CadreR2 />
        <FinalR2 />
      </main>
      <Footer />
    </>
  );
}
