"use client";

import { useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export interface DriverPin {
  deliveryPersonId: number;
  latitude: number;
  longitude: number;
  available: boolean;
  timestamp?: string;
}

export function useDriversMap(): Map<number, DriverPin> {
  const [pins, setPins] = useState<Map<number, DriverPin>>(new Map());

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${BASE}/ws`),
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      client.subscribe("/topic/drivers/all", (frame) => {
        try {
          const update: DriverPin = JSON.parse(frame.body);
          setPins((prev) => new Map(prev).set(update.deliveryPersonId, update));
        } catch {
          // malformed frame — skip
        }
      });
    };

    client.activate();
    return () => { client.deactivate(); };
  }, []);

  return pins;
}
