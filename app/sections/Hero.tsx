"use client";

import { motion } from "framer-motion";
import { ParallaxBg } from "../components/ParallaxBg";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  Home,
  Sparkles,
} from "lucide-react";

const heroHighlights = [
  {
    icon: Home,
    label: "Inmuebles",
    value: "Selección curada",
  },
  {
    icon: BadgeCheck,
    label: "Garantía",
    value: "Compra respaldada",
  },
  {
    icon: CreditCard,
    label: "Financiación",
    value: "Cuotas flexibles",
  },
];

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative min-h-[92vh] overflow-hidden bg-warm-900 pt-24 text-warm-50"
    >
      <ParallaxBg speed={0.10}>
        {/* Background image */}
        <Image
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2070&auto=format&fit=crop"
          alt="Sala premium con tecnologia integrada"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full scale-110 object-cover transition-transform duration-[20s] ease-out"
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(26,15,10,0.92)_0%,rgba(45,31,20,0.62)_46%,rgba(74,55,40,0.2)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(244,63,94,0.2),transparent_32%),radial-gradient(circle_at_70%_72%,rgba(244,63,94,0.15),transparent_30%)]" />

        {/* Animated decorative gradient orb */}
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-rose-500/10 blur-[120px] glow-pulse" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-rose-700/10 blur-[100px] glow-pulse" style={{ animationDelay: "1.5s" }} />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(0deg,#1a0f0a_0%,rgba(26,15,10,0)_100%)]" />
      </ParallaxBg>

      <div className="relative z-20 flex min-h-[calc(92vh-96px)] items-center pb-16">
        <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
            className="max-w-4xl"
          >
            {/* Logo + Badge */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8 flex items-center gap-5"
            >
              {/* Logo emblem */}
              <div className="relative">
                {/* Glow ring */}
                <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-rose-500/30 via-rose-400/10 to-amber-500/20 blur-xl" />
                <div className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-full border-2 border-rose-300/30 bg-gradient-to-br from-warm-900 via-rose-950/40 to-amber-950/20 shadow-2xl shadow-rose-500/25 md:h-24 md:w-24">
                  <Image
                    src="/logo.jpg"
                    alt="Empresas Monarca"
                    width={96}
                    height={96}
                    className="h-full w-full rounded-full object-cover transition-transform duration-700 hover:scale-110"
                    priority
                  />
                  {/* Decorative ring */}
                  <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/10" />
                </div>
                {/* Orbiting dots */}
                <div className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-400 shadow-lg shadow-rose-500/50" />
                <div className="absolute -bottom-1 -left-1 h-2.5 w-2.5 rounded-full bg-amber-400 shadow-lg shadow-amber-500/50" />
              </div>

              {/* Badge text */}
              <div className="flex flex-col">
                <span className="inline-flex items-center gap-2 rounded-full border border-rose-200/24 bg-rose-200/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-rose-200/90 backdrop-blur-sm">
                  <Sparkles size={14} className="text-rose-400" />
                  Experiencia Premium
                </span>
              </div>
            </motion.div>

            {/* Title with gradient */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="max-w-3xl text-5xl font-black leading-[0.94] md:text-7xl lg:text-8xl"
            >
              <span className="bg-gradient-to-r from-rose-300 via-rose-200 to-rose-400 bg-clip-text text-transparent">
                Empresas Monarca
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-7 max-w-2xl text-lg leading-8 text-warm-50/80 md:text-xl"
            >
              Tecnología, inmuebles, electrodomésticos y financiación en una
              experiencia visual más elegante, rápida y confiable.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="mt-10 flex flex-col gap-3 sm:flex-row"
            >
              <a
                href="#productos"
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 px-7 py-4 text-sm font-black text-white shadow-lg shadow-rose-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-rose-600/30"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-rose-400 via-rose-500 to-rose-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <ArrowRight size={18} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                <span className="relative z-10">Explorar</span>
              </a>

              <a
                href="/prestamos"
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg border border-rose-200/24 bg-rose-200/8 px-7 py-4 text-sm font-black text-warm-50 backdrop-blur-sm transition-all duration-300 hover:border-rose-200/40 hover:bg-rose-200/15"
              >
                <CreditCard size={18} className="transition-transform duration-300 group-hover:scale-110" />
                Simular crédito
              </a>
            </motion.div>

            {/* Stats / Highlights */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="mt-14 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3"
            >
              {heroHighlights.map((item, idx) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.0 + idx * 0.15 }}
                    className="group rounded-xl border border-rose-200/15 bg-warm-900/60 p-5 shadow-xl shadow-rose-950/15 backdrop-blur-sm transition-all duration-300 hover:border-rose-200/30 hover:bg-warm-900/80 hover:shadow-2xl hover:shadow-rose-950/25"
                  >
                    <Icon className="text-rose-400 transition-transform duration-300 group-hover:scale-110" size={22} />
                    <p className="mt-4 text-sm font-black text-warm-50">{item.label}</p>
                    <p className="mt-1 text-xs text-warm-50/55">{item.value}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-warm-50/30">
            Scroll
          </span>
          <div className="h-8 w-[1px] bg-gradient-to-b from-rose-600/50 to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  );
}
