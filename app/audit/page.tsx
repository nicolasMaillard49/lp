import type { Metadata } from "next";
import { AuditForm } from "@/components/form/AuditForm";

export const metadata: Metadata = {
  title: "Audit gratuit de ta situation — NMF Agence",
  description:
    "Réponds à quelques questions et obtiens un audit gratuit de ta situation. NMF Agence accompagne les artisans à remplir leur agenda.",
  robots: { index: false, follow: false },
};

/**
 * Entrée DIRECTE sur le formulaire — prospects chauds (organique, bouche
 * à oreille, DM) qu'on ne fait pas passer par la LP. Sans `known`, le form
 * pose ses 13 questions ; le parcours ads (`/`) en saute 3 grâce au
 * simulateur. Même composant, longueur déduite.
 */
export default function AuditPage() {
  return <AuditForm />;
}
