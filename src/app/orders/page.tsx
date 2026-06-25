"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CatFaceSVG from "../components/landing/CatFaceSVG";
import { getMyOrders, type OrderSummary, type OrderStatus } from "@/lib/user-orders";
import { getToken, getUserId } from "@/lib/auth";

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

  const [orders, setOrders]       = useState<OrderSummary[]>([]);
  const [page, setPage]           = useState(0);
  const [totalPages, setTotal]    = useState(1);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    const token  = getToken();
    const userId = getUserId();
    if (!token || !userId) { router.push("/login"); return; }

    setLoading(true);
    getMyOrders(userId, page)
      .then(({ orders: data, totalPages: tp }) => {
        setOrders(data);
        setTotal(tp);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar pedidos."))
      .finally(() => setLoading(false));
  }, [page, router]);

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
        <Link href="/restaurants" className="text-sm font-medium text-[var(--color-suido-4)] hover:text-white transition-colors" style={{ fontFamily: "var(--font-dm)" }}>
          ← Restaurantes
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 pt-24 pb-16">
        <h1 className="text-2xl font-extrabold text-white mb-1" style={{ fontFamily: "var(--font-syne)" }}>
          Mis pedidos
        </h1>
        <p className="text-sm text-[var(--color-suido-4)] mb-8" style={{ fontFamily: "var(--font-dm)" }}>
          Historial y estado de tus órdenes
        </p>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-400 text-center py-12" style={{ fontFamily: "var(--font-dm)" }}>{error}</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--color-suido-4)] mb-4" style={{ fontFamily: "var(--font-dm)" }}>
              Todavía no hiciste ningún pedido.
            </p>
            <Link
              href="/restaurants"
              className="text-sm font-semibold text-[var(--color-suido-accent)] hover:underline"
              style={{ fontFamily: "var(--font-dm)" }}
            >
              Explorar restaurantes →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20
                           rounded-2xl p-5 flex items-center justify-between gap-4
                           hover:border-[var(--color-suido-accent)]/40 transition-colors duration-200"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-syne)" }}>
                      #{order.id} · {order.restaurantName}
                    </p>
                    <span
                      className={`text-[0.65rem] font-semibold uppercase tracking-wide border rounded-full px-2.5 py-0.5 ${STATUS_COLORS[order.status]}`}
                      style={{ fontFamily: "var(--font-dm)" }}
                    >
                      {STATUS_LABEL[order.status]}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-suido-4)] mt-1" style={{ fontFamily: "var(--font-dm)" }}>
                    {new Date(order.createdAt).toLocaleString("es-AR")}
                    {" · "}
                    {order.paymentMethod === "CASH" ? "Efectivo" : "Tarjeta"}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-[var(--color-suido-accent)] font-extrabold text-sm" style={{ fontFamily: "var(--font-syne)" }}>
                    ${order.total.toFixed(2)}
                  </span>
                  <span className="text-[var(--color-suido-3)] text-lg">›</span>
                </div>
              </Link>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-3 mt-4">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-xl text-sm border border-[var(--color-suido-3)]/30
                             text-[var(--color-suido-4)] hover:text-white disabled:opacity-40
                             transition-colors"
                  style={{ fontFamily: "var(--font-dm)" }}
                >
                  ← Anterior
                </button>
                <span className="px-4 py-2 text-sm text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 rounded-xl text-sm border border-[var(--color-suido-3)]/30
                             text-[var(--color-suido-4)] hover:text-white disabled:opacity-40
                             transition-colors"
                  style={{ fontFamily: "var(--font-dm)" }}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
