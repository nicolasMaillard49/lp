import type { Metadata } from "next";
import { R2Form } from "@/components/form/R2Form";

export const metadata: Metadata = {
  title: "Questionnaire avant le rendez-vous — NMF Agence",
  description:
    "Réponds à 7 questions pour préparer notre rendez-vous de décision.",
  robots: { index: false, follow: false },
};

export default function QuestionnaireR2() {
  return <R2Form />;
}
