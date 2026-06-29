"use client";

import { useEffect, useState } from "react";
import { updateMyRestaurant, fetchCategories, type MyRestaurant, type UpdateRestaurantRequest } from "@/lib/restaurant";

const FALLBACK_CATEGORIES = ["FAST_FOOD","ITALIAN","MEXICAN","CHINESE","BREAKFAST","DESSERTS","HEALTHY","PIZZA","SEAFOOD","VEGETARIAN"];

interface Props { restaurant: MyRestaurant; onUpdated: (r: MyRestaurant) => void }

export default function ProfilePanel({ restaurant, onUpdated }: Props) {
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  const [form, setForm] = useState({
    name: restaurant.name, category: restaurant.category, address: restaurant.address ?? "",
    latitude: restaurant.latitude != null ? String(restaurant.latitude) : "",
    longitude: restaurant.longitude != null ? String(restaurant.longitude) : "",
    openingTime: restaurant.openingTime ? restaurant.openingTime.slice(0, 5) : "",
    closingTime: restaurant.closingTime ? restaurant.closingTime.slice(0, 5) : "",
    photoUrl: restaurant.photoUrl ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => { fetchCategories().then((c) => { if (c.length > 0) setCategories(c); }).catch(() => {}); }, []);

  function set(f: keyof typeof form, v: string) { setForm((p) => ({ ...p, [f]: v })); setSuccess(false); }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const lat = parseFloat(form.latitude), lng = parseFloat(form.longitude);
    if (!form.name.trim() || !form.address.trim() || !form.openingTime || !form.closingTime) { setError("Nombre, dirección y horarios son obligatorios."); return; }
    if (isNaN(lat) || isNaN(lng)) { setError("Latitud y longitud deben ser números."); return; }
    setLoading(true); setError(null);
    try {
      const body: UpdateRestaurantRequest = {
        name: form.name.trim(), category: form.category, address: form.address.trim(),
        latitude: lat, longitude: lng,
        openingTime: form.openingTime.length === 5 ? `${form.openingTime}:00` : form.openingTime,
        closingTime: form.closingTime.length === 5 ? `${form.closingTime}:00` : form.closingTime,
        photoUrl: form.photoUrl.trim() || undefined,
      };
      onUpdated(await updateMyRestaurant(restaurant.id, body));
      setSuccess(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Error al guardar."); }
    finally { setLoading(false); }
  }

  return (
    <section className="flex flex-col gap-6 max-w-2xl">
      <h2 className="text-xl font-extrabold text-white" style={{ fontFamily: "var(--font-syne)" }}>Perfil del restaurante</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label="Nombre *" id="rp-name" value={form.name} onChange={(v) => set("name", v)} placeholder="La Trattoria" />
          <div className="flex flex-col gap-1">
            <label htmlFor="rp-cat" className="text-xs font-medium tracking-wide uppercase text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>Categoría *</label>
            <select id="rp-cat" value={form.category} onChange={(e) => set("category", e.target.value)}
              className="bg-[var(--color-suido-2)] border border-[var(--color-suido-3)]/30 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-suido-accent)] transition-colors"
              style={{ fontFamily: "var(--font-dm)" }}>
              {categories.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <F label="Dirección *" id="rp-addr" value={form.address} onChange={(v) => set("address", v)} placeholder="Calle Mayor 12" />
          <F label="URL de foto" id="rp-photo" value={form.photoUrl} onChange={(v) => set("photoUrl", v)} placeholder="https://…" />
          <F label="Latitud *" id="rp-lat" value={form.latitude} onChange={(v) => set("latitude", v)} placeholder="40.4168" type="number" />
          <F label="Longitud *" id="rp-lng" value={form.longitude} onChange={(v) => set("longitude", v)} placeholder="-3.7038" type="number" />
          <F label="Apertura *" id="rp-open" value={form.openingTime} onChange={(v) => set("openingTime", v)} placeholder="09:00" type="time" />
          <F label="Cierre *" id="rp-close" value={form.closingTime} onChange={(v) => set("closingTime", v)} placeholder="23:00" type="time" />
        </div>
        {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5" style={{ fontFamily: "var(--font-dm)" }}>{error}</p>}
        {success && <p className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-xl px-4 py-2.5" style={{ fontFamily: "var(--font-dm)" }}>Cambios guardados correctamente.</p>}
        <button type="submit" disabled={loading}
          className="w-fit py-3 px-6 rounded-xl text-sm font-semibold text-white bg-[var(--color-suido-cat)] hover:bg-[var(--color-suido-accent)] disabled:opacity-50 transition-colors flex items-center gap-2"
          style={{ fontFamily: "var(--font-dm)" }}>
          {loading && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
          {loading ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>
    </section>
  );
}

function F({ label, id, value, onChange, placeholder, type = "text" }:
  { label: string; id: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium tracking-wide uppercase text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>{label}</label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="bg-[var(--color-suido-2)] border border-[var(--color-suido-3)]/30 text-white placeholder-[var(--color-suido-3)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-suido-accent)] transition-colors"
        style={{ fontFamily: "var(--font-dm)" }} />
    </div>
  );
}
