"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { FB_PIXEL_ID } from "@/lib/fpixel";

export function MetaPixel() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/dev")) {
    return null;
  }

  return (
    <>
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
    </>
  );
}
