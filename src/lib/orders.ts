import { getToken } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export interface AvailableOrder {
  id: number;
  restaurantName: string;
  pickupAddress: string;
  deliveryAddress: string;
  total: number;
  createdAt: string;
}

export async function fetchAvailableOrders(): Promise<AvailableOrder[]> {
  const token = getToken();
  const res = await fetch(`${BASE}/api/driver/orders/available`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error("No se pudieron cargar los pedidos disponibles.");
  }
  const json = await res.json();
  const data = json?.data ?? json;
  return Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
}
