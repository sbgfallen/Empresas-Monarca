"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import API from "@/app/services/api";

type Banner = {
  id: number;
  title: string;
  image_url: string;
  link_url: string;
  link_label: string;
  position: string;
  is_active: boolean;
  sort_order: number;
};

const apiRoot =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "";

function getImageUrl(image?: string) {
  if (!image) return "";
  if (image.startsWith("http")) return image;
  const path = image.startsWith("/") ? image : `/${image}`;
  return `${apiRoot}${path}`;
}

// ─── Banner Slider (self-contained) ───────────────────

function BannerSlider({ banners }: { banners: Banner[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const banner = banners[currentIndex];
  const imgUrl = getImageUrl(banner.image_url);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.97,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.97,
    }),
  };

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (banners.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    startAutoPlay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [banners.length, startAutoPlay]);

  const goTo = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    startAutoPlay();
  };

  const goNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    startAutoPlay();
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    startAutoPlay();
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.6)]">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={banner.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgUrl}
            alt={banner.title}
            className="h-full w-full object-cover"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <h3 className="text-xl font-black text-white md:text-3xl lg:text-4xl max-w-xl">
              {banner.title}
            </h3>
            {banner.link_url && (
              <a
                href={banner.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-3 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-rose-950/40 transition-all duration-300 hover:from-rose-500 hover:to-rose-600 hover:shadow-xl hover:shadow-rose-600/30 active:scale-95"
              >
                <span className="relative z-10">
                  {banner.link_label || "Saber más"}
                </span>
                <ArrowUpRight
                  size={16}
                  className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/50 text-white/70 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-black/70 hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/50 text-white/70 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-black/70 hover:text-white"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`h-2 rounded-full transition-all duration-500 ${
                idx === currentIndex
                  ? "w-8 bg-gradient-to-r from-rose-500 to-rose-700 shadow-lg shadow-rose-500/30"
                  : "w-2 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────

export default function BannerCarousel({
  position = "home_hero",
}: { position?: string }) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get<{ banners: Banner[] }>(`/banners/position/${position}`)
      .then((res) => {
        if (res.data.banners) {
          setBanners(res.data.banners);
        }
      })
      .catch(() => {
        // Silent
      })
      .finally(() => setLoading(false));
  }, [position]);

  if (loading) return null;
  if (banners.length === 0) return null;

  return (
    <section className="relative px-5 py-12 md:px-8 -mt-16 z-10">
      <div className="mx-auto max-w-7xl">
        <BannerSlider banners={banners} />
      </div>
    </section>
  );
}
