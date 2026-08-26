"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Image as ImageIcon,
  LoaderCircle,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import API from "@/app/services/api";

type ImageItem = {
  id: number;
  filename: string;
  original_name: string;
  url: string;
  alt: string;
  category: string;
  file_size: number;
  created_at: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const categories = [
  "general",
  "products",
  "banners",
  "news",
  "promotions",
  "gallery",
];

export default function ImagesAdminPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editingAlt, setEditingAlt] = useState<{ id: number; alt: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get<{ images: ImageItem[] }>("/images/all");
      setImages(res.data.images);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("image", file);
        formData.append("category", filterCategory || "general");
        formData.append("alt", file.name.replace(/\.[^.]+$/, ""));

        await API.post("/images/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      fetchData();
    } catch {
      // Silent
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (image: ImageItem) => {
    if (!confirm(`¿Eliminar "${image.original_name}"?`)) return;
    try {
      await API.delete(`/images/${image.id}`);
      fetchData();
    } catch {
      // Silent
    }
  };

  const copyUrl = (image: ImageItem) => {
    const url = `${window.location.origin}${image.url}`;
    navigator.clipboard.writeText(url).catch(() =>
      navigator.clipboard.writeText(image.url)
    );
    setCopiedId(image.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const updateAlt = async (id: number, alt: string) => {
    try {
      await API.put(`/images/${id}`, { alt });
      setEditingAlt(null);
    } catch {
      // Silent
    }
  };

  const filteredImages = images.filter((img) => {
    if (filterCategory && img.category !== filterCategory) return false;
    if (
      searchTerm &&
      !img.original_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !img.alt?.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  // ─── Loading ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5 py-24 text-warm-50">
        <div className="flex items-center gap-3 rounded-lg border border-amber-200/12 bg-amber-200/[0.06] px-6 py-4">
          <LoaderCircle className="h-5 w-5 animate-spin text-amber-400" />
          <span className="text-sm font-semibold">Cargando imágenes...</span>
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
          Medios
        </div>

        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-4xl font-black md:text-6xl">Galería</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-warm-50/62">
              Sube y gestiona imágenes para banners, noticias y productos.
            </p>
          </div>

          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex h-fit items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:from-amber-400 hover:to-emerald-500 disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Subir imágenes
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilterCategory("")}
            className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
              !filterCategory
                ? "border-amber-400/50 bg-amber-200/12 text-amber-400"
                : "border-amber-200/15 bg-amber-200/8 text-warm-50/60 hover:border-amber-200/25"
            }`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`rounded-lg border px-3 py-2 text-xs font-bold capitalize transition ${
                filterCategory === cat
                  ? "border-amber-400/50 bg-amber-200/12 text-amber-400"
                  : "border-amber-200/15 bg-amber-200/8 text-warm-50/60 hover:border-amber-200/25"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 rounded-lg border border-amber-200/12 bg-amber-200/[0.06] px-4 py-2.5 sm:ml-auto sm:max-w-xs w-full">
          <Search size={16} className="text-warm-50/40 shrink-0" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar imágenes..."
            className="w-full bg-transparent text-sm text-warm-50 placeholder-warm-50/30 outline-none"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-warm-50/40 hover:text-warm-50">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* GALLERY GRID */}
      {filteredImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-amber-200/12 bg-amber-200/[0.06] px-6 py-16 shadow-xl shadow-amber-950/15">
          <ImageIcon size={48} className="text-warm-50/20 mb-4" />
          <p className="text-lg font-bold text-warm-50/50">
            {searchTerm || filterCategory ? "Sin resultados" : "No hay imágenes aún"}
          </p>
          <p className="mt-1 text-sm text-warm-50/35">
            {searchTerm || filterCategory
              ? "Prueba con otros filtros."
              : "Sube tu primera imagen para empezar."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className="group relative rounded-lg border border-amber-200/12 bg-amber-200/[0.06] overflow-hidden shadow-xl shadow-amber-950/15"
            >
              {/* Image */}
              <div className="aspect-[4/3] overflow-hidden bg-amber-200/[0.04]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.alt || image.original_name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>

              {/* Overlay on hover */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => copyUrl(image)}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500/80 px-3 py-2 text-xs font-bold text-white transition hover:bg-amber-500"
                >
                  {copiedId === image.id ? (
                    <>
                      <Check size={14} />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copiar URL
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(image)}
                  className="flex items-center gap-1.5 rounded-lg bg-rose-500/80 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-500"
                >
                  <Trash2 size={14} />
                  Eliminar
                </button>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-xs font-medium text-warm-50/80 truncate" title={image.original_name}>
                  {image.original_name}
                </p>
                <div className="mt-1 flex items-center justify-between text-[10px] text-warm-50/40">
                  <span className="capitalize">{image.category}</span>
                  <span>{formatBytes(image.file_size)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 text-xs text-warm-50/40 text-center">
        {images.length} imagen{images.length !== 1 ? "es" : ""} en total
        {filteredImages.length !== images.length &&
          ` · ${filteredImages.length} filtradas`}
      </div>
    </div>
  );
}
