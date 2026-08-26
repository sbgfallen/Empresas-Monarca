"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import API from "@/app/services/api";

function getSafeRedirectTarget() {
  if (typeof window === "undefined") {
    return "/admin-hidden-2026";
  }

  const next = new URLSearchParams(window.location.search).get("next");

  if (
    next &&
    next.startsWith("/admin-hidden-2026") &&
    next !== "/admin-hidden-2026/login"
  ) {
    return next;
  }

  return "/admin-hidden-2026";
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await API.post("/auth/login", {
        email,
        password,
      });

      router.replace(getSafeRedirectTarget());
      router.refresh();
    } catch {
      setError("Credenciales de administrador invalidas.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#1a0f0a_0%,#2d1f14_54%,#1a0f0a_100%)] text-warm-50">
      <section className="grid min-h-screen lg:grid-cols-[1fr_480px]">
        <div className="hidden min-h-screen bg-[radial-gradient(circle_at_16%_12%,rgba(245,158,11,0.15),transparent_32%),linear-gradient(135deg,#1a0f0a_0%,#2d1f14_54%,#1a0f0a_100%)] p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg border border-amber-200/30 bg-amber-200/10 text-amber-400">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.34em] text-amber-300">
                Empresas
              </p>
              <h1 className="text-3xl font-black text-warm-50">Monarca</h1>
            </div>
          </div>

          <div className="max-w-3xl">
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.32em] text-emerald-400">
              Acceso protegido
            </p>
            <h2 className="text-6xl font-black leading-none text-warm-50">
              Panel privado para operar la tienda.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-warm-50/62">
              Productos, promociones, creditos y noticias quedan bajo una
              sesion segura con permisos administrativos.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm text-warm-50/60">
            <div className="rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-4">
              JWT
            </div>
            <div className="rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-4">
              HTTP-only
            </div>
            <div className="rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-4">
              Roles admin
            </div>
          </div>
        </div>

        <div className="flex min-h-screen items-center justify-center px-5 py-10">
          <form
            onSubmit={submitLogin}
            className="w-full max-w-[420px] rounded-lg border border-amber-200/12 bg-amber-200/[0.07] p-6 shadow-2xl shadow-amber-950/35 backdrop-blur"
          >
            <div className="mb-8">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-lg border border-amber-200/30 bg-amber-200/10 text-amber-400">
                <LockKeyhole size={22} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300">
                Login admin
              </p>
              <h2 className="mt-3 text-4xl font-black text-warm-50">Entrar</h2>
            </div>

            <label className="block text-sm font-bold text-warm-50/75">
              Email
              <span className="mt-2 flex items-center gap-3 rounded-lg border border-amber-200/12 bg-warm-900/50 px-3 py-3 focus-within:border-amber-400/50">
                <Mail className="h-5 w-5 text-amber-400" />
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-transparent text-white outline-none placeholder:text-white/35"
                  placeholder="admin@empresasmonarca.com"
                  required
                />
              </span>
            </label>

            <label className="mt-5 block text-sm font-bold text-white/75">
              Contrasena
              <span className="mt-2 flex items-center gap-3 rounded-lg border border-amber-200/12 bg-warm-900/50 px-3 py-3 focus-within:border-amber-400/50">
                <KeyRound className="h-5 w-5 text-amber-400" />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent text-white outline-none placeholder:text-white/35"
                  placeholder="********"
                  required
                />
              </span>
            </label>

            {error && (
              <p className="mt-5 rounded-lg border border-amber-200/25 bg-amber-200/10 px-4 py-3 text-sm font-semibold text-amber-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-emerald-500 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-warm-900 transition hover:from-amber-300 hover:to-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
              Acceder
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
