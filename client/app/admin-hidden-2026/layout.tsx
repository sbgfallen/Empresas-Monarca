"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  CreditCard,
  Home,
  Image as ImageIcon,
  Landmark,
  LoaderCircle,
  LogOut,
  Megaphone,
  Newspaper,
  Package,
  Percent,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import API from "@/app/services/api";

type AdminUser = {
  email: string;
  name: string;
  role: string;
};

type NavItem = {
  desc: string;
  href: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  name: string;
  roles?: string[];
};

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/admin-hidden-2026",
    icon: Home,
    desc: "Centro principal",
  },
  {
    name: "Productos",
    href: "/admin-hidden-2026/products",
    icon: Package,
    desc: "Inventario y stock",
  },
  {
    name: "Promociones",
    href: "/admin-hidden-2026/promotions",
    icon: Percent,
    desc: "Ofertas premium",
  },
  {
    name: "Noticias",
    href: "/admin-hidden-2026/news",
    icon: Newspaper,
    desc: "Artículos y novedades",
  },
  {
    name: "Banners",
    href: "/admin-hidden-2026/banners",
    icon: ImageIcon,
    desc: "Visuales y anuncios",
  },
  {
    name: "Anuncios",
    href: "/admin-hidden-2026/announcements",
    icon: Megaphone,
    desc: "Notificaciones",
  },
  {
    name: "Galería",
    href: "/admin-hidden-2026/images",
    icon: ImageIcon,
    desc: "Subir imágenes",
  },
  {
    name: "Cobros",
    href: "/admin-hidden-2026/cobros",
    icon: CreditCard,
    desc: "Préstamos y cotizaciones",
  },
  {
    name: "Creditos",
    href: "/admin-hidden-2026/credits",
    icon: Landmark,
    desc: "Financiamiento",
  },
  {
    name: "Analíticas",
    href: "/admin-hidden-2026/analytics",
    icon: Percent,
    desc: "Dashboard de datos",
  },
  {
    name: "Admins",
    href: "/admin-hidden-2026/users",
    icon: Users,
    desc: "Usuarios y roles",
    roles: ["owner", "super_admin"],
  },
  {
    name: "Ajustes",
    href: "/admin-hidden-2026/settings",
    icon: Settings,
    desc: "WhatsApp y sistema",
    roles: ["owner"],
  },
  {
    name: "Mi cuenta",
    href: "/admin-hidden-2026/account",
    icon: Settings,
    desc: "Correo y clave",
  },
];

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin-hidden-2026/login";
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(
    pathname !== "/admin-hidden-2026/login"
  );

  useEffect(() => {
    if (isLoginPage) {
      return;
    }

    let isActive = true;

    API.get("/auth/me")
      .then((response) => {
        if (!isActive) {
          return;
        }

        setAdmin(response.data.admin);
        setChecking(false);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        router.replace("/admin-hidden-2026/login");
      });

    const refreshAdmin = () => {
      API.get("/auth/me")
        .then((response) => {
          setAdmin(response.data.admin);
        })
        .catch(() => null);
    };

    window.addEventListener("monarca-admin-updated", refreshAdmin);

    return () => {
      isActive = false;
      window.removeEventListener("monarca-admin-updated", refreshAdmin);
    };
  }, [isLoginPage, pathname, router]);

  const logout = async () => {
    await API.post("/auth/logout").catch(() => null);
    router.replace("/admin-hidden-2026/login");
    router.refresh();
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[linear-gradient(135deg,#1a0f0a_0%,#2d1f14_54%,#1a0f0a_100%)] text-warm-50 flex items-center justify-center">
        <div className="flex items-center gap-3 border border-amber-200/12 bg-amber-200/[0.06] px-5 py-4 rounded-lg">
          <LoaderCircle className="h-5 w-5 animate-spin text-amber-400" />
          <span className="text-sm font-semibold tracking-wide">
            Validando sesion admin
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-900 text-warm-50 lg:flex">
      <aside className="border-b border-amber-200/10 bg-warm-900/95 shadow-2xl shadow-amber-950/25 lg:min-h-screen lg:w-[300px] lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col gap-8 p-5 lg:p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg border border-amber-200/30 bg-amber-200/10 text-amber-400">
              <ShieldCheck size={22} />
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-amber-300">
                Empresas
              </p>
              <h1 className="text-xl font-black tracking-wide text-warm-50">
                Monarca
              </h1>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-warm-50/45">
              Sesion activa
            </p>
            <p className="mt-3 truncate text-sm font-bold text-warm-50">
              {admin?.name || "Administrador"}
            </p>
            <p className="mt-1 truncate text-xs text-warm-50/55">
              {admin?.email}
            </p>
            <span className="mt-3 inline-flex rounded-md border border-amber-200/25 bg-amber-200/10 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400">
              {admin?.role || "admin"}
            </span>
          </div>

          <nav className="flex flex-col gap-2">
            {navItems
              .filter((item) => {
                if (!item.roles) {
                  return true;
                }

                return item.roles.includes(admin?.role || "");
              })
              .map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin-hidden-2026"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-lg border px-3 py-3 transition ${
                    isActive
                      ? "border-amber-200/40 bg-amber-200/12 text-warm-50 shadow-lg shadow-amber-950/15"
                      : "border-amber-200/10 bg-amber-200/[0.04] text-warm-50/72 hover:border-amber-200/20 hover:bg-amber-200/[0.08]"
                  }`}
                >
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-md ${
                      isActive
                        ? "bg-gradient-to-br from-amber-300 to-emerald-400 text-warm-900"
                        : "bg-amber-200/8 text-amber-400 group-hover:bg-amber-200/12"
                    }`}
                  >
                    <Icon size={19} />
                  </span>

                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black">
                      {item.name}
                    </span>
                    <span className="block truncate text-xs text-warm-50/45">
                      {item.desc}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={logout}
            className="mt-auto flex items-center justify-center gap-2 rounded-lg border border-amber-200/25 bg-amber-200/10 px-4 py-3 text-sm font-black text-amber-400 transition hover:bg-amber-200/15"
          >
            <LogOut size={18} />
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main className="min-h-screen flex-1 bg-[radial-gradient(circle_at_12%_10%,rgba(245,158,11,0.12),transparent_30%),radial-gradient(circle_at_90%_8%,rgba(16,185,129,0.08),transparent_24%),linear-gradient(135deg,#1a0f0a_0%,#2d1f14_48%,#1a0f0a_100%)]">
        <div className="relative min-h-screen overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/45 to-transparent" />
          <div className="relative z-10">{children}</div>
        </div>
      </main>
    </div>
  );
}
