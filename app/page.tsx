import type { Metadata } from "next";
import { AuditForm } from "@/components/form/AuditForm";

export const metadata: Metadata = {
  title: "Audit gratuit de ta situation — NMF Agence",
  description:
    "Réponds à quelques questions et obtiens un audit gratuit de ta situation. NMF Agence accompagne les artisans à remplir leur agenda.",
};

export default function Home() {
  return <AuditForm />;
}
