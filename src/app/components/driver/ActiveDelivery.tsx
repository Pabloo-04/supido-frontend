"use client";

import { useEffect, useRef, useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
} from "@vis.gl/react-google-maps";
import {
  fetchOrderById,
  fetchDriverOrderStats,
  markOnTheWay,
  markDelivered,
  confirmCashPayment,
  resolveRestaurantName,
  type OrderDetail,
  type DriverOrderStats,
  type DriverOrderStatus,
} from "@/lib/driver-orders";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

type LatLng = { lat: number; lng: number };

function DeliveryMap({
  order,
  driverPos,
}: {
  order: OrderDetail;
  driverPos: LatLng | null;
}) {
  const restPos: LatLng | null =
    order.restaurantLatitude != null && order.restaurantLongitude != null
      ? { lat: order.restaurantLatitude, lng: order.restaurantLongitude }
      : null;

  const delivPos: LatLng | null =
    order.deliveryLatitude != null && order.deliveryLongitude != null
      ? { lat: order.deliveryLatitude, lng: order.deliveryLongitude }
      : null;

  // Don't mount until we have at least one fixed point — guarantees defaultCenter is correct
  if (!restPos && !delivPos && !driverPos) return null;

  const center: LatLng =
    restPos && delivPos
      ? { lat: (restPos.lat + delivPos.lat) / 2, lng: (restPos.lng + delivPos.lng) / 2 }
      : restPos ?? delivPos ?? driverPos!;

  return (
    <div className="rounded-2xl overflow-hidden border border-[var(--color-suido-3)]/20 mb-1" style={{ height: "260px" }}>
      <APIProvider apiKey={MAPS_KEY}>
        <Map
          defaultCenter={center}
          defaultZoom={restPos && delivPos ? 13 : 15}
          mapId="supido-active-delivery"
          gestureHandling="greedy"
          style={{ width: "100%", height: "100%" }}
        >
          {restPos && (
            <AdvancedMarker position={restPos} title="Restaurante">
              <MapPin color="#f97316" shadow="#ea580c">🍕</MapPin>
            </AdvancedMarker>
          )}
          {delivPos && (
            <AdvancedMarker position={delivPos} title="Entrega">
              <MapPin color="#22c55e" shadow="#16a34a">🏠</MapPin>
            </AdvancedMarker>
          )}
          {driverPos && (
            <AdvancedMarker position={driverPos} title="Tu posición">
              <MapPin color="#7c3aed" shadow="#4A1A99">🛵</MapPin>
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}

interface Props {
  orderId: number;
  deliveryPersonId: number;
  onComplete: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED:  "Confirmado",
  PREPARING:  "Preparando",
  ON_THE_WAY: "En camino",
  DELIVERED:  "Entregado",
  CANCELLED:  "Cancelado",
};

export default function ActiveDelivery({ orderId, deliveryPersonId, onComplete }: Props) {
  const [order, setOrder]         = useState<OrderDetail | null>(null);
  const [stats, setStats]         = useState<DriverOrderStats | null>(null);
  const [status, setStatus]       = useState<DriverOrderStatus | null>(null);
  const [loading, setLoading]     = useState(true);
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [showCancelled, setCancelled] = useState(false);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);

  /* ── GPS for map ── */
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (p) => setDriverPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  /* ── load order + stats ── */
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchOrderById(orderId),
      fetchDriverOrderStats(orderId).catch(() => null),
    ])
      .then(([ord, st]) => {
        setOrder(ord);
        setStats(st);
        if (ord.status) setStatus(ord.status);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar el pedido."))
      .finally(() => setLoading(false));
  }, [orderId]);

  /* ── defensive poll every 30s for cancellation ── */
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const ord = await fetchOrderById(orderId);
        if (ord.status) setStatus(ord.status as DriverOrderStatus);
        if (ord.status === "CANCELLED") { setCancelled(true); clearInterval(id); }
        if (ord.status === "DELIVERED") { clearInterval(id); }
      } catch { /* ignore poll errors */ }
    }, 30000);
    return () => clearInterval(id);
  }, [orderId]);

  /* ── actions ── */
  async function handleAction(fn: () => Promise<void>, nextStatus: DriverOrderStatus) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setStatus(nextStatus);
      if (nextStatus === "DELIVERED") {
        setTimeout(() => onCompleteRef.current(), 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el estado.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3" style={{ fontFamily: "var(--font-dm)" }}>
        {error ?? "Pedido no encontrado."}
      </p>
    );
  }

  const currentStatus = status ?? (order.status as DriverOrderStatus);

  return (
    <section className="flex flex-col gap-5">

      {/* Cancellation modal */}
      {showCancelled && (
        <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="bg-[var(--color-suido-1)] border border-red-500/30 rounded-2xl p-8 max-w-sm w-full text-center">
            <p className="text-3xl mb-2">❌</p>
            <h2 className="text-white font-extrabold text-xl mb-2" style={{ fontFamily: "var(--font-syne)" }}>
              Pedido cancelado
            </h2>
            <p className="text-sm text-[var(--color-suido-4)] mb-6" style={{ fontFamily: "var(--font-dm)" }}>
              El pedido fue cancelado. Volvés al inicio.
            </p>
            <button
              type="button"
              onClick={() => { setCancelled(false); onComplete(); }}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--color-suido-cat)] hover:bg-[var(--color-suido-accent)] transition-colors"
              style={{ fontFamily: "var(--font-dm)" }}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-white" style={{ fontFamily: "var(--font-syne)" }}>
            Entrega #{order.id}
          </h2>
          <p className="text-sm text-[var(--color-suido-4)] mt-0.5" style={{ fontFamily: "var(--font-dm)" }}>
            {resolveRestaurantName(order)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentStatus && (
            <span className="text-xs font-semibold uppercase tracking-wide border rounded-full px-3 py-1 bg-purple-500/15 text-purple-400 border-purple-500/25" style={{ fontFamily: "var(--font-dm)" }}>
              {STATUS_LABEL[currentStatus] ?? currentStatus}
            </span>
          )}
          {stats && (
            <span className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1" style={{ fontFamily: "var(--font-dm)" }}>
              ${stats.shippingCost.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Map — coords come from order detail */}
      <DeliveryMap
        order={order}
        driverPos={driverPos}
      />

      {/* Addresses + stats */}
      <div className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20 rounded-2xl p-5 flex flex-col gap-3">
        <AddressRow icon="📍" label="Retiro" value={order.pickupAddress ?? resolveRestaurantName(order)} />
        <AddressRow icon="🏠" label="Entrega" value={order.deliveryAddress} />
        {stats && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--color-suido-3)]/15">
            <StatChip label="Distancia" value={`${stats.distanceKm.toFixed(1)} km`} />
            <StatChip label="Tiempo est." value={`${Math.round(stats.durationSeconds / 60)} min`} />
          </div>
        )}
      </div>

      {/* Payment + earnings */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${order.paymentMethod === "CASH" ? "bg-yellow-500/10 border-yellow-500/20" : "bg-blue-500/10 border-blue-500/20"}`}>
          <span>{order.paymentMethod === "CASH" ? "💵" : "💳"}</span>
          <span className={`text-sm font-semibold ${order.paymentMethod === "CASH" ? "text-yellow-400" : "text-blue-400"}`} style={{ fontFamily: "var(--font-dm)" }}>
            {order.paymentMethod === "CASH" ? "Cobrar en efectivo" : "Pago con tarjeta"}
          </span>
        </div>
      </div>

      {/* Items */}
      {order.items && order.items.length > 0 && (
        <div className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20 rounded-2xl p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-suido-4)] mb-1" style={{ fontFamily: "var(--font-dm)" }}>
            Ítems del pedido
          </p>
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between gap-3">
              <span className="text-sm text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>
                <span className="text-white font-semibold">{item.quantity}×</span> {item.menuItemName}
              </span>
              {item.notes && (
                <span className="text-xs text-[var(--color-suido-3)] italic" style={{ fontFamily: "var(--font-dm)" }}>{item.notes}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5" style={{ fontFamily: "var(--font-dm)" }}>
          {error}
        </p>
      )}

      {/* Status action buttons */}
      {currentStatus === "CONFIRMED" && (
        <ActionButton
          label="Ya recogí el pedido — Iniciar entrega"
          onClick={() => handleAction(() => markOnTheWay(orderId), "ON_THE_WAY")}
          busy={busy}
        />
      )}

      {currentStatus === "PREPARING" && (
        <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl px-5 py-4">
          <div className="w-4 h-4 rounded-full border-2 border-orange-400 border-t-transparent animate-spin flex-shrink-0" />
          <p className="text-sm text-orange-400" style={{ fontFamily: "var(--font-dm)" }}>
            El restaurante está preparando el pedido…
          </p>
        </div>
      )}

      {currentStatus === "ON_THE_WAY" && (
        <div className="flex flex-col gap-3">
          <ActionButton
            label="Entregué el pedido al cliente"
            onClick={() => handleAction(() => markDelivered(orderId), "DELIVERED")}
            busy={busy}
            color="green"
          />
          {order.paymentMethod === "CASH" && (
            <ActionButton
              label="Confirmar cobro en efectivo"
              onClick={() => handleAction(() => confirmCashPayment(orderId, deliveryPersonId), "ON_THE_WAY")}
              busy={busy}
              color="yellow"
            />
          )}
        </div>
      )}

      {currentStatus === "DELIVERED" && (
        <div className="bg-green-500/10 border border-green-500/25 rounded-2xl px-5 py-4 text-center">
          <p className="text-green-400 font-bold" style={{ fontFamily: "var(--font-syne)" }}>
            ¡Entrega completada! 🎉
          </p>
        </div>
      )}
    </section>
  );
}

function AddressRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className="text-[0.65rem] text-[var(--color-suido-3)] uppercase tracking-wide" style={{ fontFamily: "var(--font-dm)" }}>{label}</p>
        <p className="text-sm text-[var(--color-suido-4)] mt-0.5" style={{ fontFamily: "var(--font-dm)" }}>{value}</p>
      </div>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--color-suido-2)] rounded-xl px-3 py-2 text-center">
      <p className="text-[0.6rem] uppercase tracking-wide text-[var(--color-suido-3)]" style={{ fontFamily: "var(--font-dm)" }}>{label}</p>
      <p className="text-sm font-bold text-white mt-0.5" style={{ fontFamily: "var(--font-syne)" }}>{value}</p>
    </div>
  );
}

function ActionButton({
  label, onClick, busy, color = "purple",
}: {
  label: string; onClick: () => void; busy: boolean; color?: "purple" | "green" | "yellow";
}) {
  const colors = {
    purple: "bg-[var(--color-suido-cat)] hover:bg-[var(--color-suido-accent)] text-white",
    green:  "bg-green-600 hover:bg-green-500 text-white",
    yellow: "bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400 border border-yellow-500/25",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`w-full py-3.5 rounded-2xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 ${colors[color]}`}
      style={{ fontFamily: "var(--font-syne)" }}
    >
      {busy && <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />}
      {busy ? "Actualizando…" : label}
    </button>
  );
}

function MapPin({ color, shadow, children }: { color: string; shadow: string; children: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", filter: `drop-shadow(0 2px 4px ${shadow}88)` }}>
      <div style={{
        background: color,
        borderRadius: "50% 50% 50% 0",
        transform: "rotate(-45deg)",
        width: 40,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `2px solid ${shadow}`,
        boxShadow: `0 2px 8px ${shadow}66`,
      }}>
        <span style={{ transform: "rotate(45deg)", fontSize: 18, lineHeight: 1 }}>{children}</span>
      </div>
      <div style={{ width: 6, height: 6, background: color, borderRadius: "50%", marginTop: 2 }} />
    </div>
  );
}
