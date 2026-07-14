import { Intro } from "@/components/Intro";
import { ScrollProgress } from "@/components/ScrollProgress";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { BookingEmbed } from "@/components/BookingEmbed";
import { Marquee } from "@/components/Marquee";
import { VideoSection } from "@/components/VideoSection";
import { Agenda } from "@/components/Agenda";
import { Resource } from "@/components/Resource";
import { Prepare } from "@/components/Prepare";
import { Proof } from "@/components/Proof";
import { Footer } from "@/components/Footer";
import { TrackLead } from "@/components/TrackLead";

/**
 * Deux publics, une page :
 * - défaut : le RDV existe déjà (réservé soi-même ou posé par Nicolas)
 *   → page historique, pas un mot sur le créneau ;
 * - `?reserver=1` (posé par AuditForm au submit du funnel ads) : rien
 *   n'est réservé → hero « créneau » personnalisé + Koalendar intégré.
 * Lire searchParams rend la route dynamique — voulu, le contenu dépend
 * de la requête.
 */
export default async function Bienvenue({
  searchParams,
}: {
  searchParams: Promise<{ reserver?: string }>;
}) {
  const doitReserver = (await searchParams).reserver === "1";
  return (
    <>
      <TrackLead />
      <Intro />
      <ScrollProgress />
      <Header />
      <main>
        <Hero variant={doitReserver ? "funnel" : "classic"} />
        {/* Funnel ads : l'action n°1 est de réserver — le reste prépare le RDV */}
        {doitReserver && <BookingEmbed />}
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
