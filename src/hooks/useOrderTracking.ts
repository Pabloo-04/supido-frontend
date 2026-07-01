"use client";

import { useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getOrderTracking } from "@/lib/user-orders";
import { getToken } from "@/lib/auth";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export interface DriverPosition { lat: number; lng: number }

export function useOrderTracking(
  orderId: number | null,
  enabled: boolean,
): DriverPosition | null {
  const [position, setPosition] = useState<DriverPosition | null>(null);

  useEffect(() => {
    if (!enabled || !orderId) return;

    // 1. GET /api/order-tracking/order/{orderId} — last known position on mount
    getOrderTracking(orderId)
      .then((data) => {
        if (data) setPosition({ lat: data.latitude, lng: data.longitude });
      })
      .catch(() => {});

    // 2. Subscribe to /topic/tracking/{orderId} for real-time driver position
    const token = getToken();
    const client = new Client({
      webSocketFactory: () => new SockJS(`${BASE}/ws`),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      client.subscribe(`/topic/tracking/${orderId}`, (msg) => {
        try {
          const data = JSON.parse(msg.body) as { latitude: number; longitude: number };
          if (data.latitude != null && data.longitude != null) {
            setPosition({ lat: data.latitude, lng: data.longitude });
          }
        } catch { /* malformed frame — ignore */ }
      });
    };

    client.activate();

    return () => {
      client.deactivate();
      setPosition(null);
    };
  }, [orderId, enabled]);

  return position;
}
