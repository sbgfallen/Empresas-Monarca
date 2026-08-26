"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  KeyRound,
  LoaderCircle,
  Save,
  Settings,
  ShieldCheck,
} from "lucide-react";

import API from "@/app/services/api";

type AdminProfile = {
  email: string;
  name: string;
  role: string;
};

export default function AdminAccountPage() {
  const [profile, setProfile] = useState<AdminProfile>({
    email: "",
    name: "",
    role: "",
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    API.get<{ admin: AdminProfile }>("/auth/me")
      .then((response) => {
        if (isActive) {
          setProfile(response.data.admin);
        }
      })
      .catch(() => null);

    return () => {
      isActive = false;
    };
  }, []);

  const updateProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSavingProfile(true);

    try {
      const response = await API.patch<{ admin: AdminProfile }>(
        "/auth/profile",
        {
          email: profile.email,
          name: profile.name,
        }
      );

      setProfile(response.data.admin);
      window.dispatchEvent(new Event("monarca-admin-updated"));
      setMessage("Perfil actualizado.");
    } catch {
      setError("No se pudo actualizar el perfil. El correo podria existir.");
    } finally {
      setSavingProfile(false);
    }
  };

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (newPassword.length < 8) {
      setError("La nueva contrasena debe tener minimo 8 caracteres.");
      return;
    }

    setSavingPassword(true);

    try {
      await API.patch("/auth/password", {
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Contrasena actualizada.");
    } catch {
      setError("No se pudo cambiar la contrasena actual.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="px-5 py-8 text-white md:px-8 lg:px-12 lg:py-12">
      <section className="max-w-5xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-lg border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.24em] text-amber-400">
          <Settings size={16} />
          Mi cuenta
        </div>

        <h1 className="text-4xl font-black text-warm-50 md:text-6xl">
          Perfil admin
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-warm-50/62">
          Cambia tu correo, nombre y contrasena sin salir del panel.
        </p>
      </section>

      {(message || error) && (
        <p
          className={`mt-8 rounded-lg border px-4 py-3 text-sm font-bold ${
            error
              ? "border-amber-200/25 bg-amber-200/10 text-amber-400"
              : "border-emerald-200/25 bg-emerald-200/10 text-emerald-400"
          }`}
        >
          {error || message}
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <form
          onSubmit={updateProfile}
          className="rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-5 shadow-xl shadow-amber-950/15 backdrop-blur"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg border border-amber-200/25 bg-amber-200/10 text-amber-400">
              <ShieldCheck size={21} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-warm-50/42">
                Datos de acceso
              </p>
              <h2 className="text-xl font-black text-warm-50">Correo y nombre</h2>
            </div>
          </div>            <label className="block text-sm font-bold text-warm-50/65">
              Nombre
              <input
                value={profile.name}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    name: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-lg border border-amber-200/12 bg-warm-900/50 px-4 py-3 text-warm-50 outline-none focus:border-amber-400/50"
            />
          </label>            <label className="mt-5 block text-sm font-bold text-warm-50/65">
              Correo
              <input
                type="email"
                value={profile.email}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    email: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-lg border border-amber-200/12 bg-warm-900/50 px-4 py-3 text-warm-50 outline-none focus:border-amber-400/50"
            />
          </label>

          <div className="mt-5 rounded-lg border border-amber-200/10 bg-warm-900/50 px-4 py-3 text-sm text-warm-50/60">
            Rol actual: <strong className="text-warm-50">{profile.role}</strong>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-emerald-500 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-warm-900 transition hover:from-amber-300 hover:to-emerald-400 disabled:opacity-60"
          >
            {savingProfile ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Save size={17} />
            )}
            Guardar perfil
          </button>
        </form>

        <form
          onSubmit={updatePassword}
          className="rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-5 shadow-xl shadow-amber-950/15 backdrop-blur"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg border border-emerald-200/25 bg-emerald-200/10 text-emerald-400">
              <KeyRound size={21} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-warm-50/42">
                Seguridad
              </p>
              <h2 className="text-xl font-black text-warm-50">Cambiar contrasena</h2>
            </div>
          </div>

          <label className="block text-sm font-bold text-white/65">
            Contrasena actual
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-rose-100/12 bg-rose-950/35 px-4 py-3 text-white outline-none focus:border-rose-200/50"
            />
          </label>

          <label className="mt-5 block text-sm font-bold text-white/65">
            Nueva contrasena
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-rose-100/12 bg-rose-950/35 px-4 py-3 text-white outline-none focus:border-rose-200/50"
            />
          </label>

          <button
            type="submit"
            disabled={savingPassword}
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-amber-200/25 bg-amber-200/10 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-amber-400 transition hover:bg-amber-200/15 disabled:opacity-60"
          >
            {savingPassword ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound size={17} />
            )}
            Cambiar clave
          </button>
        </form>
      </div>
    </div>
  );
}
