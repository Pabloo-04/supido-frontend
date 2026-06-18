"use client";

import { useEffect } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export function useDriverLocationPublisher(deliveryPersonId: number | null, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !deliveryPersonId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${BASE}/ws`),
      reconnectDelay: 5000,
    });

    client.activate();

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!client.connected) return;
        client.publish({
          destination: "/app/driver/location",
          body: JSON.stringify({
            deliveryPersonId,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        });
      },
      console.error,
      { enableHighAccuracy: true, maximumAge: 5000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      client.deactivate();
    };
  }, [deliveryPersonId, enabled]);
}
