import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FeaturedProducts from "../sections/FeaturedProducts";

export const metadata: Metadata = {
  title: "Productos — Empresas Monarca",
  description:
    "Explorá nuestro catálogo de productos premium: tecnología, electrodomésticos, inmuebles y más.",
  openGraph: {
    title: "Productos — Empresas Monarca",
    description:
      "Explorá nuestro catálogo de productos premium.",
  },
};

export default function ProductosPage() {
  return (
    <main className="bg-[linear-gradient(135deg,#1a0f0a_0%,#2d1f14_48%,#1a0f0a_100%)] text-warm-50">
      <Navbar />
      <div className="pt-24">
        <FeaturedProducts />
      </div>
      <Footer />
    </main>
  );
}
