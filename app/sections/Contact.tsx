"use client";

import { motion } from "framer-motion";
import { ParallaxBg } from "../components/ParallaxBg";
import {
  ArrowUpRight,
  AtSign,
  Camera,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Sparkles,
} from "lucide-react";

const contactInfo = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "+54 9 379 409-9045",
    href: "https://wa.me/5493794099045",
    color: "from-emerald-500 to-emerald-700",
  },
  {
    icon: Mail,
    label: "Correo electrónico",
    value: "Monarca.mfp@gmail.com",
    href: "mailto:Monarca.mfp@gmail.com",
    color: "from-rose-500 to-rose-700",
  },
  {
    icon: MapPin,
    label: "Ubicación",
    value: "Corrientes Capital - Argentina",
    href: null,
    color: "from-amber-500 to-amber-700",
  },
  {
    icon: Phone,
    label: "Teléfono",
    value: "+54 9 379 409-9045",
    href: "tel:+5493794099045",
    color: "from-cyan-500 to-cyan-700",
  },
];

const socialLinks = [
  { icon: MessageCircle, label: "WhatsApp", href: "https://wa.me/5493794099045", color: "text-emerald-400 hover:text-emerald-300" },
  { icon: Camera, label: "Instagram", href: "https://instagram.com/empresasmonarca", color: "text-rose-400 hover:text-rose-300" },
  { icon: Globe, label: "Facebook", href: "https://www.facebook.com/share/1CfyX9u5yh/", color: "text-amber-400 hover:text-amber-300" },
  { icon: AtSign, label: "Email", href: "mailto:Monarca.mfp@gmail.com", color: "text-cyan-400 hover:text-cyan-300" },
];

export default function Contact() {
  return (
    <section
      id="contacto"
      className="relative overflow-hidden bg-[linear-gradient(135deg,#1a0f0a_0%,#2d1f14_52%,#1a0f0a_100%)] px-5 py-24 text-warm-50 md:px-8"
    >
      <ParallaxBg speed={0.15}>
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-rose-500/8 blur-[120px] glow-pulse" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-amber-500/6 blur-[100px] glow-pulse" style={{ animationDelay: "2s" }} />
        <div className="pointer-events-none absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </ParallaxBg>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-14 text-center"
        >
          <p className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.28em] text-rose-300">
            <Sparkles size={14} />
            Conectemos
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
            Contáctanos
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-warm-50/60">
            Estamos aquí para ayudarte. Elige el canal que prefieras y te responderemos a la brevedad.
          </p>
        </motion.div>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Contact cards grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {contactInfo.map((item, idx) => {
              const Icon = item.icon;
              const isLink = !!item.href;
              const Tag = isLink ? "a" : "div";

              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Tag
                    href={item.href || undefined}
                    target={isLink ? "_blank" : undefined}
                    rel={isLink ? "noopener noreferrer" : undefined}
                    className="group relative block h-full rounded-xl border border-rose-200/10 bg-rose-200/[0.04] p-6 shadow-lg shadow-rose-950/20 backdrop-blur-sm transition-all duration-300 hover:border-rose-200/25 hover:shadow-xl hover:shadow-rose-950/30 hover:-translate-y-1"
                  >
                    {/* Icon */}
                    <div className={`inline-flex rounded-lg bg-gradient-to-br ${item.color} p-3 shadow-lg`}>
                      <Icon size={22} className="text-white" />
                    </div>

                    <h3 className="mt-4 text-lg font-black text-warm-50">
                      {item.label}
                    </h3>

                    <p className="mt-2 text-sm text-warm-50/70 break-all">
                      {item.value}
                    </p>

                    {isLink && (
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-rose-400/70 transition-all duration-300 group-hover:text-rose-400">
                        Contactar
                        <ArrowUpRight size={12} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                    )}
                  </Tag>
                </motion.div>
              );
            })}
          </div>

          {/* Right column: Social + Quick contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col gap-6"
          >
            {/* Social media */}
            <div className="rounded-xl border border-rose-200/10 bg-rose-200/[0.04] p-6 backdrop-blur-sm">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-warm-50/50">
                Redes sociales
              </h3>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {socialLinks.map((social, idx) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group flex items-center gap-3 rounded-lg border border-rose-200/10 bg-rose-200/[0.04] px-4 py-3 text-sm font-bold text-warm-50/70 transition-all duration-300 hover:border-rose-200/25 hover:bg-rose-200/[0.08] ${social.color}`}
                    >
                      <Icon size={18} className="transition-transform duration-300 group-hover:scale-110" />
                      {social.label}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Quick message */}
            <div className="rounded-xl border border-rose-200/10 bg-rose-200/[0.04] p-6 backdrop-blur-sm">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-warm-50/50">
                Escríbenos rápido
              </h3>
              <p className="mt-2 text-sm text-warm-50/60">
                ¿Prefieres contactarnos directamente por WhatsApp?
              </p>
              <a
                href="https://wa.me/5493794099045"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-950/30 transition-all duration-300 hover:from-emerald-500 hover:to-emerald-600 hover:shadow-xl hover:shadow-emerald-600/30 active:scale-95"
              >
                <MessageCircle size={18} />
                WhatsApp directo
                <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </motion.div>
        </div>

        {/* Bottom trust */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12 flex items-center justify-center gap-2 rounded-xl border border-rose-200/8 bg-rose-200/[0.03] px-5 py-3.5 text-xs text-warm-50/45 backdrop-blur-sm"
        >
          <Sparkles size={14} className="text-rose-500" />
          Respondemos en horario laboral — Corrientes Capital, Argentina
        </motion.div>
      </div>
    </section>
  );
}
