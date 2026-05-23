"use client";

import {
  ArrowUpRight,
  LoaderCircle,
  Menu,
  Search,
  ShoppingBag,
  Tag,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import API from "@/app/services/api";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Productos" },
  { href: "/prestamos", label: "Préstamos" },
  { href: "/noticias", label: "Noticias" },
];

const categoryItems = [
  { href: "/#productos", label: "Inmuebles", icon: "🏠" },
  { href: "/#productos", label: "Electrodomésticos", icon: "🔌" },
  { href: "/prestamos", label: "Préstamos", icon: "💳" },
  { href: "/#promociones", label: "Fletes", icon: "🚚" },
];

interface SearchProduct {
  id: number;
  title: string;
  price: number | string;
  image: string;
  category: string;
}

// ─── SearchOverlay ───────────────────────────────────

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Fetch products once on mount
  useEffect(() => {
    setLoading(true);
    API.get<SearchProduct[]>("/products")
      .then((res) => setProducts(res.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const filtered = query.trim()
    ? products.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.title?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
        );
      })
    : products;

  const goToProduct = useCallback(
    (id: number) => {
      onClose();
      router.push(`/productos/${id}`);
    },
    [onClose, router]
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      goToProduct(filtered[selectedIndex].id);
    }
  };

  const apiRoot =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "";

  const getImageUrl = (image?: string) => {
    if (!image) return "";
    if (image.startsWith("http")) return image;
    const path = image.startsWith("/") ? image : `/${image}`;
    return `${apiRoot}${path}`;
  };

  const formatPrice = (price?: string | number) => {
    const n = Number(String(price ?? "").replace(/[^\d.-]/g, ""));
    if (!Number.isFinite(n) || n <= 0) return "Consultar";
    return new Intl.NumberFormat("es-AR", {
      currency: "ARS",
      maximumFractionDigits: 0,
      style: "currency",
    }).format(n);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative mt-20 w-full max-w-2xl mx-4 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="overflow-hidden rounded-2xl border border-rose-200/15 bg-warm-900 shadow-2xl shadow-rose-950/40">
          {/* Search input */}
          <div className="relative border-b border-rose-200/10">
            <Search
              size={20}
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-warm-50/40"
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Buscar productos por nombre o categoría..."
              className="w-full bg-transparent py-5 pl-13 pr-12 text-lg text-warm-50 outline-none placeholder:text-warm-50/30"
              style={{ paddingLeft: "3.25rem" }}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSelectedIndex(-1);
                  inputRef.current?.focus();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-50/40 transition hover:text-warm-50/70"
              >
                <X size={18} />
              </button>
            )}
            {/* Keyboard hint */}
            <div className="absolute right-14 top-1/2 hidden -translate-y-1/2 items-center gap-1.5 md:flex">
              <kbd className="rounded-md border border-rose-200/12 bg-rose-200/8 px-2 py-0.5 text-[11px] font-bold text-warm-50/40">
                ESC
              </kbd>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoaderCircle className="h-6 w-6 animate-spin text-rose-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Search size={36} className="text-warm-50/15" />
                <p className="mt-3 text-sm font-bold text-warm-50/40">
                  {query.trim()
                    ? "No encontramos productos con ese nombre"
                    : "No hay productos disponibles"}
                </p>
              </div>
            ) : (
              <div>
                <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-warm-50/35">
                  {filtered.length}{" "}
                  {filtered.length === 1 ? "resultado" : "resultados"}
                </div>
                {filtered.map((product, idx) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => goToProduct(product.id)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex w-full items-center gap-4 px-4 py-3 text-left transition-all duration-150 ${
                      selectedIndex === idx
                        ? "bg-rose-500/10"
                        : "hover:bg-rose-200/[0.04]"
                    }`}
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-rose-200/10 bg-warm-800">
                      <img
                        src={getImageUrl(product.image)}
                        alt={product.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-warm-50">
                        {product.title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-rose-400/70">
                          <Tag size={9} />
                          {product.category || "Premium"}
                        </span>
                        <span className="text-sm font-black text-rose-400">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                    </div>
                    <kbd className="hidden shrink-0 items-center gap-1 rounded-md border border-rose-200/10 bg-rose-200/6 px-2 py-1 text-[11px] font-bold text-warm-50/30 md:inline-flex">
                      ↵
                    </kbd>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-rose-200/8 px-4 py-3">
            <div className="flex items-center justify-between text-xs text-warm-50/35">
              <div className="flex items-center gap-4">
                <span className="hidden items-center gap-1.5 md:flex">
                  <kbd className="rounded border border-rose-200/10 bg-rose-200/6 px-1.5 py-0.5 text-[10px] font-bold">
                    ↑↓
                  </kbd>
                  Navegar
                </span>
                <span className="hidden items-center gap-1.5 md:flex">
                  <kbd className="rounded border border-rose-200/10 bg-rose-200/6 px-1.5 py-0.5 text-[10px] font-bold">
                    ↵
                  </kbd>
                  Abrir
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-rose-400/60 transition hover:text-rose-400"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Navbar ──────────────────────────────────────────

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const isHomePage = pathname === "/";

  // 5-click logo detection for admin access
  const [clickCount, setClickCount] = useState(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showAdminHint, setShowAdminHint] = useState(false);

  const handleLogoClick = useCallback(() => {
    setClickCount((prev) => prev + 1);
    
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    
    clickTimerRef.current = setTimeout(() => {
      setClickCount(0);
      setShowAdminHint(false);
    }, 2000);

    if (clickCount >= 4) {
      setClickCount(0);
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      window.location.href = "/admin-hidden-2026/login";
    }

    if (clickCount === 2) {
      setShowAdminHint(true);
      setTimeout(() => setShowAdminHint(false), 1500);
    }
  }, [clickCount]);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    if (href.startsWith("/#") && isHomePage) {
      const id = href.replace("/#", "");
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <>
      <nav
        className={`fixed left-0 top-0 z-50 w-full text-warm-50 shadow-lg shadow-rose-950/25 transition-all duration-500 ${
          scrolled
            ? "border-b border-rose-200/20 bg-warm-900/90 backdrop-blur-2xl"
            : "border-b border-transparent bg-warm-900/40 backdrop-blur-md"
        }`}
      >
        {/* Ambient glow line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />

        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 md:px-8">
          {/* Logo with 5-click admin access */}
          <button
            onClick={handleLogoClick}
            className="group relative flex items-center gap-3 cursor-pointer"
          >
            <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-lg border border-rose-200/25 bg-gradient-to-br from-rose-500 to-rose-700 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-rose-500/25">
              <Image
                src="/logo.jpg"
                alt="Empresas Monarca"
                width={40}
                height={40}
                className="h-full w-full rounded-lg object-cover transition duration-300 group-hover:scale-110"
              />
            </span>
            <span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.32em] text-rose-100/60 transition duration-300 group-hover:text-rose-100/80">
                Empresas
              </span>
              <span className="block text-base font-black leading-none text-warm-50 transition duration-300 group-hover:text-white">
                Monarca
              </span>
            </span>
            {/* Admin hint tooltip */}
            {showAdminHint && (
              <div className="absolute -bottom-10 left-0 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="rounded-lg border border-rose-500/20 bg-warm-900 px-3 py-1.5 shadow-xl shadow-rose-950/40">
                  <p className="text-[10px] font-bold text-rose-400 whitespace-nowrap">
                    ✦ {5 - clickCount} clics para admin
                  </p>
                </div>
              </div>
            )}
          </button>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className={`relative px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                    active
                      ? "text-rose-400"
                      : "text-warm-50/70 hover:text-warm-50"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-gradient-to-r from-rose-500 to-rose-700" />
                  )}
                </Link>
              );
            })}

            {/* Categories dropdown */}
            <div className="relative group">
              <button className="relative flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-warm-50/70 transition-all duration-300 hover:text-warm-50">
                Categorías
                <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50">
                <div className="overflow-hidden rounded-xl border border-rose-200/15 bg-warm-900/95 backdrop-blur-xl shadow-2xl shadow-rose-950/40 min-w-[220px]">
                  <div className="p-1.5">
                    {categoryItems.map((cat) => (
                      <Link
                        key={cat.label}
                        href={cat.href}
                        onClick={() => handleNavClick(cat.href)}
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-warm-50/70 transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-300"
                      >
                        <span className="text-base">{cat.icon}</span>
                        <span>{cat.label}</span>
                      </Link>
                    ))}
                  </div>
                  {/* Bottom accent */}
                  <div className="h-px bg-gradient-to-r from-transparent via-rose-500/20 to-transparent mx-3" />
                  <div className="px-4 py-3">
                    <Link
                      href="/#productos"
                      className="flex items-center gap-2 text-xs font-bold text-rose-400/70 hover:text-rose-400 transition-colors duration-200"
                    >
                      Ver todas las categorías
                      <ArrowUpRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              aria-label="Buscar"
              onClick={() => setSearchOpen(true)}
              className="group relative grid h-10 w-10 place-items-center rounded-lg border border-rose-200/15 bg-rose-200/8 text-warm-50/70 transition-all duration-300 hover:border-rose-200/30 hover:bg-rose-200/15 hover:text-rose-400"
              title="Buscar (Ctrl+K)"
            >
              <Search size={18} />
              <kbd className="pointer-events-none absolute -bottom-0.5 -right-0.5 hidden rounded-sm border border-rose-200/10 bg-warm-900 px-1 text-[9px] font-bold text-warm-50/30 group-hover:text-warm-50/50 lg:inline-block">
                ⌘K
              </kbd>
            </button>

            <Link
              href="/productos"
              className="group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-rose-600 via-rose-700 to-rose-700 px-4 text-sm font-black text-white transition-all duration-300 hover:shadow-lg hover:shadow-rose-600/25"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-rose-500 via-rose-600 to-rose-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <ShoppingBag size={17} className="relative z-10" />
              <span className="relative z-10">Catálogo</span>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setIsOpen((current) => !current)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-rose-200/15 bg-rose-200/10 text-warm-50 transition-all duration-300 hover:border-rose-200/30 hover:bg-rose-200/18 md:hidden"
          >
            {isOpen ? (
              <X size={20} className="animate-in fade-in" />
            ) : (
              <Menu size={20} />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={`overflow-hidden transition-all duration-400 ease-in-out md:hidden ${
            isOpen ? "max-h-80 border-t border-rose-200/10" : "max-h-0"
          }`}
        >
          <div className="space-y-1 px-5 py-4">
            {/* Mobile search */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setSearchOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-lg border border-rose-200/12 bg-rose-200/[0.06] px-4 py-3 text-sm font-bold text-warm-50/50 transition hover:border-rose-200/25 hover:bg-rose-200/[0.10] hover:text-warm-50"
            >
              <Search size={16} />
              Buscar productos...
            </button>

            <div className="my-2 border-t border-rose-200/8" />

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => handleNavClick(link.href)}
                className={`block rounded-lg border px-4 py-3 text-sm font-bold transition-all duration-200 ${
                  isActive(link.href)
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                    : "border-rose-200/12 bg-rose-200/[0.04] text-warm-50/70 hover:border-rose-200/25 hover:bg-rose-200/[0.08] hover:text-warm-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Search overlay */}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
