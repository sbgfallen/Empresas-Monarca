"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ParallaxBg } from "../components/ParallaxBg";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgePercent,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Gem,
  Gift,
  Package,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

import API from "@/app/services/api";

// ─── Types ────────────────────────────────────────────

type PromoProduct = {
  id: number;
  title: string;
  price: string;
  original_price: number;
  discounted_price: number;
  image: string;
  category: string;
  stock: string;
};

type Promotion = {
  id: number;
  title: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  start_date: string;
  end_date: string;
  banner_image: string;
  products: PromoProduct[];
};

// ─── Timer Hook ───────────────────────────────────────

function useTimer(endDate: string) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(endDate).getTime() - Date.now();

      if (diff <= 0) {
        setDisplay("Finalizado");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);

      if (days > 0) {
        setDisplay(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setDisplay(`${hours}h ${mins}m`);
      } else {
        setDisplay(`${mins}m`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  return display;
}

function TimerBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative overflow-hidden rounded-xl border border-rose-200/15 bg-gradient-to-b from-warm-800 to-warm-900 px-4 py-3 shadow-lg shadow-rose-950/40 transition-all duration-300 hover:border-rose-200/25 hover:shadow-xl hover:shadow-rose-950/50">
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent rounded-t-xl" />
        <span className="relative text-2xl font-black tabular-nums text-warm-50 md:text-3xl">
          {value}
        </span>
      </div>
      <span className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-warm-50/40">
        {label}
      </span>
    </div>
  );
}

function FlashTimer({ endDate }: { endDate: string }) {
  const display = useTimer(endDate);

  if (display === "Finalizado") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-3 py-1.5 text-sm font-bold text-rose-400">
        <Clock size={14} />
        Finalizado
      </span>
    );
  }

  const parts = display.match(/(\d+)([dhms])/g);
  if (!parts) {
    return <span className="text-sm font-bold text-rose-500">{display}</span>;
  }

  return (
    <div className="flex gap-2.5">
      {parts.map((part) => {
        const value = part.slice(0, -1);
        const unit = part.slice(-1);
        const label =
          unit === "d" ? "Días" : unit === "h" ? "Horas" : unit === "m" ? "Min" : "Seg";

        return (
          <TimerBlock key={part} value={value.padStart(2, "0")} label={label} />
        );
      })}
    </div>
  );
}

// ─── Auto-Sliding Gallery Component ───────────────────

function PromoSlider({ promotions }: { promotions: Promotion[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, 5000);
  }, [promotions.length]);

  useEffect(() => {
    if (promotions.length <= 1) return;
    startAutoPlay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [promotions.length, startAutoPlay]);

  const goTo = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    if (promotions.length > 1) startAutoPlay();
  };

  const goNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % promotions.length);
    if (promotions.length > 1) startAutoPlay();
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + promotions.length) % promotions.length);
    if (promotions.length > 1) startAutoPlay();
  };

  if (promotions.length === 0) return null;

  const promo = promotions[currentIndex];
  const hasProducts = promo.products && promo.products.length > 0;

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 400 : -400,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -400 : 400,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <div className="relative">
      {/* Main slider card */}
      <div className="relative overflow-hidden rounded-2xl border border-rose-200/12 bg-gradient-to-b from-rose-200/[0.06] to-rose-200/[0.02] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={promo.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative p-8 md:p-12"
          >
            {/* Background glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-rose-500/10 blur-[80px]" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-rose-600/8 blur-[60px]" />

            <div className="relative flex flex-col gap-8 md:flex-row md:items-center">
              {/* Left content */}
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.28em] text-rose-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                  {promo.discount_type === "percentage"
                    ? `${promo.discount_value}% OFF`
                    : `$${Number(promo.discount_value).toLocaleString()} OFF`}
                </div>

                <h3 className="mt-4 text-3xl font-black leading-tight text-warm-50 md:text-5xl">
                  {promo.title}
                </h3>

                {promo.description && (
                  <p className="mt-3 max-w-xl text-base leading-7 text-warm-50/60">
                    {promo.description}
                  </p>
                )}

                {/* Timer */}
                {new Date(promo.end_date).getTime() > Date.now() && (
                  <div className="mt-6">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-warm-50/35">
                      <Clock size={12} className="inline mr-1" />
                      Finaliza en
                    </p>
                    <FlashTimer endDate={promo.end_date} />
                  </div>
                )}

                <a
                  href="#productos"
                  className="group relative mt-6 inline-flex w-fit items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-rose-600 via-rose-700 to-rose-700 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-rose-500/20 transition-all duration-300 hover:shadow-2xl hover:shadow-rose-600/30 hover:scale-105 active:scale-95"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-rose-500 via-rose-600 to-rose-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <ArrowUpRight size={18} className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  <span className="relative z-10">Ver oferta</span>
                </a>
              </div>

              {/* Right - Products preview */}
              {hasProducts && (
                <div className="flex-1">
                  <div className="rounded-xl border border-rose-200/10 bg-rose-200/[0.04] p-5 backdrop-blur-sm">
                    <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-warm-50/40">
                      <Package size={12} />
                      Productos incluidos
                    </p>
                    <div className="grid gap-2">
                      {promo.products.slice(0, 3).map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 rounded-lg border border-rose-200/8 bg-warm-900/60 px-3 py-2.5 transition-all duration-200 hover:border-rose-200/20 hover:bg-warm-900/80"
                        >
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-rose-200/10">
                            {p.image && (
                              <img
                                src={p.image}
                                alt={p.title}
                                className="h-full w-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-warm-50">
                              {p.title}
                            </p>
                            <p className="text-xs font-bold text-rose-400">
                              {Number(p.discounted_price || p.price).toLocaleString("es-AR", {
                                style: "currency",
                                currency: "ARS",
                                maximumFractionDigits: 0,
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {promotions.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 grid h-10 w-10 place-items-center rounded-full border border-rose-200/15 bg-warm-900/80 text-warm-50/70 backdrop-blur-sm transition-all duration-300 hover:border-rose-200/30 hover:bg-warm-900 hover:text-rose-400 hover:shadow-lg hover:shadow-rose-950/30"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 grid h-10 w-10 place-items-center rounded-full border border-rose-200/15 bg-warm-900/80 text-warm-50/70 backdrop-blur-sm transition-all duration-300 hover:border-rose-200/30 hover:bg-warm-900 hover:text-rose-400 hover:shadow-lg hover:shadow-rose-950/30"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Dot indicators */}
      {promotions.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {promotions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`h-2 rounded-full transition-all duration-500 ${
                idx === currentIndex
                  ? "w-8 bg-gradient-to-r from-rose-500 to-rose-700 shadow-lg shadow-rose-500/30"
                  : "w-2 bg-rose-200/20 hover:bg-rose-200/40"
              }`}
            />
          ))}
        </div>
      )}

      {/* Promotion number indicator */}
      {promotions.length > 1 && (
        <div className="mt-4 text-center">
          <span className="text-xs font-bold text-warm-50/40">
            {String(currentIndex + 1).padStart(2, "0")} / {String(promotions.length).padStart(2, "0")}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────

export default function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [flashSales, setFlashSales] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchPromos = async () => {
      try {
        const [allRes, flashRes] = await Promise.all([
          API.get<{ promotions: Promotion[] }>("/promotions"),
          API.get<{ flashSales: Promotion[] }>("/promotions/flash-sales"),
        ]);

        if (cancelled) return;

        setPromotions(allRes.data.promotions);
        setFlashSales(flashRes.data.flashSales);
      } catch {
        // API may not be available yet
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPromos();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasPromos = promotions.length > 0;
  const hasFlash = flashSales.length > 0;

  if (loading) {
    return null;
  }

  if (!hasPromos && !hasFlash) {
    return (
      <section
        id="promociones"
        className="relative overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(244,63,94,0.10),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(244,63,94,0.06),transparent_30%),linear-gradient(135deg,#1a0f0a_0%,#2d1f14_52%,#1a0f0a_100%)] px-5 py-24 text-warm-50 md:px-8"
      >
        <ParallaxBg speed={0.14}>
          <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-rose-500/8 blur-[120px] glow-pulse" />
          <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-rose-600/6 blur-[140px] glow-pulse" style={{ animationDelay: "1.5s" }} />
          <div className="pointer-events-none absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </ParallaxBg>

        <div className="relative z-10 mx-auto max-w-7xl text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 shadow-2xl shadow-rose-500/20">
            <BadgePercent size={40} className="text-white" />
          </div>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-rose-300">
            <Sparkles size={14} />
            Temporada Monarca
          </p>
          <h2 className="mt-6 text-4xl font-black leading-tight md:text-6xl">
            Próximamente{" "}
            <span className="bg-gradient-to-r from-rose-200 via-rose-300 to-rose-500 bg-clip-text text-transparent">
              promociones exclusivas
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-warm-50/60 md:text-lg">
            Estamos preparando ofertas especiales para ti. Vuelve pronto.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="promociones"
      className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(244,63,94,0.12),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(244,63,94,0.08),transparent_30%),linear-gradient(135deg,#1a0f0a_0%,#2d1f14_52%,#1a0f0a_100%)] px-5 py-24 text-warm-50 md:px-8"
    >
      <ParallaxBg speed={0.12}>
        <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full border border-rose-500/5 spin-slow" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full border border-rose-600/5 spin-slow" style={{ animationDirection: "reverse" }} />
        <div className="pointer-events-none absolute -left-32 top-1/3 h-72 w-72 rounded-full bg-rose-500/8 blur-[120px] glow-pulse" />
        <div className="pointer-events-none absolute -right-32 bottom-1/4 h-80 w-80 rounded-full bg-rose-600/6 blur-[120px] glow-pulse" style={{ animationDelay: "2s" }} />
        <div className="pointer-events-none absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </ParallaxBg>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Auto-sliding Promotions Gallery - Only the gallery, clean and premium */}
        {hasPromos && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <PromoSlider promotions={promotions} />
          </motion.div>
        )}

        {/* Empty state when no active promos */}
        {!hasPromos && (
          <div className="text-center py-12">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 shadow-2xl shadow-rose-500/20">
              <BadgePercent size={40} className="text-white" />
            </div>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-rose-300">
              <Sparkles size={14} />
              Temporada Monarca
            </p>
            <h2 className="mt-6 text-4xl font-black leading-tight md:text-6xl">
              Próximamente{" "}
              <span className="bg-gradient-to-r from-rose-200 via-rose-300 to-rose-500 bg-clip-text text-transparent">
                promociones exclusivas
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-warm-50/60 md:text-lg">
              Estamos preparando ofertas especiales para ti. Vuelve pronto.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
