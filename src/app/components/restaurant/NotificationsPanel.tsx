"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from "@/lib/notifications";

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [markingAll, setMarkingAll]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setNotifications(await fetchNotifications());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar notificaciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleMarkOne(id: number) {
    try {
      const updated = await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: updated.read } : n)),
      );
    } catch {
      // silently ignore — UI stays consistent, user can retry
    }
  }

  async function handleMarkAll() {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al marcar todas.");
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <section>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2
            className="text-xl font-extrabold text-white"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Notificaciones
          </h2>
          {unreadCount > 0 && (
            <p className="text-xs text-[var(--color-suido-4)] mt-0.5" style={{ fontFamily: "var(--font-dm)" }}>
              {unreadCount} sin leer
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={markingAll}
              className="text-xs font-medium text-[var(--color-suido-accent)] hover:underline
                         disabled:opacity-50 transition-opacity"
              style={{ fontFamily: "var(--font-dm)" }}
            >
              {markingAll ? "Marcando…" : "Marcar todas como leídas"}
            </button>
          )}
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
      </div>

      {error && (
        <p
          className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5 mb-4"
          style={{ fontFamily: "var(--font-dm)" }}
        >
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <p
          className="text-center py-24 text-[var(--color-suido-3)]"
          style={{ fontFamily: "var(--font-dm)" }}
        >
          No tenés notificaciones.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 rounded-2xl px-5 py-4 border transition-colors duration-150
                ${n.read
                  ? "bg-[var(--color-suido-1)] border-[var(--color-suido-3)]/15"
                  : "bg-[var(--color-suido-cat)]/10 border-[var(--color-suido-cat)]/30"
                }`}
            >
              {/* Unread dot */}
              <div className="flex-shrink-0 mt-1">
                <div
                  className={`w-2 h-2 rounded-full ${n.read ? "bg-[var(--color-suido-3)]/40" : "bg-[var(--color-suido-accent)]"}`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm leading-relaxed ${n.read ? "text-[var(--color-suido-4)]" : "text-white"}`}
                  style={{ fontFamily: "var(--font-dm)" }}
                >
                  {n.message}
                </p>
                <p
                  className="text-[0.7rem] text-[var(--color-suido-3)] mt-1"
                  style={{ fontFamily: "var(--font-dm)" }}
                >
                  {new Date(n.sentAt).toLocaleString("es-AR")}
                </p>
              </div>

              {!n.read && (
                <button
                  type="button"
                  onClick={() => handleMarkOne(n.id)}
                  className="flex-shrink-0 text-[0.65rem] font-semibold uppercase tracking-wide
                             text-[var(--color-suido-accent)] hover:underline"
                  style={{ fontFamily: "var(--font-dm)" }}
                >
                  Leída
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
