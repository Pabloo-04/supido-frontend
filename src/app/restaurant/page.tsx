"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRole, getToken, removeToken } from "@/lib/auth";
import { fetchMyRestaurant, type MyRestaurant } from "@/lib/restaurant";
import { fetchUnreadNotifications } from "@/lib/notifications";
import CatFaceSVG from "../components/landing/CatFaceSVG";
import NotificationsPanel from "../components/restaurant/NotificationsPanel";
import OrdersPanel from "../components/restaurant/OrdersPanel";
import MenuPanel from "../components/restaurant/MenuPanel";
import ProfilePanel from "../components/restaurant/ProfilePanel";

type Tab = "orders" | "menu" | "profile" | "notifications";

const TABS: { id: Tab; label: string }[] = [
  { id: "orders",        label: "Pedidos" },
  { id: "menu",          label: "Menú" },
  { id: "profile",       label: "Perfil" },
  { id: "notifications", label: "Notificaciones" },
];

export default function RestaurantPage() {
  const router = useRouter();

  const [authorized, setAuthorized]   = useState(false);
  const [restaurant, setRestaurant]   = useState<MyRestaurant | null>(null);
  const [loadingRest, setLoadingRest] = useState(true);
  const [tab, setTab]                 = useState<Tab>("orders");
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnread = useCallback(async () => {
    try { setUnreadCount((await fetchUnreadNotifications()).length); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token || getRole() !== "ROLE_RESTAURANT") { router.push("/login"); return; }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    fetchMyRestaurant()
      .then((r) => { if (r === null) { router.push("/restaurant/setup"); return; } setRestaurant(r); })
      .catch(() => router.push("/restaurant/setup"))
      .finally(() => setLoadingRest(false));
  }, [authorized, router]);

  useEffect(() => { if (authorized) loadUnread(); }, [authorized, loadUnread]);
  useEffect(() => { if (authorized && tab !== "notifications") loadUnread(); }, [tab, authorized, loadUnread]);

  function handleLogout() { removeToken(); router.push("/login"); }

  if (!authorized || loadingRest) {
    return (
      <main className="min-h-screen bg-[var(--color-suido-0)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-suido-0)]">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 lg:px-16 py-4 md:py-5 bg-[var(--color-suido-0)]/90 backdrop-blur-xl border-b border-[var(--color-suido-3)]/15">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-11 md:h-11 bg-[var(--color-suido-1)] rounded-xl border border-[var(--color-suido-3)]/30 flex items-center justify-center overflow-hidden flex-shrink-0">
            <CatFaceSVG className="w-7 h-7 md:w-8 md:h-8" />
          </div>
          <div>
            <div className="text-[1.2rem] md:text-[1.4rem] font-extrabold tracking-tight text-white leading-none" style={{ fontFamily: "var(--font-syne)" }}>
              {restaurant?.name ?? "Mi restaurante"}
            </div>
            <div className="text-[0.55rem] md:text-[0.62rem] tracking-[0.2em] uppercase text-[var(--color-suido-4)] mt-1" style={{ fontFamily: "var(--font-dm)" }}>
              Panel de restaurante
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {restaurant && (
            <span className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold border rounded-full px-3 py-1 ${restaurant.isOpen ? "bg-green-500/15 text-green-400 border-green-500/25" : "bg-[var(--color-suido-2)] text-[var(--color-suido-3)] border-[var(--color-suido-3)]/20"}`} style={{ fontFamily: "var(--font-dm)" }}>
              <span className={`w-1.5 h-1.5 rounded-full ${restaurant.isOpen ? "bg-green-400" : "bg-[var(--color-suido-3)]"}`} />
              {restaurant.isOpen ? "Abierto" : "Cerrado"}
            </span>
          )}
          <button type="button" onClick={handleLogout} className="text-xs md:text-sm font-medium text-white px-3 md:px-5 py-2 md:py-2.5 rounded-full border border-[var(--color-suido-3)]/40 hover:border-[var(--color-suido-accent)] transition-colors" style={{ fontFamily: "var(--font-dm)" }}>
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
        {/* Restaurant info card */}
        {restaurant && (
          <div className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20 rounded-2xl overflow-hidden mb-8">
            <div className="flex flex-col sm:flex-row">
              {restaurant.photoUrl && (
                <div className="sm:w-48 h-36 sm:h-auto flex-shrink-0 overflow-hidden bg-[var(--color-suido-2)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={restaurant.photoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 p-5 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h1 className="text-xl font-extrabold text-white" style={{ fontFamily: "var(--font-syne)" }}>{restaurant.name}</h1>
                    <p className="text-xs text-[var(--color-suido-4)] mt-0.5" style={{ fontFamily: "var(--font-dm)" }}>{restaurant.category}{restaurant.address ? ` · ${restaurant.address}` : ""}</p>
                  </div>
                  {restaurant.averageRating != null && (
                    <span className="text-xs font-semibold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-2.5 py-0.5" style={{ fontFamily: "var(--font-dm)" }}>★ {restaurant.averageRating.toFixed(1)}</span>
                  )}
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  {restaurant.openingTime && restaurant.closingTime && (
                    <span className="text-xs text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>🕐 {restaurant.openingTime.slice(0, 5)} – {restaurant.closingTime.slice(0, 5)}</span>
                  )}
                  <span className={`text-xs font-semibold border rounded-full px-2.5 py-0.5 ${restaurant.isOpen ? "bg-green-500/15 text-green-400 border-green-500/25" : "bg-[var(--color-suido-2)] text-[var(--color-suido-3)] border-[var(--color-suido-3)]/20"}`} style={{ fontFamily: "var(--font-dm)" }}>
                    {restaurant.isOpen ? "Abierto ahora" : "Cerrado ahora"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Restaurant info card */}
        {restaurant && (
          <div className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20 rounded-2xl overflow-hidden mb-8">
            <div className="flex flex-col sm:flex-row gap-0">
              {restaurant.photoUrl && (
                <div className="sm:w-48 h-36 sm:h-auto flex-shrink-0 overflow-hidden bg-[var(--color-suido-2)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={restaurant.photoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 p-5 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h1 className="text-xl font-extrabold text-white" style={{ fontFamily: "var(--font-syne)" }}>
                        {restaurant.name}
                      </h1>
                      <p className="text-xs text-[var(--color-suido-4)] mt-0.5" style={{ fontFamily: "var(--font-dm)" }}>
                        {restaurant.category}{restaurant.address ? ` · ${restaurant.address}` : ""}
                      </p>
                    </div>
                    {restaurant.averageRating != null && (
                      <span className="text-xs font-semibold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-2.5 py-0.5 flex-shrink-0" style={{ fontFamily: "var(--font-dm)" }}>
                        ★ {restaurant.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  {restaurant.openingTime && restaurant.closingTime && (
                    <span className="text-xs text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>
                      🕐 {restaurant.openingTime.slice(0, 5)} – {restaurant.closingTime.slice(0, 5)}
                    </span>
                  )}
                  <span
                    className={`text-xs font-semibold border rounded-full px-2.5 py-0.5
                      ${restaurant.isOpen
                        ? "bg-green-500/15 text-green-400 border-green-500/25"
                        : "bg-[var(--color-suido-2)] text-[var(--color-suido-3)] border-[var(--color-suido-3)]/20"
                      }`}
                    style={{ fontFamily: "var(--font-dm)" }}
                  >
                    {restaurant.isOpen ? "Abierto ahora" : "Cerrado ahora"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 mb-8 bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20 rounded-2xl p-1 w-fit">
          {TABS.map(({ id, label }) => (
            <button key={id} type="button" onClick={() => setTab(id)}
              className={`relative px-5 py-2 rounded-xl text-sm font-semibold transition-colors duration-150 ${tab === id ? "bg-[var(--color-suido-cat)] text-white" : "text-[var(--color-suido-4)] hover:text-white"}`}
              style={{ fontFamily: "var(--font-dm)" }}>
              {label}
              {id === "notifications" && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 bg-[var(--color-suido-accent)] text-white text-[0.6rem] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "orders"        && restaurant && <OrdersPanel  restaurantId={restaurant.id} />}
        {tab === "menu"          && restaurant && <MenuPanel    restaurantId={restaurant.id} />}
        {tab === "profile"       && restaurant && <ProfilePanel restaurant={restaurant} onUpdated={setRestaurant} />}
        {tab === "notifications" && <NotificationsPanel />}
      </div>
    </main>
  );
}
