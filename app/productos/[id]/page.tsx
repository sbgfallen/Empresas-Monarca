"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BadgePercent,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  ExternalLink,
  LoaderCircle,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Tag,
  X,
} from "lucide-react";

import API from "@/app/services/api";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

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

const apiRoot =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "";

function getImageUrl(image?: string) {
  if (!image) {
    return "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=1200&auto=format&fit=crop";
  }
  if (image.startsWith("http")) return image;
  const path = image.startsWith("/") ? image : `/${image}`;
  return `${apiRoot}${path}`;
}

function formatCurrency(value?: string | number, fallback = "Consultar") {
  const numericValue = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(numericValue) || numericValue <= 0) return fallback;
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(numericValue);
}

function parseNumeric(value?: string | number): number {
  return Number(String(value ?? "").replace(/[^\d.-]/g, ""));
}

export default function ProductoDetallePage() {
  const params = useParams();
  const productId = Number(params.id);

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState("5491130000000");
  const [selectedMonths, setSelectedMonths] = useState(3);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [monthsOpen, setMonthsOpen] = useState(false);

  // Related products: same category, exclude current, limit 4
  const relatedProducts = useMemo(() => {
    if (!product || !product.category) return [];
    return allProducts
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }, [allProducts, product]);

  const getWhatsAppUrl = useCallback(() => {
    if (!product) return "#";
    const title = product.title || "Producto";
    const price = parseNumeric(product.price);
    const downPayment = parseNumeric(product.down_payment);
    const remaining = Math.max(0, price - downPayment);
    const monthly = selectedMonths > 0 ? Math.round(remaining / selectedMonths) : 0;

    const message = [
      "Hola! Me interesa este producto:",
      "",
      `- Producto: ${title}`,
      `- Precio: ${formatCurrency(price, "$0")}`,
      `- Cuota inicial: ${formatCurrency(downPayment, "$0")}`,
      `- ${selectedMonths} cuota${selectedMonths > 1 ? "s" : ""} de: ${formatCurrency(monthly, "$0")}`,
      "",
      "Quedo atento a tu respuesta. Gracias!",
    ].join("\n");

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  }, [product, whatsappNumber, selectedMonths]);

  useEffect(() => {
    let isActive = true;

    Promise.all([
      API.get<Product>(`/products/${productId}`),
      API.get<Product[]>("/products").catch(() => ({ data: [] })),
      API.get<{ value: string }>("/settings/whatsapp_number")
        .catch(() => ({ data: { value: "5491130000000" } })),
    ])
      .then(([productRes, productsRes, settingsRes]) => {
        if (isActive) {
          setProduct(productRes.data);
          setAllProducts(productsRes.data);
          setWhatsappNumber(settingsRes.data.value);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => { isActive = false; };
  }, [productId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(135deg,#1a0f0a_0%,#2d1f14_48%,#1a0f0a_100%)] text-warm-50">
        <Navbar />
        <div className="flex min-h-[80vh] items-center justify-center pt-24">
          <div className="flex items-center gap-3 rounded-lg border border-rose-200/12 bg-rose-200/[0.06] px-6 py-4">
            <LoaderCircle className="h-5 w-5 animate-spin text-rose-500" />
            <span className="text-sm font-semibold">Cargando producto...</span>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[linear-gradient(135deg,#1a0f0a_0%,#2d1f14_48%,#1a0f0a_100%)] text-warm-50">
        <Navbar />
        <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 pt-24">
          <ShoppingBag size={64} className="text-warm-50/20" />
          <h1 className="text-3xl font-black">Producto no encontrado</h1>
          <p className="text-warm-50/60">El producto que buscás no existe o fue eliminado.</p>
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-3 text-sm font-black text-white transition hover:from-rose-500 hover:to-rose-600"
          >
            <ArrowLeft size={18} />
            Volver a productos
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const imageUrl = getImageUrl(product.image);
  const price = parseNumeric(product.price);
  const downPayment = parseNumeric(product.down_payment);
  const remaining = Math.max(0, price - downPayment);

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#1a0f0a_0%,#2d1f14_48%,#1a0f0a_100%)] text-warm-50">
      {/* Lightbox overlay */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-6 top-6 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X size={24} />
          </button>
          <img
            src={imageUrl}
            alt={product.title || "Producto"}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <Navbar />

      <div className="mx-auto max-w-7xl px-5 pt-28 pb-16 md:px-8">
        {/* Breadcrumb */}
        <Link
          href="/productos"
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-warm-50/50 transition hover:text-rose-400"
        >
          <ArrowLeft size={16} />
          Volver a productos
        </Link>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* ─── Image ─── */}
          <div className="group relative">
            <div
              className="relative aspect-square cursor-pointer overflow-hidden rounded-2xl border border-rose-200/12 bg-warm-900 shadow-2xl shadow-rose-950/30 transition-all duration-300 hover:border-rose-200/25"
              onClick={() => setLightboxOpen(true)}
            >
              <img
                src={imageUrl}
                alt={product.title || "Producto premium"}
                className="h-full w-full object-contain transition-all duration-700 group-hover:scale-105"
              />

              {/* Category badge */}
              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-xl bg-warm-900/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-rose-400 backdrop-blur">
                <Tag size={14} />
                {product.category || "Premium"}
              </div>

              {product.discount && (
                <div className="absolute right-4 top-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-4 py-2 text-xs font-black text-white shadow-lg shadow-rose-950/40">
                  {product.discount.discountType === "percentage"
                    ? `${product.discount.discountValue}% OFF`
                    : `-$${Number(product.discount.discountValue).toLocaleString()}`}
                </div>
              )}

              {/* Zoom hint */}
              <div className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-warm-900/70 px-3 py-1.5 text-xs font-bold text-warm-50/70 backdrop-blur">
                  Click para ver imagen completa
                </span>
              </div>
            </div>

            {/* Stock indicator */}
            <div className="mt-4 flex items-center gap-2 text-xs text-warm-50/50">
              <ShieldCheck size={14} className="text-emerald-500" />
              {product.stock ? `Stock: ${product.stock}` : "Stock disponible"}
            </div>
          </div>

          {/* ─── Info ─── */}
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.28em] text-rose-300">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              {product.category || "Premium"}
            </div>

            <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl lg:text-6xl">
              {product.title}
            </h1>

            <p className="mt-4 text-base leading-7 text-warm-50/65 md:text-lg">
              {product.description}
            </p>

            {/* Discount info */}
            {product.discount && (
              <div className="mt-6 inline-flex items-center gap-2.5 rounded-xl border border-rose-500/15 bg-gradient-to-r from-rose-500/10 to-rose-700/5 px-5 py-3 text-sm font-bold text-rose-300 shadow-lg shadow-rose-950/20 backdrop-blur-sm">
                <BadgePercent size={20} className="text-rose-500" />
                {product.discount.promotionTitle}
                {product.discount.endsAt && (
                  <span className="inline-flex items-center gap-1 text-warm-50/50">
                    <Clock size={13} />
                    {new Date(product.discount.endsAt).toLocaleDateString("es-AR")}
                  </span>
                )}
              </div>
            )}

            {/* Price */}
            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-warm-50/40">
                Precio
              </p>
              <div className="mt-2 flex items-baseline gap-3">
                {product.discount && product.original_price ? (
                  <>
                    <p className="text-2xl font-bold text-warm-50/40 line-through">
                      {formatCurrency(product.original_price, "$0")}
                    </p>
                    <p className="text-4xl font-black text-rose-500">
                      {formatCurrency(product.price, "$0")}
                    </p>
                  </>
                ) : (
                  <p className="text-4xl font-black">
                    {formatCurrency(product.price, "$0")}
                  </p>
                )}
              </div>
            </div>

            {/* Down payment */}
            <div className="mt-6 rounded-xl border border-rose-200/10 bg-rose-200/[0.04] p-5">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-50/40">
                    Cuota inicial
                  </p>
                  <p className="mt-1 text-2xl font-black">
                    {formatCurrency(product.down_payment, "$0")}
                  </p>
                  <p className="mt-0.5 text-xs text-warm-50/40">
                    Restante: {formatCurrency(remaining, "$0")}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-50/40">
                    Financiación
                  </p>
                  <p className="mt-1 text-sm text-warm-50/60">
                    {product.financing
                      ? "Plan disponible"
                      : "Consultar planes"}
                  </p>
                </div>
              </div>
            </div>

            {/* Month selector — Elegant Dropdown */}
            <div className="mt-6 rounded-xl border border-rose-200/10 bg-rose-200/[0.04] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-50/40 mb-3">
                Financiar en
              </p>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMonthsOpen(!monthsOpen)}
                  onBlur={() => setTimeout(() => setMonthsOpen(false), 150)}
                  className="flex w-full items-center justify-between rounded-xl border border-rose-200/15 bg-warm-900/60 px-5 py-4 text-left text-sm font-black text-warm-50 outline-none transition-all duration-200 hover:border-rose-200/30 focus:border-rose-500/40"
                >
                  <span className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-rose-600 to-rose-700 text-xs font-black text-white shadow-md">
                      {selectedMonths}
                    </span>
                    <span>
                      <span className="block text-sm font-black">{selectedMonths} cuota{selectedMonths > 1 ? "s" : ""}</span>
                      <span className="block text-[10px] font-bold text-warm-50/40 mt-0.5">
                        {selectedMonths === 1 ? "Pago único" : `Plan de ${selectedMonths} meses`}
                      </span>
                    </span>
                  </span>
                  <ChevronDown size={18} className={`text-warm-50/50 transition-transform duration-300 ${monthsOpen ? "rotate-180" : ""}`} />
                </button>

                {monthsOpen && (
                  <div className="absolute left-0 right-0 z-50 mt-2 overflow-visible rounded-xl border border-rose-500/20 bg-[#1a0f0a] shadow-2xl shadow-rose-950/50 ring-1 ring-rose-500/10">
                    <div className="py-1.5">
                      {[1, 2, 3, 4, 5, 6].map((m) => {
                        const isSelected = selectedMonths === m;
                        return (
                          <button
                            key={m}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSelectedMonths(m);
                              setMonthsOpen(false);
                            }}
                            className={`flex w-full items-center gap-3 px-5 py-3.5 text-left text-sm font-black transition-all duration-150 ${
                              isSelected
                                ? "bg-gradient-to-r from-rose-500/20 to-rose-700/10 text-rose-300"
                                : "text-warm-50/80 hover:bg-rose-200/[0.08] hover:text-warm-50"
                            }`}
                          >
                            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-black transition-all duration-200 ${
                              isSelected
                                ? "bg-gradient-to-br from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-500/20 scale-110"
                                : "border border-rose-200/20 bg-rose-200/[0.06] text-warm-50/70"
                            }`}>
                              {m}
                            </span>
                            <span className="flex-1">
                              <span className="block text-sm">{m} cuota{m > 1 ? "s" : ""}</span>
                              <span className="block text-[10px] font-bold text-warm-50/40 mt-0.5">
                                {m === 1 ? "Pago único" : `Plan de ${m} meses`}
                              </span>
                            </span>
                            {isSelected && (
                              <span className="mr-1 text-xs text-rose-400">✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Monthly payment result */}
              <div className="mt-5 flex items-center justify-between border-t border-rose-200/10 pt-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-warm-50/40">
                    Cuota mensual estimada
                  </p>
                  <p className="mt-1 text-xs text-warm-50/40">
                    Saldo a financiar: {formatCurrency(remaining, "$0")}
                  </p>
                </div>
                <p className="text-3xl font-black bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
                  {selectedMonths > 0
                    ? formatCurrency(Math.round(remaining / selectedMonths), "$0")
                    : "$0"}
                </p>
              </div>
            </div>

            {/* WhatsApp CTA */}
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-green-600 via-green-700 to-green-700 px-6 py-4 text-sm font-black text-white shadow-xl shadow-green-950/30 transition-all duration-300 hover:from-green-500 hover:via-green-600 hover:to-green-600 hover:shadow-2xl hover:shadow-green-950/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageCircle size={20} />
                Comprar ahora
              </a>

              <Link
                href="/productos"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200/20 bg-rose-200/8 px-6 py-4 text-sm font-black text-warm-50 transition-all duration-300 hover:border-rose-200/30 hover:bg-rose-200/15"
              >
                <ShoppingBag size={18} />
                Seguir viendo
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-warm-50/40">
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck size={14} className="text-emerald-500" />
                Producto verificado
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CreditCard size={14} className="text-rose-500" />
                Financiación disponible
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-rose-500" />
                Garantía incluida
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Related Products ─── */}
      {relatedProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-16 md:px-8">
          <div className="border-t border-white/10 pt-16 mb-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-rose-300">
              También podría interesarte
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
              Productos relacionados
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((rp) => (
              <Link
                key={rp.id}
                href={`/productos/${rp.id}`}
                className="group relative rounded-lg border border-rose-200/12 bg-rose-200/[0.06] shadow-2xl shadow-rose-950/30 backdrop-blur transition-all duration-300 hover:border-rose-200/25 hover:bg-rose-200/[0.10] hover:-translate-y-0.5"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-warm-900">
                  <img
                    src={getImageUrl(rp.image)}
                    alt={rp.title || "Producto"}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/40">
                    <span className="flex items-center gap-1.5 rounded-xl bg-white/20 px-4 py-2 text-xs font-bold text-white opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 shadow-lg">
                      <ExternalLink size={14} />
                      Ver más
                    </span>
                  </div>
                  <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-warm-900/80 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-rose-400 backdrop-blur">
                    <Tag size={12} />
                    {rp.category || "Premium"}
                  </div>
                  {rp.discount && (
                    <div className="absolute right-3 top-3 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 px-2.5 py-1.5 text-[10px] font-black text-white shadow-lg shadow-rose-950/40">
                      {rp.discount.discountType === "percentage"
                        ? `${rp.discount.discountValue}% OFF`
                        : `-$${Number(rp.discount.discountValue).toLocaleString()}`}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-sm font-black leading-tight text-warm-50 transition-colors group-hover:text-rose-300">
                    {rp.title}
                  </h3>
                  <p className="mt-1.5 text-[11px] leading-5 text-warm-50/50 line-clamp-2">
                    {rp.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-base font-black">
                      {formatCurrency(rp.price, "$0")}
                    </p>
                    <BadgeCheck size={16} className="text-rose-500/60" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
