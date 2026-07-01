"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRole, getToken, getUserId } from "@/lib/auth";
import { fetchDeliveryPersonByUserId, updateDeliveryPersonAvailability, type DeliveryPerson } from "@/lib/deliveryPersons";
import { getActiveOrders } from "@/lib/driver-orders";
import { fetchUnreadNotifications, markAllNotificationsRead, type Notification } from "@/lib/notifications";
import CatFaceSVG from "../components/landing/CatFaceSVG";
import AvailableOrders from "../components/driver/AvailableOrders";
import ActiveOrders from "../components/driver/ActiveOrders";
import ActiveDelivery from "../components/driver/ActiveDelivery";
import DeliveredHistory from "../components/driver/DeliveredHistory";
import NotificationsPanel from "../components/restaurant/NotificationsPanel";
import NewOrderAlert from "../components/driver/NewOrderAlert";
import { useDriverLocationPublisher } from "../components/driver/useDriverLocationPublisher";
import { useNotificationPoller } from "@/hooks/useNotificationPoller";

type Tab = "home" | "active" | "history" | "notifications";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "home",          label: "Inicio",     icon: "🏠" },
  { id: "active",        label: "Mis pedidos", icon: "🛵" },
  { id: "history",       label: "Historial",  icon: "🕐" },
  { id: "notifications", label: "Noti.",      icon: "🔔" },
];

export default function DriverPage() {
  const router = useRouter();

  const [authorized, setAuthorized]       = useState(false);
  const [profile, setProfile]             = useState<DeliveryPerson | null>(null);
  const [loadingProf, setLoadingProf]     = useState(true);
  const [profileError, setProfileError]   = useState<string | null>(null);
  const [toggling, setToggling]           = useState(false);
  const [tab, setTab]                     = useState<Tab>("home");
  const [unreadCount, setUnread]          = useState(0);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [incomingNotif, setIncoming]      = useState<Notification | null>(null);

  const available        = profile?.available ?? false;
  const deliveryPersonId = profile?.id ?? null;

  /* ── auth ── */
  useEffect(() => {
    const token = getToken();
    if (!token || getRole() !== "ROLE_DELIVERY") { router.push("/login"); return; }
    setAuthorized(true);
  }, [router]);

  /* ── profile ── */
  const loadProfile = useCallback(async () => {
    const userId = getUserId();
    if (!userId) { setProfileError("No se pudo identificar al usuario."); setLoadingProf(false); return; }
    setLoadingProf(true);
    setProfileError(null);
    try {
      setProfile(await fetchDeliveryPersonByUserId(userId));
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Error al cargar el perfil.");
    } finally {
      setLoadingProf(false);
    }
  }, []);

  useEffect(() => { if (authorized) loadProfile(); }, [authorized, loadProfile]);

  /* ── check for active order ── */
  const checkActive = useCallback(async () => {
    if (!deliveryPersonId) return;
    try {
      const orders = await getActiveOrders(deliveryPersonId);
      const active = orders.find((o) => ["CONFIRMED", "PREPARING", "ON_THE_WAY"].includes(o.status));
      setActiveOrderId(active?.id ?? null);
    } catch { /* ignore */ }
  }, [deliveryPersonId]);

  useEffect(() => { if (deliveryPersonId) checkActive(); }, [deliveryPersonId, checkActive]);

  /* ── unread badge ── */
  const refreshUnread = useCallback(async () => {
    try { setUnread((await fetchUnreadNotifications()).length); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!authorized) return;
    refreshUnread();
    const id = setInterval(refreshUnread, 30000);
    return () => clearInterval(id);
  }, [authorized, refreshUnread]);

  useEffect(() => {
    if (tab !== "notifications") { refreshUnread(); return; }
    // Mark all as read when opening inbox
    markAllNotificationsRead().catch(() => {});
    setUnread(0);
  }, [tab, refreshUnread]);

  /* ── notification handler ── */
  const handleNotification = useCallback((n: Notification) => {
    if (n.type === "NEW_ORDER_AVAILABLE") setIncoming(n);
  }, []);

  // Poll only when online
  useNotificationPoller(handleNotification, available, 10000);

  // Publish GPS only when online AND there's an active delivery
  useDriverLocationPublisher(deliveryPersonId, available && activeOrderId !== null);

  /* ── availability toggle ── */
  async function handleToggle() {
    if (!profile) return;
    setToggling(true);
    try {
      const updated = await updateDeliveryPersonAvailability(profile.id, !available);
      setProfile(updated);
    } catch { /* ignore */ } finally {
      setToggling(false);
    }
  }

  if (!authorized) return null;

  return (
    <main className="min-h-screen bg-[var(--color-suido-0)]">

      {/* Incoming order overlay */}
      {incomingNotif && (
        <NewOrderAlert
          notification={incomingNotif}
          onAccepted={() => { setIncoming(null); checkActive(); setTab("active"); }}
          onDismissed={() => setIncoming(null)}
        />
      )}

      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-12 py-3 md:py-5 bg-[var(--color-suido-0)]/90 backdrop-blur-xl border-b border-[var(--color-suido-3)]/15">
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
      </nav>

      {/* Content */}
      <div className="pt-20 md:pt-28 pb-24 md:pb-16 px-4 md:px-12 max-w-4xl mx-auto">
        {profileError && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5 mb-6" style={{ fontFamily: "var(--font-dm)" }}>
            {profileError}
          </p>
        )}

        {loadingProf ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* ── HOME ── */}
            {tab === "home" && (
              <section className="flex flex-col gap-5">
                {/* Status card */}
                <div className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20 rounded-2xl p-6 flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-extrabold text-white" style={{ fontFamily: "var(--font-syne)" }}>
                        {profile?.username ?? "Repartidor"}
                      </h2>
                      {profile?.averageRating != null && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-yellow-400">★</span>
                          <span className="text-white font-semibold text-sm" style={{ fontFamily: "var(--font-dm)" }}>
                            {profile.averageRating.toFixed(1)}
                          </span>
                          <span className="text-xs text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>promedio</span>
                        </div>
                      )}
                    </div>
                    <span className={`text-[0.65rem] font-bold uppercase tracking-wider border rounded-full px-3 py-1
                      ${available
                        ? "bg-green-500/15 text-green-400 border-green-500/25"
                        : "bg-[var(--color-suido-2)] text-[var(--color-suido-3)] border-[var(--color-suido-3)]/20"
                      }`}
                      style={{ fontFamily: "var(--font-dm)" }}
                    >
                      {available ? "En línea" : "Desconectado"}
                    </span>
                  </div>

                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={handleToggle}
                    disabled={toggling}
                    className={`w-full py-4 rounded-2xl text-base font-extrabold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-3
                      ${available
                        ? "bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25"
                        : "bg-green-600 hover:bg-green-500 text-white"
                      }`}
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    {toggling
                      ? <span className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      : <span className={`w-3 h-3 rounded-full ${available ? "bg-red-400" : "bg-white"}`} />
                    }
                    {toggling ? "Actualizando…" : available ? "Desconectarme" : "Conectarme"}
                  </button>

                  {available && (
                    <p className="text-xs text-center text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>
                      Estás recibiendo notificaciones de nuevos pedidos cada 10 s
                    </p>
                  )}
                </div>

                {/* Active order banner */}
                {activeOrderId && (
                  <button
                    type="button"
                    onClick={() => setTab("active")}
                    className="bg-[var(--color-suido-cat)]/15 border border-[var(--color-suido-cat)]/30 rounded-2xl px-5 py-4 flex items-center justify-between gap-3 hover:bg-[var(--color-suido-cat)]/25 transition-colors w-full text-left"
                  >
                    <div>
                      <p className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-syne)" }}>
                        🛵 Tenés un pedido activo
                      </p>
                      <p className="text-xs text-[var(--color-suido-4)] mt-0.5" style={{ fontFamily: "var(--font-dm)" }}>
                        Tocá para ver los detalles y acciones
                      </p>
                    </div>
                    <span className="text-[var(--color-suido-accent)] text-lg">›</span>
                  </button>
                )}

                {/* Available orders (when online) */}
                {available
                  ? <AvailableOrders onOrderAccepted={() => { checkActive(); setTab("active"); }} />
                  : !activeOrderId && (
                      <p className="text-center py-12 text-[var(--color-suido-3)] text-sm" style={{ fontFamily: "var(--font-dm)" }}>
                        Conectate para empezar a recibir pedidos.
                      </p>
                    )
                }
              </section>
            )}

            {/* ── ACTIVE ── */}
            {tab === "active" && deliveryPersonId && (
              activeOrderId
                ? <ActiveDelivery
                    orderId={activeOrderId}
                    deliveryPersonId={deliveryPersonId}
                    onComplete={() => { setActiveOrderId(null); setTab("home"); }}
                  />
                : <ActiveOrders
                    deliveryPersonId={deliveryPersonId}
                  />
            )}

            {/* ── HISTORY ── */}
            {tab === "history" && deliveryPersonId && (
              <DeliveredHistory deliveryPersonId={deliveryPersonId} />
            )}

            {/* ── NOTIFICATIONS ── */}
            {tab === "notifications" && <NotificationsPanel />}
          </>
        )}
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--color-suido-1)]/95 backdrop-blur-xl border-t border-[var(--color-suido-3)]/20 flex">
        {TABS.map(({ id, icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`relative flex-1 flex flex-col items-center gap-1 py-3 transition-colors duration-150
              ${tab === id ? "text-[var(--color-suido-accent)]" : "text-[var(--color-suido-3)]"}`}
          >
            <span className="text-xl leading-none">{icon}</span>
            <span className="text-[0.6rem] font-semibold" style={{ fontFamily: "var(--font-dm)" }}>{label}</span>
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
