import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NMF Agence — Ta présentation avant notre rendez-vous",
  description:
    "Ton rendez-vous est réservé. Découvre en 45 secondes comment NMF Agence accompagne les artisans à remplir leur agenda.",
  openGraph: {
    title: "NMF Agence — Ta présentation avant notre rendez-vous",
    description:
      "Ton rendez-vous est réservé. Découvre la démarche en 45 secondes avant notre échange.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${fraunces.variable} ${manrope.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
