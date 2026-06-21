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

    let watchId: number | null = null;

    client.onConnect = () => {
      watchId = navigator.geolocation.watchPosition(
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
    };

    client.activate();

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      client.deactivate();
    };
  }, [deliveryPersonId, enabled]);
}
