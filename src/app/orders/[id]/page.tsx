"use client";

import { useCallback, useEffect, useRef, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import CatFaceSVG from "../../components/landing/CatFaceSVG";
import {
  getOrderReceipt,
  getDeliveryStats,
  getOrderTracking,
  cancelOrder,
  getRatingsForOrder,
  submitRating,
  type OrderReceipt,
  type DeliveryStats,
  type OrderStatus,
  type OrderRating,
} from "@/lib/user-orders";
import { getToken, getUserId } from "@/lib/auth";
import { useOrderTracking } from "@/hooks/useOrderTracking";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

const ACTIVE_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "ON_THE_WAY"];

const STATUS_STEPS: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "ON_THE_WAY", "DELIVERED"];

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

interface Toast { id: string; message: string; kind: "info" | "success" | "warning" }

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const orderId = Number(id);
  const router  = useRouter();

  const [receipt, setReceipt]           = useState<OrderReceipt | null>(null);
  const [status, setStatus]             = useState<OrderStatus | null>(null);
  const [stats, setStats]               = useState<DeliveryStats | null>(null);
  const [driverInitPos, setDriverInitPos] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [cancelling, setCancelling]     = useState(false);

  const [toasts, setToasts]             = useState<Toast[]>([]);
  const [showCancelled, setShowCancelled] = useState(false);
  const [showNearby, setShowNearby]     = useState(false);
  const [showRating, setShowRating]     = useState(false);
  const [trackingActive, setTracking]   = useState(false);

  const statsPollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live driver position from WebSocket
  const wsPosition = useOrderTracking(orderId, trackingActive);
  const driverPosition = wsPosition ?? driverInitPos;

  /* ── helpers ── */

  function addToast(message: string, kind: Toast["kind"] = "info") {
    const toast: Toast = { id: Math.random().toString(36).slice(2), message, kind };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), 4000);
  }

  const loadStats = useCallback(async () => {
    try {
      const data = await getOrderReceipt(orderId);
      setReceipt(data);
      if (["CONFIRMED", "PREPARING", "ON_THE_WAY", "DELIVERED"].includes(data.status)) {
        const s = await getDeliveryStats(orderId).catch(() => null);
        setStats(s);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el pedido.");
    }
  }, [orderId]);

  // Load receipt once on mount — status updates come from notifications / WS
  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }

  // Driver position — REST initial fetch + WebSocket live updates
  // Active for any status where a driver is or could be moving
  const TRACKING_STATUSES: OrderStatus[] = ["CONFIRMED", "PREPARING", "ON_THE_WAY"];
  const trackingEnabled = receipt?.status != null && TRACKING_STATUSES.includes(receipt.status);
  const driverPosition  = useOrderTracking(orderId, trackingEnabled);

  async function handleCancel() {
    setCancelling(true);
    setError(null);
    try {
      await cancelOrder(orderId);
      setStatus("CANCELLED");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar el pedido.");
    } finally {
      setCancelling(false);
    }
  }

  /* ── render ── */

  const currentStatus = status ?? receipt?.status ?? "PENDING";
  const stepIdx = STATUS_STEPS.indexOf(currentStatus);

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

  return (
    <main className="min-h-screen bg-[var(--color-suido-0)]">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-[var(--color-suido-0)]/90 backdrop-blur-xl border-b border-[var(--color-suido-3)]/15">
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

      {/* Toasts */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-5 py-3 rounded-2xl text-sm font-medium shadow-xl backdrop-blur-xl
              ${t.kind === "success" ? "bg-green-500/90 text-white"
                : t.kind === "warning" ? "bg-yellow-500/90 text-black"
                : "bg-[var(--color-suido-1)]/95 border border-[var(--color-suido-3)]/30 text-white"
              }`}
            style={{ fontFamily: "var(--font-dm)", animation: "var(--animate-fade-slide)" }}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* DELIVERY_NEARBY alert */}
      {showNearby && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[90] w-full max-w-sm px-4">
          <div className="bg-[var(--color-suido-accent)]/95 backdrop-blur-xl rounded-2xl px-5 py-4 text-center shadow-2xl">
            <p className="text-white font-extrabold text-base" style={{ fontFamily: "var(--font-syne)" }}>
              🛵 ¡Tu pedido está a punto de llegar!
            </p>
            <button
              type="button"
              onClick={() => setShowNearby(false)}
              className="mt-2 text-white/80 text-xs hover:text-white"
              style={{ fontFamily: "var(--font-dm)" }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ORDER_CANCELLED modal */}
      {showCancelled && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="bg-[var(--color-suido-1)] border border-red-500/30 rounded-2xl p-8 max-w-sm w-full text-center">
            <p className="text-2xl mb-2">❌</p>
            <h2 className="text-white font-extrabold text-xl mb-2" style={{ fontFamily: "var(--font-syne)" }}>
              Pedido cancelado
            </h2>
            <p className="text-sm text-[var(--color-suido-4)] mb-6" style={{ fontFamily: "var(--font-dm)" }}>
              Tu pedido fue cancelado. Podés volver a explorar restaurantes.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => { setShowCancelled(false); router.push("/orders"); }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--color-suido-cat)] hover:bg-[var(--color-suido-accent)] transition-colors"
                style={{ fontFamily: "var(--font-dm)" }}
              >
                Ver mis pedidos
              </button>
              <button
                type="button"
                onClick={() => { setShowCancelled(false); router.push("/restaurants"); }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:text-white transition-colors"
                style={{ fontFamily: "var(--font-dm)" }}
              >
                Explorar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RATE_YOUR_ORDER modal */}
      {showRating && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20 rounded-2xl p-8 max-w-sm w-full text-center">
            <p className="text-3xl mb-2">⭐</p>
            <h2 className="text-white font-extrabold text-xl mb-1" style={{ fontFamily: "var(--font-syne)" }}>
              ¿Cómo estuvo tu pedido?
            </h2>
            <p className="text-sm text-[var(--color-suido-4)] mb-6" style={{ fontFamily: "var(--font-dm)" }}>
              Las valoraciones estarán disponibles próximamente.
            </p>
            <button
              type="button"
              onClick={() => setShowRating(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--color-suido-cat)] hover:bg-[var(--color-suido-accent)] transition-colors"
              style={{ fontFamily: "var(--font-dm)" }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

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
          <span className={`text-xs font-semibold uppercase tracking-wide border rounded-full px-3 py-1.5 ${STATUS_COLORS[currentStatus]}`} style={{ fontFamily: "var(--font-dm)" }}>
            {STATUS_LABEL[currentStatus]}
          </span>
        </div>

        {/* Status timeline */}
        <div className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20 rounded-2xl p-6">
          {currentStatus === "CANCELLED" ? (
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
                      <div className={`flex-1 h-0.5 mx-1 mb-4 transition-colors ${i < stepIdx ? "bg-[var(--color-suido-accent)]" : "bg-[var(--color-suido-3)]/20"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {ACTIVE_STATUSES.includes(currentStatus) && (
            <p className="text-xs text-[var(--color-suido-3)] mt-4 text-center animate-pulse" style={{ fontFamily: "var(--font-dm)" }}>
              Actualizando por notificaciones…
            </p>
          )}
        </div>

        {/* Live driver map — only while ON_THE_WAY and position available */}
        {driverPosition && (
          <div className="rounded-2xl overflow-hidden border border-[var(--color-suido-3)]/20" style={{ height: "240px" }}>
            <APIProvider apiKey={MAPS_KEY}>
              <Map
                defaultCenter={driverPosition}
                center={driverPosition}
                defaultZoom={15}
                mapId="supido-order-tracking"
                gestureHandling="greedy"
                style={{ width: "100%", height: "100%" }}
              >
                <AdvancedMarker position={driverPosition} title="Repartidor en camino">
                  <BikePin />
                </AdvancedMarker>
              </Map>
            </APIProvider>
          </div>
        )}

        {/* Delivery stats */}
        {stats && (
          <div className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20 rounded-2xl p-6">
            <h2 className="text-sm font-extrabold text-white mb-4 uppercase tracking-wide" style={{ fontFamily: "var(--font-syne)" }}>
              Info de entrega
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {stats.distanceKm != null && (
                <StatCard label="Distancia" value={`${stats.distanceKm.toFixed(1)} km`} />
              )}
              {stats.estimatedMinutes != null && (
                <StatCard label="Tiempo est." value={`${stats.estimatedMinutes} min`} />
              )}
              {stats.driverName && <StatCard label="Repartidor" value={stats.driverName} />}
            </div>
          </div>
        )}

        {/* Receipt */}
        <div className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20 rounded-2xl p-6">
          <h2 className="text-sm font-extrabold text-white mb-4 uppercase tracking-wide" style={{ fontFamily: "var(--font-syne)" }}>
            Detalle del pedido
          </h2>

          <div className="flex flex-col gap-2.5 mb-4">
            {(receipt.items ?? []).map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>
                    <span className="text-white font-semibold">{item.quantity}×</span>{" "}
                    {item.menuItemName ?? item.name}
                  </p>
                  <p className="text-[0.7rem] text-[var(--color-suido-3)] mt-0.5" style={{ fontFamily: "var(--font-dm)" }}>
                    ${item.unitPrice.toFixed(2)} c/u
                  </p>
                  {item.notes && (
                    <p className="text-[0.7rem] text-[var(--color-suido-3)] italic mt-0.5" style={{ fontFamily: "var(--font-dm)" }}>{item.notes}</p>
                  )}
                </div>
                <span className="text-sm text-white whitespace-nowrap" style={{ fontFamily: "var(--font-dm)" }}>
                  ${(item.subtotal ?? item.unitPrice * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1.5 pt-4 border-t border-[var(--color-suido-3)]/15">
            {receipt.subtotal  != null && <ReceiptRow label="Subtotal"  value={`$${receipt.subtotal.toFixed(2)}`} />}
            {receipt.tip       != null && receipt.tip > 0 && <ReceiptRow label="Propina"   value={`$${receipt.tip.toFixed(2)}`} />}
            {receipt.discount  != null && receipt.discount > 0 && <ReceiptRow label="Descuento" value={`−$${receipt.discount.toFixed(2)}`} accent />}
            {receipt.total != null && (
              <div className="flex justify-between pt-2 border-t border-[var(--color-suido-3)]/15 mt-1">
                <span className="text-white font-extrabold" style={{ fontFamily: "var(--font-syne)" }}>Total</span>
                <span className="text-[var(--color-suido-accent)] font-extrabold" style={{ fontFamily: "var(--font-syne)" }}>
                  ${receipt.total.toFixed(2)}
                </span>
              </div>
            )}
            <ReceiptRow
              label="Pago"
              value={receipt.paymentMethod === "CASH" ? "💵 Efectivo" : "💳 Tarjeta"}
            />
          </div>
        </div>

        {/* Delivered CTA */}
        {currentStatus === "DELIVERED" && (
          <div className="bg-green-500/10 border border-green-500/25 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-green-400 font-bold text-sm" style={{ fontFamily: "var(--font-syne)" }}>
                ¡Pedido entregado!
              </p>
              <p className="text-xs text-[var(--color-suido-4)] mt-0.5" style={{ fontFamily: "var(--font-dm)" }}>
                Gracias por usar Supido.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowRating(true)}
                className="text-sm font-semibold px-4 py-2 rounded-xl bg-[var(--color-suido-cat)] hover:bg-[var(--color-suido-accent)] text-white transition-colors"
                style={{ fontFamily: "var(--font-dm)" }}
              >
                Valorar
              </button>
              <Link
                href="/restaurants"
                className="text-sm font-semibold px-4 py-2 rounded-xl border border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:text-white transition-colors"
                style={{ fontFamily: "var(--font-dm)" }}
              >
                Seguir pidiendo
              </Link>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5" style={{ fontFamily: "var(--font-dm)" }}>
            {error}
          </p>
        )}

        {/* Rating — only for delivered orders */}
        {receipt.status === "DELIVERED" && (
          <RatingSection
            orderId={orderId}
            deliveryPersonId={receipt.deliveryPersonId ?? null}
          />
        )}

        {/* Cancel */}
        {currentStatus === "PENDING" && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full py-3 rounded-xl text-sm font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            {cancelling ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                Cancelando…
              </>
            ) : "Cancelar pedido"}
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

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-2xl leading-none transition-transform hover:scale-110 focus:outline-none"
          aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
        >
          <span style={{ color: star <= (hovered || value) ? "#facc15" : "#3f3f5a" }}>★</span>
        </button>
      ))}
    </div>
  );
}

function RatingSection({
  orderId,
  deliveryPersonId,
}: {
  orderId: number;
  deliveryPersonId: number | null;
}) {
  const [existing, setExisting]         = useState<OrderRating[] | null>(null);
  const [restaurantScore, setRest]      = useState(0);
  const [driverScore, setDriver]        = useState(0);
  const [submitting, setSubmitting]     = useState(false);
  const [done, setDone]                 = useState(false);
  const [err, setErr]                   = useState<string | null>(null);

  useEffect(() => {
    getRatingsForOrder(orderId).then(setExisting).catch(() => setExisting([]));
  }, [orderId]);

  if (existing === null) return null; // still loading

  const ratedTypes       = new Set(existing.map((r) => r.type));
  const needsRestaurant  = !ratedTypes.has("RESTAURANT");
  const needsDriver      = deliveryPersonId !== null && !ratedTypes.has("DELIVERY_PERSON");

  if ((!needsRestaurant && !needsDriver) || done) return null;

  async function handleSubmit() {
    const userId = getUserId();
    if (!userId) return;
    if (needsRestaurant && restaurantScore === 0) { setErr("Calificá el restaurante antes de enviar."); return; }
    if (needsDriver     && driverScore    === 0) { setErr("Calificá al repartidor antes de enviar."); return; }
    setErr(null);
    setSubmitting(true);
    try {
      if (needsRestaurant) await submitRating({ orderId, ratedById: userId, type: "RESTAURANT",     score: restaurantScore });
      if (needsDriver)     await submitRating({ orderId, ratedById: userId, type: "DELIVERY_PERSON", score: driverScore });
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al enviar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20 rounded-2xl p-6 flex flex-col gap-5">
      <h2 className="text-sm font-extrabold text-white uppercase tracking-wide" style={{ fontFamily: "var(--font-syne)" }}>
        Calificá tu pedido
      </h2>

      {needsRestaurant && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-[var(--color-suido-4)] uppercase tracking-wide" style={{ fontFamily: "var(--font-dm)" }}>Restaurante</p>
          <StarPicker value={restaurantScore} onChange={setRest} />
        </div>
      )}

      {needsDriver && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-[var(--color-suido-4)] uppercase tracking-wide" style={{ fontFamily: "var(--font-dm)" }}>Repartidor</p>
          <StarPicker value={driverScore} onChange={setDriver} />
        </div>
      )}

      {err && <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-dm)" }}>{err}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3 rounded-xl text-sm font-semibold bg-[var(--color-suido-accent)]/15 hover:bg-[var(--color-suido-accent)]/25 text-[var(--color-suido-accent)] border border-[var(--color-suido-accent)]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        style={{ fontFamily: "var(--font-dm)" }}
      >
        {submitting && <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />}
        {submitting ? "Enviando…" : "Enviar calificación"}
      </button>
    </div>
  );
}

function BikePin() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", filter: "drop-shadow(0 2px 6px #4A1A9988)" }}>
      <div style={{
        background: "#7c3aed",
        borderRadius: "50% 50% 50% 0",
        transform: "rotate(-45deg)",
        width: 40,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid #4A1A99",
      }}>
        <span style={{ transform: "rotate(45deg)", fontSize: 18, lineHeight: 1 }}>🛵</span>
      </div>
      <div style={{ width: 6, height: 6, background: "#7c3aed", borderRadius: "50%", marginTop: 2 }} />
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
