"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  BarChart3,
  CreditCard,
  Eye,
  Package,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import API from "@/app/services/api";

// ─── Types ────────────────────────────────────────────
type DashboardData = {
  revenue: { total: number; paidCount: number };
  financed: { total: number; totalRequests: number };
  pendingAmount: number;
  creditStats: {
    total: number;
    pending: number;
    approved: number;
    paid: number;
    rejected: number;
  };
  products: { total: number; totalViews: number; avgPrice: number };
  lowStock: {
    id: number;
    title: string;
    stock: string;
    price: string;
    category: string;
    image: string;
  }[];
  mostViewed: {
    id: number;
    title: string;
    price: string;
    category: string;
    image: string;
    views: number;
    recentViews: number;
  }[];
  monthly: {
    month: string;
    requests: number;
    financed: number;
    revenue: number;
  }[];
};

// ─── Helpers ──────────────────────────────────────────
function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    currency: "COP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function compactCurrency(value: number) {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value}`;
}

const MONTH_NAMES: Record<string, string> = {
  "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
};

function formatMonth(month: string) {
  const [, m] = month.split("-");
  return MONTH_NAMES[m] || month;
}

// ─── Custom Tooltip ───────────────────────────────────
function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  formatter?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-amber-200/20 bg-[#1a0f0a] p-4 shadow-2xl shadow-amber-950/30 backdrop-blur">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
        {label}
      </p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 text-sm">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-warm-50/60">{entry.name}:</span>
          <span className="font-bold text-warm-50">
            {formatter ? formatter(entry.value) : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────
function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  color,
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down";
  color: string;
}) {
  return (
    <div className="group rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-5 shadow-xl shadow-amber-950/15 backdrop-blur transition hover:border-amber-200/25 hover:bg-amber-200/[0.09] md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-warm-50/45">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-warm-50 md:text-3xl">
            {value}
          </p>
          {sub && (
            <p className="mt-1 text-sm text-warm-50/55">{sub}</p>
          )}
        </div>

        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${color}`}
        >
          <Icon size={22} className="text-white" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 border-t border-amber-200/10 pt-3">
          {trend === "up" ? (
            <TrendingUp size={14} className="text-emerald-400" />
          ) : (
            <TrendingDown size={14} className="text-amber-500" />
          )}
          <span className="text-xs font-semibold text-warm-50/50">
            {trend === "up" ? "Creciendo" : "Requiere atención"}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────
export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const response = await API.get<DashboardData>("/analytics/dashboard");
      setData(response.data);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Loading State ────────────────────────────────
  if (loading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5 py-24 text-warm-50">
        <div className="flex items-center gap-3 rounded-lg border border-amber-200/12 bg-amber-200/[0.06] px-6 py-4">
          <RefreshCw className="h-5 w-5 animate-spin text-amber-400" />
          <span className="text-sm font-semibold">
            Cargando analíticas...
          </span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5 py-24 text-warm-50">
        <p className="text-warm-50/60">Error al cargar las analíticas.</p>
      </div>
    );
  }

  const chartColors = {
    amber: "#f59e0b",
    emerald: "#10b981",
    warm: "#d4a574",
    cyan: "#06b6d4",
    rose: "#f43f5e",
  };

  return (
    <div className="px-5 py-8 text-warm-50 md:px-8 lg:px-12 lg:py-12">
      {/* HEADER */}
      <section className="mb-10 max-w-6xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-lg border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.24em] text-amber-400">
          <BarChart3 size={16} />
          Inteligencia de negocio
        </div>

        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-4xl font-black md:text-6xl">Analíticas</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-warm-50/62">
              Panorama completo de ventas, financiamiento, productos y
              rendimiento de la tienda.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="inline-flex h-fit items-center gap-2 rounded-lg border border-amber-200/15 bg-amber-200/10 px-4 py-3 text-sm font-black text-amber-400 transition hover:bg-amber-200/15 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </section>

      {/* SUMMARY CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Banknote}
          label="Ingresos Totales"
          value={compactCurrency(data.revenue.total)}
          sub={`${data.revenue.paidCount} créditos pagados`}
          trend="up"
          color="bg-gradient-to-br from-emerald-500 to-emerald-700"
        />

        <SummaryCard
          icon={CreditCard}
          label="Total Financiado"
          value={compactCurrency(data.financed.total)}
          sub={`${data.financed.totalRequests} solicitudes`}
          trend="up"
          color="bg-gradient-to-br from-amber-500 to-amber-700"
        />

        <SummaryCard
          icon={Package}
          label="Productos"
          value={String(data.products.total)}
          sub={`${data.products.totalViews} vistas · ${compactCurrency(data.products.avgPrice)} promedio`}
          color="bg-gradient-to-br from-cyan-500 to-cyan-700"
        />

        <SummaryCard
          icon={AlertTriangle}
          label="Pendientes por financiar"
          value={compactCurrency(data.pendingAmount)}
          sub={`${data.creditStats.pending} solicitudes pendientes`}
          trend={data.creditStats.pending > 0 ? "up" : "down"}
          color="bg-gradient-to-br from-rose-500 to-rose-700"
        />
      </section>

      {/* CHARTS ROW */}
      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* MONTHLY REVENUE CHART */}
        <div className="rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-5 shadow-xl shadow-amber-950/15 backdrop-blur md:p-6">
          <div className="flex items-center gap-3 border-b border-amber-200/10 pb-4">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
              <TrendingUp size={18} />
            </span>
            <div>
              <h3 className="text-lg font-black">Ingresos Mensuales</h3>
              <p className="text-xs text-warm-50/50">Últimos 12 meses</p>
            </div>
          </div>

          <div className="mt-6 h-[280px]">
            {data.monthly.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-warm-50/40">
                  No hay datos de ingresos aún. Cuando se procesen créditos pagados, aparecerán aquí.
                </p>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthly}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColors.emerald} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={chartColors.emerald} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,165,116,0.08)" />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => compactCurrency(v)}
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  wrapperStyle={{ background: "transparent", border: "none", boxShadow: "none", outline: "none" }}
                  content={
                    <ChartTooltip formatter={(v) => formatCurrency(v)} />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Ingresos"
                  stroke={chartColors.emerald}
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: chartColors.emerald }}
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* MONTHLY FINANCING CHART */}
        <div className="rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-5 shadow-xl shadow-amber-950/15 backdrop-blur md:p-6">
          <div className="flex items-center gap-3 border-b border-amber-200/10 pb-4">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 text-white">
              <CreditCard size={18} />
            </span>
            <div>
              <h3 className="text-lg font-black">Financiamiento Mensual</h3>
              <p className="text-xs text-warm-50/50">Monto solicitado por mes</p>
            </div>
          </div>

          <div className="mt-6 h-[280px]">
            {data.monthly.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-warm-50/40">
                  No hay solicitudes de crédito registradas. Los datos aparecerán cuando los clientes soliciten financiamiento.
                </p>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,165,116,0.08)" />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => compactCurrency(v)}
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  wrapperStyle={{ background: "transparent", border: "none", boxShadow: "none", outline: "none" }}
                  content={
                    <ChartTooltip formatter={(v) => formatCurrency(v)} />
                  }
                />
                <Bar
                  dataKey="financed"
                  name="Financiado"
                  fill={chartColors.amber}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                >
                  {data.monthly.map((entry) => (
                    <Cell
                      key={entry.month}
                      fill={entry.financed > 0 ? chartColors.amber : `${chartColors.amber}33`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* SECOND ROW */}
      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* MOST VIEWED PRODUCTS */}
        <div className="rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-5 shadow-xl shadow-amber-950/15 backdrop-blur md:p-6">
          <div className="flex items-center gap-3 border-b border-amber-200/10 pb-4">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-700 text-white">
              <Eye size={18} />
            </span>
            <div>
              <h3 className="text-lg font-black">Productos más vistos</h3>
              <p className="text-xs text-warm-50/50">Top 10 por visualizaciones</p>
            </div>
          </div>

          <div className="mt-6 h-[280px]">
            {data.mostViewed.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-warm-50/40">
                  Aún no hay datos de visualizaciones.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.mostViewed.slice(0, 8)}
                  layout="vertical"
                  margin={{ left: 0, right: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(212,165,116,0.08)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="rgba(255,255,255,0.2)"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="title"
                    type="category"
                    width={120}
                    tick={(props) => {
                      const title = props.payload.value;
                      return (
                        <text
                          x={props.x}
                          y={props.y}
                          dy={4}
                          textAnchor="end"
                          fill="rgba(255,255,255,0.5)"
                          fontSize={11}
                          className="truncate"
                        >
                          {title.length > 18
                            ? `${title.slice(0, 18)}…`
                            : title}
                        </text>
                      );
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    wrapperStyle={{ background: "transparent", border: "none", boxShadow: "none", outline: "none" }}
                    content={<ChartTooltip formatter={(v) => `${v} vistas`} />}
                  />
                  <Bar
                    dataKey="views"
                    name="Vistas"
                    fill={chartColors.cyan}
                    radius={[0, 4, 4, 0]}
                    maxBarSize={24}
                  >
                    {data.mostViewed.slice(0, 8).map((entry) => (
                      <Cell
                        key={entry.id}
                        fill={
                          entry.views > 0
                            ? chartColors.cyan
                            : `${chartColors.cyan}33`
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CREDIT STATUS BREAKDOWN */}
        <div className="rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-5 shadow-xl shadow-amber-950/15 backdrop-blur md:p-6">
          <div className="flex items-center gap-3 border-b border-amber-200/10 pb-4">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-rose-500 to-rose-700 text-white">
              <BarChart3 size={18} />
            </span>
            <div>
              <h3 className="text-lg font-black">Estado de Créditos</h3>
              <p className="text-xs text-warm-50/50">
                {data.creditStats.total} solicitudes totales
              </p>
            </div>
          </div>

          <div className="mt-6 h-[280px]">
            {data.creditStats.total === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-warm-50/40">
                  No hay solicitudes de crédito registradas.
                </p>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: "Pendientes",
                    value: data.creditStats.pending,
                    fill: chartColors.amber,
                  },
                  {
                    name: "Aprobados",
                    value: data.creditStats.approved,
                    fill: chartColors.emerald,
                  },
                  {
                    name: "Pagados",
                    value: data.creditStats.paid,
                    fill: chartColors.cyan,
                  },
                  {
                    name: "Rechazados",
                    value: data.creditStats.rejected,
                    fill: chartColors.rose,
                  },
                ]}
                margin={{ top: 20, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(212,165,116,0.08)"
                />
                <XAxis
                  dataKey="name"
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  wrapperStyle={{ background: "transparent", border: "none", boxShadow: "none", outline: "none" }}
                  content={
                    <ChartTooltip formatter={(v) => String(v)} />
                  }
                />
                <Bar
                  dataKey="value"
                  name="Cantidad"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                >
                  {[
                    { name: "Pendientes", value: data.creditStats.pending, fill: chartColors.amber },
                    { name: "Aprobados", value: data.creditStats.approved, fill: chartColors.emerald },
                    { name: "Pagados", value: data.creditStats.paid, fill: chartColors.cyan },
                    { name: "Rechazados", value: data.creditStats.rejected, fill: chartColors.rose },
                  ].map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* LOW STOCK */}
      <section className="mt-6">
        <div className="rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-5 shadow-xl shadow-amber-950/15 backdrop-blur md:p-6">
          <div className="flex items-center gap-3 border-b border-amber-200/10 pb-4">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 text-white">
              <AlertTriangle size={18} />
            </span>
            <div>
              <h3 className="text-lg font-black">Stock Bajo</h3>
              <p className="text-xs text-warm-50/50">
                Productos con stock ≤ 5 unidades
              </p>
            </div>
          </div>

          <div className="mt-6">
            {data.lowStock.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 rounded-lg border border-emerald-200/20 bg-emerald-200/10 px-5 py-3">
                  <TrendingUp size={18} className="text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-400">
                    No hay productos con stock bajo
                  </span>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-amber-200/10 text-[11px] font-bold uppercase tracking-[0.18em] text-warm-50/40">
                      <th className="pb-3 pr-4">Producto</th>
                      <th className="pb-3 pr-4">Categoría</th>
                      <th className="pb-3 pr-4">Precio</th>
                      <th className="pb-3 pr-4">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lowStock.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-amber-200/8 last:border-0"
                      >
                        <td className="py-3 pr-4 font-bold text-warm-50">
                          {product.title}
                        </td>
                        <td className="py-3 pr-4 text-warm-50/60">
                          {product.category}
                        </td>
                        <td className="py-3 pr-4 text-warm-50/80">
                          {formatCurrency(Number(product.price))}
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold ${
                              Number(product.stock) <= 2
                                ? "border border-rose-200/25 bg-rose-200/10 text-rose-400"
                                : "border border-amber-200/25 bg-amber-200/10 text-amber-400"
                            }`}
                          >
                            <AlertTriangle size={12} />
                            {product.stock} uds
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* MONTHLY REQUESTS LINE */}
      <section className="mt-6">
        <div className="rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-5 shadow-xl shadow-amber-950/15 backdrop-blur md:p-6">
          <div className="flex items-center gap-3 border-b border-amber-200/10 pb-4">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-amber-500 to-emerald-600 text-white">
              <BarChart3 size={18} />
            </span>
            <div>
              <h3 className="text-lg font-black">Solicitudes Mensuales</h3>
              <p className="text-xs text-warm-50/50">Créditos solicitados por mes</p>
            </div>
          </div>

          <div className="mt-6 h-[240px]">
            {data.monthly.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-warm-50/40">
                  No hay solicitudes registradas en los últimos 12 meses.
                </p>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,165,116,0.08)" />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  wrapperStyle={{ background: "transparent", border: "none", boxShadow: "none", outline: "none" }}
                  content={<ChartTooltip formatter={(v) => `${v} solicitudes`} />}
                />
                <Line
                  type="monotone"
                  dataKey="requests"
                  name="Solicitudes"
                  stroke={chartColors.amber}
                  strokeWidth={2.5}
                  dot={{ fill: chartColors.amber, r: 4 }}
                  activeDot={{ r: 6, fill: chartColors.amber }}
                />
              </LineChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
