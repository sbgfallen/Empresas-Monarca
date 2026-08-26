"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  CircleCheck,
  Clock,
  LoaderCircle,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";

import API from "@/app/services/api";

type CreditStatus = "pending" | "approved" | "rejected" | "paid";

type CreditRecord = {
  amount: string;
  created_at: string;
  email: string;
  id: number;
  interest_rate: string;
  monthly_payment: string;
  name: string;
  notes: string;
  phone: string;
  status: CreditStatus;
  term_months: number;
  total_payment: string;
  updated_at: string;
};

type StatusCounts = {
  approved: number;
  paid: number;
  pending: number;
  rejected: number;
  total: number;
};

const STATUS_CONFIG: Record<
  CreditStatus,
  { icon: typeof Clock; label: string; color: string }
> = {
  pending: {
    icon: Clock,
    label: "Pendiente",
    color: "text-rose-500 border-rose-200/25 bg-rose-200/10",
  },
  approved: {
    icon: CheckCircle2,
    label: "Aprobado",
    color: "text-emerald-400 border-emerald-200/25 bg-emerald-200/10",
  },
  rejected: {
    icon: XCircle,
    label: "Rechazado",
    color: "text-rose-400 border-rose-200/25 bg-rose-200/10",
  },
  paid: {
    icon: CircleCheck,
    label: "Pagado",
    color: "text-emerald-400 border-emerald-200/25 bg-emerald-200/10",
  },
};

function formatCurrency(value: string | number) {
  const num = Number(value);

  if (!Number.isFinite(num)) return "$0";

  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(num);
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function AdminCreditsPage() {
  const [credits, setCredits] = useState<CreditRecord[]>([]);
  const [counts, setCounts] = useState<StatusCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CreditStatus | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchCredits = useCallback(async () => {
    try {
      const params: Record<string, string> = {};

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await API.get<{
        counts: StatusCounts;
        credits: CreditRecord[];
      }>("/credits", { params });

      setCredits(response.data.credits);
      setCounts(response.data.counts);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchCredits();
  }, [fetchCredits]);

  const updateStatus = async (
    id: number,
    status: CreditStatus,
    notes = ""
  ) => {
    setUpdatingId(id);

    try {
      await API.patch(`/credits/${id}/status`, { status, notes });
      await fetchCredits();
    } catch {
      // Silent fail
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredCredits = credits.filter((credit) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();

    return (
      credit.name.toLowerCase().includes(term) ||
      credit.email.toLowerCase().includes(term) ||
      credit.phone.includes(term)
    );
  });

  const tabs: { label: string; key: CreditStatus | ""; count: number }[] = [
    {
      label: "Todas",
      key: "",
      count: counts?.total || 0,
    },
    {
      label: "Pendientes",
      key: "pending",
      count: counts?.pending || 0,
    },
    {
      label: "Aprobadas",
      key: "approved",
      count: counts?.approved || 0,
    },
    {
      label: "Rechazadas",
      key: "rejected",
      count: counts?.rejected || 0,
    },
    {
      label: "Pagadas",
      key: "paid",
      count: counts?.paid || 0,
    },
  ];

  return (
    <div className="px-5 py-8 text-warm-50 md:px-8 lg:px-12 lg:py-12">
      {/* HEADER */}
      <section className="max-w-6xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-lg border border-rose-200/20 bg-rose-200/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.24em] text-rose-500">
          <Banknote size={16} />
          Financiamiento real
        </div>

        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-4xl font-black md:text-6xl">Créditos</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-warm-50/62">
              Gestiona las solicitudes de crédito enviadas por los clientes
              desde el simulador público.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchCredits();
            }}
            disabled={loading}
            className="inline-flex h-fit items-center gap-2 rounded-lg border border-rose-200/15 bg-rose-200/10 px-4 py-3 text-sm font-black text-rose-500 transition hover:bg-rose-200/15 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Actualizar
          </button>
        </div>
      </section>

      {/* SEARCH & FILTERS */}
      <section className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-black transition ${
                statusFilter === tab.key
                  ? "border-rose-200/40 bg-rose-200/12 text-rose-300 shadow-lg shadow-rose-950/15"
                  : "border-rose-200/10 bg-rose-200/[0.04] text-warm-50/72 hover:border-rose-200/20 hover:bg-rose-200/[0.08]"
              }`}
            >
              {tab.label}
              <span className="rounded-md bg-warm-900/60 px-2 py-0.5 text-xs tabular-nums">
                {tab.count}
              </span>
            </button>
          ))}
        </div>          <div className="flex items-center gap-3 rounded-lg border border-rose-200/15 bg-rose-200/[0.06] px-4 py-2">
          <Search size={16} className="text-rose-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono..."
            className="w-full min-w-[200px] bg-transparent text-sm text-warm-50 outline-none placeholder:text-warm-50/35"
          />
        </div>
      </section>

      {/* CREDIT LIST */}
      <section className="mt-6 space-y-4">
        {loading ? (
          <div className="flex items-center gap-3 rounded-lg border border-rose-200/12 bg-rose-200/[0.06] p-6">
            <LoaderCircle className="h-5 w-5 animate-spin text-rose-500" />
            <span className="text-sm font-semibold">
              Cargando solicitudes...
            </span>
          </div>
        ) : filteredCredits.length === 0 ? (
          <div              className="rounded-lg border border-rose-200/12 bg-rose-200/[0.06] p-10 text-center">
            <p className="text-lg font-black text-warm-50/60">
              {statusFilter
                ? "No hay solicitudes con este estado."
                : "Aún no hay solicitudes de crédito."}
            </p>
            <p className="mt-2 text-sm text-warm-50/40">
              {statusFilter
                ? "Prueba con otro filtro."
                : "Los clientes pueden solicitar créditos desde el simulador en la página principal."}
            </p>
          </div>
        ) : (
          filteredCredits.map((credit) => {
            const config = STATUS_CONFIG[credit.status];
            const StatusIcon = config.icon;

            return (
              <article
                key={credit.id}
                className="rounded-lg border border-rose-200/12 bg-rose-200/[0.06] p-5 shadow-xl shadow-rose-950/15 backdrop-blur md:p-6"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  {/* LEFT INFO */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-black text-warm-50">
                        {credit.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${config.color}`}
                      >
                        <StatusIcon size={13} />
                        {config.label}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-warm-50/50">
                      {credit.email} &middot; {credit.phone}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-warm-50/40">
                          Monto solicitado (ARS)
                        </p>
                        <p className="mt-1 text-lg font-black text-warm-50">
                          {formatCurrency(credit.amount)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-warm-50/40">
                          Cuota mensual (ARS)
                        </p>
                        <p className="mt-1 text-lg font-black text-emerald-400">
                          {formatCurrency(credit.monthly_payment)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-warm-50/40">
                          Plazo
                        </p>
                        <p className="mt-1 text-lg font-black text-warm-50">
                          {credit.term_months} meses
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-warm-50/40">
                          Interés
                        </p>
                        <p className="mt-1 text-lg font-black text-warm-50">
                          {credit.interest_rate}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-warm-50/40">
                          Total a pagar
                        </p>
                        <p className="mt-1 text-sm font-bold text-warm-50/70">
                          {formatCurrency(credit.total_payment)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-warm-50/40">
                          Recibida
                        </p>
                        <p className="mt-1 text-sm font-bold text-warm-50/70">
                          {formatDate(credit.created_at)}
                        </p>
                      </div>
                    </div>

                    {credit.notes && (
                      <div className="mt-4 rounded-lg border border-amber-200/10 bg-warm-900/30 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-warm-50/40">
                          Notas
                        </p>
                        <p className="mt-1 text-sm text-warm-50/70">
                          {credit.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div className="flex shrink-0 flex-col gap-2">
                    {credit.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateStatus(credit.id, "approved")}
                          disabled={updatingId === credit.id}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-60"
                        >
                          {updatingId === credit.id ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 size={16} />
                          )}
                          Aprobar
                        </button>

                        <button
                          type="button"
                          onClick={() => updateStatus(credit.id, "rejected")}
                          disabled={updatingId === credit.id}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200/25 bg-rose-200/10 px-5 py-3 text-sm font-black text-rose-500 transition hover:bg-rose-200/15 disabled:opacity-60"
                        >
                          {updatingId === credit.id ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle size={16} />
                          )}
                          Rechazar
                        </button>
                      </>
                    )}

                    {credit.status === "approved" && (
                      <button
                        type="button"
                        onClick={() => updateStatus(credit.id, "paid")}
                        disabled={updatingId === credit.id}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-60"
                      >
                        {updatingId === credit.id ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <CircleCheck size={16} />
                        )}
                        Marcar pagado
                      </button>
                    )}

                    {credit.status === "rejected" && (
                      <button
                        type="button"
                        onClick={() => updateStatus(credit.id, "pending")}
                        disabled={updatingId === credit.id}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200/25 bg-rose-200/10 px-5 py-3 text-sm font-black text-rose-500 transition hover:bg-rose-200/15 disabled:opacity-60"
                      >
                        {updatingId === credit.id ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Clock size={16} />
                        )}
                        Reabrir
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
