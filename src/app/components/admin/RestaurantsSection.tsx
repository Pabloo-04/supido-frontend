"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAllRestaurants, type MenuItem, type Restaurant } from "@/lib/admin";
import AddRestaurantForm from "./AddRestaurantForm";
import AddMenuItemForm from "./AddMenuItemForm";

export default function RestaurantsSection() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [expandedMenuId, setExpandedMenuId] = useState<number | null>(null);

  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRestaurants(await fetchAllRestaurants());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar restaurantes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRestaurants(); }, [loadRestaurants]);

  function handleRestaurantCreated(r: Restaurant) {
    setRestaurants((prev) => [r, ...prev]);
    setShowAddRestaurant(false);
  }

  function handleMenuItemCreated(_item: MenuItem, restaurantId: number) {
    setExpandedMenuId(null);
    // success toast could go here
    void restaurantId;
  }

  return (
    <section className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-extrabold text-white"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Restaurantes
        </h2>
        {!showAddRestaurant && (
          <button
            type="button"
            onClick={() => setShowAddRestaurant(true)}
            className="text-xs font-semibold text-white px-4 py-2 rounded-full
                       bg-[var(--color-suido-cat)] hover:bg-[var(--color-suido-accent)]
                       transition-colors duration-200"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            + Agregar restaurante
          </button>
        )}
      </div>

      {/* Add restaurant form */}
      {showAddRestaurant && (
        <AddRestaurantForm
          onCreated={handleRestaurantCreated}
          onCancel={() => setShowAddRestaurant(false)}
        />
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5" style={{ fontFamily: "var(--font-dm)" }}>
          {error}
        </p>
      ) : restaurants.length === 0 ? (
        <p className="text-center py-16 text-[var(--color-suido-3)]" style={{ fontFamily: "var(--font-dm)" }}>
          No hay restaurantes aún.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {restaurants.map((r) => (
            <div
              key={r.id}
              className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {r.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.photoUrl}
                      alt={r.name}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-[var(--color-suido-2)]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-suido-2)] flex items-center justify-center flex-shrink-0 text-xl">
                      🍽️
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm truncate" style={{ fontFamily: "var(--font-syne)" }}>
                      {r.name}
                    </p>
                    <p className="text-[0.72rem] text-[var(--color-suido-4)] mt-0.5" style={{ fontFamily: "var(--font-dm)" }}>
                      {r.category}{r.address ? ` · ${r.address}` : ""}
                    </p>
                    {r.openingTime && r.closingTime && (
                      <p className="text-[0.7rem] text-[var(--color-suido-3)]" style={{ fontFamily: "var(--font-dm)" }}>
                        {r.openingTime} – {r.closingTime}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedMenuId(expandedMenuId === r.id ? null : r.id)}
                  className="text-xs font-medium text-[var(--color-suido-4)] hover:text-white
                             px-3 py-1.5 rounded-full border border-[var(--color-suido-3)]/30
                             transition-colors duration-200 flex-shrink-0"
                  style={{ fontFamily: "var(--font-dm)" }}
                >
                  {expandedMenuId === r.id ? "Cerrar" : "+ Ítem al menú"}
                </button>
              </div>

              {expandedMenuId === r.id && (
                <AddMenuItemForm
                  restaurantId={r.id}
                  restaurantName={r.name}
                  onCreated={(item) => handleMenuItemCreated(item, r.id)}
                  onCancel={() => setExpandedMenuId(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
