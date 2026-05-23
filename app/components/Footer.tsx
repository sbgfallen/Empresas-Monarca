"use client";

import { ArrowUp, AtSign, Camera, CheckCircle, Globe, Heart, LoaderCircle, Mail, MapPin, MessageCircle, Phone, XCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import API from "@/app/services/api";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<"success" | "error" | "exists" | null>(null);
  const [subscriptionMessage, setSubscriptionMessage] = useState("");

  const handleSubscribe = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setSubscriptionStatus("error");
      setSubscriptionMessage("Por favor ingresá un email válido.");
      setTimeout(() => setSubscriptionStatus(null), 3000);
      return;
    }

    setSubscribing(true);
    setSubscriptionStatus(null);

    try {
      const res = await API.post("/subscriptions/subscribe", { email: email.trim() });
      if (res.data.alreadySubscribed) {
        setSubscriptionStatus("exists");
      } else {
        setSubscriptionStatus("success");
      }
      setSubscriptionMessage(res.data.message || "¡Gracias por suscribirte!");
      setEmail("");
    } catch {
      setSubscriptionStatus("error");
      setSubscriptionMessage("Error al suscribir. Intentalo de nuevo.");
    } finally {
      setSubscribing(false);
      setTimeout(() => setSubscriptionStatus(null), 4000);
    }
  };
  return (
    <footer className="relative overflow-hidden bg-[linear-gradient(135deg,#1a0f0a_0%,#2d1f14_58%,#1a0f0a_100%)] px-5 py-16 text-warm-50 md:px-8">
      {/* Decorative elements */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full bg-rose-500/5 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-[250px] w-[250px] rounded-full bg-rose-600/5 blur-[80px]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_0.7fr_0.7fr_1.2fr]">
          {/* Brand */}
          <div>
            <div className="inline-flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl border border-rose-200/20 bg-rose-200/10 shadow-lg shadow-rose-500/20">
                <Image
                  src="/logo.jpg"
                  alt="Empresas Monarca"
                  width={48}
                  height={48}
                  className="h-full w-full rounded-xl object-cover"
                />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-rose-200/50">Empresas</p>
                <p className="text-2xl font-black leading-none text-warm-50">Monarca</p>
              </div>
            </div>

            <p className="mt-6 max-w-xs text-sm leading-6 text-warm-50/50">
              Marketplace de productos, inmuebles, servicios y financiación con
              una experiencia visual más cuidada.
            </p>

            {/* Social links */}
            <div className="mt-6 flex items-center gap-2">
              <a
                href="https://wa.me/5493794099045"
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-9 w-9 place-items-center rounded-lg border border-rose-200/10 bg-rose-200/5 text-emerald-400 transition-all duration-200 hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:shadow-lg hover:shadow-emerald-950/20"
              >
                <MessageCircle size={16} />
              </a>
              <a
                href="https://instagram.com/empresasmonarca"
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-9 w-9 place-items-center rounded-lg border border-rose-200/10 bg-rose-200/5 text-rose-400 transition-all duration-200 hover:border-rose-400/30 hover:bg-rose-500/10 hover:shadow-lg hover:shadow-rose-950/20"
              >
                <Camera size={16} />
              </a>
              <a
                href="https://www.facebook.com/share/1CfyX9u5yh/"
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-9 w-9 place-items-center rounded-lg border border-rose-200/10 bg-rose-200/5 text-amber-400 transition-all duration-200 hover:border-amber-400/30 hover:bg-amber-500/10 hover:shadow-lg hover:shadow-amber-950/20"
              >
                <Globe size={16} />
              </a>
              <a
                href="mailto:Monarca.mfp@gmail.com"
                className="grid h-9 w-9 place-items-center rounded-lg border border-rose-200/10 bg-rose-200/5 text-cyan-400 transition-all duration-200 hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:shadow-lg hover:shadow-cyan-950/20"
              >
                <AtSign size={16} />
              </a>
            </div>

            {/* Trust */}
            <div className="mt-4 flex items-center gap-3 text-warm-50/30">
              <span className="flex items-center gap-1.5 text-xs">
                <Heart size={13} className="text-rose-500/60" />
                Hecho en Argentina
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.22em] text-rose-200/50">
              Navegación
            </h3>
            <ul className="mt-5 space-y-3">
              {[
                { href: "/", label: "Inicio" },
                { href: "/productos", label: "Productos" },
                { href: "/prestamos", label: "Préstamos" },
                { href: "/noticias", label: "Noticias" },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-warm-50/60 transition-all duration-200 hover:text-rose-300 hover:translate-x-1 inline-block"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.22em] text-rose-200/50">
              Servicios
            </h3>
            <ul className="mt-5 space-y-3 text-sm text-warm-50/60">
              {["Inmuebles", "Créditos", "Fletes", "Tecnología", "Cotizaciones"].map((s) => (
                <li key={s} className="transition-all duration-200 hover:text-rose-300 hover:translate-x-1 cursor-default">
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Newsletter */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.22em] text-rose-200/50">
              Contacto
            </h3>

            <div className="mt-5 space-y-3">
              <a href="https://wa.me/5493794099045" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-warm-50/60 transition-all duration-200 hover:text-emerald-400 group">
                <span className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200/10 bg-rose-200/5 transition-all duration-200 group-hover:border-emerald-400/30 group-hover:bg-emerald-500/10">
                  <MessageCircle size={14} className="text-emerald-500" />
                </span>
                +54 9 379 409-9045
              </a>
              <a href="mailto:Monarca.mfp@gmail.com" className="flex items-center gap-3 text-sm text-warm-50/60 transition-all duration-200 hover:text-rose-500 group">
                <span className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200/10 bg-rose-200/5 transition-all duration-200 group-hover:border-rose-500/30 group-hover:bg-rose-500/10">
                  <Mail size={14} className="text-rose-500" />
                </span>
                Monarca.mfp@gmail.com
              </a>
              <p className="flex items-center gap-3 text-sm text-warm-50/60">
                <span className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200/10 bg-rose-200/5">
                  <Phone size={14} className="text-rose-500" />
                </span>
                +54 9 379 409-9045
              </p>
              <p className="flex items-center gap-3 text-sm text-warm-50/60">
                <span className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200/10 bg-rose-200/5">
                  <MapPin size={14} className="text-rose-500" />
                </span>
                Corrientes Capital - Argentina
              </p>
            </div>

            {/* Newsletter */}
            <div className="mt-6 rounded-xl border border-rose-200/10 bg-rose-200/[0.04] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-200/60">
                Novedades
              </p>

              {/* Status notification */}
              {subscriptionStatus && (
                <div className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                  subscriptionStatus === "success"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : subscriptionStatus === "exists"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}>
                  {subscriptionStatus === "success" ? (
                    <CheckCircle size={14} />
                  ) : subscriptionStatus === "exists" ? (
                    <CheckCircle size={14} />
                  ) : (
                    <XCircle size={14} />
                  )}
                  {subscriptionMessage}
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                  placeholder="tu@email.com"
                  className="min-w-0 flex-1 rounded-lg border border-rose-200/10 bg-warm-900/60 px-3 py-2 text-xs text-warm-50 outline-none transition focus:border-rose-500/40 placeholder:text-warm-50/30"
                />
                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className="rounded-lg bg-gradient-to-r from-rose-600 via-rose-700 to-rose-700 px-3 py-2 text-xs font-black text-white transition hover:from-rose-500 hover:via-rose-600 hover:to-rose-600 disabled:opacity-60 min-w-[80px] flex items-center justify-center gap-1.5"
                >
                  {subscribing ? (
                    <LoaderCircle size={14} className="animate-spin" />
                  ) : (
                    "Suscribir"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col gap-4 border-t border-warm-50/8 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-warm-50/35">
            &copy; 2026 Empresas Monarca. Todos los derechos reservados.
          </p>

          <div className="flex items-center gap-4">
            <p className="text-xs text-warm-50/30">
              Diseñado para una experiencia premium.
            </p>
            <a
              href="/"
              className="grid h-9 w-9 place-items-center rounded-lg border border-rose-200/15 bg-rose-200/8 text-warm-50/50 transition-all duration-300 hover:border-rose-200/30 hover:bg-rose-200/15 hover:text-rose-300 hover:shadow-lg hover:shadow-rose-500/20"
            >
              <ArrowUp size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
