"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchRestaurantOrders,
  fetchOrderStats,
  confirmOrder,
  prepareOrder,
  orderOnTheWay,
  deliverOrder,
  cancelRestaurantOrder,
  assignDeliveryPerson,
  type RestaurantOrder,
  type RestaurantOrderStatus,
  type OrderStats,
} from "@/lib/restaurant";

const STATUS_LABEL: Record<RestaurantOrderStatus, string> = {
  PENDING:    "Pendiente",
  CONFIRMED:  "Confirmado",
  PREPARING:  "Preparando",
  ON_THE_WAY: "En camino",
  DELIVERED:  "Entregado",
  CANCELLED:  "Cancelado",
};

const STATUS_COLORS: Record<RestaurantOrderStatus, string> = {
  PENDING:    "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  CONFIRMED:  "bg-blue-500/15 text-blue-400 border-blue-500/25",
  PREPARING:  "bg-orange-500/15 text-orange-400 border-orange-500/25",
  ON_THE_WAY: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  DELIVERED:  "bg-green-500/15 text-green-400 border-green-500/25",
  CANCELLED:  "bg-red-500/15 text-red-400 border-red-500/25",
};

const STATUS_FILTERS: { label: string; value: RestaurantOrderStatus | undefined }[] = [
  { label: "Todos",      value: undefined },
  { label: "Pendiente",  value: "PENDING" },
  { label: "Confirmado", value: "CONFIRMED" },
  { label: "Preparando", value: "PREPARING" },
  { label: "En camino",  value: "ON_THE_WAY" },
  { label: "Entregado",  value: "DELIVERED" },
  { label: "Cancelado",  value: "CANCELLED" },
];

const PAGE_SIZE = 20;

interface Props { restaurantId: number }

export default function OrdersPanel({ restaurantId }: Props) {
  const [orders, setOrders]               = useState<RestaurantOrder[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [statusFilter, setStatusFilter]   = useState<RestaurantOrderStatus | undefined>(undefined);
  const [page, setPage]                   = useState(0);
  const [totalPages, setTotalPages]       = useState(1);
  const [totalElements, setTotal]         = useState(0);
  const [expanded, setExpanded]           = useState<number | null>(null);

  const load = useCallback(async (p: number, status: RestaurantOrderStatus | undefined) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRestaurantOrders(restaurantId, p, PAGE_SIZE, status);
      setOrders(result.orders);
      setTotalPages(result.totalPages);
      setTotal(result.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar los pedidos.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { load(page, statusFilter); }, [load, page, statusFilter]);

  function handleFilterChange(status: RestaurantOrderStatus | undefined) {
    setStatusFilter(status);
    setPage(0);
    setExpanded(null);
  }

  function updateOrder(updated: RestaurantOrder) {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }

  function cancelLocally(id: number) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "CANCELLED" as RestaurantOrderStatus } : o)),
    );
  }

  return (
    <section className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-white" style={{ fontFamily: "var(--font-syne)" }}>
            Pedidos
          </h2>
          {!loading && (
            <p className="text-xs text-[var(--color-suido-4)] mt-0.5" style={{ fontFamily: "var(--font-dm)" }}>
              {totalElements} {totalElements === 1 ? "pedido" : "pedidos"}
              {statusFilter ? ` · ${STATUS_LABEL[statusFilter]}` : ""}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => load(page, statusFilter)}
          className="text-xs font-medium text-[var(--color-suido-4)] hover:text-white
                     px-3 py-1.5 rounded-full border border-[var(--color-suido-3)]/30
                     transition-colors duration-200"
          style={{ fontFamily: "var(--font-dm)" }}
        >
          Actualizar
        </button>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={label}
            type="button"
            onClick={() => handleFilterChange(value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors duration-150
              ${statusFilter === value
                ? "bg-[var(--color-suido-cat)] border-[var(--color-suido-cat)] text-white"
                : "bg-transparent border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:text-white"
              }`}
            style={{ fontFamily: "var(--font-dm)" }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5" style={{ fontFamily: "var(--font-dm)" }}>
          {error}
        </p>
      ) : orders.length === 0 ? (
        <p className="text-center py-16 text-[var(--color-suido-3)]" style={{ fontFamily: "var(--font-dm)" }}>
          No hay pedidos con este filtro.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                expanded={expanded === order.id}
                onToggle={() => setExpanded((p) => (p === order.id ? null : order.id))}
                onUpdate={updateOrder}
                onCancelled={() => cancelLocally(order.id)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 rounded-xl text-sm border border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:text-white disabled:opacity-40 transition-colors"
                style={{ fontFamily: "var(--font-dm)" }}
              >
                ← Anterior
              </button>
              <span className="text-sm text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 rounded-xl text-sm border border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:text-white disabled:opacity-40 transition-colors"
                style={{ fontFamily: "var(--font-dm)" }}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

/* ─── Individual order row ─── */

interface RowProps {
  order: RestaurantOrder;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (o: RestaurantOrder) => void;
  onCancelled: () => void;
}

function OrderRow({ order, expanded, onToggle, onUpdate, onCancelled }: RowProps) {
  const [busy, setBusy]               = useState(false);
  const [rowError, setRowError]       = useState<string | null>(null);
  const [driverInput, setDriverInput] = useState("");
  const [stats, setStats]             = useState<OrderStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Load stats when driver is assigned and row is expanded
  useEffect(() => {
    if (!expanded || order.deliveryPersonId == null || stats) return;
    setLoadingStats(true);
    fetchOrderStats(order.id)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, [expanded, order.id, order.deliveryPersonId, stats]);

  async function run(fn: () => Promise<RestaurantOrder | null>, isCancel = false) {
    setBusy(true);
    setRowError(null);
    try {
      const updated = await fn();
      if (isCancel) { onCancelled(); return; }
      if (updated) onUpdate(updated);
    } catch (err) {
      setRowError(err instanceof Error ? err.message : "Error al actualizar.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAssign() {
    const dpId = parseInt(driverInput, 10);
    if (!dpId || isNaN(dpId)) { setRowError("Ingresá un ID de repartidor válido."); return; }
    setBusy(true);
    setRowError(null);
    try {
      const updated = await assignDeliveryPerson(order.id, dpId);
      onUpdate(updated);
      setDriverInput("");
      setStats(null);
    } catch (err) {
      setRowError(err instanceof Error ? err.message : "Error al asignar.");
    } finally {
      setBusy(false);
    }
  }

  const canCancel   = order.status === "PENDING" || order.status === "CONFIRMED";
  const actionLabel = {
    PENDING:    { label: "Confirmar",  fn: () => run(() => confirmOrder(order.id)) },
    CONFIRMED:  { label: "Preparando", fn: () => run(() => prepareOrder(order.id)) },
    PREPARING:  { label: "En camino",  fn: () => run(() => orderOnTheWay(order.id)) },
    ON_THE_WAY: { label: "Entregar",   fn: () => run(() => deliverOrder(order.id)) },
  }[order.status as string];

  return (
    <div className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4
                   hover:bg-[var(--color-suido-2)]/50 transition-colors duration-150 text-left"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-syne)" }}>
            #{order.id}
          </span>
          <span
            className={`text-[0.65rem] font-semibold uppercase tracking-wide border rounded-full px-2.5 py-0.5 ${STATUS_COLORS[order.status]}`}
            style={{ fontFamily: "var(--font-dm)" }}
          >
            {STATUS_LABEL[order.status]}
          </span>
          <span className="text-xs text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>
            {new Date(order.createdAt).toLocaleString("es-AR")}
          </span>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <span className="text-xs text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>
            {order.items.length} {order.items.length === 1 ? "ítem" : "ítems"}
          </span>
          {order.total != null && (
            <span className="text-[var(--color-suido-accent)] font-extrabold text-sm" style={{ fontFamily: "var(--font-syne)" }}>
              ${order.total.toFixed(2)}
            </span>
          )}
          <span className={`text-[var(--color-suido-3)] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>▾</span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[var(--color-suido-3)]/15 px-5 pb-5 pt-4 flex flex-col gap-5">

          {/* Items */}
          <div className="flex flex-col gap-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium" style={{ fontFamily: "var(--font-dm)" }}>
                    <span className="text-[var(--color-suido-accent)] font-bold">{item.quantity}×</span>{" "}{item.menuItemName}
                  </p>
                  {item.notes && (
                    <p className="text-[0.72rem] text-[var(--color-suido-3)] mt-0.5 italic" style={{ fontFamily: "var(--font-dm)" }}>
                      Nota: {item.notes}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-white text-sm" style={{ fontFamily: "var(--font-dm)" }}>${item.subtotal.toFixed(2)}</p>
                  <p className="text-[0.7rem] text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>${item.unitPrice.toFixed(2)} c/u</p>
                </div>
              </div>
            ))}
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[var(--color-suido-3)]/15">
            {order.subtotal != null && <MetaCell label="Subtotal" value={`$${order.subtotal.toFixed(2)}`} />}
            <MetaCell label="Envío" value={order.shippingCost > 0 ? `$${order.shippingCost.toFixed(2)}` : "Pendiente"} dim={order.shippingCost === 0} />
            {order.tip != null && order.tip > 0 && <MetaCell label="Propina" value={`$${order.tip.toFixed(2)}`} />}
            {order.total != null && <MetaCell label="Total" value={`$${order.total.toFixed(2)}`} accent />}
            {order.paymentMethod && (
              <MetaCell label="Pago" value={order.paymentMethod === "CASH" ? "💵 Efectivo" : "💳 Tarjeta"} />
            )}
            <MetaCell
              label="Repartidor"
              value={order.deliveryPersonId != null ? `#${order.deliveryPersonId}` : "Sin asignar"}
              dim={order.deliveryPersonId == null}
            />
            {order.deliveredAt && (
              <MetaCell label="Entregado" value={new Date(order.deliveredAt).toLocaleString("es-AR")} />
            )}
          </div>

          {/* Order stats (after driver assigned) */}
          {order.deliveryPersonId != null && (
            <div className="pt-3 border-t border-[var(--color-suido-3)]/15">
              {loadingStats ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" />
                  <span className="text-xs text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>
                    Cargando estadísticas…
                  </span>
                </div>
              ) : stats ? (
                <div className="grid grid-cols-3 gap-3">
                  <MetaCell label="Distancia" value={`${stats.distanceKm.toFixed(2)} km`} />
                  <MetaCell label="Tiempo est." value={`${Math.round(stats.durationSeconds / 60)} min`} />
                  <MetaCell label="Costo envío" value={`$${stats.shippingCost.toFixed(2)}`} accent />
                </div>
              ) : null}
            </div>
          )}

          {/* Assign driver (CONFIRMED) */}
          {order.status === "CONFIRMED" && order.deliveryPersonId == null && (
            <div className="pt-3 border-t border-[var(--color-suido-3)]/15 flex items-center gap-2 flex-wrap">
              <input
                type="number"
                min="1"
                value={driverInput}
                onChange={(e) => setDriverInput(e.target.value)}
                placeholder="ID repartidor"
                className="bg-[var(--color-suido-2)] border border-[var(--color-suido-3)]/30
                           text-white placeholder-[var(--color-suido-3)] rounded-xl
                           px-3 py-2 text-sm w-36
                           focus:outline-none focus:border-[var(--color-suido-accent)]
                           transition-colors"
                style={{ fontFamily: "var(--font-dm)" }}
              />
              <button
                type="button"
                onClick={handleAssign}
                disabled={busy || !driverInput.trim()}
                className="text-xs font-semibold px-3 py-2 rounded-xl border
                           border-blue-500/30 text-blue-400 hover:bg-blue-500/10
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ fontFamily: "var(--font-dm)" }}
              >
                Asignar repartidor
              </button>
            </div>
          )}

          {/* Error */}
          {rowError && (
            <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-dm)" }}>{rowError}</p>
          )}

          {/* Action buttons */}
          {(actionLabel || canCancel) && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {actionLabel && (
                <button
                  type="button"
                  onClick={actionLabel.fn}
                  disabled={busy}
                  className="text-sm font-semibold px-4 py-2 rounded-xl text-white
                             bg-[var(--color-suido-cat)] hover:bg-[var(--color-suido-accent)]
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-colors duration-200 flex items-center gap-2"
                  style={{ fontFamily: "var(--font-dm)" }}
                >
                  {busy && <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                  {busy ? "Actualizando…" : actionLabel.label}
                </button>
              )}
              {canCancel && (
                <button
                  type="button"
                  onClick={() => run(() => cancelRestaurantOrder(order.id).then(() => null), true)}
                  disabled={busy}
                  className="text-sm font-semibold px-4 py-2 rounded-xl
                             border border-red-500/30 text-red-400 hover:bg-red-500/10
                             disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ fontFamily: "var(--font-dm)" }}
                >
                  Cancelar pedido
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetaCell({ label, value, accent, dim }: { label: string; value: string; accent?: boolean; dim?: boolean }) {
  return (
    <div>
      <p className="text-[0.62rem] uppercase tracking-wide text-[var(--color-suido-3)]" style={{ fontFamily: "var(--font-dm)" }}>{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${accent ? "text-[var(--color-suido-accent)]" : dim ? "text-[var(--color-suido-3)]" : "text-white"}`} style={{ fontFamily: "var(--font-dm)" }}>
        {value}
      </p>
    </div>
  );
}
