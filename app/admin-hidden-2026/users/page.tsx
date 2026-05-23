"use client";

import { useEffect, useState } from "react";
import {
  CircleCheck,
  CircleX,
  KeyRound,
  LoaderCircle,
  Plus,
  Save,
  ShieldCheck,
  Users,
} from "lucide-react";

import API from "@/app/services/api";

type AdminRecord = {
  active: boolean;
  created_at: string;
  email: string;
  id: number;
  name: string;
  role: "admin" | "super_admin" | "owner";
  updated_at: string;
};

type AdminForm = {
  email: string;
  name: string;
  password: string;
  role: "admin" | "super_admin" | "owner";
};

const initialForm: AdminForm = {
  email: "",
  name: "",
  password: "",
  role: "admin",
};

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [form, setForm] = useState<AdminForm>(initialForm);
  const [passwords, setPasswords] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [currentRole, setCurrentRole] = useState<string>("");
  const isOwner = currentRole === "owner";

  const loadAdmins = async () => {
    const response = await API.get<{ admins: AdminRecord[] }>("/admin-users");
    setAdmins(response.data.admins);
  };

  useEffect(() => {
    let isActive = true;

    Promise.all([
      API.get<{ admin: { role: string } }>("/auth/me"),
      API.get<{ admins: AdminRecord[] }>("/admin-users"),
    ])
      .then(([meRes, adminsRes]) => {
        if (isActive) {
          setCurrentRole(meRes.data.admin.role);
          setAdmins(adminsRes.data.admins);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isActive) {
          setError("No tienes permisos para administrar usuarios.");
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const createAdmin = async () => {
    setError("");
    setMessage("");
    setSaving(true);

    try {
      await API.post("/admin-users", form);
      setForm(initialForm);
      await loadAdmins();
      setMessage("Administrador creado correctamente.");
    } catch {
      setError("No se pudo crear el administrador. Revisa correo y clave.");
    } finally {
      setSaving(false);
    }
  };

  const updateAdminField = (
    id: number,
    field: keyof AdminRecord,
    value: string | boolean
  ) => {
    setAdmins((current) =>
      current.map((admin) =>
        admin.id === id
          ? {
              ...admin,
              [field]: value,
            }
          : admin
      )
    );
  };

  const saveAdmin = async (admin: AdminRecord) => {
    setError("");
    setMessage("");
    setSaving(true);

    try {
      await API.put(`/admin-users/${admin.id}`, {
        active: admin.active,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      });
      await loadAdmins();
      setMessage("Usuario actualizado.");
    } catch {
      setError("No se pudo actualizar. Debe existir un super_admin activo.");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (id: number) => {
    const password = passwords[id] || "";

    if (password.length < 8) {
      setError("La nueva contrasena debe tener minimo 8 caracteres.");
      return;
    }

    setError("");
    setMessage("");
    setSaving(true);

    try {
      await API.patch(`/admin-users/${id}/password`, {
        password,
      });
      setPasswords((current) => ({
        ...current,
        [id]: "",
      }));
      setMessage("Contrasena actualizada.");
    } catch {
      setError("No se pudo cambiar la contrasena.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-5 py-8 text-white md:px-8 lg:px-12 lg:py-12">
      <section className="max-w-5xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-lg border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.24em] text-amber-400">
          <Users size={16} />
          Usuarios admin
        </div>

        <h1 className="text-4xl font-black text-warm-50 md:text-6xl">
          Administradores
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-warm-50/62">
          Crea usuarios, asigna roles y controla quien puede operar el panel.
        </p>
      </section>

      <section className="mt-10 rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-5 shadow-xl shadow-amber-950/15 backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg border border-amber-200/25 bg-amber-200/10 text-amber-400">
            <Plus size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-warm-50/42">
              Nuevo acceso
            </p>
            <h2 className="text-xl font-black text-warm-50">Crear administrador</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_1fr_180px]">
          <input
            value={form.name}
            onChange={(event) =>
              setForm({
                ...form,
                name: event.target.value,
              })
            }
            placeholder="Nombre"
            className="rounded-lg border border-amber-200/12 bg-warm-900/50 px-4 py-3 outline-none focus:border-amber-400/50"
          />
          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm({
                ...form,
                email: event.target.value,
              })
            }
            placeholder="Correo"
            className="rounded-lg border border-amber-200/12 bg-warm-900/50 px-4 py-3 outline-none focus:border-amber-400/50"
          />
          <input
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm({
                ...form,
                password: event.target.value,
              })
            }
            placeholder="Contrasena inicial"
            className="rounded-lg border border-amber-200/12 bg-warm-900/50 px-4 py-3 outline-none focus:border-amber-400/50"
          />
          <select
            value={form.role}
            onChange={(event) =>
              setForm({
                ...form,
                role: event.target.value as AdminForm["role"],
              })
            }
            className="rounded-lg border border-amber-200/12 bg-warm-900 px-4 py-3 outline-none focus:border-amber-400/50"
          >
            <option value="admin">admin</option>
            <option value="super_admin">super_admin</option>
            {isOwner && <option value="owner">owner</option>}
          </select>
        </div>

        <button
          type="button"
          onClick={createAdmin}
          disabled={saving}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-emerald-500 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-warm-900 transition hover:from-amber-300 hover:to-emerald-400 disabled:opacity-60"
        >
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus size={17} />}
          Crear usuario
        </button>
      </section>

      {(message || error) && (
        <p
          className={`mt-5 rounded-lg border px-4 py-3 text-sm font-bold ${
            error
              ? "border-amber-200/25 bg-amber-200/10 text-amber-400"
              : "border-emerald-200/25 bg-emerald-200/10 text-emerald-400"
          }`}
        >
          {error || message}
        </p>
      )}

      <section className="mt-6 grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-5">
            <LoaderCircle className="h-5 w-5 animate-spin text-amber-400" />
            Cargando usuarios
          </div>
        ) : (
          admins.map((admin) => (
            <article
              key={admin.id}
              className="rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-5 shadow-xl shadow-amber-950/15 backdrop-blur"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-lg border border-amber-200/25 bg-amber-200/10 text-amber-400">
                      <ShieldCheck size={21} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-black text-warm-50">
                        {admin.name}
                      </p>
                      <p className="truncate text-sm text-warm-50/50">
                        {admin.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_180px_140px]">
                    <input
                      value={admin.name}
                      onChange={(event) =>
                        updateAdminField(admin.id, "name", event.target.value)
                      }
                      className="rounded-lg border border-amber-200/12 bg-warm-900/50 px-4 py-3 outline-none focus:border-amber-400/50"
                    />
                    <input
                      type="email"
                      value={admin.email}
                      onChange={(event) =>
                        updateAdminField(admin.id, "email", event.target.value)
                      }
                      className="rounded-lg border border-amber-200/12 bg-warm-900/50 px-4 py-3 outline-none focus:border-amber-400/50"
                    />
                    <select
                      value={admin.role}
                      onChange={(event) =>
                        updateAdminField(admin.id, "role", event.target.value)
                      }
                      className="rounded-lg border border-amber-200/12 bg-warm-900 px-4 py-3 outline-none focus:border-amber-400/50"
                    >
                      <option value="admin">admin</option>
                      <option value="super_admin">super_admin</option>
                      {isOwner && <option value="owner">owner</option>}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        updateAdminField(admin.id, "active", !admin.active)
                      }
                      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-black ${
                        admin.active
                          ? "border-emerald-200/25 bg-emerald-200/10 text-emerald-400"
                          : "border-amber-200/25 bg-amber-200/10 text-amber-400"
                      }`}
                    >
                      {admin.active ? (
                        <CircleCheck size={17} />
                      ) : (
                        <CircleX size={17} />
                      )}
                      {admin.active ? "Activo" : "Inactivo"}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => saveAdmin(admin)}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-200/25 bg-amber-200/10 px-5 py-3 text-sm font-black text-amber-400 transition hover:bg-amber-200/15 disabled:opacity-60"
                >
                  <Save size={17} />
                  Guardar
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px]">
                <input
                  type="password"
                  value={passwords[admin.id] || ""}
                  onChange={(event) =>
                    setPasswords((current) => ({
                      ...current,
                      [admin.id]: event.target.value,
                    }))
                  }
                  placeholder="Nueva contrasena para este usuario"
                  className="rounded-lg border border-amber-200/12 bg-warm-900/50 px-4 py-3 outline-none focus:border-amber-400/50"
                />
                <button
                  type="button"
                  onClick={() => changePassword(admin.id)}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-200/25 bg-amber-200/10 px-5 py-3 text-sm font-black text-amber-400 transition hover:bg-amber-200/15 disabled:opacity-60"
                >
                  <KeyRound size={17} />
                  Cambiar clave
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
