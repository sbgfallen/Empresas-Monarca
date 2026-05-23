/* eslint-disable @next/next/no-img-element */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowUpDown,
  ArrowUpRight,
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flame,
  LoaderCircle,
  MessageCircle,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  X,
} from "lucide-react";

import API from "../services/api";

interface Discount {
  promotionId: number;
  promotionTitle: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountedPrice: number;
  endsAt: string;
}

interface Product {
  category?: string;
  description?: string;
  down_payment?: number | string;
  financing?: {
    daily?: string | number;
    weekly?: string | number;
    monthly?: string | number;
  } | null;
  id: number;
  image?: string;
  price?: string | number;
  original_price?: string | number;
  stock?: string | number;
  title?: string;
  discount?: Discount;
}

const fallbackProducts: Product[] = [
  {
    id: -1,
    title: "Departamento Premium",
    description: "Vista amplia, acabados sobrios y espacios listos para vivir.",
    price: 98000000,
    stock: "Disponible",
    category: "Inmuebles",
    down_payment: 0,
    image:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: -2,
    title: "Cocina Smart Suite",
    description: "Electrodomésticos integrados para una cocina más precisa.",
    price: 12490000,
    stock: "Nuevo",
    category: "Electrodomésticos",
    down_payment: 0,
    image:
      "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: -3,
    title: "Sala Modular Nórdica",
    description: "Confort, madera cálida y diseño flexible para espacios premium.",
    price: 6890000,
    stock: "Últimas unidades",
    category: "Muebles",
    down_payment: 0,
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: -4,
    title: "Laptop Pro Ultrabook",
    description: "Rendimiento máximo para profesionales creativos y ejecutivos.",
    price: 8490000,
    stock: "Nuevo",
    category: "Tecnología",
    down_payment: 0,
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: -5,
    title: "Smart TV OLED 65\"",
    description: "Imagen perfecta con colores vivos y sonido envolvente.",
    price: 5290000,
    stock: "Disponible",
    category: "Electrodomésticos",
    down_payment: 0,
    image:
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: -6,
    title: "Set de Jardín Ébano",
    description: "Muebles de exterior con acabado premium resistente al clima.",
    price: 4190000,
    stock: "Últimas unidades",
    category: "Muebles",
    down_payment: 0,
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop",
  },
];

const apiRoot =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "";

function getImageUrl(image?: string) {
  if (!image) {
    return "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=1200&auto=format&fit=crop";
  }

  if (image.startsWith("http")) {
    return image;
  }

  const path = image.startsWith("/") ? image : `/${image}`;

  return `${apiRoot}${path}`;
}


function formatCurrency(value?: string | number, fallback = "Consultar") {
  const numericValue = Number(
    String(value ?? "").replace(/[^\d.-]/g, "")
  );

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallback;
  }

  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(numericValue);
}

function parseNumeric(value?: string | number): number {
  return Number(String(value ?? "").replace(/[^\d.-]/g, ""));
}

function getWhatsAppUrl(
  product: Product,
  whatsappNumber: string,
  months: number
): string {
  const title = product.title || "Producto";
  const price = parseNumeric(product.price);
  const downPayment = parseNumeric(product.down_payment);
  const remaining = Math.max(0, price - downPayment);
  const monthly = months > 0 ? Math.round(remaining / months) : 0;

  const message = [
    "Hola! Me interesa este producto:",
    "",
    "- Producto: " + title,
    "- Precio: " + formatCurrency(price, "$0"),
    "- Cuota inicial: " + formatCurrency(downPayment, "$0"),
    "- " + months + " cuota" + (months > 1 ? "s" : "") + " de: " + formatCurrency(monthly, "$0"),
    "",
    "Quedo atento a tu respuesta. Gracias!",
  ].join("\n");

  return "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(message);
}



// ─── Ofertas Auto-Sliding Carousel (Samsung-style) ───

function OfertasCarousel({ products }: { products: Product[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const discountedProducts = useMemo(
    () => products.filter((p) => p.discount),
    [products]
  );

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (discountedProducts.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % discountedProducts.length);
    }, 5000);
  }, [discountedProducts.length]);

  useEffect(() => {
    if (discountedProducts.length <= 1) return;
    startAutoPlay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [discountedProducts.length, startAutoPlay]);

  const goNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % discountedProducts.length);
    startAutoPlay();
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + discountedProducts.length) % discountedProducts.length);
    startAutoPlay();
  };

  if (discountedProducts.length === 0) return null;

  const product = discountedProducts[currentIndex];
  const imgUrl = getImageUrl(product.image);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 400 : -400,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -400 : 400,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <div className="mb-16">
      {/* Section label */}
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-600/20 to-rose-700/10 border border-rose-500/25 px-4 py-1.5 text-xs font-black uppercase tracking-[0.24em] text-rose-400">
          <Flame size={14} />
          Ofertas activas
        </span>
        {discountedProducts.length > 1 && (
          <span className="text-xs text-warm-50/35">
            {currentIndex + 1} / {discountedProducts.length}
          </span>
        )}
      </div>

      {/* Samsung-style large card */}
      <div className="relative overflow-hidden rounded-2xl border border-rose-200/12 bg-gradient-to-b from-rose-200/[0.06] to-rose-200/[0.02] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.5)]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={product.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative aspect-[21/9] w-full overflow-hidden"
          >
            {/* Large product image */}
            <img
              src={imgUrl}
              alt={product.title || "Oferta premium"}
              className="h-full w-full object-cover transition-all duration-700"
            />

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

            {/* Premium glow effect */}
            <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-rose-500/15 blur-[80px]" />
            <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-rose-600/10 blur-[60px]" />

            {/* Discount badge */}
            <div className="absolute right-6 top-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-600 to-rose-800 blur-lg opacity-60" />
                <div className="relative flex h-20 w-20 flex-col items-center justify-center rounded-full bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 shadow-2xl shadow-rose-950/60">
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white/70">
                    OFF
                  </span>
                  <span className="text-xl font-black text-white leading-none -mt-0.5">
                    {product.discount?.discountType === "percentage"
                      ? `${product.discount.discountValue}%`
                      : `-$${Number(product.discount?.discountValue).toLocaleString()}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-rose-400 mb-2">
                  <Tag size={14} />
                  {product.category || "Premium"}
                </div>

                <h3 className="text-2xl font-black text-white md:text-4xl lg:text-5xl">
                  {product.title}
                </h3>

                <p className="mt-2 max-w-xl text-sm leading-6 text-white/60 md:text-base md:leading-7">
                  {product.description}
                </p>

                <div className="mt-4 flex items-baseline gap-3">
                  {product.original_price && (
                    <span className="text-lg font-bold text-white/40 line-through md:text-xl">
                      {formatCurrency(product.original_price, "$0")}
                    </span>
                  )}
                  <span className="text-3xl font-black text-rose-400 md:text-5xl">
                    {formatCurrency(product.price, "$0")}
                  </span>
                </div>

                {product.discount && (
                  <p className="mt-1 text-xs font-semibold text-rose-400/70">
                    {product.discount.promotionTitle} · Válido hasta {new Date(product.discount.endsAt).toLocaleDateString()}
                  </p>
                )}

                <Link
                  href={`/productos/${product.id}`}
                  className="group mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-rose-950/40 transition-all duration-300 hover:from-rose-500 hover:to-rose-600 hover:shadow-2xl hover:shadow-rose-600/30 active:scale-95"
                >
                  <span>Ver oferta</span>
                  <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {discountedProducts.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/50 text-white/70 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-black/70 hover:text-white"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={goNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/50 text-white/70 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-black/70 hover:text-white"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {discountedProducts.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {discountedProducts.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                  startAutoPlay();
                }}
                className={`h-2 rounded-full transition-all duration-500 ${
                  idx === currentIndex
                    ? "w-8 bg-gradient-to-r from-rose-500 to-rose-700 shadow-lg shadow-rose-500/30"
                    : "w-2 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState("5491130000000");

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [cuotaMin, setCuotaMin] = useState("");
  const [cuotaMax, setCuotaMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<string>("");
  const [selectedMonths, setSelectedMonths] = useState<Record<number, number>>({});
  const [monthsDropdownOpen, setMonthsDropdownOpen] = useState<Record<number, boolean>>({});

  const getSelectedMonths = (productId: number) => selectedMonths[productId] || 3;

  useEffect(() => {
    let isActive = true;

    Promise.all([
      API.get<Product[]>("/products"),
      API.get<{ value: string }>("/settings/whatsapp_number").catch(() => ({ data: { value: "5491130000000" } })),
    ])
      .then(([productsRes, settingsRes]) => {
        if (isActive) {
          setProducts(productsRes.data);
          setWhatsappNumber(settingsRes.data.value);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.log(error);

        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const displayProducts = products.length > 0 ? products : fallbackProducts;

  // Extract unique categories
  const categories = useMemo(() => {
    const unique = new Set<string>();
    for (const p of displayProducts) {
      if (p.category) {
        unique.add(p.category);
      }
    }
    return Array.from(unique).sort();
  }, [displayProducts]);

  // Filter + sort logic
  const filteredProducts = useMemo(() => {
    let result = displayProducts.filter((product) => {
      // Search by title or description
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const title = (product.title || "").toLowerCase();
        const desc = (product.description || "").toLowerCase();
        if (!title.includes(query) && !desc.includes(query)) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory && product.category !== selectedCategory) {
        return false;
      }

      // Price range filter
      const productPrice = parseNumeric(product.price);
      if (priceMin && productPrice < parseNumeric(priceMin)) {
        return false;
      }
      if (priceMax && productPrice > parseNumeric(priceMax)) {
        return false;
      }

      // Monthly installment range filter
      const numericPrice = parseNumeric(product.price);
      const downP = parseNumeric(product.down_payment);
      const productCuota = numericPrice > downP ? Math.round((numericPrice - downP) / 3) : 0;
      if (cuotaMin && productCuota < parseNumeric(cuotaMin)) {
        return false;
      }
      if (cuotaMax && productCuota > parseNumeric(cuotaMax)) {
        return false;
      }

      return true;
    });

    // Sort by price
    if (sortOrder === "asc") {
      result = [...result].sort(
        (a, b) => parseNumeric(a.price) - parseNumeric(b.price)
      );
    } else if (sortOrder === "desc") {
      result = [...result].sort(
        (a, b) => parseNumeric(b.price) - parseNumeric(a.price)
      );
    }

    return result;
  }, [displayProducts, searchQuery, selectedCategory, priceMin, priceMax, cuotaMin, cuotaMax, sortOrder]);

  const hasActiveFilters = searchQuery || selectedCategory || priceMin || priceMax || cuotaMin || cuotaMax;

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setPriceMin("");
    setPriceMax("");
    setCuotaMin("");
    setCuotaMax("");
    setSortOrder("");
  };

  return (
    <section
      id="productos"
      className="bg-[radial-gradient(circle_at_12%_18%,rgba(244,63,94,0.12),transparent_28%),linear-gradient(135deg,#1a0f0a_0%,#2d1f14_52%,#1a0f0a_100%)] px-5 py-24 text-warm-50 md:px-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-rose-300">
              Selección destacada
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight md:text-6xl">
              Productos listos para elegir
            </h2>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-rose-200/12 bg-rose-200/[0.06] px-4 py-3 text-sm text-warm-50/72">
            {isLoading ? (
              <LoaderCircle className="animate-spin text-rose-500" size={18} />
            ) : (
              <ShieldCheck className="text-rose-500" size={18} />
            )}
            {products.length > 0
              ? "Inventario sincronizado"
              : "Colección de muestra"}
          </div>
        </div>

        {/* Auto-sliding Ofertas Carousel (Samsung-style) */}
        {!isLoading && (
          <OfertasCarousel products={displayProducts} />
        )}

        {/* Search + Filters Bar */}
        <div className="mb-10 space-y-4">
          {/* Search row */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-warm-50/40"
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos por nombre o descripción..."
                className="w-full rounded-lg border border-rose-200/12 bg-warm-900/80 px-11 py-4 text-sm text-warm-50 outline-none backdrop-blur transition focus:border-rose-500/50 focus:bg-warm-900 placeholder:text-warm-50/35"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-50/40 transition hover:text-warm-50/70"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Sort selector - fixed dark dropdown */}
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full appearance-none rounded-lg border border-rose-200/12 bg-rose-200/[0.06] px-5 py-4 pr-12 text-sm font-black uppercase tracking-[0.12em] text-warm-50/60 outline-none transition hover:border-rose-200/25 sm:w-auto"
                style={{
                  colorScheme: "dark",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                }}
              >
                <option value="" className="bg-warm-900 text-warm-50/60">Ordenar por</option>
                <option value="asc" className="bg-warm-900 text-warm-50">Precio: menor a mayor</option>
                <option value="desc" className="bg-warm-900 text-warm-50">Precio: mayor a menor</option>
              </select>
              <ArrowUpDown
                size={15}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-warm-50/40"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 rounded-lg border px-5 py-4 text-sm font-black uppercase tracking-[0.12em] transition ${
                showFilters || hasActiveFilters
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                  : "border-rose-200/12 bg-rose-200/[0.06] text-warm-50/60 hover:border-rose-200/25 hover:bg-rose-200/[0.10]"
              }`}
            >
              <SlidersHorizontal size={17} />
              Filtros
              <ChevronDown
                size={15}
                className={`transition ${showFilters ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="rounded-lg border border-rose-200/12 bg-rose-200/[0.04] p-5 backdrop-blur transition-all">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Category filter */}
                <div>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-warm-50/45">
                    Categoría
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() =>
                          setSelectedCategory(
                            selectedCategory === cat ? null : cat
                          )
                        }
                        className={`rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition ${
                          selectedCategory === cat
                            ? "border-rose-500/40 bg-rose-500/12 text-rose-400"
                            : "border-rose-200/12 bg-rose-200/[0.06] text-warm-50/55 hover:border-rose-200/25 hover:text-warm-50/80"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-warm-50/45">
                    Precio (ARS)
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      placeholder="Desde"
                      type="number"
                      className="w-full rounded-lg border border-rose-200/12 bg-warm-900/60 px-3 py-2.5 text-sm outline-none transition focus:border-rose-500/40 placeholder:text-warm-50/30"
                    />
                    <span className="text-xs text-warm-50/35">—</span>
                    <input
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      placeholder="Hasta"
                      type="number"
                      className="w-full rounded-lg border border-rose-200/12 bg-warm-900/60 px-3 py-2.5 text-sm outline-none transition focus:border-rose-500/40 placeholder:text-warm-50/30"
                    />
                  </div>
                </div>

                {/* Cuota range */}
                <div>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-warm-50/45">
                    Cuota mensual (ARS)
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      value={cuotaMin}
                      onChange={(e) => setCuotaMin(e.target.value)}
                      placeholder="Desde"
                      type="number"
                      className="w-full rounded-lg border border-rose-200/12 bg-warm-900/60 px-3 py-2.5 text-sm outline-none transition focus:border-rose-500/40 placeholder:text-warm-50/30"
                    />
                    <span className="text-xs text-warm-50/35">—</span>
                    <input
                      value={cuotaMax}
                      onChange={(e) => setCuotaMax(e.target.value)}
                      placeholder="Hasta"
                      type="number"
                      className="w-full rounded-lg border border-rose-200/12 bg-warm-900/60 px-3 py-2.5 text-sm outline-none transition focus:border-rose-500/40 placeholder:text-warm-50/30"
                    />
                  </div>
                </div>

                {/* Results count + clear */}
                <div className="flex flex-col justify-end">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-warm-50/45">
                    &nbsp;
                  </p>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-warm-50/50">
                      <span className="font-bold text-warm-50/80">
                        {filteredProducts.length}
                      </span>{" "}
                      {filteredProducts.length === 1
                        ? "resultado"
                        : "resultados"}
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500/70 transition hover:text-rose-400"
                      >
                        <X size={13} />
                        Limpiar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active filter pills */}
          {hasActiveFilters && !showFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-200/15 bg-rose-200/[0.06] px-2.5 py-1.5 text-[11px] font-bold text-warm-50/60">
                  <Search size={12} />
                  &ldquo;{searchQuery}&rdquo;
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-200/15 bg-rose-200/[0.06] px-2.5 py-1.5 text-[11px] font-bold text-warm-50/60">
                  {selectedCategory}
                </span>
              )}
              {(priceMin || priceMax) && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-200/15 bg-rose-200/[0.06] px-2.5 py-1.5 text-[11px] font-bold text-warm-50/60">
                  Precio: ${priceMin || "0"} – ${priceMax || "∞"}
                </span>
              )}
              {(cuotaMin || cuotaMax) && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-200/15 bg-rose-200/[0.06] px-2.5 py-1.5 text-[11px] font-bold text-warm-50/60">
                  Cuota: ${cuotaMin || "0"} – ${cuotaMax || "∞"}
                </span>
              )}
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-bold text-rose-500/60 transition hover:text-rose-400"
              >
                <X size={13} />
                Limpiar
              </button>
            </div>
          )}
        </div>

        {/* Product grid */}
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-rose-200/10 bg-rose-200/[0.04] px-6 py-20 text-center">
            <Search size={40} className="mb-4 text-warm-50/20" />
            <p className="text-lg font-black text-warm-50/50">
              No encontramos productos con esos filtros
            </p>
            <p className="mt-2 text-sm text-warm-50/35">
              Intentá ajustar los criterios de búsqueda
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-rose-200/20 bg-rose-200/10 px-5 py-3 text-sm font-black text-rose-500 transition hover:bg-rose-200/15"
            >
              <X size={16} />
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`group relative rounded-lg border border-rose-200/12 bg-rose-200/[0.06] shadow-2xl shadow-rose-950/30 backdrop-blur ${monthsDropdownOpen[product.id] ? "z-[100] isolate" : ""}`}
              >
                <Link
                  href={`/productos/${product.id}`}
                  className="relative aspect-[4/3] block overflow-hidden bg-warm-900"
                >
                  <img
                    src={getImageUrl(product.image)}
                    alt={product.title || "Producto premium"}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/40">
                    <span className="flex items-center gap-2 rounded-xl bg-white/20 px-5 py-3 text-sm font-bold text-white opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 shadow-lg">
                      <ExternalLink size={16} />
                      Ver detalle
                    </span>
                  </div>

                  <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-lg bg-warm-900/80 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-rose-400 backdrop-blur">
                    <Tag size={14} />
                    {product.category || "Premium"}
                  </div>

                  {product.discount && (
                    <div className="absolute right-4 top-4 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 px-3 py-2 text-xs font-black text-white shadow-lg shadow-rose-950/40">
                      {product.discount.discountType === "percentage"
                        ? `${product.discount.discountValue}% OFF`
                        : `-$${Number(product.discount.discountValue).toLocaleString()}`}
                    </div>
                  )}
                </Link>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-black leading-tight">
                        {product.title}
                      </h3>

                      <p className="mt-3 min-h-12 text-sm leading-6 text-warm-50/60">
                        {product.description}
                      </p>
                    </div>

                    <BadgeCheck className="shrink-0 text-rose-500" size={22} />
                  </div>

                  <div className="mt-7 flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-warm-50/40">
                        Precio
                      </p>
                      <div className="mt-2 flex items-baseline gap-2">
                        {product.discount && product.original_price ? (
                          <>
                            <p className="text-sm font-bold text-warm-50/40 line-through">
                              {formatCurrency(product.original_price, "$0")}
                            </p>
                            <p className="text-2xl font-black text-rose-500">
                              {formatCurrency(product.price, "$0")}
                            </p>
                          </>
                        ) : (
                          <p className="text-2xl font-black">
                            {formatCurrency(product.price, "$0")}
                          </p>
                        )}
                      </div>
                      {product.discount && (
                        <p className="mt-1 text-[10px] font-semibold text-rose-500/70">
                          {product.discount.promotionTitle}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-warm-50/40">
                        Cuota inicial
                      </p>
                      <p className="mt-2 text-lg font-black text-warm-50">
                        {formatCurrency(product.down_payment, "$0")}
                      </p>
                      <p className="mt-0.5 text-[10px] text-warm-50/40">
                        Restante: {formatCurrency(Math.max(0, parseNumeric(product.price) - parseNumeric(product.down_payment)), "$0")}
                      </p>
                    </div>
                  </div>

                  {/* Month selector — Elegant Dropdown */}
                  <div className="mt-5 rounded-xl border border-rose-200/10 bg-rose-200/[0.04] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-warm-50/40 mb-1.5">
                          Financiar en
                        </p>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setMonthsDropdownOpen((prev) => ({
                                ...prev,
                                [product.id]: !prev[product.id],
                              }))
                            }
                            onBlur={() =>
                              setTimeout(
                                () =>
                                  setMonthsDropdownOpen((prev) => ({
                                    ...prev,
                                    [product.id]: false,
                                  })),
                                150
                              )
                            }
                            className="flex w-full min-w-[140px] items-center justify-between gap-2 rounded-lg border border-rose-200/15 bg-warm-900/60 px-3.5 py-2.5 text-left text-xs font-black text-warm-50 outline-none transition-all duration-200 hover:border-rose-200/30 focus:border-rose-500/40"
                          >
                            <span className="flex items-center gap-2">
                              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-gradient-to-br from-rose-600 to-rose-700 text-[9px] font-black text-white shadow-sm">
                                {getSelectedMonths(product.id)}
                              </span>
                              <span>{getSelectedMonths(product.id)} cuota{getSelectedMonths(product.id) > 1 ? "s" : ""}</span>
                            </span>
                            <ChevronDown size={14} className={`text-warm-50/40 transition-transform duration-300 ${monthsDropdownOpen[product.id] ? "rotate-180" : ""}`} />
                          </button>

                          {monthsDropdownOpen[product.id] && (
                            <div className="absolute left-0 right-0 z-50 mt-1.5 overflow-visible rounded-xl border border-rose-500/20 bg-[#1a0f0a] shadow-2xl shadow-rose-950/50 ring-1 ring-rose-500/10">
                              <div className="py-1.5">
                                {[1, 2, 3, 4, 5, 6].map((m) => {
                                  const isSelected = getSelectedMonths(product.id) === m;
                                  return (
                                    <button
                                      key={m}
                                      type="button"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        setSelectedMonths((prev) => ({
                                          ...prev,
                                          [product.id]: m,
                                        }));
                                        setMonthsDropdownOpen((prev) => ({
                                          ...prev,
                                          [product.id]: false,
                                        }));
                                      }}
                                      className={`flex w-full items-center gap-2.5 px-4 py-3 text-left text-xs font-black transition-all duration-150 ${
                                        isSelected
                                          ? "bg-gradient-to-r from-rose-500/20 to-rose-700/10 text-rose-300"
                                          : "text-warm-50/80 hover:bg-rose-200/[0.08] hover:text-warm-50"
                                      }`}
                                    >
                                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-[9px] font-black transition-all duration-200 ${
                                        isSelected
                                          ? "bg-gradient-to-br from-rose-600 to-rose-700 text-white shadow-md shadow-rose-500/20 scale-110"
                                          : "border border-rose-200/20 bg-rose-200/[0.06] text-warm-50/70"
                                      }`}>
                                        {m}
                                      </span>
                                      <span className="flex-1">{m} cuota{m > 1 ? "s" : ""}</span>
                                      {isSelected && (
                                        <span className="text-[10px] text-rose-400">✓</span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-warm-50/40">
                          Cuota mensual
                        </p>
                        <p className="mt-1 text-2xl font-black bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
                          {(() => {
                            const months = getSelectedMonths(product.id);
                            const price = parseNumeric(product.price);
                            const downP = parseNumeric(product.down_payment);
                            const remaining = Math.max(0, price - downP);
                            return months > 0 ? formatCurrency(Math.round(remaining / months), "$0") : "$0";
                          })()}
                        </p>
                        <p className="text-[10px] text-warm-50/40">
                          {getSelectedMonths(product.id)} cuota{getSelectedMonths(product.id) > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:gap-3">
                    <Link
                      href={`/productos/${product.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200/20 bg-rose-200/8 px-4 py-3 text-sm font-bold text-warm-50 transition hover:border-rose-200/30 hover:bg-rose-200/15"
                    >
                      <ExternalLink size={16} />
                      Ver detalle
                    </Link>
                    <a
                      href={getWhatsAppUrl(product, whatsappNumber, getSelectedMonths(product.id))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 via-rose-700 to-rose-700 px-4 py-3 text-sm font-black text-white transition hover:from-rose-500 hover:via-rose-600 hover:to-rose-600 shadow-lg shadow-rose-950/30"
                    >
                      <MessageCircle size={17} />
                      Comprar ahora
                    </a>
                    <a
                      href={`/productos/${product.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-950/30 transition-all duration-300 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-xl hover:shadow-emerald-600/30 active:scale-95"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Comprar al contado
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
