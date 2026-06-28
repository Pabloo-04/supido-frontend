"use client";

import { useEffect, useState } from "react";
import { getOrderTracking } from "@/lib/user-orders";

export interface DriverPosition { lat: number; lng: number }

export function useOrderTracking(
  orderId: number | null,
  enabled: boolean,
  intervalMs = 10000,
): DriverPosition | null {
  const [position, setPosition] = useState<DriverPosition | null>(null);

  useEffect(() => {
    if (!enabled || !orderId) return;

    async function poll() {
      try {
        const data = await getOrderTracking(orderId!);
        if (data) setPosition({ lat: data.latitude, lng: data.longitude });
      } catch { /* ignore */ }
    }

    poll();
    const id = setInterval(poll, intervalMs);
    return () => { clearInterval(id); setPosition(null); };
  }, [orderId, enabled, intervalMs]);

  return position;
}
