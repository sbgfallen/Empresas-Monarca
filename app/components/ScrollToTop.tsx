"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Volver arriba"
      className={`fixed bottom-8 right-8 z-50 grid h-12 w-12 place-items-center rounded-xl border border-rose-200/20 bg-gradient-to-br from-rose-600 to-rose-700 text-white shadow-2xl shadow-rose-950/50 backdrop-blur-sm transition-all duration-500 hover:from-rose-500 hover:to-rose-600 hover:shadow-rose-500/25 hover:scale-110 active:scale-95 ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      {/* Glow ring */}
      <div
        className={`absolute -inset-1 rounded-xl bg-gradient-to-br from-rose-500/30 to-rose-700/20 blur-lg transition-opacity duration-500 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />
      <ArrowUp size={20} className="relative z-10" />
    </button>
  );
}
