"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ParallaxBg } from "./ParallaxBg";
import {
  Calculator,
  CheckCircle2,
  CreditCard,
  Gem,
  LoaderCircle,
  Mail,
  Percent,
  Phone,
  Sparkles,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";

import API from "../services/api";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

type PaymentPlan = "daily" | "weekly" | "monthly";

const PLAN_CONFIG: Record<PaymentPlan, { label: string; desc: string; multiplier: number; divisor: number; icon: typeof Zap }> = {
  daily: { label: "Diario", desc: "30 cuotas", multiplier: 1.60, divisor: 30, icon: Zap },
  weekly: { label: "Semanal", desc: "4 cuotas", multiplier: 1.60, divisor: 4, icon: TrendingUp },
  monthly: { label: "Mensual", desc: "1 cuota", multiplier: 1.60, divisor: 1, icon: CalendarDays },
};

// Import CalendarDays from lucide
import { CalendarDays } from "lucide-react";

type SubmissionStatus = "idle" | "sending" | "success" | "error";

export default function LoanCalculator() {
  const [amount, setAmount] = useState(500000);
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan>("monthly");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const plan = PLAN_CONFIG[paymentPlan];
  const total = Math.round(amount * plan.multiplier);
  const installment = Math.round(total / plan.divisor);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      await API.post("/credits", {
        amount,
        email,
        name,
        phone,
        paymentPlan,
      });

      setStatus("success");
    } catch (error: unknown) {
      const err = error as {
        code?: string;
        message?: string;
        response?: { data?: { error?: string }; status?: number };
      };

      if (err.response) {
        setErrorMsg(
          err.response.data?.error ||
            `Error del servidor (${err.response.status})`
        );
      } else if (err.code === "ERR_NETWORK") {
        setErrorMsg(
          "No se puede conectar con el servidor. " +
            "¿Está el backend corriendo? (cd server && npm start)"
        );
      } else {
        setErrorMsg("Error al enviar la solicitud. Intenta de nuevo.");
      }

      setStatus("error");
    }
  };

  const handleReset = () => {
    setName("");
    setEmail("");
    setPhone("");
    setStatus("idle");
    setErrorMsg("");
  };

  // --- SUCCESS STATE ---
  if (status === "success") {
    return (
      <section
        id="credito"
        className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(244,63,94,0.10),transparent_40%),linear-gradient(135deg,#1a0f0a_0%,#2d1f14_52%,#1a0f0a_100%)] px-5 py-24 md:px-8"
      >
        <ParallaxBg speed={0.12}>
          <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-rose-500/8 blur-[120px] glow-pulse" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-rose-600/8 blur-[140px] glow-pulse" style={{ animationDelay: "1.5s" }} />
          <div className="pointer-events-none absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </ParallaxBg>

        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 shadow-2xl shadow-rose-500/30">
            <CheckCircle2 size={48} className="text-white" />
          </div>

          <h2 className="mt-8 text-4xl font-black text-warm-50 md:text-5xl">
            ¡Solicitud enviada!
          </h2>

          <p className="mx-auto mt-6 max-w-lg text-lg leading-7 text-warm-50/65">
            Hemos recibido tu solicitud de crédito por{" "}
            <strong className="text-rose-400">{formatCurrency(amount)}</strong>{" "}
            en {plan.desc.toLowerCase()}.
            Un asesor se comunicará contigo en las próximas horas para darte una
            respuesta.
          </p>

          <div className="mx-auto mt-8 grid max-w-md gap-3 rounded-2xl border border-rose-200/10 bg-rose-200/[0.04] p-6 text-left shadow-2xl shadow-rose-950/30 backdrop-blur-sm">
            <p className="flex items-center gap-3 text-sm text-warm-50/70">
              <User size={16} className="text-rose-500" />
              {name}
            </p>
            <p className="flex items-center gap-3 text-sm text-warm-50/70">
              <Mail size={16} className="text-rose-500" />
              {email}
            </p>
            <p className="flex items-center gap-3 text-sm text-warm-50/70">
              <Phone size={16} className="text-rose-500" />
              {phone}
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="group relative mt-8 inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-rose-600 via-rose-700 to-rose-700 px-7 py-4 text-sm font-black text-white shadow-xl shadow-rose-500/20 transition-all duration-300 hover:shadow-2xl hover:shadow-rose-600/30 hover:scale-105 active:scale-95"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-rose-500 via-rose-600 to-rose-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative z-10">Nueva solicitud</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      id="credito"
      className="relative overflow-hidden bg-[radial-gradient(circle_at_80%_20%,rgba(244,63,94,0.10),transparent_40%),radial-gradient(circle_at_20%_80%,rgba(244,63,94,0.06),transparent_30%),linear-gradient(135deg,#1a0f0a_0%,#2d1f14_52%,#1a0f0a_100%)] px-5 py-24 md:px-8"
    >
      <ParallaxBg speed={0.12}>
        <div className="pointer-events-none absolute -left-40 top-1/4 h-80 w-80 rounded-full bg-rose-500/8 blur-[120px] glow-pulse" />
        <div className="pointer-events-none absolute -right-32 bottom-1/4 h-72 w-72 rounded-full bg-rose-600/6 blur-[100px] glow-pulse" style={{ animationDelay: "2s" }} />
        <div className="pointer-events-none absolute left-1/2 top-10 h-40 w-40 rounded-full bg-rose-400/5 blur-[80px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="pointer-events-none absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full border border-rose-500/5 spin-slow" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-[250px] w-[250px] rounded-full border border-rose-600/5 spin-slow" style={{ animationDirection: "reverse" }} />
      </ParallaxBg>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
        {/* LEFT COLUMN - INFO */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.28em] text-rose-300"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Financiación
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-4xl font-black leading-tight text-warm-50 md:text-6xl"
          >
            Solicita tu{" "}
            <span className="bg-gradient-to-r from-rose-200 via-rose-300 to-rose-500 bg-clip-text text-transparent">
              crédito
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 max-w-md text-base leading-7 text-warm-50/60"
          >
            Elegí el monto y la modalidad de pago que mejor se adapte a vos.
            Completá el formulario y te respondemos al instante.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-10 grid max-w-md grid-cols-3 gap-4"
          >
            {[
              { icon: CreditCard, label: "Flexible", desc: "Elegí tu plan" },
              { icon: Percent, label: "Claro", desc: "Sin sorpresas" },
              { icon: Zap, label: "Rápido", desc: "Aprobación ágil" },
            ].map((item, idx) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 + idx * 0.12 }}
                  className="group relative overflow-hidden rounded-xl border border-rose-200/10 bg-rose-200/[0.04] p-5 shadow-lg shadow-rose-950/20 backdrop-blur-sm transition-all duration-300 hover:border-rose-200/25 hover:bg-rose-200/[0.08] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-rose-950/30"
                >
                  <div className="absolute -right-4 -top-4 h-12 w-12 rounded-full bg-rose-500/5 blur-[20px] transition-all duration-300 group-hover:bg-rose-500/10" />
                  <Icon size={22} className="relative text-rose-500 transition-transform duration-300 group-hover:scale-110" />
                  <p className="relative mt-5 text-xs font-black uppercase tracking-[0.18em] text-warm-50">
                    {item.label}
                  </p>
                  <p className="relative mt-1 text-[10px] text-warm-50/40">{item.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Trust indicator */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-10 inline-flex items-center gap-2 rounded-lg border border-rose-200/8 bg-rose-200/[0.03] px-4 py-3 text-xs text-warm-50/45 backdrop-blur-sm"
          >
            <Gem size={14} className="text-rose-500" />
            Sin costo oculto — tasa fija durante todo el crédito
          </motion.div>
        </motion.div>

        {/* RIGHT COLUMN - CALCULATOR + FORM */}
        <div className="space-y-8">
          {/* CALCULATOR - 3D Glass Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="group relative overflow-hidden rounded-2xl border border-rose-200/10 bg-gradient-to-b from-rose-200/[0.06] to-rose-200/[0.02] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-all duration-500 hover:shadow-[0_25px_80px_-15px_rgba(244,63,94,0.15)] hover:border-rose-200/20"
          >
            <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-b from-rose-500/5 via-transparent to-rose-700/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="pointer-events-none absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />

            <div className="relative p-6 md:p-8">
              {/* Header */}
              <div className="flex items-center gap-4 border-b border-rose-200/10 pb-6">
                <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-rose-600 via-rose-700 to-rose-700 shadow-lg shadow-rose-500/20">
                  <Calculator size={26} className="text-white" />
                  <span className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </span>

                <div>
                  <h3 className="text-2xl font-black text-warm-50">
                    Calculá tu plan
                  </h3>
                  <p className="mt-1 text-sm text-warm-50/50">
                    Elegí el monto y la modalidad de pago
                  </p>
                </div>
              </div>

              {/* Amount Slider */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5 }}
                className="mt-8"
              >
                <span className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2 text-sm font-bold text-warm-50/80">
                    <Calculator size={14} className="text-rose-500" />
                    Monto
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setAmount(Math.min(val, 1000000));
                    }}
                    className="w-36 rounded-xl border border-rose-200/12 bg-warm-900/80 px-4 py-2.5 text-right text-sm font-black text-warm-50 outline-none transition focus:border-rose-500/50 focus:shadow-[0_0_20px_rgba(244,63,94,0.08)]"
                    min={10000}
                    max={1000000}
                    step={10000}
                  />
                </span>
                <div className="relative mt-4">
                  <input
                    type="range"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="relative z-10 mt-0 w-full accent-rose-600"
                    min={10000}
                    max={1000000}
                    step={10000}
                  />
                  <div className="pointer-events-none absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 rounded-full bg-rose-200/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-700 transition-all duration-200"
                      style={{ width: `${((amount - 10000) / (1000000 - 10000)) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-warm-50/40">
                  <span>{formatCurrency(10000)}</span>
                  <span className="font-bold text-rose-400/60">${amount.toLocaleString()} ARS</span>
                  <span>{formatCurrency(1000000)}</span>
                </div>
              </motion.div>

              {/* Payment Plan Selector */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-8"
              >
                <span className="flex items-center gap-2 text-sm font-bold text-warm-50/80 mb-4">
                  <CalendarDays size={14} className="text-rose-500" />
                  Modalidad de pago
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.entries(PLAN_CONFIG) as [PaymentPlan, typeof PLAN_CONFIG["daily"]][]).map(([key, cfg]) => {
                    const isSelected = paymentPlan === key;
                    const Icon = cfg.icon;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPaymentPlan(key)}
                        className={`group relative overflow-hidden rounded-xl border p-4 text-center transition-all duration-300 ${
                          isSelected
                            ? "border-rose-500/40 bg-gradient-to-b from-rose-500/15 to-rose-700/10 shadow-lg shadow-rose-500/15"
                            : "border-rose-200/10 bg-rose-200/[0.04] hover:border-rose-200/25 hover:bg-rose-200/[0.08]"
                        }`}
                      >
                        {isSelected && (
                          <div className="pointer-events-none absolute -inset-1 rounded-xl bg-gradient-to-b from-rose-500/10 via-transparent to-rose-700/10" />
                        )}
                        <Icon size={20} className={`mx-auto transition-transform duration-300 group-hover:scale-110 ${
                          isSelected ? "text-rose-400" : "text-warm-50/50"
                        }`} />
                        <p className={`mt-2 text-sm font-black transition-colors ${
                          isSelected ? "text-rose-400" : "text-warm-50/70"
                        }`}>
                          {cfg.label}
                        </p>
                        <p className={`text-[10px] font-bold transition-colors ${
                          isSelected ? "text-rose-300/60" : "text-warm-50/40"
                        }`}>
                          {cfg.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Results - 3D cards */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-30px" }}
                variants={{
                  visible: { transition: { staggerChildren: 0.15 } },
                  hidden: {},
                }}
                className="mt-8 grid gap-4 border-t border-rose-200/10 pt-6 md:grid-cols-2"
              >
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.95 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } },
                  }}
                  className="relative overflow-hidden rounded-xl border border-rose-200/10 bg-gradient-to-br from-warm-800/80 to-warm-900/80 p-6 shadow-lg shadow-rose-950/30 transition-all duration-300 hover:border-rose-200/20 hover:shadow-xl hover:shadow-rose-950/40"
                >
                  <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-rose-500/5 blur-[30px]" />
                  <p className="relative text-xs font-black uppercase tracking-[0.2em] text-warm-50/45">
                    Total a pagar
                  </p>
                  <p className="relative mt-3 text-3xl font-black text-warm-50">
                    {formatCurrency(total)}
                  </p>
                  <div className="relative mt-2 flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-rose-500/50" />
                    <span className="text-[10px] text-warm-50/50">
                      Interés {plan.label.toLowerCase()}: {Math.round((plan.multiplier - 1) * 100)}%
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.95 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } },
                  }}
                  className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-600 via-rose-700 to-rose-700 p-6 shadow-xl shadow-rose-500/20 transition-all duration-300 hover:shadow-2xl hover:shadow-rose-600/30 hover:scale-[1.02]"
                >
                  <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-[40px]" />
                  <div className="pointer-events-none absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-white/5 blur-[30px]" />
                  
                  <p className="relative text-xs font-black uppercase tracking-[0.2em] text-white/60">
                    Cuota {plan.label.toLowerCase()}
                  </p>
                  <p className="relative mt-3 text-3xl font-black text-white">
                    {formatCurrency(installment)}
                  </p>
                  <div className="relative mt-2 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-white/50" />
                    <span className="text-[10px] text-white/50">
                      {plan.desc} — fija durante todo el plazo
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* APPLICATION FORM */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="group relative overflow-hidden rounded-2xl border border-rose-200/10 bg-gradient-to-b from-rose-200/[0.06] to-rose-200/[0.02] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-all duration-500 hover:shadow-[0_25px_80px_-15px_rgba(244,63,94,0.15)] hover:border-rose-200/20"
          >
            <div className="pointer-events-none absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />

            <div className="relative p-6 md:p-8">
              <h3 className="flex items-center gap-2 text-2xl font-black text-warm-50">
                <User size={20} className="text-rose-500" />
                Completá tus datos
              </h3>
              <p className="mt-2 text-sm text-warm-50/50">
                Te contactaremos para formalizar tu crédito.
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="flex items-center gap-2 text-sm font-bold text-warm-50/70">
                    <User size={14} className="text-rose-500" />
                    Nombre completo
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-rose-200/12 bg-warm-900/80 px-4 py-3.5 text-warm-50 outline-none transition focus:border-rose-500/50 focus:shadow-[0_0_20px_rgba(244,63,94,0.08)] placeholder:text-warm-50/30"
                    placeholder="Tu nombre"
                    required
                  />
                </label>

                <label className="block">
                  <span className="flex items-center gap-2 text-sm font-bold text-warm-50/70">
                    <Mail size={14} className="text-rose-500" />
                    Correo electrónico
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-rose-200/12 bg-warm-900/80 px-4 py-3.5 text-warm-50 outline-none transition focus:border-rose-500/50 focus:shadow-[0_0_20px_rgba(244,63,94,0.08)] placeholder:text-warm-50/30"
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </label>

                <label className="block">
                  <span className="flex items-center gap-2 text-sm font-bold text-warm-50/70">
                    <Phone size={14} className="text-rose-500" />
                    Teléfono
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-rose-200/12 bg-warm-900/80 px-4 py-3.5 text-warm-50 outline-none transition focus:border-rose-500/50 focus:shadow-[0_0_20px_rgba(244,63,94,0.08)] placeholder:text-warm-50/30"
                    placeholder="+54 11 XXXX-XXXX"
                    required
                  />
                </label>
              </div>

              {status === "error" && errorMsg && (
                <p className="mt-5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-5 py-3.5 text-sm font-semibold text-rose-300 shadow-lg shadow-rose-950/20">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="group/btn relative mt-6 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-rose-600 via-rose-700 to-rose-700 px-6 py-4 text-sm font-black text-white shadow-xl shadow-rose-500/20 transition-all duration-300 hover:shadow-2xl hover:shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-rose-500 via-rose-600 to-rose-600 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100" />
                {status === "sending" ? (
                  <span className="relative z-10 inline-flex items-center gap-2">
                    <LoaderCircle size={18} className="animate-spin" />
                    Enviando solicitud...
                  </span>
                ) : (
                  <span className="relative z-10 inline-flex items-center gap-2">
                    <CreditCard size={18} />
                    Solicitar crédito
                  </span>
                )}
              </button>
            </div>
          </motion.form>
        </div>
      </div>
    </section>
  );
}
