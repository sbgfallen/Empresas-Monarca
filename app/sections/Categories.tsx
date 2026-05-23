"use client";

import { useCallback, useRef, useState } from "react";
import type { ComponentType } from "react";
import { motion } from "framer-motion";
import { ParallaxBg } from "../components/ParallaxBg";
import {
  ArrowUpRight,
  CreditCard,
  Home,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────

type Category = {
  desc: string;
  href: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  image: string;
  title: string;
};

const categories = [
  {
    title: "Inmuebles",
    desc: "Apartamentos, casas y oportunidades de inversión.",
    href: "#productos",
    icon: Home,
    image:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Electrodomésticos",
    desc: "Tecnología para hogares modernos y eficientes.",
    href: "#productos",
    icon: ShoppingBag,
    image:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Préstamos",
    desc: "Financiación clara para compras grandes.",
    href: "/prestamos",
    icon: CreditCard,
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Fletes",
    desc: "Entrega coordinada para mover tus compras con cuidado.",
    href: "#promociones",
    icon: Truck,
    image:
      "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=1200&auto=format&fit=crop",
  },
] satisfies Category[];

// ─── 3D Tilt Hook ─────────────────────────────────────

function useTilt() {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: "transform 0.08s ease-out",
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setStyle({
      transform:
        "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
    });
  }, []);

  return { ref, style, handleMouseMove, handleMouseLeave };
}

// ─── Tilt Card Wrapper ────────────────────────────────

function TiltCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, style, handleMouseMove, handleMouseLeave } = useTilt();

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style}
      className={className}
    >
      {children}
    </div>
  );
}

// ─── Floating Particle ─────────────────────────────────

function FloatingDot({
  className = "",
  delay = 0,
  size = "h-2 w-2",
}: {
  className?: string;
  delay?: number;
  size?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full ${size} ${className}`}
      style={{
        animation: `float 5s ease-in-out ${delay}s infinite`,
      }}
    />
  );
}

// ─── Counter Badge ────────────────────────────────────

function CounterBadge({ text }: { text: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.28em] text-rose-300"
    >
      <motion.span
        className="h-1.5 w-1.5 rounded-full bg-rose-600"
        animate={{ scale: [1, 1.4, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {text}
    </motion.p>
  );
}

// ─── Main Component ───────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      delay: i * 0.12,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  }),
};

export default function Categories() {
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={sectionRef}
      id="categorias"
      className="relative overflow-hidden bg-[linear-gradient(135deg,#000000_0%,#0a0a0a_52%,#000000_100%)] px-5 py-24 text-warm-50 md:px-8"
    >
      {/* ─── Parallax Background Layer ─── */}
      <ParallaxBg speed={0.18}>
        {/* Large spinning rings */}
        <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full border border-rose-500/5 spin-slow" />
        <div
          className="pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full border border-rose-700/5 spin-slow"
          style={{ animationDirection: "reverse" }}
        />

        {/* Glowing gradient orbs */}
        <div className="pointer-events-none absolute -left-32 top-1/4 h-72 w-72 rounded-full bg-rose-500/8 blur-[120px] glow-pulse" />
        <div className="pointer-events-none absolute -right-32 bottom-1/4 h-64 w-64 rounded-full bg-amber-500/6 blur-[100px] glow-pulse" style={{ animationDelay: "1.5s" }} />
        <div className="pointer-events-none absolute left-1/3 top-1/3 h-40 w-40 rounded-full bg-rose-600/5 blur-[80px] glow-pulse" style={{ animationDelay: "3s" }} />

        {/* Subtle grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating decorative dots */}
        <FloatingDot
          className="bg-rose-400/20 left-[15%] top-[20%]"
          delay={0}
          size="h-3 w-3"
        />
        <FloatingDot
          className="bg-amber-400/15 right-[20%] top-[30%]"
          delay={1.2}
          size="h-2 w-2"
        />
        <FloatingDot
          className="bg-rose-500/20 left-[10%] bottom-[25%]"
          delay={2.5}
          size="h-1.5 w-1.5"
        />
        <FloatingDot
          className="bg-amber-500/15 right-[15%] bottom-[30%]"
          delay={0.8}
          size="h-2.5 w-2.5"
        />

        {/* Scanline accent lines */}
        <div className="pointer-events-none absolute left-[8%] top-0 h-full w-px bg-gradient-to-b from-transparent via-rose-500/6 to-transparent" />
        <div className="pointer-events-none absolute right-[12%] top-0 h-full w-px bg-gradient-to-b from-transparent via-amber-500/4 to-transparent" />
      </ParallaxBg>

      {/* ─── Content ─── */}
      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="mb-14 flex flex-col justify-between gap-5 md:flex-row md:items-end"
        >
          <div>
            <CounterBadge text="Marketplace" />

            <motion.h2
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
                },
              }}
              className="mt-4 text-4xl font-black leading-tight text-warm-50 md:text-6xl"
            >
              Categorías{" "}
              <span className="bg-gradient-to-r from-rose-200 via-rose-300 to-rose-500 bg-clip-text text-transparent">
                premium
              </span>
            </motion.h2>
          </div>

          <motion.p
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, delay: 0.2 },
              },
            }}
            className="max-w-md text-base leading-7 text-warm-50/68"
          >
            Una vitrina organizada para explorar productos, servicios y crédito
            con una presentación más limpia.
          </motion.p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {categories.map((item, idx) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.title}
                custom={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-30px" }}
                variants={cardVariants}
              >
                <TiltCard className="group relative h-full min-h-[440px] rounded-xl bg-warm-900 shadow-2xl shadow-rose-950/20 transition-shadow duration-500 hover:shadow-[0_25px_80px_-12px_rgba(244,63,94,0.25)]">
                  {/* Gradient border glow on hover */}
                  <div className="pointer-events-none absolute -inset-[1px] rounded-xl bg-gradient-to-b from-rose-500/30 via-rose-400/10 to-amber-500/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="relative h-full w-full overflow-hidden rounded-xl">
                    {/* Background image */}
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                      className="absolute inset-0 h-full w-full object-cover transition-all duration-700 group-hover:scale-110"
                    />

                    {/* Multi-layer gradient overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(245,158,11,0.04)_0%,rgba(26,15,10,0.70)_40%,rgba(26,15,10,0.94)_100%)] transition-opacity duration-500 group-hover:opacity-95" />

                    {/* Shine sweep effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.06)_38%,transparent_46%)] translate-x-[-100%] transition-transform duration-700 group-hover:translate-x-[100%]" />

                    {/* Spotlight effect on hover */}
                    <div className="pointer-events-none absolute -inset-20 bg-[radial-gradient(circle_at_50%_50%,rgba(244,63,94,0.08),transparent_50%)] opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

                    {/* Content */}
                    <div className="relative z-10 flex h-full flex-col justify-between p-7">
                      {/* Top row */}
                      <div className="flex items-center justify-between">
                        <motion.span
                          whileHover={{ rotate: [0, -10, 10, -5, 0] }}
                          className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-warm-900 shadow-lg shadow-rose-500/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-rose-600/30"
                        >
                          <Icon size={22} />
                        </motion.span>

                        <motion.span
                          whileHover={{ scale: 1.15, rotate: 45 }}
                          className="grid h-10 w-10 place-items-center rounded-lg border border-rose-200/20 bg-rose-200/10 text-warm-50/70 backdrop-blur-sm transition-all duration-300 group-hover:bg-rose-600 group-hover:text-warm-900 group-hover:border-rose-600 group-hover:shadow-lg group-hover:shadow-rose-700/30"
                        >
                          <ArrowUpRight size={18} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </motion.span>
                      </div>

                      {/* Bottom info */}
                      <div>
                        <h3 className="text-3xl font-black text-warm-50 transition-all duration-300 group-hover:translate-y-[-2px]">
                          {item.title}
                        </h3>

                        <p className="mt-3 text-sm leading-6 text-warm-50/65 transition-all duration-300 group-hover:text-warm-50/80">
                          {item.desc}
                        </p>

                        {/* Hover CTA hint */}
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{
                            opacity: 1,
                            y: 0,
                            transition: { delay: 0.2 },
                          }}
                          className="mt-4 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-rose-500/0 transition-all duration-300 group-hover:text-rose-400/80"
                        >
                          Explorar
                          <ArrowUpRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </motion.p>
                      </div>
                    </div>

                    {/* Bottom accent bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500/0 via-rose-500/0 to-amber-500/0 transition-all duration-500 group-hover:from-rose-500/60 group-hover:via-rose-400/40 group-hover:to-amber-500/30" />
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>

        {/* Trust indicator */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 rounded-xl border border-rose-200/8 bg-rose-200/[0.03] px-6 py-4 text-xs text-warm-50/45 backdrop-blur-sm"
        >
          <span className="inline-flex items-center gap-1.5">
            <Sparkles size={13} className="text-rose-500" />
            Categorías curadas
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-warm-50/20" />
            Productos verificados
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-warm-50/20" />
            Financiación disponible
          </span>
        </motion.div>
      </div>

      {/* ─── CSS for float animation ─── */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-8px) translateX(4px);
          }
          50% {
            transform: translateY(-4px) translateX(-2px);
          }
          75% {
            transform: translateY(-10px) translateX(3px);
          }
        }
      `}</style>
    </section>
  );
}
