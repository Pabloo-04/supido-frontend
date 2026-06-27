"use client";

import { useCallback, useEffect, useState } from "react";
import { getDeliveredHistory, type DriverOrder } from "@/lib/driver-orders";

interface Props {
  deliveryPersonId: number;
}

export default function DeliveredHistory({ deliveryPersonId }: Props) {
  const [orders, setOrders]   = useState<DriverOrder[]>([]);
  const [page, setPage]       = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const SIZE = 10;

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDeliveredHistory(deliveryPersonId, p, SIZE);
      setOrders(data);
      setHasMore(data.length === SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el historial.");
    } finally {
      setLoading(false);
    }
  }, [deliveryPersonId]);

  useEffect(() => { load(page); }, [load, page]);

  return (
    <section>
      <h2
        className="text-xl font-extrabold text-white mb-6"
        style={{ fontFamily: "var(--font-syne)" }}
      >
        Historial de entregas
      </h2>

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
          Todavía no realizaste ninguna entrega.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20
                           rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <span className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-syne)" }}>
                      #{order.id} · {order.restaurantName}
                    </span>
                    <span
                      className="text-[0.65rem] font-semibold uppercase tracking-wide border rounded-full px-2.5 py-0.5
                                 bg-green-500/15 text-green-400 border-green-500/25"
                      style={{ fontFamily: "var(--font-dm)" }}
                    >
                      Entregado
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>
                    {order.deliveryAddress}
                    {" · "}
                    {new Date(order.createdAt).toLocaleString("es-AR")}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`text-xs font-medium ${order.paymentMethod === "CASH" ? "text-yellow-400" : "text-blue-400"}`}
                    style={{ fontFamily: "var(--font-dm)" }}
                  >
                    {order.paymentMethod === "CASH" ? "💵" : "💳"}
                  </span>
                  <span
                    className="text-[var(--color-suido-accent)] font-extrabold text-sm"
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    ${order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-xl text-sm border border-[var(--color-suido-3)]/30
                         text-[var(--color-suido-4)] hover:text-white disabled:opacity-40 transition-colors"
              style={{ fontFamily: "var(--font-dm)" }}
            >
              ← Anterior
            </button>
            <span className="px-4 py-2 text-sm text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>
              Página {page + 1}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
              className="px-4 py-2 rounded-xl text-sm border border-[var(--color-suido-3)]/30
                         text-[var(--color-suido-4)] hover:text-white disabled:opacity-40 transition-colors"
              style={{ fontFamily: "var(--font-dm)" }}
            >
              Siguiente →
            </button>
          </div>
        </>
      )}
    </section>
  );
}
