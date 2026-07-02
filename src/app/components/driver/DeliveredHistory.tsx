"use client";

import { useCallback, useEffect, useState } from "react";
import { getDeliveredHistory, fetchOrderById, resolveRestaurantName, type DriverOrder, type OrderDetail } from "@/lib/driver-orders";

interface Props { deliveryPersonId: number }

const SIZE = 20;

export default function DeliveredHistory({ deliveryPersonId }: Props) {
  const [orders, setOrders]   = useState<DriverOrder[]>([]);
  const [page, setPage]       = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

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
      <h2 className="text-xl font-extrabold text-white mb-6" style={{ fontFamily: "var(--font-syne)" }}>
        Historial de entregas
      </h2>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5" style={{ fontFamily: "var(--font-dm)" }}>
          {error}
        </p>
      ) : orders.length === 0 ? (
        <p className="text-center py-24 text-[var(--color-suido-3)]" style={{ fontFamily: "var(--font-dm)" }}>
          Todavía no realizaste ninguna entrega.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <HistoryRow
                key={order.id}
                order={order}
                expanded={expanded === order.id}
                onToggle={() => setExpanded((p) => (p === order.id ? null : order.id))}
              />
            ))}
          </div>

          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-xl text-sm border border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:text-white disabled:opacity-40 transition-colors"
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
              className="px-4 py-2 rounded-xl text-sm border border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:text-white disabled:opacity-40 transition-colors"
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

/* ─── Expandable row ─── */

function HistoryRow({
  order, expanded, onToggle,
}: {
  order: DriverOrder;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!expanded || detail) return;
    setLoading(true);
    fetchOrderById(order.id)
      .then(setDetail)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [expanded, order.id, detail]);

  return (
    <div className={`bg-[var(--color-suido-1)] border rounded-2xl overflow-hidden transition-colors ${expanded ? "border-[var(--color-suido-accent)]/30" : "border-[var(--color-suido-3)]/20"}`}>
      {/* Compact row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-[var(--color-suido-2)]/40 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-syne)" }}>
              {order.restaurantName}
            </span>
            <span className="text-[0.65rem] font-semibold uppercase tracking-wide border rounded-full px-2.5 py-0.5 bg-green-500/15 text-green-400 border-green-500/25" style={{ fontFamily: "var(--font-dm)" }}>
              Entregado
            </span>
          </div>
          <p className="text-xs text-[var(--color-suido-4)] truncate" style={{ fontFamily: "var(--font-dm)" }}>
            {order.deliveryAddress} · {new Date(order.createdAt).toLocaleDateString("es-AR")}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-[var(--color-suido-accent)] font-extrabold text-sm" style={{ fontFamily: "var(--font-syne)" }}>
            ${order.total.toFixed(2)}
          </span>
          <span className={`text-[var(--color-suido-3)] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>▾</span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[var(--color-suido-3)]/15 px-5 pb-5 pt-4 flex flex-col gap-3">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" />
            </div>
          ) : detail ? (
            <>
              {/* Addresses */}
              <div className="flex flex-col gap-1.5 text-sm" style={{ fontFamily: "var(--font-dm)" }}>
                <p className="text-[var(--color-suido-4)]">
                  <span className="text-[var(--color-suido-3)]">Retiro: </span>{detail.pickupAddress ?? resolveRestaurantName(detail)}
                </p>
                <p className="text-[var(--color-suido-4)]">
                  <span className="text-[var(--color-suido-3)]">Entrega: </span>{detail.deliveryAddress}
                </p>
              </div>

              {/* Items */}
              {detail.items && detail.items.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-3 border-t border-[var(--color-suido-3)]/15">
                  {detail.items.map((item, i) => (
                    <div key={i} className="flex justify-between gap-3">
                      <span className="text-sm text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>
                        <span className="text-white font-semibold">{item.quantity}×</span> {item.menuItemName}
                      </span>
                      <span className="text-sm text-white whitespace-nowrap" style={{ fontFamily: "var(--font-dm)" }}>
                        ${item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between pt-2 border-t border-[var(--color-suido-3)]/15">
                <span className="text-sm text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>Total pedido</span>
                <span className="text-sm font-bold text-[var(--color-suido-accent)]" style={{ fontFamily: "var(--font-syne)" }}>
                  ${detail.total.toFixed(2)}
                </span>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
