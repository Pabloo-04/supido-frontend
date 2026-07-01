"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CatFaceSVG from "../components/landing/CatFaceSVG";
import { getMyOrders, type OrderSummary, type OrderStatus } from "@/lib/user-orders";
import { fetchUnreadNotifications } from "@/lib/notifications";
import { getToken, getUserId } from "@/lib/auth";
import NotificationsPanel from "../components/restaurant/NotificationsPanel";

type Tab = "orders" | "notifications";

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

export default function OrdersPage() {
  const router = useRouter();

  const [tab, setTab]           = useState<Tab>("orders");
  const [orders, setOrders]     = useState<OrderSummary[]>([]);
  const [page, setPage]         = useState(0);
  const [totalPages, setTotal]  = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [unreadCount, setUnread] = useState(0);

  const loadUnread = useCallback(async () => {
    try { setUnread((await fetchUnreadNotifications()).length); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const token  = getToken();
    const userId = getUserId();
    if (!token || !userId) { router.push("/login"); return; }

    setLoading(true);
    getMyOrders(userId, page)
      .then(({ orders: data, totalPages: tp }) => { setOrders(data); setTotal(tp); })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar pedidos."))
      .finally(() => setLoading(false));

    loadUnread();
    const id = setInterval(loadUnread, 30000);
    return () => clearInterval(id);
  }, [page, router, loadUnread]);

  useEffect(() => { if (tab !== "notifications") loadUnread(); }, [tab, loadUnread]);

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
        <div className="flex items-center gap-3">
          {/* Bell button */}
          <button type="button" onClick={() => setTab("notifications")} aria-label="Notificaciones"
            className={`relative p-2 rounded-xl border transition-colors duration-150
              ${tab === "notifications"
                ? "bg-[var(--color-suido-cat)]/20 border-[var(--color-suido-accent)]/40 text-[var(--color-suido-accent)]"
                : "border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:text-white hover:border-[var(--color-suido-3)]/60"
              }`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10 2a6 6 0 0 0-6 6v1.28a1 1 0 0 1-.168.555l-1.7 2.55A1 1 0 0 0 2.998 14h14.004a1 1 0 0 0 .866-1.617l-1.7-2.55A1 1 0 0 1 16 9.28V8a6 6 0 0 0-6-6ZM10 18a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3Z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 bg-[var(--color-suido-accent)] text-white text-[0.55rem] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <Link href="/restaurants" className="text-sm font-medium text-[var(--color-suido-4)] hover:text-white transition-colors" style={{ fontFamily: "var(--font-dm)" }}>
            ← Restaurantes
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 pt-24 pb-16">
        {/* Tab pills */}
        <div className="flex gap-1 mb-8 bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20 rounded-2xl p-1 w-fit">
          {(["orders", "notifications"] as Tab[]).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`relative px-5 py-2 rounded-xl text-sm font-semibold transition-colors duration-150
                ${tab === t ? "bg-[var(--color-suido-cat)] text-white" : "text-[var(--color-suido-4)] hover:text-white"}`}
              style={{ fontFamily: "var(--font-dm)" }}>
              {t === "orders" ? "Mis pedidos" : "Notificaciones"}
              {t === "notifications" && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1rem] h-[1rem] px-1 bg-[var(--color-suido-accent)] text-white text-[0.55rem] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders tab */}
        {tab === "orders" && (
          loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-400 text-center py-12" style={{ fontFamily: "var(--font-dm)" }}>{error}</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[var(--color-suido-4)] mb-4" style={{ fontFamily: "var(--font-dm)" }}>Todavía no hiciste ningún pedido.</p>
              <Link href="/restaurants" className="text-sm font-semibold text-[var(--color-suido-accent)] hover:underline" style={{ fontFamily: "var(--font-dm)" }}>
                Explorar restaurantes →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {orders.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`}
                  className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20 rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-[var(--color-suido-accent)]/40 transition-colors duration-200">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-syne)" }}>#{order.id} · {order.restaurantName}</p>
                      <span className={`text-[0.65rem] font-semibold uppercase tracking-wide border rounded-full px-2.5 py-0.5 ${STATUS_COLORS[order.status]}`} style={{ fontFamily: "var(--font-dm)" }}>
                        {STATUS_LABEL[order.status]}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-suido-4)] mt-1" style={{ fontFamily: "var(--font-dm)" }}>
                      {new Date(order.createdAt).toLocaleString("es-AR")} · {order.paymentMethod === "CASH" ? "Efectivo" : "Tarjeta"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[var(--color-suido-accent)] font-extrabold text-sm" style={{ fontFamily: "var(--font-syne)" }}>${order.total.toFixed(2)}</span>
                    <span className="text-[var(--color-suido-3)] text-lg">›</span>
                  </div>
                </Link>
              ))}

              {totalPages > 1 && (
                <div className="flex justify-center gap-3 mt-4">
                  <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                    className="px-4 py-2 rounded-xl text-sm border border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:text-white disabled:opacity-40 transition-colors" style={{ fontFamily: "var(--font-dm)" }}>
                    ← Anterior
                  </button>
                  <span className="px-4 py-2 text-sm text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>{page + 1} / {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                    className="px-4 py-2 rounded-xl text-sm border border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:text-white disabled:opacity-40 transition-colors" style={{ fontFamily: "var(--font-dm)" }}>
                    Siguiente →
                  </button>
                </div>
              )}
            </div>
          )
        )}

        {/* Notifications tab */}
        {tab === "notifications" && <NotificationsPanel />}
      </div>
    </main>
  );
}
