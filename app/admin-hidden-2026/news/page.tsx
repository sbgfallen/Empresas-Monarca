"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  Newspaper,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";

import API from "@/app/services/api";

type NewsItem = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  category: string;
  tags: string[];
  is_published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
};

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

export default function NewsAdminPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formCategory, setFormCategory] = useState("General");
  const [formTags, setFormTags] = useState("");
  const [formIsPublished, setFormIsPublished] = useState(false);
  const [formPublishedAt, setFormPublishedAt] = useState("");

  const categories = [
    "General",
    "Tecnología",
    "Tendencias",
    "Ofertas",
    "Noticias",
    "Consejos",
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get<{ news: NewsItem[] }>("/news/all");
      setNews(res.data.news);
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
    setFormExcerpt("");
    setFormContent("");
    setFormImageUrl("");
    setFormCategory("General");
    setFormTags("");
    setFormIsPublished(false);
    setFormPublishedAt("");
    setEditingId(null);
    setError("");
  };

  const openEdit = (item: NewsItem) => {
    setFormTitle(item.title);
    setFormExcerpt(item.excerpt || "");
    setFormContent(item.content || "");
    setFormImageUrl(item.image_url || "");
    setFormCategory(item.category || "General");
    setFormTags(item.tags?.join(", ") || "");
    setFormIsPublished(item.is_published);
    setFormPublishedAt(
      item.published_at ? new Date(item.published_at).toISOString().slice(0, 16) : ""
    );
    setEditingId(item.id);
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
        excerpt: formExcerpt.trim(),
        content: formContent,
        imageUrl: formImageUrl.trim(),
        category: formCategory,
        tags: formTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        isPublished: formIsPublished,
        publishedAt: formPublishedAt
          ? new Date(formPublishedAt).toISOString()
          : formIsPublished
          ? new Date().toISOString()
          : null,
      };

      if (editingId) {
        await API.put(`/news/${editingId}`, body);
      } else {
        await API.post("/news", body);
      }

      resetForm();
      setShowForm(false);
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Error al guardar noticia.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta noticia?")) return;
    try {
      await API.delete(`/news/${id}`);
      fetchData();
    } catch {
      // Silent
    }
  };

  const togglePublish = async (item: NewsItem) => {
    try {
      await API.put(`/news/${item.id}`, {
        isPublished: !item.is_published,
        publishedAt: !item.is_published ? new Date().toISOString() : null,
      });
      fetchData();
    } catch {
      // Silent
    }
  };

  const filteredNews = news.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags?.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ─── Loading ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5 py-24 text-warm-50">
        <div className="flex items-center gap-3 rounded-lg border border-amber-200/12 bg-amber-200/[0.06] px-6 py-4">
          <LoaderCircle className="h-5 w-5 animate-spin text-amber-400" />
          <span className="text-sm font-semibold">Cargando noticias...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 text-warm-50 md:px-8 lg:px-12 lg:py-12">
      {/* HEADER */}
      <section className="mb-10 max-w-6xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-lg border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.24em] text-amber-400">
          <Newspaper size={16} />
          Contenido
        </div>

        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-4xl font-black md:text-6xl">Noticias</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-warm-50/62">
              Publica artículos, novedades y comunicados con imágenes,
              categorías y programación.
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
            Nueva noticia
          </button>
        </div>
      </section>

      {/* Search */}
      <div className="mb-8 flex items-center gap-3 rounded-lg border border-amber-200/12 bg-amber-200/[0.06] px-4 py-3 max-w-md">
        <Search size={18} className="text-warm-50/40 shrink-0" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar noticias..."
          className="w-full bg-transparent text-sm text-warm-50 placeholder-warm-50/30 outline-none"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm("")} className="text-warm-50/40 hover:text-warm-50">
            <X size={16} />
          </button>
        )}
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
          <div className="mt-12 w-full max-w-3xl rounded-xl border border-amber-200/15 bg-warm-900 p-6 shadow-2xl shadow-amber-950/40 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black">
                {editingId ? "Editar noticia" : "Nueva noticia"}
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
                  placeholder="Ej: Nuevos productos sostenibles 2026"
                  className="mt-2 w-full rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 placeholder-warm-50/30 outline-none transition focus:border-amber-400/50"
                />
              </div>

              {/* Excerpt */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  Extracto
                </label>
                <textarea
                  value={formExcerpt}
                  onChange={(e) => setFormExcerpt(e.target.value)}
                  placeholder="Breve descripción que aparecerá en la tarjeta..."
                  rows={2}
                  className="mt-2 w-full rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 placeholder-warm-50/30 outline-none transition focus:border-amber-400/50"
                />
              </div>

              {/* Content */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  Contenido (Markdown / HTML)
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Escribe el contenido completo aquí..."
                  rows={8}
                  className="mt-2 w-full rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 placeholder-warm-50/30 outline-none transition focus:border-amber-400/50 font-mono"
                />
              </div>

              {/* Image URL */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  URL de imagen destacada
                </label>
                <input
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="mt-2 w-full rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 placeholder-warm-50/30 outline-none transition focus:border-amber-400/50"
                />
                {formImageUrl && (
                  <div className="mt-3 overflow-hidden rounded-lg border border-amber-200/15 bg-amber-200/[0.04]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formImageUrl}
                      alt="Preview"
                      className="max-h-48 w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  Categoría
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 outline-none transition focus:border-amber-400/50"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-warm-900">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  Tags (separados por coma)
                </label>
                <input
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="sostenible, moda, tendencias"
                  className="mt-2 w-full rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 placeholder-warm-50/30 outline-none transition focus:border-amber-400/50"
                />
              </div>

              {/* Published At */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-warm-50/50">
                  Publicar el
                </label>
                <input
                  type="datetime-local"
                  value={formPublishedAt}
                  onChange={(e) => setFormPublishedAt(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3 text-sm text-warm-50 outline-none transition focus:border-amber-400/50 [color-scheme:dark]"
                />
              </div>

              {/* Published toggle */}
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPublished}
                    onChange={(e) => setFormIsPublished(e.target.checked)}
                    className="h-5 w-5 rounded border-amber-200/30 bg-amber-200/10 text-amber-500 outline-none accent-amber-500"
                  />
                  <span className="text-sm font-bold text-warm-50/80">
                    Publicada
                  </span>
                </label>
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
                  "Actualizar noticia"
                ) : (
                  "Publicar noticia"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEWS LIST */}
      <section className="grid gap-4">
        {filteredNews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-amber-200/12 bg-amber-200/[0.06] px-6 py-16 shadow-xl shadow-amber-950/15">
            <Newspaper size={48} className="text-warm-50/20 mb-4" />
            <p className="text-lg font-bold text-warm-50/50">
              {searchTerm ? "Sin resultados" : "No hay noticias aún"}
            </p>
            <p className="mt-1 text-sm text-warm-50/35">
              {searchTerm
                ? "Intenta con otros términos de búsqueda."
                : "Crea tu primera noticia para empezar."}
            </p>
          </div>
        ) : (
          filteredNews.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-5 shadow-xl shadow-amber-950/15 backdrop-blur transition hover:border-amber-200/20 md:p-6"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {/* Published badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                        item.is_published
                          ? "border border-emerald-200/25 bg-emerald-200/10 text-emerald-400"
                          : "border border-warm-200/15 bg-warm-200/8 text-warm-50/40"
                      }`}
                    >
                      {item.is_published ? <Eye size={12} /> : <EyeOff size={12} />}
                      {item.is_published ? "Publicada" : "Borrador"}
                    </span>

                    {/* Category */}
                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-200/15 bg-amber-200/8 px-2 py-1 text-xs text-amber-400">
                      <FileText size={11} />
                      {item.category}
                    </span>

                    {/* Date */}
                    <span className="inline-flex items-center gap-1 text-xs text-warm-50/40">
                      <Calendar size={11} />
                      {formatDate(item.published_at || item.created_at)}
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    {item.image_url && (
                      <div className="hidden sm:block w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-amber-200/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-black text-warm-50 md:text-xl">
                        {item.title}
                      </h3>

                      {item.excerpt && (
                        <p className="mt-1 text-sm text-warm-50/60 line-clamp-2">
                          {item.excerpt}
                        </p>
                      )}

                      {item.tags && item.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 rounded-full bg-amber-200/8 px-2 py-0.5 text-xs text-warm-50/50"
                            >
                              <Tag size={10} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => togglePublish(item)}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                      item.is_published
                        ? "border-warm-200/15 bg-warm-200/8 text-warm-50/50 hover:bg-warm-200/12"
                        : "border-emerald-200/20 bg-emerald-200/10 text-emerald-400 hover:bg-emerald-200/15"
                    }`}
                    title={item.is_published ? "Ocultar" : "Publicar"}
                  >
                    {item.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="rounded-lg border border-amber-200/15 bg-amber-200/10 px-3 py-2 text-xs font-bold text-amber-400 transition hover:bg-amber-200/15"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg border border-rose-200/15 bg-rose-200/10 px-3 py-2 text-xs font-bold text-rose-400 transition hover:bg-rose-200/15"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
