"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  GripVertical,
  Image as ImageIcon,
  Link,
  LoaderCircle,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import API from "@/app/services/api";

type Banner = {
  id: number;
  title: string;
  image_url: string;
  link_url: string;
  link_label: string;
  position: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

const positions = [
  { value: "home_hero", label: "Hero Principal" },
  { value: "home_mid", label: "Mitad de Home" },
  { value: "home_bottom", label: "Final de Home" },
  { value: "sidebar", label: "Sidebar" },
  { value: "popup", label: "Popup" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function BannersAdminPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterPosition, setFilterPosition] = useState("");

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formLinkUrl, setFormLinkUrl] = useState("");
  const [formLinkLabel, setFormLinkLabel] = useState("Saber más");
  const [formPosition, setFormPosition] = useState("home_hero");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formSortOrder, setFormSortOrder] = useState("0");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get<{ banners: Banner[] }>("/banners/all");
      setBanners(res.data.banners);
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
    setFormImageUrl("");
    setFormLinkUrl("");
    setFormLinkLabel("Saber más");
    setFormPosition("home_hero");
    setFormIsActive(true);
    setFormSortOrder("0");
    setEditingId(null);
    setError("");
  };

  const openEdit = (banner: Banner) => {
    setFormTitle(banner.title);
    setFormImageUrl(banner.image_url);
    setFormLinkUrl(banner.link_url || "");
    setFormLinkLabel(banner.link_label || "Saber más");
    setFormPosition(banner.position);
    setFormIsActive(banner.is_active);
    setFormSortOrder(String(banner.sort_order));
    setEditingId(banner.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setError("");
    if (!formTitle.trim() || !formImageUrl.trim()) {
      setError("Título e imagen son requeridos.");
      return;
    }

    setSaving(true);
    try {
      const body = {
        title: formTitle.trim(),
        imageUrl: formImageUrl.trim(),
        linkUrl: formLinkUrl.trim(),
        linkLabel: formLinkLabel.trim(),
        position: formPosition,
        isActive: formIsActive,
        sortOrder: Number(formSortOrder) || 0,
      };

      if (editingId) {
        await API.put(`/banners/${editingId}`, body);
      } else {
        await API.post("/banners", body);
      }

      resetForm();
      setShowForm(false);
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Error al guardar banner.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("category", "banners");
      formData.append("alt", formTitle || file.name.replace(/\.[^.]+$/, ""));

      const res = await API.post<{ image: { url: string } }>("/images/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFormImageUrl(res.data.image.url);
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
    if (!confirm("¿Eliminar este banner?")) return;
    try {
      await API.delete(`/banners/${id}`);
      fetchData();
    } catch {
      // Silent
    }
  };

  const toggleActive = async (banner: Banner) => {
    try {
      await API.put(`/banners/${banner.id}`, { isActive: !banner.is_active });
      fetchData();
    } catch {
      // Silent
    }
  };

  const moveOrder = async (banner: Banner, direction: number) => {
    const newOrder = banner.sort_order + direction;
    if (newOrder < 0) return;
    try {
      await API.put(`/banners/${banner.id}`, { sortOrder: newOrder });
      fetchData();
    } catch {
      // Silent
    }
  };

  const filteredBanners = filterPosition
    ? banners.filter((b) => b.position === filterPosition)
    : banners;

  // Group by position for display
  const groupedByPosition = positions
    .map((pos) => ({
      ...pos,
      items: filteredBanners.filter((b) => b.position === pos.value),
    }))
    .filter((g) => g.items.length > 0);

  // ─── Loading ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5 py-24 text-warm-50">
        <div className="flex items-center gap-3 rounded-lg border border-amber-200/12 bg-amber-200/[0.06] px-6 py-4">
          <LoaderCircle className="h-5 w-5 animate-spin text-amber-400" />
          <span className="text-sm font-semibold">Cargando banners...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 text-warm-50 md:px-8 lg:px-12 lg:py-12">
      {/* HEADER */}
      <section className="mb-10 max-w-6xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-lg border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.24em] text-amber-400">
          <ImageIcon size={16} />
          Visuales
        </div>

        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-4xl font-black md:text-6xl">Banners</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-warm-50/62">
              Gestiona banners publicitarios en Hero, Home, Sidebar y Popups.
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
            Nuevo banner
          </button>
        </div>
      </section>

      {/* Position filter */}
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilterPosition("")}
          className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
            !filterPosition
              ? "border-amber-400/50 bg-amber-200/12 text-amber-400"
              : "border-amber-200/15 bg-amber-200/8 text-warm-50/60 hover:border-amber-200/25"
          }`}
        >
          Todas
        </button>
        {positions.map((pos) => (
          <button
            key={pos.value}
            type="button"
            onClick={() => setFilterPosition(pos.value)}
            className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
              filterPosition === pos.value
                ? "border-amber-400/50 bg-amber-200/12 text-amber-400"
                : "border-amber-200/15 bg-amber-200/8 text-warm-50/60 hover:border-amber-200/25"
            }`}
          >
            {pos.label}
          </button>
        ))}
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
          <div className="mt-12 w-full max-w-2xl rounded-xl border border-amber-200/15 bg-warm-900 p-6 shadow-2xl shadow-amber-950/40 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black">
                {editingId ? "Editar banner" : "Nuevo banner"}
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
                  placeholder="Ej: Colección Verano 2026"
                  className="mt-2 w-full rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 placeholder-warm-50/30 outline-none transition focus:border-amber-400/50"
                />
              </div>

              {/* Image URL */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  URL de imagen *
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://ejemplo.com/banner.jpg"
                    className="flex-1 rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 placeholder-warm-50/30 outline-none transition focus:border-amber-400/50"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerImageUpload}
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
                {formImageUrl && (
                  <div className="mt-3 overflow-hidden rounded-lg border border-amber-200/15 bg-amber-200/[0.04]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formImageUrl}
                      alt="Preview"
                      className="max-h-32 w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Link URL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  Enlace
                </label>
                <input
                  value={formLinkUrl}
                  onChange={(e) => setFormLinkUrl(e.target.value)}
                  placeholder="https://ejemplo.com/oferta"
                  className="mt-2 w-full rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 placeholder-warm-50/30 outline-none transition focus:border-amber-400/50"
                />
              </div>

              {/* Link Label */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  Texto del botón
                </label>
                <input
                  value={formLinkLabel}
                  onChange={(e) => setFormLinkLabel(e.target.value)}
                  placeholder="Saber más"
                  className="mt-2 w-full rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 placeholder-warm-50/30 outline-none transition focus:border-amber-400/50"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  Posición
                </label>
                <select
                  value={formPosition}
                  onChange={(e) => setFormPosition(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 outline-none transition focus:border-amber-400/50"
                >
                  {positions.map((pos) => (
                    <option key={pos.value} value={pos.value} className="bg-warm-900">
                      {pos.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  Orden
                </label>
                <input
                  type="number"
                  min={0}
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 outline-none transition focus:border-amber-400/50"
                />
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
                    Banner activo
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => { resetForm(); setShowForm(false); }}
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
                  "Actualizar banner"
                ) : (
                  "Crear banner"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BANNERS LIST */}
      {groupedByPosition.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-amber-200/12 bg-amber-200/[0.06] px-6 py-16 shadow-xl shadow-amber-950/15">
          <ImageIcon size={48} className="text-warm-50/20 mb-4" />
          <p className="text-lg font-bold text-warm-50/50">
            No hay banners aún
          </p>
          <p className="mt-1 text-sm text-warm-50/35">
            Crea tu primer banner para empezar.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {groupedByPosition.map((group) => (
            <div key={group.value}>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-warm-50/50">
                {group.label}
                <span className="ml-2 text-xs text-warm-50/30">
                  ({group.items.length})
                </span>
              </h3>

              <div className="grid gap-3">
                {group.items.map((banner) => (
                  <div
                    key={banner.id}
                    className={`rounded-lg border p-4 shadow-xl shadow-amber-950/15 backdrop-blur transition md:p-5 ${
                      banner.is_active
                        ? "border-amber-200/12 bg-amber-200/[0.06]"
                        : "border-warm-200/8 bg-warm-200/[0.03] opacity-60"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      {/* Image preview */}
                      <div className="hidden sm:block w-32 h-20 shrink-0 rounded-lg overflow-hidden border border-amber-200/10 bg-amber-200/[0.04]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={banner.image_url}
                          alt={banner.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-warm-50 truncate">
                            {banner.title}
                          </h4>
                          {!banner.is_active && (
                            <span className="text-xs text-warm-50/40">(oculto)</span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-warm-50/45">
                          <span>Orden: {banner.sort_order}</span>
                          {banner.link_url && (
                            <span className="inline-flex items-center gap-1">
                              <Link size={10} />
                              {banner.link_url.length > 30
                                ? `${banner.link_url.slice(0, 30)}…`
                                : banner.link_url}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveOrder(banner, -1)}
                          className="rounded-lg border border-amber-200/10 bg-amber-200/8 p-2 text-warm-50/40 transition hover:bg-amber-200/12 hover:text-amber-400"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveOrder(banner, 1)}
                          className="rounded-lg border border-amber-200/10 bg-amber-200/8 p-2 text-warm-50/40 transition hover:bg-amber-200/12 hover:text-amber-400"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActive(banner)}
                          className={`rounded-lg border p-2 transition ${
                            banner.is_active
                              ? "border-amber-200/10 bg-amber-200/8 text-warm-50/40 hover:bg-amber-200/12 hover:text-amber-400"
                              : "border-emerald-200/15 bg-emerald-200/10 text-emerald-400"
                          }`}
                        >
                          {banner.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(banner)}
                          className="rounded-lg border border-amber-200/12 bg-amber-200/10 px-3 py-2 text-xs font-bold text-amber-400 transition hover:bg-amber-200/15"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(banner.id)}
                          className="rounded-lg border border-rose-200/12 bg-rose-200/10 p-2 text-rose-400 transition hover:bg-rose-200/15"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
