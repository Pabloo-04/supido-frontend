"use client";

import { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CatFaceSVG from "../../components/landing/CatFaceSVG";
import {
  getOrderReceipt,
  getDeliveryStats,
  cancelOrder,
  type OrderReceipt,
  type DeliveryStats,
  type OrderStatus,
} from "@/lib/user-orders";
import { getToken } from "@/lib/auth";

const ACTIVE_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "ON_THE_WAY"];
const STATUS_STEPS: OrderStatus[]    = ["PENDING", "CONFIRMED", "PREPARING", "ON_THE_WAY", "DELIVERED"];

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING:    "Pendiente",
  CONFIRMED:  "Confirmado",
  PREPARING:  "Preparando",
  ON_THE_WAY: "En camino",
  DELIVERED:  "Entregado",
  CANCELLED:  "Cancelado",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING:    "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  CONFIRMED:  "bg-blue-500/15 text-blue-400 border-blue-500/25",
  PREPARING:  "bg-orange-500/15 text-orange-400 border-orange-500/25",
  ON_THE_WAY: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  DELIVERED:  "bg-green-500/15 text-green-400 border-green-500/25",
  CANCELLED:  "bg-red-500/15 text-red-400 border-red-500/25",
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const orderId = Number(id);
  const router  = useRouter();

  const [receipt, setReceipt]           = useState<OrderReceipt | null>(null);
  const [stats, setStats]               = useState<DeliveryStats | null>(null);
  const [loading, setLoading]           = useState(true);
  const [cancelling, setCancelling]     = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const loadReceipt = useCallback(async () => {
    try {
      const data = await getOrderReceipt(orderId);
      setReceipt(data);
      if (data.status === "ON_THE_WAY" || data.status === "DELIVERED") {
        const s = await getDeliveryStats(orderId).catch(() => null);
        setStats(s);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el pedido.");
    }
  }, [orderId]);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    loadReceipt().finally(() => setLoading(false));
  }, [loadReceipt, router]);

  // Poll while order is still active
  useEffect(() => {
    if (!receipt || !ACTIVE_STATUSES.includes(receipt.status)) return;
    const interval = setInterval(() => {
      loadReceipt().catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [receipt?.status, loadReceipt]);

  async function handleCancel() {
    setCancelling(true);
    setError(null);
    try {
      await cancelOrder(orderId);
      await loadReceipt();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar el pedido.");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--color-suido-0)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" />
      </main>
    );
  }

  if (!receipt) {
    return (
      <main className="min-h-screen bg-[var(--color-suido-0)] flex flex-col items-center justify-center gap-4">
        <p className="text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>
          {error ?? "Pedido no encontrado."}
        </p>
        <Link href="/orders" className="text-[var(--color-suido-accent)] hover:underline text-sm" style={{ fontFamily: "var(--font-dm)" }}>
          ← Mis pedidos
        </Link>
      </main>
    );
  }

  const stepIdx = STATUS_STEPS.indexOf(receipt.status);

  return (
    <main className="min-h-screen bg-[var(--color-suido-0)]">
      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between
                   px-6 md:px-12 py-4
                   bg-[var(--color-suido-0)]/90 backdrop-blur-xl
                   border-b border-[var(--color-suido-3)]/15"
      >
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-suido-1)] rounded-xl border border-[var(--color-suido-3)]/30 flex items-center justify-center overflow-hidden flex-shrink-0">
            <CatFaceSVG className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[1.2rem] font-extrabold tracking-tight text-white leading-none" style={{ fontFamily: "var(--font-syne)" }}>
              Supi<span className="text-[var(--color-suido-accent)]">|</span>do
            </div>
            <div className="text-[0.55rem] tracking-[0.2em] uppercase text-[var(--color-suido-4)] mt-1" style={{ fontFamily: "var(--font-dm)" }}>
              Delivery Veloz
            </div>
          </div>
        </Link>
        <Link href="/orders" className="text-sm font-medium text-[var(--color-suido-4)] hover:text-white transition-colors" style={{ fontFamily: "var(--font-dm)" }}>
          ← Mis pedidos
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 pt-24 pb-16 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-white" style={{ fontFamily: "var(--font-syne)" }}>
              Pedido #{receipt.orderId}
            </h1>
            <p className="text-sm text-[var(--color-suido-4)] mt-0.5" style={{ fontFamily: "var(--font-dm)" }}>
              {receipt.restaurantName} · {new Date(receipt.createdAt).toLocaleString("es-AR")}
            </p>
          </div>
          <span
            className={`text-xs font-semibold uppercase tracking-wide border rounded-full px-3 py-1.5 ${STATUS_COLORS[receipt.status]}`}
            style={{ fontFamily: "var(--font-dm)" }}
          >
            {STATUS_LABEL[receipt.status]}
          </span>
        </div>

        {/* Status timeline */}
        <div className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20 rounded-2xl p-6">
          {receipt.status === "CANCELLED" ? (
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-red-400 flex-shrink-0" />
              <p className="text-red-400 font-semibold text-sm" style={{ fontFamily: "var(--font-dm)" }}>
                Este pedido fue cancelado.
              </p>
            </div>
          ) : (
            <div className="flex items-center">
              {STATUS_STEPS.map((step, i) => {
                const done    = i <= stepIdx;
                const current = i === stepIdx;
                return (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-colors
                          ${done
                            ? "bg-[var(--color-suido-accent)] border-[var(--color-suido-accent)]"
                            : "bg-transparent border-[var(--color-suido-3)]/50"
                          }
                          ${current ? "ring-2 ring-offset-1 ring-offset-[var(--color-suido-1)] ring-[var(--color-suido-accent)]/40" : ""}`}
                      />
                      <span
                        className={`text-[0.58rem] mt-1.5 text-center leading-tight max-w-[54px] ${done ? "text-[var(--color-suido-accent)]" : "text-[var(--color-suido-3)]"}`}
                        style={{ fontFamily: "var(--font-dm)" }}
                      >
                        {STATUS_LABEL[step]}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-1 mb-4 transition-colors ${i < stepIdx ? "bg-[var(--color-suido-accent)]" : "bg-[var(--color-suido-3)]/20"}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {ACTIVE_STATUSES.includes(receipt.status) && (
            <p className="text-xs text-[var(--color-suido-3)] mt-4 text-center animate-pulse" style={{ fontFamily: "var(--font-dm)" }}>
              Actualizando estado automáticamente…
            </p>
          )}
        </div>

        {/* Delivery stats */}
        {stats && (
          <div className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20 rounded-2xl p-6">
            <h2 className="text-sm font-extrabold text-white mb-4 uppercase tracking-wide" style={{ fontFamily: "var(--font-syne)" }}>
              Repartidor
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {stats.driverName && <StatCard label="Repartidor" value={stats.driverName} />}
              {stats.estimatedMinutes != null && (
                <StatCard label="Tiempo estimado" value={`${stats.estimatedMinutes} min`} />
              )}
              {stats.distanceKm != null && (
                <StatCard label="Distancia" value={`${stats.distanceKm.toFixed(1)} km`} />
              )}
            </div>
          </div>
        )}

        {/* Receipt */}
        <div className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20 rounded-2xl p-6">
          <h2 className="text-sm font-extrabold text-white mb-4 uppercase tracking-wide" style={{ fontFamily: "var(--font-syne)" }}>
            Detalle del pedido
          </h2>

          <div className="flex flex-col gap-2 mb-4">
            {receipt.items.map((item, i) => (
              <div key={i} className="flex justify-between gap-3">
                <span className="text-sm text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>
                  <span className="text-white font-semibold">{item.quantity}×</span> {item.name}
                </span>
                <span className="text-sm text-white whitespace-nowrap" style={{ fontFamily: "var(--font-dm)" }}>
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 pt-4 border-t border-[var(--color-suido-3)]/15">
            <ReceiptRow label="Subtotal"       value={`$${receipt.subtotal.toFixed(2)}`} />
            {receipt.tip     > 0 && <ReceiptRow label="Propina"     value={`$${receipt.tip.toFixed(2)}`} />}
            {receipt.discount > 0 && <ReceiptRow label="Descuento"  value={`−$${receipt.discount.toFixed(2)}`} accent />}
            <div className="flex justify-between pt-2 border-t border-[var(--color-suido-3)]/15 mt-1">
              <span className="text-white font-extrabold" style={{ fontFamily: "var(--font-syne)" }}>Total</span>
              <span className="text-[var(--color-suido-accent)] font-extrabold" style={{ fontFamily: "var(--font-syne)" }}>
                ${receipt.total.toFixed(2)}
              </span>
            </div>
            <ReceiptRow
              label="Pago"
              value={receipt.paymentMethod === "CASH" ? "💵 Efectivo" : "💳 Tarjeta"}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <p
            className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            {error}
          </p>
        )}

        {/* Cancel */}
        {receipt.status === "PENDING" && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full py-3 rounded-xl text-sm font-semibold
                       border border-red-500/30 text-red-400 hover:bg-red-500/10
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200 flex items-center justify-center gap-2"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            {cancelling ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                Cancelando…
              </>
            ) : (
              "Cancelar pedido"
            )}
          </button>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--color-suido-2)] rounded-xl px-4 py-3">
      <p className="text-[0.65rem] text-[var(--color-suido-4)] uppercase tracking-wide" style={{ fontFamily: "var(--font-dm)" }}>{label}</p>
      <p className="text-white font-semibold text-sm mt-0.5" style={{ fontFamily: "var(--font-syne)" }}>{value}</p>
    </div>
  );
}

function ReceiptRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>{label}</span>
      <span className={`text-sm ${accent ? "text-green-400" : "text-white"}`} style={{ fontFamily: "var(--font-dm)" }}>{value}</span>
    </div>
  );
}
