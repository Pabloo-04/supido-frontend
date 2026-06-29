"use client";

import { useCallback, useEffect, useState } from "react";
import {
  acceptOrder,
  fetchOrderById,
  fetchDriverOrderStats,
  type OrderDetail,
  type DriverOrderStats,
} from "@/lib/driver-orders";
import { markNotificationRead, type Notification } from "@/lib/notifications";

interface Props {
  notification: Notification;
  onAccepted: () => void;
  onDismissed: () => void;
}

const COUNTDOWN = 30;

const ACCEPT_ERRORS: Record<string, string> = {
  "Order can only be accepted when it is CONFIRMED": "El pedido ya no está disponible.",
  "This order has already been claimed by another driver": "Pedido tomado por otro repartidor.",
  "You must be set as available to accept orders": "Tenés que estar disponible para aceptar.",
};

function friendlyAcceptError(msg: string): string {
  for (const [key, label] of Object.entries(ACCEPT_ERRORS)) {
    if (msg.includes(key)) return label;
  }
  return msg;
}

export default function NewOrderAlert({ notification, onAccepted, onDismissed }: Props) {
  const orderId = notification.orderId;

  const [order, setOrder]     = useState<OrderDetail | null>(null);
  const [stats, setStats]     = useState<DriverOrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [seconds, setSeconds] = useState(COUNTDOWN);

  /* ── dismiss helper ── */
  const dismiss = useCallback(() => {
    markNotificationRead(notification.id).catch(() => {});
    onDismissed();
  }, [notification.id, onDismissed]);

  /* ── countdown ── */
  useEffect(() => {
    if (seconds <= 0) { dismiss(); return; }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, dismiss]);

  /* ── load order details + stats ── */
  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    Promise.all([
      fetchOrderById(orderId),
      fetchDriverOrderStats(orderId).catch(() => null),
    ])
      .then(([ord, st]) => { setOrder(ord); setStats(st); })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar el pedido."))
      .finally(() => setLoading(false));
  }, [orderId]);

  /* ── accept ── */
  async function handleAccept() {
    if (!orderId) return;
    setAccepting(true);
    setError(null);
    try {
      await acceptOrder(orderId);
      markNotificationRead(notification.id).catch(() => {});
      onAccepted();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al aceptar.";
      setError(friendlyAcceptError(msg));
      setAccepting(false);
    }
  }

  const pct = (seconds / COUNTDOWN) * 100;
  const urgentColor = seconds <= 10 ? "text-red-400" : "text-[var(--color-suido-accent)]";

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col">

        {/* Timer bar */}
        <div className="h-1.5 bg-[var(--color-suido-2)]">
          <div
            className="h-full bg-[var(--color-suido-accent)] transition-[width] duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="p-6 flex flex-col gap-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-white" style={{ fontFamily: "var(--font-syne)" }}>
              🛵 ¡Nuevo pedido!
            </h2>
            <span className={`text-base font-bold tabular-nums ${urgentColor}`} style={{ fontFamily: "var(--font-dm)" }}>
              {seconds}s
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-7 h-7 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" />
            </div>
          ) : error && !order ? (
            <p className="text-sm text-red-400 text-center py-4" style={{ fontFamily: "var(--font-dm)" }}>{error}</p>
          ) : order ? (
            <div className="flex flex-col gap-3">

              {/* Order card */}
              <div className="bg-[var(--color-suido-2)] rounded-2xl p-4 flex flex-col gap-2">
                <p className="text-white font-bold" style={{ fontFamily: "var(--font-syne)" }}>
                  {order.restaurantName}
                </p>
                <div className="flex flex-col gap-1 text-sm" style={{ fontFamily: "var(--font-dm)" }}>
                  <p className="text-[var(--color-suido-4)]">
                    <span className="text-[var(--color-suido-3)]">Retiro </span>{order.pickupAddress}
                  </p>
                  <p className="text-[var(--color-suido-4)]">
                    <span className="text-[var(--color-suido-3)]">Entrega </span>{order.deliveryAddress}
                  </p>
                </div>

                {/* Items */}
                {order.items && order.items.length > 0 && (
                  <div className="pt-2 border-t border-[var(--color-suido-3)]/15 flex flex-col gap-1">
                    {order.items.map((item, i) => (
                      <p key={i} className="text-xs text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>
                        <span className="text-white font-semibold">{item.quantity}×</span> {item.menuItemName}
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[var(--color-suido-3)]/15">
                  <span className="text-[var(--color-suido-accent)] font-bold text-sm" style={{ fontFamily: "var(--font-syne)" }}>
                    ${order.total.toFixed(2)}
                  </span>
                  {order.paymentMethod && (
                    <span className={`text-xs font-medium ${order.paymentMethod === "CASH" ? "text-yellow-400" : "text-blue-400"}`} style={{ fontFamily: "var(--font-dm)" }}>
                      {order.paymentMethod === "CASH" ? "💵 Efectivo" : "💳 Tarjeta"}
                    </span>
                  )}
                </div>
              </div>

              {/* Stats chips */}
              {stats && (
                <div className="grid grid-cols-3 gap-2">
                  <StatChip label="Distancia"  value={`${stats.distanceKm.toFixed(1)} km`} />
                  <StatChip label="Tiempo"      value={`${Math.round(stats.durationSeconds / 60)} min`} />
                  <StatChip label="Ganancia"    value={`$${stats.shippingCost.toFixed(2)}`} accent />
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-suido-4)] text-center py-4" style={{ fontFamily: "var(--font-dm)" }}>
              {notification.message}
            </p>
          )}

          {/* Accept error */}
          {error && order && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2 text-center" style={{ fontFamily: "var(--font-dm)" }}>
              {error}
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={dismiss}
              disabled={accepting}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:text-white disabled:opacity-50 transition-colors"
              style={{ fontFamily: "var(--font-dm)" }}
            >
              Ignorar
            </button>
            <button
              type="button"
              onClick={handleAccept}
              disabled={accepting || !orderId || (!!error && !order)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              style={{ fontFamily: "var(--font-dm)" }}
            >
              {accepting
                ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />Aceptando…</>
                : "✓ Aceptar"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatChip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-[var(--color-suido-2)] rounded-xl px-3 py-2 text-center">
      <p className="text-[0.6rem] uppercase tracking-wide text-[var(--color-suido-3)]" style={{ fontFamily: "var(--font-dm)" }}>{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${accent ? "text-green-400" : "text-white"}`} style={{ fontFamily: "var(--font-syne)" }}>{value}</p>
    </div>
  );
}
