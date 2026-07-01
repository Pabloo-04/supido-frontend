"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchRestaurantOrders, fetchOrderStats, confirmOrder, prepareOrder, orderOnTheWay,
  deliverOrder, cancelRestaurantOrder, assignDeliveryPerson,
  type RestaurantOrder, type RestaurantOrderStatus, type OrderStats,
} from "@/lib/restaurant";

const STATUS_LABEL: Record<RestaurantOrderStatus, string> = {
  PENDING: "Pendiente", CONFIRMED: "Confirmado", PREPARING: "Preparando",
  ON_THE_WAY: "En camino", DELIVERED: "Entregado", CANCELLED: "Cancelado",
};
const STATUS_COLORS: Record<RestaurantOrderStatus, string> = {
  PENDING: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  CONFIRMED: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  PREPARING: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  ON_THE_WAY: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  DELIVERED: "bg-green-500/15 text-green-400 border-green-500/25",
  CANCELLED: "bg-red-500/15 text-red-400 border-red-500/25",
};
const STATUS_FILTERS: { label: string; value: RestaurantOrderStatus | undefined }[] = [
  { label: "Todos", value: undefined }, { label: "Pendiente", value: "PENDING" },
  { label: "Confirmado", value: "CONFIRMED" }, { label: "Preparando", value: "PREPARING" },
  { label: "En camino", value: "ON_THE_WAY" }, { label: "Entregado", value: "DELIVERED" },
  { label: "Cancelado", value: "CANCELLED" },
];

interface Props { restaurantId: number }

export default function OrdersPanel({ restaurantId }: Props) {
  const [orders, setOrders]             = useState<RestaurantOrder[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RestaurantOrderStatus | undefined>(undefined);
  const [page, setPage]                 = useState(0);
  const [totalPages, setTotalPages]     = useState(1);
  const [totalElements, setTotal]       = useState(0);
  const [expanded, setExpanded]         = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetchRestaurantOrders(restaurantId, page, 20, statusFilter);
      setOrders(r.orders); setTotalPages(r.totalPages); setTotal(r.totalElements);
    } catch (err) { setError(err instanceof Error ? err.message : "Error al cargar."); }
    finally { setLoading(false); }
  }, [restaurantId, page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  function updateOrder(u: RestaurantOrder) { setOrders((p) => p.map((o) => (o.id === u.id ? u : o))); }
  function cancelLocally(id: number) { setOrders((p) => p.map((o) => (o.id === id ? { ...o, status: "CANCELLED" as RestaurantOrderStatus } : o))); }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-white" style={{ fontFamily: "var(--font-syne)" }}>Pedidos</h2>
          {!loading && <p className="text-xs text-[var(--color-suido-4)] mt-0.5" style={{ fontFamily: "var(--font-dm)" }}>{totalElements} pedidos{statusFilter ? ` · ${STATUS_LABEL[statusFilter]}` : ""}</p>}
        </div>
        <button type="button" onClick={load} className="text-xs font-medium text-[var(--color-suido-4)] hover:text-white px-3 py-1.5 rounded-full border border-[var(--color-suido-3)]/30 transition-colors" style={{ fontFamily: "var(--font-dm)" }}>Actualizar</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(({ label, value }) => (
          <button key={label} type="button" onClick={() => { setStatusFilter(value); setPage(0); setExpanded(null); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${statusFilter === value ? "bg-[var(--color-suido-cat)] border-[var(--color-suido-cat)] text-white" : "bg-transparent border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:text-white"}`}
            style={{ fontFamily: "var(--font-dm)" }}>{label}</button>
        ))}
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="w-7 h-7 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" /></div>
        : error ? <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5" style={{ fontFamily: "var(--font-dm)" }}>{error}</p>
        : orders.length === 0 ? <p className="text-center py-16 text-[var(--color-suido-3)]" style={{ fontFamily: "var(--font-dm)" }}>No hay pedidos.</p>
        : (
          <>
            <div className="flex flex-col gap-3">
              {orders.map((o) => (
                <OrderRow key={o.id} order={o} expanded={expanded === o.id}
                  onToggle={() => setExpanded((p) => (p === o.id ? null : o.id))}
                  onUpdate={updateOrder} onCancelled={() => cancelLocally(o.id)} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-4 py-2 rounded-xl text-sm border border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:text-white disabled:opacity-40 transition-colors" style={{ fontFamily: "var(--font-dm)" }}>← Anterior</button>
                <span className="text-sm text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>{page + 1} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-4 py-2 rounded-xl text-sm border border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:text-white disabled:opacity-40 transition-colors" style={{ fontFamily: "var(--font-dm)" }}>Siguiente →</button>
              </div>
            )}
          </>
        )}
    </section>
  );
}

function OrderRow({ order, expanded, onToggle, onUpdate, onCancelled }:
  { order: RestaurantOrder; expanded: boolean; onToggle: () => void; onUpdate: (o: RestaurantOrder) => void; onCancelled: () => void }) {
  const [busy, setBusy]             = useState(false);
  const [rowError, setRowError]     = useState<string | null>(null);
  const [driverInput, setDriverInput] = useState("");
  const [stats, setStats]           = useState<OrderStats | null>(null);
  const [loadingStats, setLS]       = useState(false);

  useEffect(() => {
    if (!expanded || order.deliveryPersonId == null || stats) return;
    setLS(true);
    fetchOrderStats(order.id).then(setStats).catch(() => {}).finally(() => setLS(false));
  }, [expanded, order.id, order.deliveryPersonId, stats]);

  async function run(fn: () => Promise<RestaurantOrder | null>, isCancel = false) {
    setBusy(true); setRowError(null);
    try { const u = await fn(); if (isCancel) { onCancelled(); return; } if (u) onUpdate(u); }
    catch (err) { setRowError(err instanceof Error ? err.message : "Error."); }
    finally { setBusy(false); }
  }
  async function handleAssign() {
    const dpId = parseInt(driverInput, 10);
    if (!dpId || isNaN(dpId)) { setRowError("Ingresá un ID válido."); return; }
    setBusy(true); setRowError(null);
    try { onUpdate(await assignDeliveryPerson(order.id, dpId)); setDriverInput(""); setStats(null); }
    catch (err) { setRowError(err instanceof Error ? err.message : "Error."); }
    finally { setBusy(false); }
  }

  const canCancel = order.status === "PENDING" || order.status === "CONFIRMED";
  const actionLabel = ({ PENDING: { label: "Confirmar", fn: () => run(() => confirmOrder(order.id)) },
    CONFIRMED: { label: "Preparando", fn: () => run(() => prepareOrder(order.id)) },
    PREPARING: { label: "En camino", fn: () => run(() => orderOnTheWay(order.id)) },
    ON_THE_WAY: { label: "Entregar", fn: () => run(() => deliverOrder(order.id)) },
  } as Record<string, { label: string; fn: () => void }>)[order.status];

  return (
    <div className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20 rounded-2xl overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-[var(--color-suido-2)]/50 transition-colors text-left">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-syne)" }}>#{order.id}</span>
          <span className={`text-[0.65rem] font-semibold uppercase tracking-wide border rounded-full px-2.5 py-0.5 ${STATUS_COLORS[order.status]}`} style={{ fontFamily: "var(--font-dm)" }}>{STATUS_LABEL[order.status]}</span>
          <span className="text-xs text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>{new Date(order.createdAt).toLocaleString("es-AR")}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>{order.items.length} ítem{order.items.length !== 1 ? "s" : ""}</span>
          {order.total != null && <span className="text-[var(--color-suido-accent)] font-extrabold text-sm" style={{ fontFamily: "var(--font-syne)" }}>${order.total.toFixed(2)}</span>}
          <span className={`text-[var(--color-suido-3)] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>▾</span>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-[var(--color-suido-3)]/15 px-5 pb-5 pt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-4">
                <p className="text-white text-sm" style={{ fontFamily: "var(--font-dm)" }}><span className="text-[var(--color-suido-accent)] font-bold">{item.quantity}×</span> {item.menuItemName}{item.notes ? <span className="text-[var(--color-suido-3)] italic text-xs ml-1">({item.notes})</span> : null}</p>
                <p className="text-white text-sm whitespace-nowrap" style={{ fontFamily: "var(--font-dm)" }}>${item.subtotal.toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[var(--color-suido-3)]/15">
            {order.subtotal != null && <MC l="Subtotal" v={`$${order.subtotal.toFixed(2)}`} />}
            <MC l="Envío" v={order.shippingCost > 0 ? `$${order.shippingCost.toFixed(2)}` : "Pendiente"} dim={order.shippingCost === 0} />
            {order.total != null && <MC l="Total" v={`$${order.total.toFixed(2)}`} accent />}
            {order.paymentMethod && <MC l="Pago" v={order.paymentMethod === "CASH" ? "💵 Efectivo" : "💳 Tarjeta"} />}
            <MC l="Repartidor" v={order.deliveryPersonId != null ? `#${order.deliveryPersonId}` : "Sin asignar"} dim={order.deliveryPersonId == null} />
          </div>
          {order.deliveryPersonId != null && (
            loadingStats ? <p className="text-xs text-[var(--color-suido-4)] animate-pulse" style={{ fontFamily: "var(--font-dm)" }}>Cargando estadísticas…</p>
              : stats ? (
                <div className="grid grid-cols-3 gap-3">
                  <MC l="Distancia" v={`${stats.distanceKm.toFixed(2)} km`} />
                  <MC l="Tiempo est." v={`${Math.round(stats.durationSeconds / 60)} min`} />
                  <MC l="Costo envío" v={`$${stats.shippingCost.toFixed(2)}`} accent />
                </div>
              ) : null
          )}
          {order.status === "CONFIRMED" && order.deliveryPersonId == null && (
            <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-[var(--color-suido-3)]/15">
              <input type="number" min="1" value={driverInput} onChange={(e) => setDriverInput(e.target.value)} placeholder="ID repartidor"
                className="bg-[var(--color-suido-2)] border border-[var(--color-suido-3)]/30 text-white placeholder-[var(--color-suido-3)] rounded-xl px-3 py-2 text-sm w-36 focus:outline-none focus:border-[var(--color-suido-accent)] transition-colors"
                style={{ fontFamily: "var(--font-dm)" }} />
              <button type="button" onClick={handleAssign} disabled={busy || !driverInput.trim()}
                className="text-xs font-semibold px-3 py-2 rounded-xl border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 disabled:opacity-50 transition-colors"
                style={{ fontFamily: "var(--font-dm)" }}>Asignar repartidor</button>
            </div>
          )}
          {rowError && <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-dm)" }}>{rowError}</p>}
          {(actionLabel || canCancel) && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {actionLabel && (
                <button type="button" onClick={actionLabel.fn} disabled={busy}
                  className="text-sm font-semibold px-4 py-2 rounded-xl text-white bg-[var(--color-suido-cat)] hover:bg-[var(--color-suido-accent)] disabled:opacity-50 transition-colors flex items-center gap-2"
                  style={{ fontFamily: "var(--font-dm)" }}>
                  {busy && <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                  {busy ? "Actualizando…" : actionLabel.label}
                </button>
              )}
              {canCancel && (
                <button type="button" onClick={() => run(() => cancelRestaurantOrder(order.id).then(() => null), true)} disabled={busy}
                  className="text-sm font-semibold px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                  style={{ fontFamily: "var(--font-dm)" }}>Cancelar pedido</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MC({ l, v, accent, dim }: { l: string; v: string; accent?: boolean; dim?: boolean }) {
  return (
    <div>
      <p className="text-[0.62rem] uppercase tracking-wide text-[var(--color-suido-3)]" style={{ fontFamily: "var(--font-dm)" }}>{l}</p>
      <p className={`text-sm font-semibold mt-0.5 ${accent ? "text-[var(--color-suido-accent)]" : dim ? "text-[var(--color-suido-3)]" : "text-white"}`} style={{ fontFamily: "var(--font-dm)" }}>{v}</p>
    </div>
  );
}
