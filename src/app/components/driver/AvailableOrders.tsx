"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAvailableOrders, type AvailableOrder } from "@/lib/orders";
import OrderCard from "./OrderCard";

export default function AvailableOrders() {
  const [orders, setOrders]   = useState<AvailableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await fetchAvailableOrders());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar los pedidos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-xl font-extrabold text-white"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Pedidos disponibles
        </h2>
        <button
          type="button"
          onClick={loadOrders}
          className="text-xs font-medium text-[var(--color-suido-4)] hover:text-white
                     px-3 py-1.5 rounded-full border border-[var(--color-suido-3)]/30
                     transition-colors duration-200"
          style={{ fontFamily: "var(--font-dm)" }}
        >
          Actualizar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" />
        </div>
      ) : error ? (
        <p
          className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5"
          style={{ fontFamily: "var(--font-dm)" }}
        >
          {error}
        </p>
      ) : orders.length === 0 ? (
        <p
          className="text-center py-24 text-[var(--color-suido-3)]"
          style={{ fontFamily: "var(--font-dm)" }}
        >
          No hay pedidos disponibles por el momento.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </section>
  );
}
