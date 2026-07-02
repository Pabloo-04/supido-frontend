"use client";

import { useState } from "react";
import { createRestaurant, type Restaurant } from "@/lib/admin";

interface Props {
  onCreated: (r: Restaurant) => void;
  onCancel: () => void;
}

const CATEGORIES = [
  "FAST_FOOD",
  "ITALIAN",
  "MEXICAN",
  "CHINESE",
  "BREAKFAST",
  "DESSERTS",
  "HEALTHY",
  "PIZZA",
  "SEAFOOD",
  "VEGETARIAN",
];

const INITIAL = {
  name: "",
  category: "",
  address: "",
  openingTime: "",
  closingTime: "",
  photoUrl: "",
  latitude: "",
  longitude: "",
};

export default function AddRestaurantForm({ onCreated, onCancel }: Props) {
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.category.trim()) {
      setError("Nombre y categoría son obligatorios.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const created = await createRestaurant({
        name: form.name.trim(),
        category: form.category.trim(),
        address: form.address.trim() || undefined,
        openingTime: form.openingTime.trim() || undefined,
        closingTime: form.closingTime.trim() || undefined,
        photoUrl: form.photoUrl.trim() || undefined,
        latitude: form.latitude !== "" ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude !== "" ? parseFloat(form.longitude) : undefined,
      });
      setForm(INITIAL);
      onCreated(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear restaurante.");
    } finally {
      setLoading(false);
    }
  }

  const textFields: { name: keyof typeof INITIAL; label: string; placeholder: string; required?: boolean }[] = [
    { name: "name",        label: "Nombre",     placeholder: "Nombre del restaurante", required: true },
    { name: "address",     label: "Dirección",  placeholder: "Calle 123" },
    { name: "openingTime", label: "Apertura",   placeholder: "09:00" },
    { name: "closingTime", label: "Cierre",     placeholder: "23:00" },
    { name: "photoUrl",    label: "URL de foto", placeholder: "https://…" },
    { name: "latitude",    label: "Latitud",    placeholder: "-34.6037" },
    { name: "longitude",   label: "Longitud",   placeholder: "-58.3816" },
  ];

  return (
      <form
          onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}
          className="bg-[var(--color-suido-2)] border border-[var(--color-suido-3)]/20
                 rounded-2xl p-5 flex flex-col gap-4"
      >
        <h3
            className="text-white font-bold text-base"
            style={{ fontFamily: "var(--font-syne)" }}
        >
          Nuevo restaurante
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* Categoría como dropdown */}
          <div className="flex flex-col gap-1">
            <label
                htmlFor="r-category"
                className="text-[0.7rem] font-medium tracking-wide uppercase text-[var(--color-suido-4)]"
                style={{ fontFamily: "var(--font-dm)" }}
            >
              Categoría *
            </label>
            <select
                id="r-category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/30
                       text-white rounded-xl px-3 py-2.5 text-sm
                       focus:outline-none focus:border-[var(--color-suido-accent)]
                       transition-colors duration-200"
                style={{ fontFamily: "var(--font-dm)" }}
            >
              <option value="" disabled>Seleccionar categoría…</option>
              {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace(/_/g, " ")}
                  </option>
              ))}
            </select>
          </div>

          {/* Resto de campos de texto */}
          {textFields.map(({ name, label, placeholder, required }) => (
              <div key={name} className="flex flex-col gap-1">
                <label
                    htmlFor={`r-${name}`}
                    className="text-[0.7rem] font-medium tracking-wide uppercase text-[var(--color-suido-4)]"
                    style={{ fontFamily: "var(--font-dm)" }}
                >
                  {label}{required && " *"}
                </label>
                <input
                    id={`r-${name}`}
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/30
                         text-white placeholder-[var(--color-suido-3)] rounded-xl
                         px-3 py-2.5 text-sm
                         focus:outline-none focus:border-[var(--color-suido-accent)]
                         transition-colors duration-200"
                    style={{ fontFamily: "var(--font-dm)" }}
                />
              </div>
          ))}
        </div>

        {error && (
            <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-dm)" }}>{error}</p>
        )}

        <div className="flex gap-2">
          <button
              type="submit"
              disabled={loading}
              className="text-sm font-semibold text-white px-4 py-2 rounded-xl
                     bg-[var(--color-suido-cat)] hover:bg-[var(--color-suido-accent)]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200 flex items-center gap-2"
              style={{ fontFamily: "var(--font-dm)" }}
          >
            {loading && <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            {loading ? "Guardando…" : "Guardar"}
          </button>
          <button
              type="button"
              onClick={onCancel}
              className="text-sm font-medium text-[var(--color-suido-4)] hover:text-white
                     px-4 py-2 rounded-xl border border-[var(--color-suido-3)]/30
                     transition-colors duration-200"
              style={{ fontFamily: "var(--font-dm)" }}
          >
            Cancelar
          </button>
        </div>
      </form>
  );
}