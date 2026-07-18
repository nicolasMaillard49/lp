import type { Metadata } from "next";
import { site } from "@/config/site";
import { simulateur } from "@/config/simulateur";
import { SimHeader } from "@/components/simulateur/SimHeader";
import { StandaloneSimulator } from "@/components/simulateur/StandaloneSimulator";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: simulateur.meta.title,
  description: simulateur.meta.description,
};

export default function SimulateurPage() {
  return (
    <>
      <SimHeader />

      <main className="bg-[#f7f9fc] px-5 py-8 font-helvetica sm:px-8 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="border-2 border-[#071a33] bg-white p-4 font-helvetica sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#075ad8]">
              {simulateur.eyebrow} · CA estimé
            </p>
            <h1 className="mt-2 font-helvetica text-[clamp(1.75rem,4vw,3.3rem)] font-black leading-[0.95] tracking-tight text-[#071a33]">
              Combien une campagne NMF peut te rapporter ?
            </h1>
            <p className="mt-3 max-w-xl text-sm font-semibold leading-relaxed text-[#607089]">
              Choisis ton métier, ta ville et ton budget. Le chiffre de CA monte en direct.
            </p>
          </div>

          <div className="mt-6">
            <StandaloneSimulator ctaLabel={site.lp.cta} />
          </div>
        </div>
      </main>

      <Footer helvetica />
    </>
  );
}
