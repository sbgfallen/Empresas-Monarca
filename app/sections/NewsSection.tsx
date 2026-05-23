"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ParallaxBg } from "../components/ParallaxBg";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  LoaderCircle,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";

import API from "@/app/services/api";

type NewsItem = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  image_url: string;
  category: string;
  tags: string[];
  published_at: string;
};

const fallbackNews = [
  {
    id: 1,
    category: "Inmuebles",
    title: "Nuevo proyecto inmobiliario premium",
    excerpt:
      "Oportunidades premium con espacios más amplios y acabados sobrios. Descubre las mejores propiedades del mercado.",
    image_url:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop",
    slug: "nuevo-proyecto-inmobiliario",
    tags: ["Inversión", "Premium"],
    published_at: new Date().toISOString(),
  },
  {
    id: 2,
    category: "Tecnología",
    title: "Tecnología inteligente para el hogar",
    excerpt:
      "La nueva generación de electrodomésticos para hogares conectados. Eficiencia y diseño en un solo lugar.",
    image_url:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=1000&auto=format&fit=crop",
    slug: "tecnologia-inteligente",
    tags: ["Innovación", "Smart Home"],
    published_at: new Date().toISOString(),
  },
  {
    id: 3,
    category: "Crédito",
    title: "Créditos rápidos con la mejor tasa",
    excerpt: "Opciones de financiación flexibles para comprar con mayor comodidad. Aprobación en 24 horas.",
    image_url:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1000&auto=format&fit=crop",
    slug: "creditos-rapidos",
    tags: ["Financiación", "Crédito"],
    published_at: new Date().toISOString(),
  },
  {
    id: 4,
    category: "Tendencias",
    title: "Diseño premium: lo último en arquitectura",
    excerpt: "Las tendencias más innovadoras en diseño arquitectónico para espacios residenciales y comerciales.",
    image_url:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1000&auto=format&fit=crop",
    slug: "diseno-premium-arquitectura",
    tags: ["Arquitectura", "Diseño"],
    published_at: new Date().toISOString(),
  },
];

// ─── Auto-Sliding News Carousel ───────────────────────

function NewsCarousel({ news }: { news: NewsItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % news.length);
    }, 6000);
  }, [news.length]);

  const pauseAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (news.length <= 1) return;
    startAutoPlay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [news.length, startAutoPlay]);

  const goTo = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    pauseAutoPlay();
  };

  const goNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % news.length);
    pauseAutoPlay();
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + news.length) % news.length);
    pauseAutoPlay();
  };

  if (news.length === 0) return null;

  const item = news[currentIndex];

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 600 : -600,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -600 : 600,
      opacity: 0,
    }),
  };

  return (
    <div className="relative">
      {/* Main featured card */}
      <div
        className="group relative overflow-hidden rounded-2xl border border-rose-200/12 bg-gradient-to-b from-rose-200/[0.06] to-rose-200/[0.02] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)]"
        onMouseEnter={pauseAutoPlay}
        onMouseLeave={startAutoPlay}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={item.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative"
          >
            <Link href={`/noticias/${item.slug}`} className="block">
              <div className="relative aspect-[21/9] md:aspect-[21/9] overflow-hidden">
                <Image
                  src={item.image_url}
                  alt={item.title}
                  fill
                  sizes="100vw"
                  className="object-cover transition-all duration-700 group-hover:scale-105"
                  priority
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a0f0a] via-[#1a0f0a]/60 to-transparent" />

                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                  {/* Category badge */}
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/15 backdrop-blur-sm px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-rose-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                    {item.category}
                  </div>

                  <h3 className="mt-4 text-2xl font-black leading-tight text-white md:text-4xl max-w-3xl">
                    {item.title}
                  </h3>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 md:text-base">
                    {item.excerpt}
                  </p>

                  <div className="mt-4 flex items-center gap-4">
                    {item.published_at && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-white/50">
                        <Clock size={12} />
                        {new Date(item.published_at).toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    )}

                    <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400 transition-all duration-300 group-hover:text-rose-300">
                      Leer noticia
                      <ArrowUpRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/50 backdrop-blur-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {news.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-warm-900/80 text-white/70 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-warm-900 hover:text-rose-400 hover:shadow-lg"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-warm-900/80 text-white/70 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-warm-900 hover:text-rose-400 hover:shadow-lg"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails / indicators */}
      {news.length > 1 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {news.map((n, idx) => (
            <button
              key={n.id}
              onClick={() => goTo(idx)}
              className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
                idx === currentIndex
                  ? "border-rose-500/50 ring-2 ring-rose-500/30 shadow-lg shadow-rose-950/30"
                  : "border-rose-200/8 hover:border-rose-200/25 opacity-60 hover:opacity-90"
              }`}
            >
              <div className="relative aspect-[16/9]">
                <Image
                  src={n.image_url}
                  alt={n.title}
                  fill
                  sizes="25vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a0f0a]/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-[10px] font-bold text-white/80 truncate">
                    {n.title}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────

export default function NewsSection() {
  const [news, setNews] = useState<NewsItem[]>(fallbackNews);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get<{ news: NewsItem[] }>("/news")
      .then((res) => {
        if (res.data.news && res.data.news.length > 0) {
          setNews(res.data.news);
        }
      })
      .catch(() => {
        // Silent — use fallback
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section
      id="noticias"
      className="relative overflow-hidden bg-[linear-gradient(135deg,#1a0f0a_0%,#2d1f14_52%,#1a0f0a_100%)] px-5 py-24 text-warm-50 md:px-8"
    >
      <ParallaxBg speed={0.18}>
        <div className="pointer-events-none absolute -left-20 top-1/2 h-[400px] w-[400px] rounded-full bg-rose-500/8 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-[300px] w-[300px] rounded-full bg-rose-600/6 blur-[100px]" />
      </ParallaxBg>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-rose-500/12 px-3 py-1.5 text-xs font-black uppercase tracking-[0.28em] text-rose-300">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              Novedades
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight text-warm-50 md:text-6xl">
              Noticias y{" "}
              <span className="bg-gradient-to-r from-rose-200 via-rose-300 to-rose-500 bg-clip-text text-transparent">
                tendencias
              </span>
            </h2>
          </div>

          <Link
            href="/noticias"
            className="group inline-flex w-fit items-center gap-2 rounded-lg border border-rose-200/15 bg-rose-200/10 px-5 py-3 text-sm font-black text-rose-300 transition-all duration-300 hover:bg-rose-200/18 hover:border-rose-200/30 hover:shadow-lg hover:shadow-rose-500/15"
          >
            Ver todas
            <ArrowUpRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 rounded-lg border border-rose-200/12 bg-rose-200/[0.06] px-6 py-4">
              <LoaderCircle className="h-5 w-5 animate-spin text-rose-500" />
              <span className="text-sm font-semibold">Cargando noticias...</span>
            </div>
          </div>
        ) : (
          <NewsCarousel news={news} />
        )}

        {/* Trust indicator */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12 flex items-center justify-center gap-2 rounded-xl border border-rose-200/8 bg-rose-200/[0.03] px-5 py-3.5 text-xs text-warm-50/45 backdrop-blur-sm"
        >
          <TrendingUp size={14} className="text-rose-500" />
          Contenido actualizado — Información verificada
        </motion.div>
      </div>
    </section>
  );
}
