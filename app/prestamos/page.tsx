import type { Metadata } from "next";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoanCalculator from "../components/LoanCalculator";

export const metadata: Metadata = {
  title: "Préstamos — Empresas Monarca",
  description: "Solicitá préstamos de dinero de forma rápida y segura. Créditos con cuotas diarias, semanales o mensuales.",
  openGraph: {
    title: "Préstamos — Empresas Monarca",
    description: "Solicitá préstamos de dinero de forma rápida y segura.",
  },
};

export default function PrestamosPage() {
  return (
    <main className="bg-[linear-gradient(135deg,#1a0f0a_0%,#2d1f14_48%,#1a0f0a_100%)] text-warm-50">
      <Navbar />

      <div className="pt-24">
        <LoanCalculator />
      </div>

      <Footer />
    </main>
  );
}
