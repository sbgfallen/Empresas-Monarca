"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Calendar,
  Check,
  Clock,
  Info,
  LoaderCircle,
  Megaphone,
  MessageSquareWarning,
  PartyPopper,
  Plus,
  ShieldAlert,
  Trash2,
  X,
  Zap,
} from "lucide-react";

import API from "@/app/services/api";

type Announcement = {
  id: number;
  title: string;
  content: string;
  type: "info" | "warning" | "success" | "promo" | "urgent";
  link_url: string;
  link_label: string;
  icon: string;
  is_active: boolean;
  starts_at: string;
  expires_at: string;
  sort_order: number;
  created_at: string;
};

const typeOptions = [
  { value: "info", label: "Info", color: "text-blue-400 bg-blue-200/10 border-blue-200/25", icon: Info },
  { value: "warning", label: "Advertencia", color: "text-amber-400 bg-amber-200/10 border-amber-200/25", icon: AlertTriangle },
  { value: "success", label: "Éxito", color: "text-emerald-400 bg-emerald-200/10 border-emerald-200/25", icon: PartyPopper },
  { value: "promo", label: "Promo", color: "text-amber-400 bg-amber-200/10 border-amber-200/25", icon: Zap },
  { value: "urgent", label: "Urgente", color: "text-rose-400 bg-rose-200/10 border-rose-200/25", icon: ShieldAlert },
];

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatus(ann: Announcement): "active" | "scheduled" | "expired" | "inactive" {
  const now = Date.now();
  if (!ann.is_active) return "inactive";
  if (ann.starts_at && new Date(ann.starts_at).getTime() > now) return "scheduled";
  if (ann.expires_at && new Date(ann.expires_at).getTime() < now) return "expired";
  return "active";
}

export default function AnnouncementsAdminPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formType, setFormType] = useState<Announcement["type"]>("info");
  const [formLinkUrl, setFormLinkUrl] = useState("");
  const [formLinkLabel, setFormLinkLabel] = useState("Saber más");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formStartsAt, setFormStartsAt] = useState("");
  const [formExpiresAt, setFormExpiresAt] = useState("");
  const [formSortOrder, setFormSortOrder] = useState("0");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get<{ announcements: Announcement[] }>("/announcements/all");
      setAnnouncements(res.data.announcements);
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
    setFormContent("");
    setFormType("info");
    setFormLinkUrl("");
    setFormLinkLabel("Saber más");
    setFormIsActive(true);
    setFormStartsAt("");
    setFormExpiresAt("");
    setFormSortOrder("0");
    setEditingId(null);
    setError("");
  };

  const openEdit = (ann: Announcement) => {
    setFormTitle(ann.title);
    setFormContent(ann.content || "");
    setFormType(ann.type);
    setFormLinkUrl(ann.link_url || "");
    setFormLinkLabel(ann.link_label || "Saber más");
    setFormIsActive(ann.is_active);
    setFormStartsAt(ann.starts_at ? new Date(ann.starts_at).toISOString().slice(0, 16) : "");
    setFormExpiresAt(ann.expires_at ? new Date(ann.expires_at).toISOString().slice(0, 16) : "");
    setFormSortOrder(String(ann.sort_order));
    setEditingId(ann.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setError("");
    if (!formTitle.trim()) {
      setError("El título es requerido.");
      return;
    }

    setSaving(true);
    try {
      const body = {
        title: formTitle.trim(),
        content: formContent.trim(),
        type: formType,
        linkUrl: formLinkUrl.trim(),
        linkLabel: formLinkLabel.trim(),
        isActive: formIsActive,
        startsAt: formStartsAt ? new Date(formStartsAt).toISOString() : null,
        expiresAt: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
        sortOrder: Number(formSortOrder) || 0,
      };

      if (editingId) {
        await API.put(`/announcements/${editingId}`, body);
      } else {
        await API.post("/announcements", body);
      }

      resetForm();
      setShowForm(false);
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Error al guardar anuncio.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este anuncio?")) return;
    try {
      await API.delete(`/announcements/${id}`);
      fetchData();
    } catch {
      // Silent
    }
  };

  // ─── Loading ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5 py-24 text-warm-50">
        <div className="flex items-center gap-3 rounded-lg border border-amber-200/12 bg-amber-200/[0.06] px-6 py-4">
          <LoaderCircle className="h-5 w-5 animate-spin text-amber-400" />
          <span className="text-sm font-semibold">Cargando anuncios...</span>
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
          Comunicación
        </div>

        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-4xl font-black md:text-6xl">Anuncios</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-warm-50/62">
              Crea notificaciones emergentes, barras informativas y llamados
              visibles con tipos, colores y fechas programadas.
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
            Nuevo anuncio
          </button>
        </div>
      </section>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
          <div className="mt-12 w-full max-w-2xl rounded-xl border border-amber-200/15 bg-warm-900 p-6 shadow-2xl shadow-amber-950/40 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black">
                {editingId ? "Editar anuncio" : "Nuevo anuncio"}
              </h2>
              <button
                type="button"
                onClick={() => { resetForm(); setShowForm(false); }}
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
                  placeholder="Ej: ¡Envío gratis este fin de semana!"
                  className="mt-2 w-full rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 placeholder-warm-50/30 outline-none transition focus:border-amber-400/50"
                />
              </div>

              {/* Content */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  Mensaje
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Texto adicional del anuncio..."
                  rows={2}
                  className="mt-2 w-full rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 placeholder-warm-50/30 outline-none transition focus:border-amber-400/50"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  Tipo
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {typeOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormType(opt.value as Announcement["type"])}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-bold transition ${
                          formType === opt.value
                            ? `${opt.color} border-current`
                            : "border-amber-200/15 bg-amber-200/[0.04] text-warm-50/60 hover:border-amber-200/25"
                        }`}
                      >
                        <Icon size={14} />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
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

              {/* Link URL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  Enlace
                </label>
                <input
                  value={formLinkUrl}
                  onChange={(e) => setFormLinkUrl(e.target.value)}
                  placeholder="https://..."
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

              {/* Starts At */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  Inicio programado
                </label>
                <input
                  type="datetime-local"
                  value={formStartsAt}
                  onChange={(e) => setFormStartsAt(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 outline-none transition focus:border-amber-400/50 [color-scheme:dark]"
                />
                <p className="mt-1 text-xs text-warm-50/35">Opcional. Dejar vacío para mostrar inmediatamente.</p>
              </div>

              {/* Expires At */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  Expira el
                </label>
                <input
                  type="datetime-local"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 outline-none transition focus:border-amber-400/50 [color-scheme:dark]"
                />
                <p className="mt-1 text-xs text-warm-50/35">Opcional.</p>
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
                    Anuncio activo
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
                  "Actualizar anuncio"
                ) : (
                  "Crear anuncio"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENTS LIST */}
      <section className="grid gap-4">
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-amber-200/12 bg-amber-200/[0.06] px-6 py-16 shadow-xl shadow-amber-950/15">
            <Megaphone size={48} className="text-warm-50/20 mb-4" />
            <p className="text-lg font-bold text-warm-50/50">
              No hay anuncios aún
            </p>
            <p className="mt-1 text-sm text-warm-50/35">
              Crea tu primer anuncio para empezar.
            </p>
          </div>
        ) : (
          announcements.map((ann) => {
            const status = getStatus(ann);
            const typeDef = typeOptions.find((t) => t.value === ann.type) || typeOptions[0];
            const TypeIcon = typeDef.icon;

            return (
              <div
                key={ann.id}
                className="rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-5 shadow-xl shadow-amber-950/15 backdrop-blur transition hover:border-amber-200/20 md:p-6"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {/* Type badge */}
                      <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold ${typeDef.color}`}>
                        <TypeIcon size={12} />
                        {typeDef.label}
                      </span>

                      {/* Status */}
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
                          ? "Activo"
                          : status === "scheduled"
                          ? "Programado"
                          : status === "expired"
                          ? "Expirado"
                          : "Inactivo"}
                      </span>

                      <span className="text-xs text-warm-50/40">
                        Orden: {ann.sort_order}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-warm-50">{ann.title}</h3>

                    {ann.content && (
                      <p className="mt-1 text-sm text-warm-50/60">{ann.content}</p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-warm-50/40">
                      {ann.starts_at && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={11} />
                          Inicia: {formatDate(ann.starts_at)}
                        </span>
                      )}
                      {ann.expires_at && (
                        <span className="inline-flex items-center gap-1">
                          <Clock size={11} />
                          Expira: {formatDate(ann.expires_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(ann)}
                      className="rounded-lg border border-amber-200/15 bg-amber-200/10 px-3 py-2 text-xs font-bold text-amber-400 transition hover:bg-amber-200/15"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(ann.id)}
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
