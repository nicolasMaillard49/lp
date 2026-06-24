import { SmoothScroll } from "@/components/SmoothScroll";
import { Intro } from "@/components/Intro";
import { ScrollProgress } from "@/components/ScrollProgress";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { VideoSection } from "@/components/VideoSection";
import { Agenda } from "@/components/Agenda";
import { Resource } from "@/components/Resource";
import { Prepare } from "@/components/Prepare";
import { Method } from "@/components/Method";
import { Proof } from "@/components/Proof";
import { FinalCta } from "@/components/FinalCta";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Intro />
      <ScrollProgress />
      <Header />
      <main>
        <Hero />
        <Marquee />
        {/* Flow de confirmation — 4 étapes numérotées */}
        <VideoSection />
        <Agenda />
        <Resource />
        <Prepare />
        {/* Réassurance */}
        <Method />
        <Proof />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
