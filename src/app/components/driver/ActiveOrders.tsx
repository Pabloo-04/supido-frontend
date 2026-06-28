"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getActiveOrders,
  confirmCashPayment,
  type DriverOrder,
  type DriverOrderStatus,
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

// Steps shown in the detail stepper (after driver accepts)
const STEPS: DriverOrderStatus[] = ["CONFIRMED", "PREPARING", "ON_THE_WAY", "DELIVERED"];

const ACTIVE = new Set<DriverOrderStatus>(["CONFIRMED", "PREPARING", "ON_THE_WAY"]);

interface Props { deliveryPersonId: number }

export default function ActiveOrders({ deliveryPersonId }: Props) {
  const [orders, setOrders]   = useState<DriverOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await getActiveOrders(deliveryPersonId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar los pedidos.");
    } finally {
      setLoading(false);
    }
  }, [deliveryPersonId]);

  useEffect(() => { load(); }, [load]);

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-extrabold text-white" style={{ fontFamily: "var(--font-syne)" }}>
          Mis pedidos activos
        </h2>
        <button
          type="button"
          onClick={load}
          className="text-xs font-medium text-[var(--color-suido-4)] hover:text-white px-3 py-1.5 rounded-full border border-[var(--color-suido-3)]/30 transition-colors duration-200"
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

/* ─── Row with inline expand ─── */

function OrderRow({
  order,
  deliveryPersonId,
  expanded,
  onToggle,
  onCashConfirmed,
}: {
  order: DriverOrder;
  deliveryPersonId: number;
  expanded: boolean;
  onToggle: () => void;
  onCashConfirmed: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [rowError, setRowError]     = useState<string | null>(null);

  const isActive = ACTIVE.has(order.status);
  const stepIdx  = STEPS.indexOf(order.status);

  const canConfirmCash =
    order.paymentMethod === "CASH" &&
    (order.status === "ON_THE_WAY" || order.status === "DELIVERED");

  async function handleConfirmCash() {
    setConfirming(true);
    setRowError(null);
    try {
      await confirmCashPayment(order.id, deliveryPersonId);
      onCashConfirmed();
    } catch (err) {
      setRowError(err instanceof Error ? err.message : "Error al confirmar el pago.");
      setConfirming(false);
    }
  }

  return (
    <div className={`rounded-2xl overflow-hidden border transition-colors duration-150 ${expanded ? "border-[var(--color-suido-accent)]/30 bg-[var(--color-suido-1)]" : "border-[var(--color-suido-3)]/20 bg-[var(--color-suido-1)]"}`}>

      {/* Compact row — always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[var(--color-suido-2)]/40 transition-colors duration-150 text-left"
      >
        {/* Status dot */}
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
        <div className="px-5 pb-5 border-t border-[var(--color-suido-3)]/15 flex flex-col gap-4 pt-4">

          {/* Status stepper (for active orders) */}
          {isActive && (
            <div className="flex items-center">
              {STEPS.map((step, i) => {
                const done    = i <= stepIdx;
                const current = i === stepIdx;
                return (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 transition-colors
                        ${done
                          ? "bg-[var(--color-suido-accent)] border-[var(--color-suido-accent)]"
                          : "bg-transparent border-[var(--color-suido-3)]/40"
                        }
                        ${current ? "ring-2 ring-offset-1 ring-offset-[var(--color-suido-1)] ring-[var(--color-suido-accent)]/40" : ""}`}
                      />
                      <span className={`text-[0.55rem] mt-1 text-center leading-tight max-w-[48px] ${done ? "text-[var(--color-suido-accent)]" : "text-[var(--color-suido-3)]"}`} style={{ fontFamily: "var(--font-dm)" }}>
                        {STATUS_LABEL[step]}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < stepIdx ? "bg-[var(--color-suido-accent)]" : "bg-[var(--color-suido-3)]/20"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Addresses + meta */}
          <div className="flex flex-col gap-2 text-sm" style={{ fontFamily: "var(--font-dm)" }}>
            <div className="flex items-start gap-2">
              <span className="text-[var(--color-suido-3)] flex-shrink-0 w-14">Retiro</span>
              <span className="text-[var(--color-suido-4)]">{order.pickupAddress}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[var(--color-suido-3)] flex-shrink-0 w-14">Entrega</span>
              <span className="text-[var(--color-suido-4)]">{order.deliveryAddress}</span>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-suido-3)]/15">
              <span className={`text-[0.65rem] font-semibold uppercase tracking-wide border rounded-full px-2.5 py-0.5 sm:hidden ${STATUS_COLORS[order.status]}`}>
                {STATUS_LABEL[order.status]}
              </span>
              <span className={`text-xs font-medium ml-auto ${order.paymentMethod === "CASH" ? "text-yellow-400" : "text-blue-400"}`}>
                {order.paymentMethod === "CASH" ? "💵 Efectivo" : "💳 Tarjeta"}
              </span>
              <span className="text-xs text-[var(--color-suido-3)]">
                {new Date(order.createdAt).toLocaleString("es-AR")}
              </span>
            </div>
          </div>

          {/* Cash confirmation */}
          {canConfirmCash && (
            <>
              {rowError && <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-dm)" }}>{rowError}</p>}
              <button
                type="button"
                onClick={handleConfirmCash}
                disabled={confirming}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400 border border-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
                style={{ fontFamily: "var(--font-dm)" }}
              >
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
