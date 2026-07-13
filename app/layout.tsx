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
        {/* Meta Pixel — chargé à l'idle : n'entre pas en concurrence
            avec l'hydratation sur mobile (le PageView part quand même). */}
        <Script id="fb-pixel" strategy="lazyOnload">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${FB_PIXEL_ID}');
fbq('track','PageView');`}
        </Script>
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
