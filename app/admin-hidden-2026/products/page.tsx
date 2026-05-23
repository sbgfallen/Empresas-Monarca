/* eslint-disable @next/next/no-img-element */

"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import {
  ImageUp,
  LoaderCircle,
  MessageCircle,
  PackagePlus,
  Pencil,
  Save,
  Trash2,
  X,
  ZoomIn,
} from "lucide-react";

import API from "@/app/services/api";

type Category = {
  id: number;
  name: string;
  slug: string;
};

type Product = {
  category: string;
  description: string;
  id: number;
  image: string;
  price: number | string;
  stock: number | string;
  title: string;
  down_payment?: number | string;
};

const apiRoot =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "";

function getImageUrl(image?: string) {
  if (!image || image.startsWith("http")) {
    return image || "";
  }

  const path = image.startsWith("/") ? image : `/${image}`;

  return `${apiRoot}${path}`;
}

function getWhatsAppUrl(product: Product, whatsappNumber: string, months = 3) {
  const title = product.title || "Producto";
  const price = Number(product.price) || 0;
  const downPayment = Number(product.down_payment) || 0;
  const remaining = price - downPayment;
  const monthly = months > 0 ? Math.round(remaining / months) : 0;

  const formattedPrice = new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(price);

  const formattedDownPayment = new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(downPayment);

  const formattedMonthly = new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(monthly);

  const message = [
    `Hola! Me interesa este producto:`,
    "",
    `- Producto: ${title}`,
    `- Precio: ${formattedPrice}`,
    `- Cuota inicial: ${formattedDownPayment}`,
    `- ${months} cuota${months > 1 ? "s" : ""} de: ${formattedMonthly}`,
    "",
    `Quedo atento a tu respuesta. Gracias!`,
  ].join("\n");

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

const initialForm = {
  title: "",
  description: "",
  price: "",
  stock: "",
  category: "",
  image: "",
  down_payment: "",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("573000000000");
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);

  const fetchProducts = useCallback(async () => {
    const response = await API.get<Product[]>("/products");
    setProducts(response.data);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function init() {
      try {
        const [productsRes, settingsRes, catsRes] = await Promise.all([
          API.get<Product[]>("/products"),
          API.get<{ value: string }>("/settings/whatsapp_number").catch(() => ({ data: { value: "573000000000" } })),
          API.get<{ categories: Category[] }>("/categories"),
        ]);
        if (isActive) {
          setProducts(productsRes.data);
          setWhatsappNumber(settingsRes.data.value);
          setCategories(catsRes.data.categories);
          // Set default category to first one
          if (catsRes.data.categories.length > 0) {
            setForm((prev) => ({ ...prev, category: catsRes.data.categories[0].name }));
          }
        }
      } catch {
        if (isActive) {
          // Fallback categories
          const fallbackCats: Category[] = [
            { id: 1, name: "Electrodomésticos", slug: "electrodomesticos" },
            { id: 2, name: "Muebles", slug: "muebles" },
          ];
          setCategories(fallbackCats);
          setForm((prev) => ({ ...prev, category: fallbackCats[0].name }));
        }
      }
    }

    init();

    return () => {
      isActive = false;
    };
  }, []);

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);

    try {
      const data = new FormData();
      data.append("image", file);

      const response = await API.post("/products/upload", data);

      setForm((current) => ({
        ...current,
        image: response.data.imageUrl,
      }));
    } finally {
      setUploading(false);
    }
  };

  const createProduct = async () => {
    setSaving(true);

    try {
      await API.post("/products", {
        ...form,
        down_payment: Number(form.down_payment) || 0,
      });

      setForm(initialForm);
      await fetchProducts();
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: number) => {
    await API.delete(`/products/${id}`);
    fetchProducts();
  };

  const updateProduct = async (id: number, product: Product) => {
    await API.put(`/products/${id}`, {
      title: product.title,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      down_payment: Number(product.down_payment) || 0,
    });

    setEditingId(null);
    fetchProducts();
  };

  return (
    <div className="px-5 py-8 text-white md:px-8 lg:px-12 lg:py-12">
      <section className="max-w-5xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-lg border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.24em] text-amber-400">
          <PackagePlus size={16} />
          Inventario premium
        </div>

        <h1 className="bg-gradient-to-r from-amber-300 via-emerald-400 to-amber-200 bg-clip-text text-4xl font-black text-transparent md:text-6xl">
          Productos
        </h1>

        <p className="mt-4 max-w-3xl text-lg leading-8 text-warm-50/62">
          Crea, edita y organiza el catálogo con una interfaz más limpia.
        </p>
      </section>

      <section className="mt-10 rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-5 shadow-2xl shadow-amber-950/20 backdrop-blur md:p-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            placeholder="Título"
            value={form.title}
            onChange={(event) =>
              setForm({
                ...form,
                title: event.target.value,
              })
            }
            className="rounded-lg border border-amber-200/12 bg-warm-900/50 p-4 outline-none focus:border-amber-400/50"
          />

          <input
            placeholder="Precio"
            value={form.price}
            onChange={(event) =>
              setForm({
                ...form,
                price: event.target.value,
              })
            }
            className="rounded-lg border border-amber-200/12 bg-warm-900/50 p-4 outline-none focus:border-amber-400/50"
          />

          <input
            placeholder="Cuota inicial (0 si no aplica)"
            value={form.down_payment}
            onChange={(event) =>
              setForm({
                ...form,
                down_payment: event.target.value,
              })
            }
            className="rounded-lg border border-amber-200/12 bg-warm-900/50 p-4 outline-none focus:border-amber-400/50"
          />

          <input
            placeholder="Stock"
            value={form.stock}
            onChange={(event) =>
              setForm({
                ...form,
                stock: event.target.value,
              })
            }
            className="rounded-lg border border-amber-200/12 bg-warm-900/50 p-4 outline-none focus:border-amber-400/50"
          />

          <div className="relative">
            <select
              value={form.category}
              onChange={(event) =>
                setForm({
                  ...form,
                  category: event.target.value,
                })
              }
              className="w-full rounded-lg border border-amber-200/12 bg-warm-900 p-4 text-warm-50 outline-none focus:border-amber-400/50"
            >
              {categories.length === 0 && (
                <option value="" className="bg-warm-900">Cargando...</option>
              )}
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name} className="bg-warm-900">
                  {cat.name}
                </option>
              ))}
            </select>

            {/* New category inline */}
            <div className="mt-3">
              {showNewCategory ? (
                <div className="flex items-center gap-2">
                  <input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nueva categoría..."
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && newCategoryName.trim()) {
                        try {
                          const res = await API.post<{ category: Category }>("/categories", { name: newCategoryName.trim() });
                          setCategories((prev) => [...prev, res.data.category]);
                          setForm((prev) => ({ ...prev, category: res.data.category.name }));
                          setNewCategoryName("");
                          setShowNewCategory(false);
                        } catch {
                          // Silent
                        }
                      }
                      if (e.key === "Escape") {
                        setShowNewCategory(false);
                        setNewCategoryName("");
                      }
                    }}
                    className="flex-1 rounded-lg border border-amber-200/15 bg-warm-900/60 px-3 py-2 text-xs text-warm-50 placeholder-warm-50/30 outline-none focus:border-amber-400/50"
                  />
                  <button
                    type="button"
                    onClick={() => { setShowNewCategory(false); setNewCategoryName(""); }}
                    className="rounded-lg border border-amber-200/15 bg-amber-200/8 px-2.5 py-2 text-xs text-warm-50/60 hover:text-warm-50"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNewCategory(true)}
                  className="text-xs font-bold text-amber-400/70 hover:text-amber-400 transition"
                >
                  + Nueva categoría
                </button>
              )}
            </div>
          </div>
        </div>

        <textarea
          placeholder="Descripción"
          value={form.description}
          onChange={(event) =>
            setForm({
              ...form,
              description: event.target.value,
            })
          }
          className="mt-4 h-[160px] w-full rounded-lg border border-amber-200/12 bg-warm-900/50 p-4 outline-none focus:border-amber-400/50"
        />

        <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-lg border border-amber-200/12 bg-warm-900/50 p-4 text-sm font-bold text-warm-50/72">
          {uploading ? (
            <LoaderCircle className="h-5 w-5 animate-spin text-amber-400" />
          ) : (
            <ImageUp className="h-5 w-5 text-amber-400" />
          )}
          Subir imagen
          <input type="file" onChange={uploadImage} className="hidden" />
        </label>

        {form.image && (
          <div className="group relative mt-6 inline-block">
            <img
              src={form.image}
              alt={form.title || "Vista previa del producto"}
              className="h-[220px] w-[220px] cursor-pointer rounded-lg object-cover shadow-xl shadow-amber-950/25 transition-all duration-300 group-hover:brightness-75"
              onClick={() => window.open(form.image, "_blank")}
            />
            <button
              type="button"
              onClick={() => window.open(form.image, "_blank")}
              className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            >
              <span className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-2 text-xs font-bold text-white backdrop-blur-sm">
                <ZoomIn size={14} />
                Ver completa
              </span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={createProduct}
          disabled={saving}
          className="mt-7 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-emerald-600 px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:from-amber-400 hover:to-emerald-500 disabled:opacity-60"
        >
          {saving ? (
            <LoaderCircle className="h-5 w-5 animate-spin" />
          ) : (
            <PackagePlus size={18} />
          )}
          Crear producto
        </button>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
        {products.map((product, index) => (
          <article
            key={product.id}
            className="overflow-hidden rounded-lg border border-amber-200/12 bg-amber-200/[0.06] shadow-2xl shadow-amber-950/20 backdrop-blur"
          >
            {/* Clickable image with lightbox */}
            <ProductImage
              src={product.image}
              alt={product.title || "Producto"}
            />

            <div className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <input
                    value={product.title}
                    disabled={editingId !== product.id}
                    onChange={(event) => {
                      setProducts((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                title: event.target.value,
                              }
                            : item
                        )
                      );
                    }}
                    className="w-full bg-transparent text-3xl font-black outline-none"
                  />

                  <p className="mt-2 text-sm font-black uppercase tracking-[0.18em] text-amber-400">
                    {product.category}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {editingId === product.id ? (
                    <button
                      type="button"
                      onClick={() => updateProduct(product.id, product)}
                      className="inline-flex items-center gap-2 rounded-lg border border-amber-200/25 bg-amber-200/10 px-4 py-3 text-sm font-black text-amber-400 transition hover:bg-amber-200/15"
                    >
                      <Save size={16} />
                      Guardar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingId(product.id)}
                      className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-3 text-sm font-black text-warm-900 transition hover:bg-amber-400"
                    >
                      <Pencil size={16} />
                      Editar
                    </button>
                  )}

                  <a
                    href={getWhatsAppUrl(product, whatsappNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-200/25 bg-emerald-200/10 px-4 py-3 text-sm font-black text-emerald-400 transition hover:bg-emerald-200/15"
                  >
                    <MessageCircle size={16} />
                    Comprar ahora
                  </a>

                  <button
                    type="button"
                    onClick={() => deleteProduct(product.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200/25 bg-red-200/10 px-4 py-3 text-sm font-black text-red-400 transition hover:bg-red-200/15"
                  >
                    <Trash2 size={16} />
                    Eliminar
                  </button>
                </div>
              </div>

              <textarea
                value={product.description}
                disabled={editingId !== product.id}
                onChange={(event) => {
                  setProducts((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index
                        ? {
                            ...item,
                            description: event.target.value,
                          }
                        : item
                    )
                  );
                }}
                className="mt-5 w-full resize-none bg-transparent leading-relaxed text-warm-50/70 outline-none"
              />

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <input
                  value={product.price}
                  disabled={editingId !== product.id}
                  onChange={(event) => {
                    setProducts((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? {
                              ...item,
                              price: event.target.value,
                            }
                          : item
                      )
                    );
                  }}
                  className="rounded-lg border border-amber-200/12 bg-warm-900/50 p-4 text-2xl font-black outline-none focus:border-amber-400/50"
                />

                <input
                  value={product.down_payment ?? 0}
                  disabled={editingId !== product.id}
                  onChange={(event) => {
                    setProducts((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? {
                              ...item,
                              down_payment: event.target.value,
                            }
                          : item
                      )
                    );
                  }}
                  className="rounded-lg border border-amber-200/12 bg-warm-900/50 p-4 text-2xl font-black outline-none focus:border-amber-400/50"
                />

                <input
                  value={product.stock}
                  disabled={editingId !== product.id}
                  onChange={(event) => {
                    setProducts((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? {
                              ...item,
                              stock: event.target.value,
                            }
                          : item
                      )
                    );
                  }}
                  className="rounded-lg border border-amber-200/12 bg-warm-900/50 p-4 text-2xl font-black outline-none focus:border-amber-400/50"
                />
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

// ─── ProductImage Component (clickable with lightbox) ───

function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);

  const apiRoot =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "";

  const getUrl = (image: string) => {
    if (!image || image.startsWith("http")) return image || "";
    const path = image.startsWith("/") ? image : `/${image}`;
    return `${apiRoot}${path}`;
  };

  const imageUrl = getUrl(src);

  return (
    <>
      <div
        className="group relative cursor-pointer overflow-hidden"
        onClick={() => setOpen(true)}
      >
        <img
          src={imageUrl}
          alt={alt}
          className="h-[360px] w-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-75"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="flex items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm shadow-lg">
            <ZoomIn size={16} />
            Click para ver completa
          </span>
        </div>
      </div>

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-6 top-6 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X size={24} />
          </button>
          <img
            src={imageUrl}
            alt={alt}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
