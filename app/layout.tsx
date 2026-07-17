import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import Script from "next/script";
import { FB_PIXEL_ID } from "@/lib/fpixel";
import { MotionProvider } from "@/components/MotionProvider";
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
      <body suppressHydrationWarning>
        <MotionProvider>{children}</MotionProvider>
        {/* Meta Pixel — stub fbq inline (synchrone, ~300 o, aucune requête) :
            fbq existe dès l'hydratation, les events (Lead…) sont mis en file
            et envoyés quand fbevents.js arrive à l'idle. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(f){if(f.fbq)return;var n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];}(window);
fbq('init','${FB_PIXEL_ID}');
fbq('track','PageView');`,
          }}
        />
        {/* `afterInteractive` et non `lazyOnload` (2026-07-17).
            `lazyOnload` attend window.load PUIS l'idle : un visiteur qui
            rebondit avant emporte la file avec son onglet — l'event est
            perdu, sans repli CAPI serveur. Or 100 % du trafic Meta arrive
            en webview in-app Instagram/Facebook, où les rebonds < 3 s sont
            la norme. Le gain perf de lazyOnload était de toute façon
            théorique : le stub inline ci-dessus tient déjà la file, c'est
            LUI qui protège le LCP, pas le report du chargement. */}
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          src="https://connect.facebook.net/en_US/fbevents.js"
        />
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
      </body>
    </html>
  );
}
