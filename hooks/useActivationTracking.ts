"use client";

import { useEffect, type RefObject } from "react";
import { activationMarksForScroll, type ActivationMark } from "@/lib/activation";

export function useActivationTracking(args: {
  mark?: (event: ActivationMark) => void;
  resultRef: RefObject<Element | null>;
  ctaRef: RefObject<Element | null>;
  onCtaVisible?: () => void;
}) {
  const { mark, resultRef, ctaRef, onCtaVisible } = args;

  useEffect(() => {
    let frame = 0;
    if (!mark) return;
    const measure = () => {
      frame = 0;
      const available = document.documentElement.scrollHeight - window.innerHeight;
      const progress = available <= 0 ? 1 : window.scrollY / available;
      for (const event of activationMarksForScroll(progress)) mark(event);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [mark]);

  useEffect(() => {
    if (!mark || !resultRef.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        mark("result_viewed");
        observer.disconnect();
      },
      { threshold: 0.35 }
    );
    observer.observe(resultRef.current);
    return () => observer.disconnect();
  }, [mark, resultRef]);

  useEffect(() => {
    if (!mark || !ctaRef.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        mark("cta_viewed");
        onCtaVisible?.();
        observer.disconnect();
      },
      { threshold: 0.25 }
    );
    observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, [ctaRef, mark, onCtaVisible]);
}
