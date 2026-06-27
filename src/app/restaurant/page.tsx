"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRole, getToken, getUserId, removeToken } from "@/lib/auth";
import CatFaceSVG from "../components/landing/CatFaceSVG";
import NotificationsPanel from "../components/restaurant/NotificationsPanel";
import { fetchNotifications } from "@/lib/notifications";

type Tab = "orders" | "notifications";

const TABS: { id: Tab; label: string }[] = [
  { id: "orders",        label: "Pedidos" },
  { id: "notifications", label: "Notificaciones" },
];

export default function RestaurantPage() {
  const router = useRouter();
  const [authorized, setAuthorized]         = useState(false);
  const [tab, setTab]                       = useState<Tab>("orders");
  const [unreadCount, setUnreadCount]       = useState(0);

  const loadUnread = useCallback(async () => {
    try {
      const all = await fetchNotifications();
      setUnreadCount(all.filter((n) => !n.read).length);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token || getRole() !== "ROLE_RESTAURANT") {
      router.push("/login");
      return;
    }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (authorized) loadUnread();
  }, [authorized, loadUnread]);

  // refresh unread badge whenever switching away from notifications tab
  useEffect(() => {
    if (authorized && tab !== "notifications") loadUnread();
  }, [tab, authorized, loadUnread]);

  function handleLogout() {
    removeToken();
    router.push("/login");
  }

  if (!authorized) return null;

  return (
    <main className="min-h-screen bg-[var(--color-suido-0)]">

      {/* Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between
                   px-6 md:px-12 lg:px-16 py-4 md:py-5
                   bg-[var(--color-suido-0)]/90 backdrop-blur-xl
                   border-b border-[var(--color-suido-3)]/15"
      >
        <Link href="/" className="flex items-center gap-3">
          <div
            className="w-10 h-10 md:w-11 md:h-11 bg-[var(--color-suido-1)] rounded-xl
                       border border-[var(--color-suido-3)]/30
                       flex items-center justify-center overflow-hidden flex-shrink-0"
          >
            <CatFaceSVG className="w-7 h-7 md:w-8 md:h-8" />
          </div>
          <div>
            <div
              className="text-[1.2rem] md:text-[1.4rem] font-extrabold tracking-tight text-white leading-none"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Supi<span className="text-[var(--color-suido-accent)]">|</span>do
            </div>
            <div
              className="text-[0.55rem] md:text-[0.62rem] tracking-[0.2em] uppercase text-[var(--color-suido-4)] mt-1"
              style={{ fontFamily: "var(--font-dm)" }}
            >
              Panel de restaurante
            </div>
          </div>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="text-xs md:text-sm font-medium text-white
                     px-3 md:px-5 py-2 md:py-2.5 rounded-full
                     border border-[var(--color-suido-3)]/40 hover:border-[var(--color-suido-accent)]
                     transition-colors duration-200"
          style={{ fontFamily: "var(--font-dm)" }}
        >
          Cerrar sesión
        </button>
      </nav>

      {/* Content */}
      <div className="pt-24 pb-16 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">

        {/* Tab bar */}
        <div
          className="flex gap-1 mb-8 bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20
                     rounded-2xl p-1 w-fit"
        >
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`relative px-5 py-2 rounded-xl text-sm font-semibold transition-colors duration-150
                ${tab === id
                  ? "bg-[var(--color-suido-cat)] text-white"
                  : "text-[var(--color-suido-4)] hover:text-white"
                }`}
              style={{ fontFamily: "var(--font-dm)" }}
            >
              {label}
              {id === "notifications" && unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1
                             bg-[var(--color-suido-accent)] text-white text-[0.6rem] font-bold
                             rounded-full flex items-center justify-center"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        {tab === "orders" && <OrdersPlaceholder />}
        {tab === "notifications" && <NotificationsPanel />}
      </div>
    </main>
  );
}

function OrdersPlaceholder() {
  return (
    <section>
      <h2
        className="text-xl font-extrabold text-white mb-6"
        style={{ fontFamily: "var(--font-syne)" }}
      >
        Pedidos
      </h2>
      <div
        className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20
                   rounded-2xl p-10 text-center"
      >
        <p
          className="text-[var(--color-suido-4)] text-sm"
          style={{ fontFamily: "var(--font-dm)" }}
        >
          Gestión de pedidos disponible próximamente.
        </p>
      </div>
    </section>
  );
}
