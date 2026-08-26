"use client";

import { useEffect, useState } from "react";
import {
  LoaderCircle,
  MessageCircle,
  Save,
  Settings,
  ShieldCheck,
} from "lucide-react";

import API from "@/app/services/api";

type AppSettings = {
  whatsapp_number: string;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    whatsapp_number: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    API.get<{ settings: AppSettings }>("/settings")
      .then((response) => {
        if (isActive) {
          setSettings(response.data.settings);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isActive) {
          setError("No pudimos cargar la configuración.");
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const saveSettings = async () => {
    setError("");
    setMessage("");
    setSaving(true);

    try {
      await API.put("/settings/whatsapp_number", {
        value: settings.whatsapp_number,
      });
      setMessage("Número de WhatsApp actualizado correctamente.");
    } catch {
      setError("No se pudo guardar. Solo el owner puede cambiar esta configuración.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-6 m-8">
        <LoaderCircle className="h-5 w-5 animate-spin text-amber-400" />
        <span className="text-sm font-semibold">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 text-white md:px-8 lg:px-12 lg:py-12">
      <section className="max-w-5xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-lg border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.24em] text-amber-400">
          <Settings size={16} />
          Configuración
        </div>

        <h1 className="text-4xl font-black text-warm-50 md:text-6xl">
          Ajustes del sistema
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-warm-50/62">
          Configura el número de WhatsApp, integraciones y parámetros generales
          de la plataforma. Solo visible para el rol owner.
        </p>
      </section>

      {(message || error) && (
        <p
          className={`mt-8 rounded-lg border px-4 py-3 text-sm font-bold max-w-5xl ${
            error
              ? "border-amber-200/25 bg-amber-200/10 text-amber-400"
              : "border-emerald-200/25 bg-emerald-200/10 text-emerald-400"
          }`}
        >
          {error || message}
        </p>
      )}

      {/* WhatsApp Settings */}
      <section className="mt-8 max-w-3xl">
        <div className="rounded-lg border border-amber-200/12 bg-amber-200/[0.06] p-6 shadow-xl shadow-amber-950/15 backdrop-blur">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg border border-emerald-200/25 bg-emerald-200/10 text-emerald-400">
              <MessageCircle size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-warm-50/42">
                Ventas
              </p>
              <h2 className="text-2xl font-black text-warm-50">
                WhatsApp automático
              </h2>
            </div>
          </div>

          <p className="mb-6 text-sm leading-6 text-warm-50/60">
            Este número se usará en los botones &quot;Comprar ahora&quot; de toda la
            plataforma. Los clientes serán redirigidos a WhatsApp con un mensaje
            automático del producto que quieran comprar.
          </p>

          <label className="block text-sm font-bold text-warm-50/65">
            Número de WhatsApp (formato internacional, sin +)
            <input
              value={settings.whatsapp_number}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  whatsapp_number: event.target.value,
                }))
              }
              placeholder="573001234567"
              className="mt-2 w-full rounded-lg border border-amber-200/12 bg-warm-900/50 px-4 py-3 text-lg font-black text-warm-50 outline-none focus:border-emerald-400/50"
            />
          </label>

          <p className="mt-3 text-xs text-warm-50/40">
            Ejemplo: 573001234567 (Colombia). No incluyas el signo + ni espacios.
          </p>

          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Save size={17} />
            )}
            Guardar configuración
          </button>
        </div>
      </section>

      {/* Info banner */}
      <section className="mt-8 max-w-3xl">
        <div className="rounded-lg border border-amber-200/10 bg-amber-200/[0.04] p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-bold text-warm-50">
                Solo el owner puede modificar estos valores
              </p>
              <p className="mt-1 text-sm text-warm-50/50">
                Los cambios se aplican inmediatamente en toda la plataforma, tanto
                en la página pública como en el panel de administración.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
