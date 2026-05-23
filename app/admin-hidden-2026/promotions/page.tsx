"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  FileText,
  Link,
  LoaderCircle,
  Megaphone,
  Package,
  Percent,
  Plus,
  RefreshCw,
  Tag,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";

import API from "@/app/services/api";

// ─── Types ────────────────────────────────────────────

type Product = {
  id: number;
  title: string;
  price: string;
  image: string;
  stock: string;
  category: string;
};

type Promotion = {
  id: number;
  title: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  banner_image: string;
  created_at: string;
  products: Product[];
};

// ─── Helpers ──────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRemaining(endDate: string): string {
  const diff = new Date(endDate).getTime() - Date.now();

  if (diff <= 0) return "Expirada";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;

  return `${mins}m restantes`;
}

function getStatus(promo: Promotion): "active" | "scheduled" | "expired" | "inactive" {
  const now = Date.now();
  const start = new Date(promo.start_date).getTime();
  const end = new Date(promo.end_date).getTime();

  if (!promo.is_active) return "inactive";
  if (now > end) return "expired";
  if (now < start) return "scheduled";

  return "active";
}

// ─── Timer Component ──────────────────────────────────

function CountdownTimer({ endDate }: { endDate: string }) {
  const [display, setDisplay] = useState(getRemaining(endDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplay(getRemaining(endDate));
    }, 30_000);

    return () => clearInterval(interval);
  }, [endDate]);

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold">
      <Clock size={12} />
      {display}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────

export default function PromotionsAdminPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [formDiscountValue, setFormDiscountValue] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formStartHour, setFormStartHour] = useState("12");
  const [formEndDate, setFormEndDate] = useState("");
  const [formEndHour, setFormEndHour] = useState("23");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formBannerImage, setFormBannerImage] = useState("");
  const [formProductIds, setFormProductIds] = useState<number[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const [promoRes, prodRes] = await Promise.all([
        API.get<{ promotions: Promotion[] }>("/promotions/all"),
        API.get<Product[]>("/products"),
      ]);

      setPromotions(promoRes.data.promotions);
      setProducts(prodRes.data);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setFormTitle("");
    setFormDesc("");
    setFormDiscountType("percentage");
    setFormDiscountValue("");
    setFormStartDate("");
    setFormStartHour("12");
    setFormEndDate("");
    setFormEndHour("23");
    setFormIsActive(true);
    setFormBannerImage("");
    setFormProductIds([]);
    setEditingId(null);
    setError("");
  };

  const openEdit = (promo: Promotion) => {
    setFormTitle(promo.title);
    setFormDesc(promo.description || "");
    setFormDiscountType(promo.discount_type);
    setFormDiscountValue(String(promo.discount_value));
    setFormStartDate(promo.start_date ? new Date(promo.start_date).toISOString().slice(0, 10) : "");
    setFormStartHour(promo.start_date ? String(new Date(promo.start_date).getHours()).padStart(2, "0") : "12");
    setFormEndDate(promo.end_date ? new Date(promo.end_date).toISOString().slice(0, 10) : "");
    setFormEndHour(promo.end_date ? String(new Date(promo.end_date).getHours()).padStart(2, "0") : "23");
    setFormIsActive(promo.is_active);
    setFormBannerImage(promo.banner_image || "");
    setFormProductIds(promo.products?.map((p) => p.id) || []);
    setEditingId(promo.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setError("");

    if (!formTitle || !formDiscountValue || !formStartDate || !formEndDate) {
      setError("Completa todos los campos requeridos.");
      return;
    }

    setSaving(true);

    try {
      const body = {
        title: formTitle,
        description: formDesc,
        discountType: formDiscountType,
        discountValue: Number(formDiscountValue),
        startDate: new Date(`${formStartDate}T${formStartHour}:00`).toISOString(),
        endDate: new Date(`${formEndDate}T${formEndHour}:00`).toISOString(),
        isActive: formIsActive,
        bannerImage: formBannerImage,
        productIds: formProductIds,
      };

      if (editingId) {
        await API.put(`/promotions/${editingId}`, body);
      } else {
        await API.post("/promotions", body);
      }

      resetForm();
      setShowForm(false);
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Error al guardar promoción.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("category", "promotions");
      formData.append("alt", formTitle || file.name.replace(/\.[^.]+$/, ""));

      const res = await API.post<{ image: { url: string } }>("/images/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFormBannerImage(res.data.image.url);
    } catch {
      setError("Error al subir imagen.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta promoción?")) return;

    try {
      await API.delete(`/promotions/${id}`);
      fetchData();
    } catch {
      // Silent
    }
  };

  const toggleProduct = (productId: number) => {
    setFormProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // ─── Loading ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5 py-24 text-warm-50">
        <div className="flex items-center gap-3 rounded-lg border border-amber-200/12 bg-amber-200/[0.06] px-6 py-4">
          <LoaderCircle className="h-5 w-5 animate-spin text-amber-400" />
          <span className="text-sm font-semibold">Cargando promociones...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 text-warm-50 md:px-8 lg:px-12 lg:py-12">
      {/* HEADER */}
      <section className="mb-10 max-w-6xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-lg border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.24em] text-amber-400">
          <Megaphone size={16} />
          Marketing
        </div>

        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-4xl font-black md:text-6xl">Promociones</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-warm-50/62">
              Crea descuentos, flash sales y banners dinámicos con temporizadores.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex h-fit items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:from-amber-400 hover:to-emerald-500"
          >
            <Plus size={18} />
            Nueva promoción
          </button>
        </div>
      </section>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
          <div className="mt-12 w-full max-w-2xl rounded-xl border border-amber-200/15 bg-warm-900 p-6 shadow-2xl shadow-amber-950/40 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black">
                {editingId ? "Editar promoción" : "Nueva promoción"}
              </h2>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="rounded-lg p-2 text-warm-50/50 transition hover:bg-amber-200/10 hover:text-warm-50"
              >
                <X size={22} />
              </button>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-2 rounded-lg border border-rose-200/25 bg-rose-200/10 px-4 py-3 text-sm font-semibold text-rose-400">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Title */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  Título *
                </label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ej: Hot Sale Tecnología"
                  className="mt-2 w-full rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 placeholder-warm-50/30 outline-none transition focus:border-amber-400/50"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  Descripción
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Descripción breve de la promoción..."
                  rows={2}
                  className="mt-2 w-full rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 placeholder-warm-50/30 outline-none transition focus:border-amber-400/50"
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  Tipo
                </label>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormDiscountType("percentage")}
                    className={`flex-1 rounded-lg border px-4 py-3 text-sm font-bold transition ${
                      formDiscountType === "percentage"
                        ? "border-amber-400/50 bg-amber-200/12 text-amber-400"
                        : "border-amber-200/15 bg-amber-200/[0.04] text-warm-50/60 hover:border-amber-200/25"
                    }`}
                  >
                    <Percent size={16} className="inline-block mr-1.5" />
                    Porcentaje
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormDiscountType("fixed")}
                    className={`flex-1 rounded-lg border px-4 py-3 text-sm font-bold transition ${
                      formDiscountType === "fixed"
                        ? "border-amber-400/50 bg-amber-200/12 text-amber-400"
                        : "border-amber-200/15 bg-amber-200/[0.04] text-warm-50/60 hover:border-amber-200/25"
                    }`}
                  >
                    <Tag size={16} className="inline-block mr-1.5" />
                    Fijo ($)
                  </button>
                </div>
              </div>

              {/* Discount Value */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  Valor *
                </label>
                <input
                  type="number"
                  min={1}
                  value={formDiscountValue}
                  onChange={(e) => setFormDiscountValue(e.target.value)}
                  placeholder={formDiscountType === "percentage" ? "15" : "50000"}
                  className="mt-2 w-full rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 placeholder-warm-50/30 outline-none transition focus:border-amber-400/50"
                />
              </div>

              {/* Start Date (Día + Hora) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  Inicio *
                </label>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 outline-none transition focus:border-amber-400/50 [color-scheme:dark]"
                />
              </div>

              {/* Start Hour */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  Hora inicio
                </label>
                <select
                  value={formStartHour}
                  onChange={(e) => setFormStartHour(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 outline-none transition focus:border-amber-400/50"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={String(i).padStart(2, "0")} className="bg-warm-900">
                      {String(i).padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </div>

              {/* End Date (Día + Hora) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  Fin *
                </label>
                <input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 outline-none transition focus:border-amber-400/50 [color-scheme:dark]"
                />
              </div>

              {/* End Hour */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  Hora fin
                </label>
                <select
                  value={formEndHour}
                  onChange={(e) => setFormEndHour(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 outline-none transition focus:border-amber-400/50"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={String(i).padStart(2, "0")} className="bg-warm-900">
                      {String(i).padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </div>

              {/* Banner Image */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  Imagen de banner
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    value={formBannerImage}
                    onChange={(e) => setFormBannerImage(e.target.value)}
                    placeholder="https://ejemplo.com/banner.jpg"
                    className="flex-1 rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 placeholder-warm-50/30 outline-none transition focus:border-amber-400/50"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-200/20 bg-amber-200/10 px-4 py-3 text-xs font-bold text-amber-400 transition hover:bg-amber-200/15 disabled:opacity-60 shrink-0"
                  >
                    {uploadingImage ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <Upload size={16} />
                    )}
                    {uploadingImage ? "Subiendo..." : "Subir"}
                  </button>
                </div>
                {formBannerImage && (
                  <div className="mt-3 overflow-hidden rounded-lg border border-amber-200/15 bg-amber-200/[0.04]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formBannerImage}
                      alt="Preview"
                      className="max-h-36 w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Active toggle */}
              <div className="sm:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="h-5 w-5 rounded border-amber-200/30 bg-amber-200/10 text-amber-500 outline-none accent-amber-500"
                  />
                  <span className="text-sm font-bold text-warm-50/80">
                    Promoción activa
                  </span>
                </label>
              </div>

              {/* Products selector */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50 mb-2">
                  Productos en oferta ({formProductIds.length} seleccionados)
                </label>

                <div className="max-h-48 overflow-y-auto rounded-lg border border-amber-200/15 bg-amber-200/[0.04] p-2">
                  {products.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-warm-50/40">
                      No hay productos disponibles. Crea productos primero.
                    </p>
                  ) : (
                    products.map((product) => {
                      const selected = formProductIds.includes(product.id);

                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => toggleProduct(product.id)}
                          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition ${
                            selected
                              ? "bg-amber-200/12 text-amber-300"
                              : "text-warm-50/60 hover:bg-amber-200/8 hover:text-warm-50/80"
                          }`}
                        >
                          <div
                            className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${
                              selected
                                ? "border-amber-400 bg-amber-400 text-warm-900"
                                : "border-amber-200/20"
                            }`}
                          >
                            {selected && <Check size={12} />}
                          </div>

                          <span className="truncate font-medium">
                            {product.title}
                          </span>

                          <span className="ml-auto text-xs text-warm-50/40">
                            ${Number(product.price).toLocaleString()}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="flex-1 rounded-lg border border-amber-200/20 bg-amber-200/8 px-4 py-3 text-sm font-bold text-warm-50/70 transition hover:bg-amber-200/12"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-[2] rounded-lg bg-gradient-to-r from-amber-500 to-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:from-amber-400 hover:to-emerald-500 disabled:opacity-60"
              >
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <LoaderCircle size={16} className="animate-spin" />
                    Guardando...
                  </span>
                ) : editingId ? (
                  "Actualizar promoción"
                ) : (
                  "Crear promoción"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROMOTIONS LIST */}
      <section className="grid gap-5">
        {promotions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-amber-200/12 bg-amber-200/[0.06] px-6 py-16 shadow-xl shadow-amber-950/15">
            <Megaphone size={48} className="text-warm-50/20 mb-4" />
            <p className="text-lg font-bold text-warm-50/50">
              No hay promociones aún
            </p>
            <p className="mt-1 text-sm text-warm-50/35">
              Crea tu primera promoción para empezar.
            </p>
          </div>
        ) : (
          promotions.map((promo) => {
            const status = getStatus(promo);
            const isFlash =
              status === "active" &&
              new Date(promo.end_date).getTime() - new Date(promo.start_date).getTime() <=
                48 * 60 * 60 * 1000;

            return (
              <div
                key={promo.id}
                className="rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-5 shadow-xl shadow-amber-950/15 backdrop-blur transition hover:border-amber-200/20 md:p-6"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {/* Status badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                          status === "active"
                            ? "border border-emerald-200/25 bg-emerald-200/10 text-emerald-400"
                            : status === "scheduled"
                            ? "border border-amber-200/25 bg-amber-200/10 text-amber-400"
                            : status === "expired"
                            ? "border border-rose-200/25 bg-rose-200/10 text-rose-400"
                            : "border border-warm-200/15 bg-warm-200/8 text-warm-50/40"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            status === "active"
                              ? "bg-emerald-400"
                              : status === "scheduled"
                              ? "bg-amber-400"
                              : "bg-warm-50/30"
                          }`}
                        />
                        {status === "active"
                          ? "Activa"
                          : status === "scheduled"
                          ? "Programada"
                          : status === "expired"
                          ? "Expirada"
                          : "Inactiva"}
                      </span>

                      {/* Flash badge */}
                      {isFlash && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-200/25 bg-gradient-to-r from-amber-500/20 to-emerald-500/20 px-2.5 py-1 text-xs font-bold text-amber-400">
                          <Zap size={12} />
                          Flash Sale
                        </span>
                      )}

                      {/* Timer */}
                      {(status === "active" || status === "scheduled") && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-warm-50/50">
                          <Calendar size={12} />
                          {status === "scheduled"
                            ? `Inicia ${formatDate(promo.start_date)}`
                            : `Termina ${formatDate(promo.end_date)}`}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-black text-warm-50 md:text-2xl">
                      {promo.title}
                    </h3>

                    {promo.description && (
                      <p className="mt-1 text-sm text-warm-50/60 line-clamp-2">
                        {promo.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-200/10 px-2.5 py-1 text-sm font-bold text-amber-400">
                        {promo.discount_type === "percentage" ? (
                          <Percent size={14} />
                        ) : (
                          <Tag size={14} />
                        )}
                        {promo.discount_type === "percentage"
                          ? `${promo.discount_value}% OFF`
                          : `$${Number(promo.discount_value).toLocaleString()} OFF`}
                      </span>

                      <span className="text-xs text-warm-50/40">
                        {promo.products?.length || 0} producto
                        {(promo.products?.length || 0) !== 1 ? "s" : ""}
                      </span>

                      {(status === "active" || status === "scheduled") && (
                        <CountdownTimer endDate={promo.end_date} />
                      )}
                    </div>

                    {/* Products preview */}
                    {promo.products && promo.products.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {promo.products.slice(0, 5).map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1 rounded-md bg-amber-200/8 px-2 py-1 text-xs text-warm-50/60"
                          >
                            <Package size={11} />
                            {p.title.length > 25
                              ? `${p.title.slice(0, 25)}…`
                              : p.title}
                          </span>
                        ))}
                        {promo.products.length > 5 && (
                          <span className="text-xs text-warm-50/40 self-center">
                            +{promo.products.length - 5} más
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(promo)}
                      className="rounded-lg border border-amber-200/15 bg-amber-200/10 px-3 py-2 text-xs font-bold text-amber-400 transition hover:bg-amber-200/15"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(promo.id)}
                      className="rounded-lg border border-rose-200/15 bg-rose-200/10 px-3 py-2 text-xs font-bold text-rose-400 transition hover:bg-rose-200/15"
                    >
                      <Trash2 size={14} />
                    </button>
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
