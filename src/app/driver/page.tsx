"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRole, getToken, getUserId } from "@/lib/auth";
import { fetchDeliveryPersonByUserId } from "@/lib/deliveryPersons";
import { fetchUnreadNotifications } from "@/lib/notifications";
import CatFaceSVG from "../components/landing/CatFaceSVG";
import AvailableOrders from "../components/driver/AvailableOrders";
import ActiveOrders from "../components/driver/ActiveOrders";
import DeliveredHistory from "../components/driver/DeliveredHistory";
import AvailabilityToggle from "../components/driver/AvailabilityToggle";
import NotificationsPanel from "../components/restaurant/NotificationsPanel";
import { useDriverLocationPublisher } from "../components/driver/useDriverLocationPublisher";

type Tab = "available" | "active" | "history" | "notifications";

const TABS: { id: Tab; label: string; shortLabel: string; icon: string }[] = [
  { id: "available",     label: "Disponibles",    shortLabel: "Disponibles", icon: "📬" },
  { id: "active",        label: "Mis pedidos",     shortLabel: "Pedidos",     icon: "🛵" },
  { id: "history",       label: "Historial",       shortLabel: "Historial",   icon: "🕐" },
  { id: "notifications", label: "Notificaciones",  shortLabel: "Noti.",       icon: "🔔" },
];

export default function DriverPage() {
  const router = useRouter();

  const [authorized, setAuthorized]     = useState(false);
  const [deliveryPersonId, setDpId]     = useState<number | null>(null);
  const [available, setAvailable]       = useState(false);
  const [loadingProfile, setLoadingProf] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [tab, setTab]                   = useState<Tab>("available");
  const [unreadCount, setUnreadCount]   = useState(0);

  const loadProfile = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      setProfileError("No se pudo identificar al usuario.");
      setLoadingProf(false);
      return;
    }
    setLoadingProf(true);
    setProfileError(null);
    try {
      const profile = await fetchDeliveryPersonByUserId(userId);
      setDpId(profile.id);
      setAvailable(profile.available);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Error al cargar el perfil.");
    } finally {
      setLoadingProf(false);
    }
  }, []);

  const loadUnread = useCallback(async () => {
    try {
      const unread = await fetchUnreadNotifications();
      setUnreadCount(unread.length);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token || getRole() !== "ROLE_DELIVERY") {
      router.push("/login");
      return;
    }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    loadProfile();
    loadUnread();
    const id = setInterval(loadUnread, 30000);
    return () => clearInterval(id);
  }, [authorized, loadProfile, loadUnread]);

  // refresh badge when switching away from notifications tab
  useEffect(() => {
    if (authorized && tab !== "notifications") loadUnread();
  }, [tab, authorized, loadUnread]);

  useDriverLocationPublisher(deliveryPersonId, authorized);

  if (!authorized) return null;

  return (
    <main className="min-h-screen bg-[var(--color-suido-0)]">

      {/* Top navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-12 lg:px-16 py-3 md:py-5 bg-[var(--color-suido-0)]/90 backdrop-blur-xl border-b border-[var(--color-suido-3)]/15">
        <Link href="/" className="flex items-center gap-2 md:gap-3">
          <div className="w-9 h-9 md:w-11 md:h-11 bg-[var(--color-suido-1)] rounded-xl border border-[var(--color-suido-3)]/30 flex items-center justify-center overflow-hidden flex-shrink-0">
            <CatFaceSVG className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div>
            <div className="text-[1.1rem] md:text-[1.4rem] font-extrabold tracking-tight text-white leading-none" style={{ fontFamily: "var(--font-syne)" }}>
              Supi<span className="text-[var(--color-suido-accent)]">|</span>do
            </div>
            <div className="text-[0.5rem] md:text-[0.62rem] tracking-[0.2em] uppercase text-[var(--color-suido-4)] mt-0.5" style={{ fontFamily: "var(--font-dm)" }}>
              Panel de repartidor
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Desktop tab pills */}
          <div className="hidden md:flex gap-1 bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20 rounded-2xl p-1">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`relative px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors duration-150
                  ${tab === id ? "bg-[var(--color-suido-cat)] text-white" : "text-[var(--color-suido-4)] hover:text-white"}`}
                style={{ fontFamily: "var(--font-dm)" }}
              >
                {label}
                {id === "notifications" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[1rem] h-[1rem] px-1 bg-[var(--color-suido-accent)] text-white text-[0.55rem] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {deliveryPersonId && (
            <AvailabilityToggle
              deliveryPersonId={deliveryPersonId}
              available={available}
              onChange={setAvailable}
            />
          )}
        </div>
      </nav>

      {/* Content — extra bottom padding on mobile for bottom nav */}
      <div className="pt-20 md:pt-28 pb-24 md:pb-16 px-4 md:px-12 lg:px-16 max-w-4xl mx-auto">
        {profileError && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5 mb-6" style={{ fontFamily: "var(--font-dm)" }}>
            {profileError}
          </p>
        )}

        {loadingProfile ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {tab === "available" && <AvailableOrders onOrderAccepted={() => setTab("active")} />}
            {tab === "active"    && deliveryPersonId && <ActiveOrders deliveryPersonId={deliveryPersonId} />}
            {tab === "history"   && deliveryPersonId && <DeliveredHistory deliveryPersonId={deliveryPersonId} />}
            {tab === "notifications" && <NotificationsPanel />}
          </>
        )}
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--color-suido-1)]/95 backdrop-blur-xl border-t border-[var(--color-suido-3)]/20 flex safe-bottom">
        {TABS.map(({ id, shortLabel, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`relative flex-1 flex flex-col items-center gap-1 py-3 transition-colors duration-150
              ${tab === id ? "text-[var(--color-suido-accent)]" : "text-[var(--color-suido-3)]"}`}
          >
            <span className="text-xl leading-none">{icon}</span>
            <span className="text-[0.6rem] font-semibold" style={{ fontFamily: "var(--font-dm)" }}>
              {shortLabel}
            </span>
            {id === "notifications" && unreadCount > 0 && (
              <span className="absolute top-2 left-1/2 ml-2 min-w-[1rem] h-[1rem] px-1 bg-[var(--color-suido-accent)] text-white text-[0.5rem] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        ))}
      </nav>
    </main>
  );
}
