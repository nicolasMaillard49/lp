"use client";

import { useEffect, useState } from "react";
import { site } from "@/config/site";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300 ${
        scrolled
          ? "border-border bg-bg/85 backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <a
          href="#top"
          className="font-display text-lg font-semibold tracking-tight text-ink"
        >
          {site.name}
          <span className="text-primary">.</span>
        </a>

        <a
          href="#video"
          className="rounded-full border border-border bg-bg/70 px-4 py-2 text-sm font-semibold text-ink backdrop-blur-md transition-colors hover:border-primary hover:text-primary"
        >
          La présentation
        </a>
      </div>
    </header>
  );
}
