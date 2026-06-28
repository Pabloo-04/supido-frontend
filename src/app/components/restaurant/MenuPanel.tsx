"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchMyMenuItems,
  createRestaurantMenuItem,
  updateRestaurantMenuItem,
  deleteRestaurantMenuItem,
  toggleMenuItemAvailability,
  type RestaurantMenuItem,
} from "@/lib/restaurant";

interface Props { restaurantId: number }

export default function MenuPanel({ restaurantId }: Props) {
  const [items, setItems]         = useState<RestaurantMenuItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [totalElements, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<RestaurantMenuItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMyMenuItems(restaurantId);
      setItems(result.items);
      setTotal(result.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el menú.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { load(); }, [load]);

  function handleCreated(item: RestaurantMenuItem) {
    setItems((prev) => [item, ...prev]);
    setTotal((t) => t + 1);
    setShowCreate(false);
  }

  function handleUpdated(item: RestaurantMenuItem) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    setEditingItem(null);
  }

  function handleDeleted(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setTotal((t) => t - 1);
  }

  function handleToggled(item: RestaurantMenuItem) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
  }

  function openEdit(item: RestaurantMenuItem) {
    setShowCreate(false);
    setEditingItem(item);
  }

  return (
    <section className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-white" style={{ fontFamily: "var(--font-syne)" }}>
            Menú
          </h2>
          {!loading && (
            <p className="text-xs text-[var(--color-suido-4)] mt-0.5" style={{ fontFamily: "var(--font-dm)" }}>
              {totalElements} {totalElements === 1 ? "ítem" : "ítems"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setEditingItem(null); setShowCreate((v) => !v); }}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors duration-200
              ${showCreate
                ? "border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:text-white"
                : "bg-[var(--color-suido-cat)] border-[var(--color-suido-cat)] text-white hover:bg-[var(--color-suido-accent)] hover:border-[var(--color-suido-accent)]"
              }`}
            style={{ fontFamily: "var(--font-dm)" }}
          >
            {showCreate ? "Cancelar" : "+ Agregar ítem"}
          </button>
          <button
            type="button"
            onClick={load}
            className="text-xs font-medium text-[var(--color-suido-4)] hover:text-white
                       px-3 py-1.5 rounded-full border border-[var(--color-suido-3)]/30
                       transition-colors duration-200"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <MenuItemForm
          restaurantId={restaurantId}
          onSaved={handleCreated}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Edit form */}
      {editingItem && (
        <MenuItemForm
          restaurantId={restaurantId}
          existing={editingItem}
          onSaved={handleUpdated}
          onCancel={() => setEditingItem(null)}
        />
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5" style={{ fontFamily: "var(--font-dm)" }}>
          {error}
        </p>
      ) : items.length === 0 ? (
        <p className="text-center py-16 text-[var(--color-suido-3)]" style={{ fontFamily: "var(--font-dm)" }}>
          El menú está vacío. Agregá tu primer ítem.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              restaurantId={restaurantId}
              isEditing={editingItem?.id === item.id}
              onEdit={() => openEdit(item)}
              onToggled={handleToggled}
              onDeleted={() => handleDeleted(item.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── Card ─── */

function MenuItemCard({
  item,
  restaurantId,
  isEditing,
  onEdit,
  onToggled,
  onDeleted,
}: {
  item: RestaurantMenuItem;
  restaurantId: number;
  isEditing: boolean;
  onEdit: () => void;
  onToggled: (i: RestaurantMenuItem) => void;
  onDeleted: () => void;
}) {
  const [toggling, setToggling]     = useState(false);
  const [pendingDelete, setPending] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [err, setErr]               = useState<string | null>(null);

  async function handleToggle() {
    setToggling(true);
    setErr(null);
    try {
      onToggled(await toggleMenuItemAvailability(restaurantId, item.id));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al cambiar disponibilidad.");
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) { setPending(true); return; }
    setDeleting(true);
    try {
      await deleteRestaurantMenuItem(restaurantId, item.id);
      onDeleted();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al eliminar.");
      setDeleting(false);
      setPending(false);
    }
  }

  return (
    <div
      className={`bg-[var(--color-suido-1)] border rounded-2xl overflow-hidden flex flex-col transition-colors
        ${isEditing ? "border-[var(--color-suido-accent)]/40" : "border-[var(--color-suido-3)]/20"}`}
    >
      {item.photoUrl && (
        <div className="h-36 overflow-hidden bg-[var(--color-suido-2)] flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-white font-bold text-sm leading-snug" style={{ fontFamily: "var(--font-syne)" }}>
            {item.name}
          </h3>
          <span className="text-[var(--color-suido-accent)] font-bold text-sm whitespace-nowrap" style={{ fontFamily: "var(--font-syne)" }}>
            ${item.price.toFixed(2)}
          </span>
        </div>
        <p className="text-[0.78rem] text-[var(--color-suido-4)] leading-relaxed flex-1" style={{ fontFamily: "var(--font-dm)" }}>
          {item.description}
        </p>

        {err && <p className="text-[0.7rem] text-red-400" style={{ fontFamily: "var(--font-dm)" }}>{err}</p>}

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--color-suido-3)]/15 flex-wrap">
          {/* Toggle availability */}
          <button
            type="button"
            onClick={handleToggle}
            disabled={toggling}
            className={`text-[0.65rem] font-semibold uppercase tracking-wide border rounded-full px-2.5 py-0.5
                        disabled:opacity-50 transition-colors duration-150
              ${item.available
                ? "bg-green-500/15 text-green-400 border-green-500/25 hover:bg-green-500/25"
                : "bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/25"
              }`}
            style={{ fontFamily: "var(--font-dm)" }}
          >
            {toggling ? "…" : item.available ? "Disponible" : "No disponible"}
          </button>

          <div className="flex items-center gap-1 ml-auto">
            {/* Edit */}
            <button
              type="button"
              onClick={onEdit}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors duration-150
                ${isEditing
                  ? "border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:text-white"
                  : "border-[var(--color-suido-accent)]/30 text-[var(--color-suido-accent)] hover:bg-[var(--color-suido-accent)]/10"
                }`}
              style={{ fontFamily: "var(--font-dm)" }}
            >
              {isEditing ? "✕" : "Editar"}
            </button>

            {/* Delete (two-step) */}
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              onBlur={() => setPending(false)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors duration-150
                          disabled:opacity-50
                ${pendingDelete
                  ? "border-red-500/50 bg-red-500/15 text-red-400 hover:bg-red-500/25"
                  : "border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:border-red-500/40 hover:text-red-400"
                }`}
              style={{ fontFamily: "var(--font-dm)" }}
            >
              {deleting ? "…" : pendingDelete ? "¿Borrar?" : "Borrar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Create / Edit form (shared) ─── */

function MenuItemForm({
  restaurantId,
  existing,
  onSaved,
  onCancel,
}: {
  restaurantId: number;
  existing?: RestaurantMenuItem;
  onSaved: (item: RestaurantMenuItem) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name:        existing?.name        ?? "",
    description: existing?.description ?? "",
    price:       existing ? String(existing.price) : "",
    photoUrl:    existing?.photoUrl    ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  function set(field: keyof typeof form, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.price.trim()) {
      setError("Nombre, descripción y precio son obligatorios.");
      return;
    }
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) { setError("El precio debe ser un número positivo."); return; }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        name:        form.name.trim(),
        description: form.description.trim(),
        price,
        photoUrl:    form.photoUrl.trim() || undefined,
      };
      const saved = existing
        ? await updateRestaurantMenuItem(restaurantId, existing.id, payload)
        : await createRestaurantMenuItem(restaurantId, payload);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`border rounded-2xl p-5 flex flex-col gap-4
        ${existing
          ? "bg-[var(--color-suido-2)] border-[var(--color-suido-accent)]/30"
          : "bg-[var(--color-suido-2)] border-[var(--color-suido-3)]/20"
        }`}
    >
      <h3 className="text-white font-bold text-base" style={{ fontFamily: "var(--font-syne)" }}>
        {existing ? `Editar — ${existing.name}` : "Nuevo ítem del menú"}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Nombre *"    id="mi-name"  value={form.name}     onChange={(v) => set("name", v)}     placeholder="Margherita Pizza" />
        <Field label="Precio *"    id="mi-price" value={form.price}    onChange={(v) => set("price", v)}    placeholder="12.50" type="number" />
        <Field label="URL de foto" id="mi-photo" value={form.photoUrl} onChange={(v) => set("photoUrl", v)} placeholder="https://…" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="mi-desc" className="text-[0.7rem] font-medium tracking-wide uppercase text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>
          Descripción *
        </label>
        <textarea
          id="mi-desc"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Tomato sauce, mozzarella, basil"
          rows={2}
          className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/30
                     text-white placeholder-[var(--color-suido-3)] rounded-xl
                     px-3 py-2.5 text-sm resize-none
                     focus:outline-none focus:border-[var(--color-suido-accent)]
                     transition-colors"
          style={{ fontFamily: "var(--font-dm)" }}
        />
      </div>

      {error && <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-dm)" }}>{error}</p>}

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
          {loading ? "Guardando…" : existing ? "Guardar cambios" : "Guardar ítem"}
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

function Field({
  label, id, value, onChange, placeholder, type = "text",
}: {
  label: string; id: string; value: string;
  onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[0.7rem] font-medium tracking-wide uppercase text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/30
                   text-white placeholder-[var(--color-suido-3)] rounded-xl
                   px-3 py-2.5 text-sm
                   focus:outline-none focus:border-[var(--color-suido-accent)]
                   transition-colors duration-200"
        style={{ fontFamily: "var(--font-dm)" }}
      />
    </div>
  );
}
