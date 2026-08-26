import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import NewsSection from "../sections/NewsSection";

export const metadata: Metadata = {
  title: "Noticias — Empresas Monarca",
  description:
    "Enterate de las últimas novedades, tendencias y actualizaciones del mundo premium.",
  openGraph: {
    title: "Noticias — Empresas Monarca",
    description:
      "Últimas novedades y tendencias premium.",
  },
};

export default function NoticiasPage() {
  return (
    <main className="bg-[linear-gradient(135deg,#1a0f0a_0%,#2d1f14_48%,#1a0f0a_100%)] text-warm-50">
      <Navbar />
      <div className="pt-24">
        <NewsSection />
      </div>
      <Footer />
    </main>
  );
}
