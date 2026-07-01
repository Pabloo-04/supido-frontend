"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getActiveOrders,
  fetchOrderById,
  confirmCashPayment,
  type DriverOrder,
  type DriverOrderStatus,
  type OrderDetail,
} from "@/lib/driver-orders";

const STATUS_LABEL: Record<DriverOrderStatus, string> = {
  PENDING:    "Pendiente",
  CONFIRMED:  "Confirmado",
  PREPARING:  "Preparando",
  ON_THE_WAY: "En camino",
  DELIVERED:  "Entregado",
  CANCELLED:  "Cancelado",
};

const STATUS_COLORS: Record<DriverOrderStatus, string> = {
  PENDING:    "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  CONFIRMED:  "bg-blue-500/15 text-blue-400 border-blue-500/25",
  PREPARING:  "bg-orange-500/15 text-orange-400 border-orange-500/25",
  ON_THE_WAY: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  DELIVERED:  "bg-green-500/15 text-green-400 border-green-500/25",
  CANCELLED:  "bg-red-500/15 text-red-400 border-red-500/25",
};

const STATUS_DOT: Record<DriverOrderStatus, string> = {
  PENDING:    "bg-yellow-400",
  CONFIRMED:  "bg-blue-400",
  PREPARING:  "bg-orange-400",
  ON_THE_WAY: "bg-purple-400",
  DELIVERED:  "bg-green-400",
  CANCELLED:  "bg-red-400",
};

interface Props { deliveryPersonId: number }

export default function ActiveOrders({ deliveryPersonId }: Props) {
  const [orders, setOrders]     = useState<DriverOrder[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setOrders(await getActiveOrders(deliveryPersonId)); }
    catch (err) { setError(err instanceof Error ? err.message : "Error al cargar los pedidos."); }
    finally { setLoading(false); }
  }, [deliveryPersonId]);

  useEffect(() => { load(); }, [load]);

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-extrabold text-white" style={{ fontFamily: "var(--font-syne)" }}>
          Mis pedidos activos
        </h2>
        <button type="button" onClick={load}
          className="text-xs font-medium text-[var(--color-suido-4)] hover:text-white px-3 py-1.5 rounded-full border border-[var(--color-suido-3)]/30 transition-colors"
          style={{ fontFamily: "var(--font-dm)" }}>
          Actualizar
        </button>
      </div>

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
          No tenés pedidos activos en este momento.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              deliveryPersonId={deliveryPersonId}
              expanded={expanded === order.id}
              onToggle={() => setExpanded((p) => (p === order.id ? null : order.id))}
              onCashConfirmed={load}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function OrderRow({
  order, deliveryPersonId, expanded, onToggle, onCashConfirmed,
}: {
  order: DriverOrder;
  deliveryPersonId: number;
  expanded: boolean;
  onToggle: () => void;
  onCashConfirmed: () => void;
}) {
  const [detail, setDetail]     = useState<OrderDetail | null>(null);
  const [loadingD, setLoadingD] = useState(false);
  const [confirming, setConfirm] = useState(false);
  const [cashError, setCashErr] = useState<string | null>(null);

  // Lazy-load full order detail on expand
  useEffect(() => {
    if (!expanded || detail) return;
    setLoadingD(true);
    fetchOrderById(order.id).then(setDetail).catch(() => {}).finally(() => setLoadingD(false));
  }, [expanded, order.id, detail]);

  const canConfirmCash =
    order.paymentMethod === "CASH" &&
    (order.status === "ON_THE_WAY" || order.status === "DELIVERED");

  async function handleConfirmCash() {
    setConfirm(true); setCashErr(null);
    try { await confirmCashPayment(order.id, deliveryPersonId); onCashConfirmed(); }
    catch (err) { setCashErr(err instanceof Error ? err.message : "Error."); setConfirm(false); }
  }

  return (
    <div className={`bg-[var(--color-suido-1)] border rounded-2xl overflow-hidden transition-colors ${expanded ? "border-[var(--color-suido-accent)]/30" : "border-[var(--color-suido-3)]/20"}`}>

      {/* Compact header — always visible */}
      <button type="button" onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[var(--color-suido-2)]/40 transition-colors text-left">
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[order.status]}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-syne)" }}>
              {order.restaurantName}
            </span>
            <span className="text-[0.6rem] text-[var(--color-suido-3)]" style={{ fontFamily: "var(--font-dm)" }}>
              #{order.id}
            </span>
          </div>
          <p className="text-xs text-[var(--color-suido-4)] mt-0.5 truncate" style={{ fontFamily: "var(--font-dm)" }}>
            {order.deliveryAddress}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`text-[0.62rem] font-semibold uppercase tracking-wide border rounded-full px-2.5 py-0.5 hidden sm:inline ${STATUS_COLORS[order.status]}`} style={{ fontFamily: "var(--font-dm)" }}>
            {STATUS_LABEL[order.status]}
          </span>
          <span className="text-[var(--color-suido-accent)] font-bold text-sm" style={{ fontFamily: "var(--font-syne)" }}>
            ${order.total.toFixed(2)}
          </span>
          <span className={`text-[var(--color-suido-3)] text-sm transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>▾</span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[var(--color-suido-3)]/15 px-5 pb-5 pt-4 flex flex-col gap-4">

          {/* Addresses */}
          <div className="flex flex-col gap-1.5 text-sm" style={{ fontFamily: "var(--font-dm)" }}>
            <p className="text-[var(--color-suido-4)]">
              <span className="text-[var(--color-suido-3)]">Retiro: </span>
              <span className="text-white font-medium">{order.restaurantName}</span>
              {order.pickupAddress ? ` · ${order.pickupAddress}` : ""}
            </p>
            <p className="text-[var(--color-suido-4)]">
              <span className="text-[var(--color-suido-3)]">Entrega: </span>{order.deliveryAddress}
            </p>
          </div>

          {/* Cost breakdown */}
          {loadingD ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" />
              <span className="text-xs text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>Cargando detalles…</span>
            </div>
          ) : detail ? (
            <div className="bg-[var(--color-suido-2)] rounded-2xl p-4 flex flex-col gap-3">
              {/* Items with unit price */}
              {detail.items && detail.items.length > 0 && (
                <div className="flex flex-col gap-2">
                  {detail.items.map((item, i) => (
                    <div key={i} className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm" style={{ fontFamily: "var(--font-dm)" }}>
                          <span className="text-[var(--color-suido-accent)] font-bold">{item.quantity}×</span> {item.menuItemName}
                        </p>
                        <p className="text-[0.7rem] text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>
                          ${item.unitPrice.toFixed(2)} c/u
                        </p>
                        {item.notes && (
                          <p className="text-[0.7rem] text-[var(--color-suido-3)] italic" style={{ fontFamily: "var(--font-dm)" }}>{item.notes}</p>
                        )}
                      </div>
                      <span className="text-white text-sm whitespace-nowrap" style={{ fontFamily: "var(--font-dm)" }}>
                        ${item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Cost summary */}
              <div className="flex flex-col gap-1.5 pt-3 border-t border-[var(--color-suido-3)]/20">
                {detail.subtotal != null && (
                  <CostRow label="Subtotal" value={`$${detail.subtotal.toFixed(2)}`} />
                )}
                {detail.shippingCost != null && (
                  <CostRow label="Costo de envío" value={`$${detail.shippingCost.toFixed(2)}`} />
                )}
                {detail.tip != null && detail.tip > 0 && (
                  <CostRow label="Propina" value={`$${detail.tip.toFixed(2)}`} />
                )}
                {detail.discount != null && detail.discount > 0 && (
                  <CostRow label="Descuento" value={`−$${detail.discount.toFixed(2)}`} green />
                )}
                <div className="flex justify-between pt-2 border-t border-[var(--color-suido-3)]/20 mt-1">
                  <span className="text-white font-extrabold text-sm" style={{ fontFamily: "var(--font-syne)" }}>Total</span>
                  <span className="text-[var(--color-suido-accent)] font-extrabold text-sm" style={{ fontFamily: "var(--font-syne)" }}>
                    ${(detail.total ?? order.total).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Payment + date */}
          <div className="flex items-center justify-between text-xs" style={{ fontFamily: "var(--font-dm)" }}>
            <span className={`font-medium ${order.paymentMethod === "CASH" ? "text-yellow-400" : "text-blue-400"}`}>
              {order.paymentMethod === "CASH" ? "💵 Efectivo" : "💳 Tarjeta"}
            </span>
            <span className="text-[var(--color-suido-3)]">
              {new Date(order.createdAt).toLocaleString("es-AR")}
            </span>
          </div>

          {/* Cash confirmation */}
          {canConfirmCash && (
            <>
              {cashError && <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-dm)" }}>{cashError}</p>}
              <button type="button" onClick={handleConfirmCash} disabled={confirming}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400 border border-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                style={{ fontFamily: "var(--font-dm)" }}>
                {confirming
                  ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />Confirmando…</>
                  : "Confirmar cobro en efectivo"
                }
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CostRow({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>{label}</span>
      <span className={`text-xs font-semibold ${green ? "text-green-400" : "text-white"}`} style={{ fontFamily: "var(--font-dm)" }}>{value}</span>
    </div>
  );
}
