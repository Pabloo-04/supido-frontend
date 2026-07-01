"use client";

import { useEffect, useRef } from "react";
import { fetchUnreadNotifications, markNotificationRead, type Notification } from "@/lib/notifications";

export function useNotificationPoller(
  onNotification: (n: Notification) => void,
  enabled: boolean,
  intervalMs = 10000,
) {
  const cbRef = useRef(onNotification);
  cbRef.current = onNotification;

  useEffect(() => {
    if (!enabled) return;

    async function poll() {
      try {
        const unread = await fetchUnreadNotifications();
        for (const n of unread) {
          cbRef.current(n);
          markNotificationRead(n.id).catch(() => {});
        }
      } catch {
        // silently ignore — next tick will retry
      }
    }

    poll();
    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs]);
}
