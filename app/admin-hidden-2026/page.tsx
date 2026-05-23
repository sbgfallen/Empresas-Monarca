"use client";

import {
  BadgePercent,
  BarChart3,
  CreditCard,
  Package,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

const metrics = [
  {
    label: "Catalogo",
    value: "Productos",
    detail: "Inventario, imagenes y stock",
    icon: Package,
    tone: "text-amber-400 bg-amber-200/10 border-amber-200/25",
  },
  {
    label: "Marketing",
    value: "Promos",
    detail: "Ofertas, banners y campanas",
    icon: BadgePercent,
    tone: "text-emerald-400 bg-emerald-200/10 border-emerald-200/25",
  },
  {
    label: "Finanzas",
    value: "Creditos",
    detail: "Solicitudes y simulaciones",
    icon: CreditCard,
    tone: "text-amber-400 bg-amber-200/10 border-amber-200/25",
  },
];

const nextBlocks = [
  "Analiticas premium",
  "Creditos reales",
  "Promociones dinamicas",
  "WhatsApp automatico",
];

export default function DashboardPage() {
  return (
    <div className="px-5 py-8 text-white md:px-8 lg:px-12 lg:py-12">
      <section className="max-w-6xl">
        <div className="mb-10 inline-flex items-center gap-2 rounded-lg border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.28em] text-amber-400">
          <ShieldCheck size={16} />
          Premium admin
        </div>

        <h1 className="max-w-4xl text-5xl font-black leading-none text-warm-50 md:text-7xl">
          Dashboard
        </h1>

        <p className="mt-6 max-w-4xl text-lg leading-8 text-warm-50/68 md:text-xl">
          Controla inventario, promociones, publicaciones y creditos desde un
          panel protegido con sesion admin, JWT y permisos por rol.
        </p>
      </section>

      <section className="mt-12 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {metrics.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.label}
              className="rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-5 shadow-xl shadow-amber-950/25 backdrop-blur"
            >
              <div
                className={`mb-8 grid h-12 w-12 place-items-center rounded-lg border ${item.tone}`}
              >
                <Icon size={23} />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.24em] text-warm-50/42">
                {item.label}
              </p>

              <h2 className="mt-3 text-3xl font-black text-warm-50">
                {item.value}
              </h2>

              <p className="mt-3 text-sm leading-6 text-warm-50/58">
                {item.detail}
              </p>
            </article>
          );
        })}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg border border-emerald-200/25 bg-emerald-200/10 text-emerald-400">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-warm-50/42">
                Siguiente etapa
              </p>
              <h2 className="text-xl font-black text-warm-50">Ecommerce real</h2>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {nextBlocks.map((block) => (
              <div
                key={block}
                className="rounded-lg border border-amber-200/10 bg-warm-900/50 px-4 py-3 text-sm font-bold text-warm-50/72"
              >
                {block}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-5 backdrop-blur">
          <div className="mb-6 grid h-11 w-11 place-items-center rounded-lg border border-amber-200/25 bg-amber-200/10 text-amber-400">
            <BarChart3 size={22} />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.22em] text-warm-50/42">
            Base lista
          </p>
          <h2 className="mt-3 text-xl font-black text-warm-50">Panel protegido</h2>
          <p className="mt-3 text-sm leading-6 text-warm-50/58">
            Ya podemos construir analiticas, promociones y solicitudes de
            credito sobre una administracion privada.
          </p>
        </article>
      </section>
    </div>
  );
}
