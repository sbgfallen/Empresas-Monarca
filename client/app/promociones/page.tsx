import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Promotions from "../sections/Promotions";

export const metadata: Metadata = {
  title: "Promociones — Empresas Monarca",
  description:
    "Descubrí las mejores ofertas y promociones exclusivas en productos premium.",
  openGraph: {
    title: "Promociones — Empresas Monarca",
    description:
      "Ofertas y promociones exclusivas.",
  },
};

export default function PromocionesPage() {
  return (
    <main className="bg-[linear-gradient(135deg,#1a0f0a_0%,#2d1f14_48%,#1a0f0a_100%)] text-warm-50">
      <Navbar />
      <div className="pt-24">
        <Promotions />
      </div>
      <Footer />
    </main>
  );
}
