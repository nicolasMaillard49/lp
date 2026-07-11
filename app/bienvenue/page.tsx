import { Intro } from "@/components/Intro";
import { ScrollProgress } from "@/components/ScrollProgress";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { VideoSection } from "@/components/VideoSection";
import { Agenda } from "@/components/Agenda";
import { Resource } from "@/components/Resource";
import { Prepare } from "@/components/Prepare";
import { Proof } from "@/components/Proof";
import { Footer } from "@/components/Footer";
import { TrackLead } from "@/components/TrackLead";

export default function Bienvenue() {
  return (
    <>
      <TrackLead />
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
        {/* Réassurance — uniquement les témoignages */}
        <Proof />
      </main>
      <Footer />
    </>
  );
}
