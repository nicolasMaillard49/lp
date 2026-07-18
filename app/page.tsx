import type { Metadata } from "next";
import { AcquisitionLp } from "@/components/lp/AcquisitionLp";
import { LpHero } from "@/components/lp/LpHero";
import { Method } from "@/components/Method";
import { Proof } from "@/components/Proof";
import { Footer } from "@/components/Footer";

const TITLE = "Combien de chantiers tu laisses passer ? — NMF Agence";
const DESC =
  "Simule ce que la publicité Google peut rapporter à ton activité : ton métier, ta ville, ton budget. Gratuit, sans inscription, 2 minutes.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  /* Sans ça, l'openGraph du layout racine (« Ton rendez-vous est
     réservé ») fuirait sur la LP : il est écrit pour /bienvenue. */
  openGraph: { title: TITLE, description: DESC, type: "website" },
  twitter: { card: "summary", title: TITLE, description: DESC },
};

/**
 * `/` = LP d'acquisition (atterrissage des ads).
 * Le formulaire seul vit sur `/audit` pour les prospects chauds.
 * Épure 2026-07-15 : le simulateur EST la page — un titre court
 * au-dessus, zéro distraction (la marquee métiers est partie), les
 * preuves restent sous le pli.
 */
export default function Home() {
  return (
    <main className="simulator-page">
      <AcquisitionLp
        before={<LpHero />}
        after={
          <>
            <Proof />
            <Method />
            <Footer />
          </>
        }
      />
    </main>
  );
}
