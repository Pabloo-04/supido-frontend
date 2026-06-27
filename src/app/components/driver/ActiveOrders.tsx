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

interface Props {
  deliveryPersonId: number;
}

export default function ActiveOrders({ deliveryPersonId }: Props) {
  const [orders, setOrders]   = useState<DriverOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

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
        <h2
          className="text-xl font-extrabold text-white"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Mis pedidos activos
        </h2>
        <button
          type="button"
          onClick={load}
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
          No tenés pedidos activos en este momento.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {orders.map((order) => (
            <ActiveOrderCard
              key={order.id}
              order={order}
              deliveryPersonId={deliveryPersonId}
              onCashConfirmed={load}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ActiveOrderCard({
  order,
  deliveryPersonId,
  onCashConfirmed,
}: {
  order: DriverOrder;
  deliveryPersonId: number;
  onCashConfirmed: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const canConfirmCash =
    order.paymentMethod === "CASH" &&
    (order.status === "ON_THE_WAY" || order.status === "DELIVERED");

  async function handleConfirmCash() {
    setConfirming(true);
    setError(null);
    try {
      await confirmCashPayment(order.id, deliveryPersonId);
      onCashConfirmed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al confirmar el pago.");
      setConfirming(false);
    }
  }

  return (
    <div
      className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20
                 rounded-2xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3
          className="text-white font-bold text-base"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          {order.restaurantName}
        </h3>
        <div className="flex items-center gap-2">
          <span
            className={`text-[0.65rem] font-semibold uppercase tracking-wide border rounded-full px-2.5 py-0.5 ${STATUS_COLORS[order.status]}`}
            style={{ fontFamily: "var(--font-dm)" }}
          >
            {STATUS_LABEL[order.status]}
          </span>
          <span
            className="text-[0.7rem] tracking-wide uppercase
                       bg-[var(--color-suido-cat)]/20 text-[var(--color-suido-accent)]
                       border border-[var(--color-suido-cat)]/30 rounded-full px-3 py-0.5"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            #{order.id}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>
        <p><span className="text-[var(--color-suido-3)]">Retiro:</span> {order.pickupAddress}</p>
        <p><span className="text-[var(--color-suido-3)]">Entrega:</span> {order.deliveryAddress}</p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[var(--color-suido-3)]/15">
        <span className="text-white font-semibold" style={{ fontFamily: "var(--font-dm)" }}>
          ${order.total.toFixed(2)}
        </span>
        <span
          className={`text-xs font-medium ${order.paymentMethod === "CASH" ? "text-yellow-400" : "text-blue-400"}`}
          style={{ fontFamily: "var(--font-dm)" }}
        >
          {order.paymentMethod === "CASH" ? "💵 Efectivo" : "💳 Tarjeta"}
        </span>
      </div>

      {canConfirmCash && (
        <>
          {error && (
            <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-dm)" }}>{error}</p>
          )}
          <button
            type="button"
            onClick={handleConfirmCash}
            disabled={confirming}
            className="w-full py-2.5 rounded-xl text-sm font-semibold
                       bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400
                       border border-yellow-500/25
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200 flex items-center justify-center gap-2"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            {confirming ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
                Confirmando…
              </>
            ) : (
              "Confirmar cobro en efectivo"
            )}
          </button>
        </>
      )}
    </div>
  );
}
