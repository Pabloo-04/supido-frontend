"use client";

import { useState } from "react";
import { createMenuItem, type MenuItem } from "@/lib/admin";

interface Props {
  restaurantId: number;
  restaurantName: string;
  onCreated: (item: MenuItem) => void;
  onCancel: () => void;
}

const INITIAL = {
  name: "",
  description: "",
  price: "",
  category: "",
  photoUrl: "",
};

export default function AddMenuItemForm({ restaurantId, restaurantName, onCreated, onCancel }: Props) {
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.category.trim() || !form.price) {
      setError("Nombre, categoría y precio son obligatorios.");
      return;
    }
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) {
      setError("El precio debe ser un número positivo.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const created = await createMenuItem(restaurantId, {
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        category: form.category.trim(),
        photoUrl: form.photoUrl.trim() || undefined,
        available: true,
      });
      setForm(INITIAL);
      onCreated(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear ítem.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}
      className="bg-[var(--color-suido-2)] border border-[var(--color-suido-3)]/20
                 rounded-2xl p-5 flex flex-col gap-4 mt-3"
    >
      <h4
        className="text-white font-bold text-sm"
        style={{ fontFamily: "var(--font-syne)" }}
      >
        Nuevo ítem — <span className="text-[var(--color-suido-accent)]">{restaurantName}</span>
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {([
          { name: "name",        label: "Nombre *",      placeholder: "Ej: Milanesa napolitana" },
          { name: "category",    label: "Categoría *",   placeholder: "Ej: Principales" },
          { name: "price",       label: "Precio *",      placeholder: "0.00" },
          { name: "photoUrl",    label: "URL de foto",   placeholder: "https://…" },
        ] as { name: keyof typeof INITIAL; label: string; placeholder: string }[]).map(({ name, label, placeholder }) => (
          <div key={name} className="flex flex-col gap-1">
            <label
              htmlFor={`m-${name}`}
              className="text-[0.7rem] font-medium tracking-wide uppercase text-[var(--color-suido-4)]"
              style={{ fontFamily: "var(--font-dm)" }}
            >
              {label}
            </label>
            <input
              id={`m-${name}`}
              name={name}
              type={name === "price" ? "number" : "text"}
              min={name === "price" ? "0" : undefined}
              step={name === "price" ? "0.01" : undefined}
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
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label
            htmlFor="m-description"
            className="text-[0.7rem] font-medium tracking-wide uppercase text-[var(--color-suido-4)]"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            Descripción
          </label>
          <input
            id="m-description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Breve descripción del plato"
            className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/30
                       text-white placeholder-[var(--color-suido-3)] rounded-xl
                       px-3 py-2.5 text-sm
                       focus:outline-none focus:border-[var(--color-suido-accent)]
                       transition-colors duration-200"
            style={{ fontFamily: "var(--font-dm)" }}
          />
        </div>
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
          {loading ? "Guardando…" : "Guardar ítem"}
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
