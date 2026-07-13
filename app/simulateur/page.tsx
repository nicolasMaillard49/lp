import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { simulateur } from "@/config/simulateur";
import { SimulateurRoi } from "@/components/simulateur/SimulateurRoi";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: simulateur.meta.title,
  description: simulateur.meta.description,
};

export default function SimulateurPage() {
  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/preparation"
            className="font-display text-lg font-semibold tracking-tight text-ink"
          >
            {site.name}
            <span className="text-primary">.</span>
          </Link>
          <Link
            href={simulateur.backHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
          >
            <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M9.5 3.5 5 8l4.5 4.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {simulateur.back}
          </Link>
        </div>
      </header>

      <main className="px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              {simulateur.eyebrow}
            </p>
            <h1 className="mt-4 text-[clamp(1.8rem,4.5vw,2.8rem)] font-normal leading-tight text-ink">
              {simulateur.title}
            </h1>
            <p className="mt-4 text-pretty leading-relaxed text-muted">
              {simulateur.subtitle}
            </p>
          </div>

          <div className="mt-12">
            <SimulateurRoi />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
