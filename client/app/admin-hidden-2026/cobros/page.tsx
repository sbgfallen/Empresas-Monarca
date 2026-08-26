"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Calendar,
  ChevronDown,
  Clock,
  Landmark,
  LoaderCircle,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

import API from "@/app/services/api";

// ─── Types ────────────────────────────────────────────

type CobroRecord = {
  id: number;
  type: "loan" | "quote";
  client_name: string;
  client_phone: string;
  amount: number;
  description: string;
  status: "active" | "paid" | "cancelled";
  created_at: string;
  payments: PaymentRecord[];
};

type PaymentRecord = {
  id: number;
  cobro_id: number;
  amount: number;
  payment_date: string;
  notes: string;
  created_at: string;
};

// ─── Helpers ──────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRemaining(cobro: CobroRecord): number {
  const totalPaid = cobro.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  return Math.max(0, Number(cobro.amount) - totalPaid);
}

function getProgress(cobro: CobroRecord): number {
  const totalPaid = cobro.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  if (Number(cobro.amount) <= 0) return 0;
  return Math.min(100, Math.round((totalPaid / Number(cobro.amount)) * 100));
}

// ─── Main Component ───────────────────────────────────

export default function CobrosAdminPage() {
  const [cobros, setCobros] = useState<CobroRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "loan" | "quote">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "paid" | "cancelled">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"loan" | "quote">("loan");
  const [formClientName, setFormClientName] = useState("");
  const [formClientPhone, setFormClientPhone] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Payment form
  const [showPaymentForm, setShowPaymentForm] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentNotes, setPaymentNotes] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  // Expanded cobro detail
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchCobros = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterType !== "all") params.type = filterType;
      if (filterStatus !== "all") params.status = filterStatus;
      const res = await API.get<{ cobros: CobroRecord[] }>("/cobros", { params });
      setCobros(res.data.cobros);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => {
    fetchCobros();
  }, [fetchCobros]);

  // ─── Create Cobro ─────────────────────────────────
  const handleCreate = async () => {
    setError("");
    if (!formClientName.trim() || !formAmount) {
      setError("Nombre del cliente y monto son requeridos.");
      return;
    }
    setSaving(true);
    try {
      await API.post("/cobros", {
        type: formType,
        clientName: formClientName.trim(),
        clientPhone: formClientPhone.trim(),
        amount: Number(formAmount),
        description: formDescription.trim(),
      });
      setShowForm(false);
      resetForm();
      fetchCobros();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Error al crear cobro.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormType("loan");
    setFormClientName("");
    setFormClientPhone("");
    setFormAmount("");
    setFormDescription("");
    setError("");
  };

  // ─── Add Payment ───────────────────────────────────
  const handleAddPayment = async (cobroId: number) => {
    setError("");
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      setError("El monto del abono debe ser mayor a 0.");
      return;
    }
    setSavingPayment(true);
    try {
      await API.post(`/cobros/${cobroId}/payments`, {
        amount: Number(paymentAmount),
        paymentDate: new Date(paymentDate).toISOString(),
        notes: paymentNotes.trim(),
      });
      setShowPaymentForm(null);
      setPaymentAmount("");
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setPaymentNotes("");
      fetchCobros();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Error al registrar abono.";
      setError(msg);
    } finally {
      setSavingPayment(false);
    }
  };

  // ─── Delete Cobro ──────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este cobro permanentemente?")) return;
    try {
      await API.delete(`/cobros/${id}`);
      fetchCobros();
    } catch {
      // Silent
    }
  };

  // ─── Filtering ──────────────────────────────────────
  const filteredCobros = cobros.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.client_name.toLowerCase().includes(term) ||
      c.client_phone.includes(term) ||
      c.description.toLowerCase().includes(term)
    );
  });

  // Stats
  const totalActive = cobros.filter((c) => c.status === "active").length;
  const totalPaid = cobros.filter((c) => c.status === "paid").length;
  const totalAmount = cobros.reduce((sum, c) => sum + Number(c.amount), 0);
  const totalRemaining = cobros
    .filter((c) => c.status === "active")
    .reduce((sum, c) => sum + getRemaining(c), 0);

  return (
    <div className="px-5 py-8 text-warm-50 md:px-8 lg:px-12 lg:py-12">
      {/* HEADER */}
      <section className="mb-10 max-w-6xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-lg border border-emerald-200/20 bg-emerald-200/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.24em] text-emerald-400">
          <Landmark size={16} />
          Gestión financiera
        </div>

        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-4xl font-black md:text-6xl">Cobros</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-warm-50/62">
              Registra y administra préstamos y cotizaciones. Controla abonos, historial y saldos pendientes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex h-fit items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-950/30"
          >
            <Plus size={18} />
            Nuevo cobro
          </button>
        </div>
      </section>

      {/* STATS ROW */}
      <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-emerald-200/12 bg-emerald-200/[0.06] p-4 backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-warm-50/45">Préstamos activos</p>
          <p className="mt-1 text-2xl font-black text-warm-50">{totalActive}</p>
        </div>
        <div className="rounded-lg border border-emerald-200/12 bg-emerald-200/[0.06] p-4 backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-warm-50/45">Pagados</p>
          <p className="mt-1 text-2xl font-black text-emerald-400">{totalPaid}</p>
        </div>
        <div className="rounded-lg border border-emerald-200/12 bg-emerald-200/[0.06] p-4 backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-warm-50/45">Total prestado</p>
          <p className="mt-1 text-lg font-black text-warm-50">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="rounded-lg border border-rose-200/12 bg-rose-200/[0.06] p-4 backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-warm-50/45">Saldo pendiente</p>
          <p className="mt-1 text-lg font-black text-rose-400">{formatCurrency(totalRemaining)}</p>
        </div>
      </section>

      {/* FILTERS */}
      <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all" as const, label: "Todos", count: cobros.length },
            { key: "loan" as const, label: "Préstamos", count: cobros.filter(c => c.type === "loan").length },
            { key: "quote" as const, label: "Cotizaciones", count: cobros.filter(c => c.type === "quote").length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterType(tab.key)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-black transition ${
                filterType === tab.key
                  ? "border-emerald-400/50 bg-emerald-200/12 text-emerald-400 shadow-lg shadow-emerald-950/15"
                  : "border-emerald-200/10 bg-emerald-200/[0.04] text-warm-50/72 hover:border-emerald-200/20"
              }`}
            >
              {tab.label}
              <span className="rounded-md bg-warm-900/60 px-2 py-0.5 text-xs tabular-nums">{tab.count}</span>
            </button>
          ))}
          <div className="w-px bg-emerald-200/10 mx-1" />
          {[
            { key: "all" as const, label: "Todos" },
            { key: "active" as const, label: "Activos" },
            { key: "paid" as const, label: "Pagados" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterStatus(tab.key)}
              className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                filterStatus === tab.key
                  ? "border-emerald-400/40 bg-emerald-200/10 text-emerald-400"
                  : "border-emerald-200/10 bg-emerald-200/[0.04] text-warm-50/60 hover:border-emerald-200/20"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-emerald-200/15 bg-emerald-200/[0.06] px-4 py-2">
          <Search size={16} className="text-emerald-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, teléfono..."
            className="w-full min-w-[200px] bg-transparent text-sm text-warm-50 outline-none placeholder:text-warm-50/35"
          />
        </div>
      </section>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
          <div className="mt-12 w-full max-w-lg rounded-xl border border-emerald-200/15 bg-warm-900 p-6 shadow-2xl shadow-emerald-950/40 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black">Nuevo cobro</h2>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="rounded-lg p-2 text-warm-50/50 transition hover:bg-emerald-200/10 hover:text-warm-50">
                <X size={22} />
              </button>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-2 rounded-lg border border-rose-200/25 bg-rose-200/10 px-4 py-3 text-sm font-semibold text-rose-400">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            <div className="grid gap-5">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50 mb-2">Tipo</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType("loan")}
                    className={`flex-1 rounded-lg border px-4 py-3 text-sm font-bold transition ${
                      formType === "loan" ? "border-emerald-400/50 bg-emerald-200/12 text-emerald-400" : "border-emerald-200/15 bg-emerald-200/[0.04] text-warm-50/60 hover:border-emerald-200/25"
                    }`}
                  >
                    <Banknote size={16} className="inline mr-1.5" />
                    Préstamo
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType("quote")}
                    className={`flex-1 rounded-lg border px-4 py-3 text-sm font-bold transition ${
                      formType === "quote" ? "border-emerald-400/50 bg-emerald-200/12 text-emerald-400" : "border-emerald-200/15 bg-emerald-200/[0.04] text-warm-50/60 hover:border-emerald-200/25"
                    }`}
                  >
                    <TrendingUp size={16} className="inline mr-1.5" />
                    Cotización
                  </button>
                </div>
              </div>

              {/* Client name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">Nombre del cliente *</label>
                <input value={formClientName} onChange={(e) => setFormClientName(e.target.value)} placeholder="Ej: Juan Pérez" className="mt-2 w-full rounded-lg border border-emerald-200/15 bg-emerald-200/[0.06] px-4 py-3 text-sm text-warm-50 placeholder-warm-50/30 outline-none transition focus:border-emerald-400/50" />
              </div>

              {/* Client phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">Teléfono</label>
                <input value={formClientPhone} onChange={(e) => setFormClientPhone(e.target.value)} placeholder="+54 11 5555-0000" className="mt-2 w-full rounded-lg border border-emerald-200/15 bg-emerald-200/[0.06] px-4 py-3 text-sm text-warm-50 placeholder-warm-50/30 outline-none transition focus:border-emerald-400/50" />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">Monto *</label>
                <input type="number" min={1} value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="50000" className="mt-2 w-full rounded-lg border border-emerald-200/15 bg-emerald-200/[0.06] px-4 py-3 text-sm text-warm-50 placeholder-warm-50/30 outline-none transition focus:border-emerald-400/50" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">Descripción</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Motivo del préstamo o cotización..." rows={2} className="mt-2 w-full rounded-lg border border-emerald-200/15 bg-emerald-200/[0.06] px-4 py-3 text-sm text-warm-50 placeholder-warm-50/30 outline-none transition focus:border-emerald-400/50" />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="flex-1 rounded-lg border border-emerald-200/20 bg-emerald-200/8 px-4 py-3 text-sm font-bold text-warm-50/70 transition hover:bg-emerald-200/12">Cancelar</button>
              <button type="button" onClick={handleCreate} disabled={saving} className="flex-[2] rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-60">
                {saving ? (
                  <span className="inline-flex items-center gap-2"><LoaderCircle size={16} className="animate-spin" /> Guardando...</span>
                ) : "Crear cobro"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {showPaymentForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
          <div className="mt-12 w-full max-w-md rounded-xl border border-emerald-200/15 bg-warm-900 p-6 shadow-2xl shadow-emerald-950/40 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black">Registrar abono</h2>
              <button type="button" onClick={() => setShowPaymentForm(null)} className="rounded-lg p-2 text-warm-50/50 transition hover:bg-emerald-200/10 hover:text-warm-50">
                <X size={22} />
              </button>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200/25 bg-rose-200/10 px-4 py-3 text-sm font-semibold text-rose-400">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            <div className="grid gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">Monto del abono *</label>
                <input type="number" min={1} value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="10000" className="mt-2 w-full rounded-lg border border-emerald-200/15 bg-emerald-200/[0.06] px-4 py-3 text-sm text-warm-50 placeholder-warm-50/30 outline-none transition focus:border-emerald-400/50" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">Fecha del abono *</label>
                <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="mt-2 w-full rounded-lg border border-emerald-200/15 bg-emerald-200/[0.06] px-4 py-3 text-sm text-warm-50 outline-none transition focus:border-emerald-400/50 [color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">Notas</label>
                <input value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Opcional" className="mt-2 w-full rounded-lg border border-emerald-200/15 bg-emerald-200/[0.06] px-4 py-3 text-sm text-warm-50 placeholder-warm-50/30 outline-none transition focus:border-emerald-400/50" />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setShowPaymentForm(null)} className="flex-1 rounded-lg border border-emerald-200/20 bg-emerald-200/8 px-4 py-3 text-sm font-bold text-warm-50/70 transition hover:bg-emerald-200/12">Cancelar</button>
              <button type="button" onClick={() => handleAddPayment(showPaymentForm)} disabled={savingPayment} className="flex-[2] rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-60">
                {savingPayment ? (
                  <span className="inline-flex items-center gap-2"><LoaderCircle size={16} className="animate-spin" /> Registrando...</span>
                ) : "Registrar abono"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COBROS LIST */}
      <section className="grid gap-4">
        {loading ? (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200/12 bg-emerald-200/[0.06] p-6">
            <LoaderCircle className="h-5 w-5 animate-spin text-emerald-400" />
            <span className="text-sm font-semibold">Cargando cobros...</span>
          </div>
        ) : filteredCobros.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-emerald-200/12 bg-emerald-200/[0.06] px-6 py-16">
            <Landmark size={48} className="text-warm-50/20 mb-4" />
            <p className="text-lg font-bold text-warm-50/50">No hay cobros registrados</p>
            <p className="mt-1 text-sm text-warm-50/35">Crea tu primer cobro para empezar a gestionar.</p>
          </div>
        ) : (
          filteredCobros.map((cobro) => {
            const remaining = getRemaining(cobro);
            const progress = getProgress(cobro);
            const isExpanded = expandedId === cobro.id;

            return (
              <div
                key={cobro.id}
                className={`rounded-lg border transition-all duration-300 ${
                  cobro.status === "paid"
                    ? "border-emerald-200/20 bg-emerald-200/[0.04]"
                    : cobro.status === "cancelled"
                    ? "border-rose-200/12 bg-rose-200/[0.04]"
                    : "border-emerald-200/12 bg-emerald-200/[0.06]"
                } p-5 shadow-xl shadow-emerald-950/15 backdrop-blur md:p-6`}
              >
                <div className="flex flex-col gap-4">
                  {/* Top row */}
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {/* Type badge */}
                        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold ${
                          cobro.type === "loan"
                            ? "border-emerald-200/25 bg-emerald-200/10 text-emerald-400"
                            : "border-amber-200/25 bg-amber-200/10 text-amber-400"
                        }`}>
                          {cobro.type === "loan" ? <Banknote size={12} /> : <TrendingUp size={12} />}
                          {cobro.type === "loan" ? "Préstamo" : "Cotización"}
                        </span>

                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                          cobro.status === "active"
                            ? "border border-emerald-200/25 bg-emerald-200/10 text-emerald-400"
                            : cobro.status === "paid"
                            ? "border border-emerald-200/25 bg-emerald-200/10 text-emerald-400"
                            : "border border-rose-200/25 bg-rose-200/10 text-rose-400"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            cobro.status === "active" ? "bg-emerald-400 animate-pulse" : cobro.status === "paid" ? "bg-emerald-400" : "bg-rose-400"
                          }`} />
                          {cobro.status === "active" ? "Activo" : cobro.status === "paid" ? "Pagado" : "Cancelado"}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-warm-50">{cobro.client_name}</h3>

                      {cobro.client_phone && (
                        <p className="text-sm text-warm-50/50 mt-0.5">{cobro.client_phone}</p>
                      )}

                      {cobro.description && (
                        <p className="mt-2 text-sm text-warm-50/60">{cobro.description}</p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-warm-50/40">Monto</p>
                      <p className="text-2xl font-black text-warm-50">{formatCurrency(Number(cobro.amount))}</p>
                      {cobro.status === "active" && (
                        <p className="text-xs font-bold text-rose-400 mt-1">
                          Saldo: {formatCurrency(remaining)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  {cobro.status === "active" && (
                    <div className="w-full">
                      <div className="flex items-center justify-between text-xs text-warm-50/50 mb-1">
                        <span>Progreso de pago</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-emerald-200/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-700"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : cobro.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/12 bg-emerald-200/8 px-3 py-2 text-xs font-bold text-warm-50/70 transition hover:border-emerald-200/25 hover:bg-emerald-200/12"
                    >
                      {isExpanded ? "Ocultar historial" : "Ver historial"}
                      <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>

                    {cobro.status === "active" && (
                      <button
                        type="button"
                        onClick={() => setShowPaymentForm(cobro.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-2 text-xs font-black text-white transition hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-950/20"
                      >
                        <Plus size={14} />
                        Agregar abono
                      </button>
                    )}

                    {cobro.client_phone && (
                      <a
                        href={`https://wa.me/${cobro.client_phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/12 bg-emerald-200/8 px-3 py-2 text-xs font-bold text-emerald-400 transition hover:border-emerald-200/25 hover:bg-emerald-200/12"
                      >
                        <MessageCircle size={14} />
                        WhatsApp
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(cobro.id)}
                      className="ml-auto rounded-lg border border-rose-200/12 bg-rose-200/10 px-3 py-2 text-xs font-bold text-rose-400 transition hover:bg-rose-200/15"
                    >
                      Eliminar
                    </button>
                  </div>

                  {/* Expanded history */}
                  {isExpanded && (
                    <div className="mt-4 rounded-lg border border-emerald-200/10 bg-warm-900/50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-50/40 mb-3">
                        Historial de abonos ({cobro.payments.length})
                      </p>

                      {cobro.payments.length === 0 ? (
                        <p className="text-sm text-warm-50/40 text-center py-4">No hay abonos registrados aún.</p>
                      ) : (
                        <div className="space-y-2">
                          {cobro.payments.map((payment) => (
                            <div key={payment.id} className="flex items-center justify-between rounded-lg border border-emerald-200/8 bg-emerald-200/[0.03] px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className="grid h-8 w-8 place-items-center rounded-md bg-emerald-200/10 text-emerald-400">
                                  <Calendar size={14} />
                                </span>
                                <div>
                                  <p className="text-sm font-bold text-warm-50">{formatDate(payment.payment_date)}</p>
                                  {payment.notes && <p className="text-xs text-warm-50/50">{payment.notes}</p>}
                                </div>
                              </div>
                              <p className="text-lg font-black text-emerald-400">{formatCurrency(Number(payment.amount))}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Totals */}
                      <div className="mt-4 border-t border-emerald-200/10 pt-4 flex justify-between">
                        <span className="text-sm font-bold text-warm-50/60">Total abonado</span>
                        <span className="text-lg font-black text-emerald-400">
                          {formatCurrency(cobro.payments.reduce((s, p) => s + Number(p.amount), 0))}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-warm-50/35">
                    Creado: {formatDateTime(cobro.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
