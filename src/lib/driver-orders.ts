import { getToken } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_URL;

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? `Error ${res.status}`);
  }
  const json = await res.json();
  return json?.data ?? json;
}

function parseList<T>(raw: T[] | { content?: T[] }): T[] {
  if (Array.isArray(raw)) return raw;
  const paged = raw as { content?: T[] };
  return Array.isArray(paged.content) ? paged.content : [];
}

export type DriverOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "ON_THE_WAY"
  | "DELIVERED"
  | "CANCELLED";

export interface DriverOrder {
  id: number;
  status: DriverOrderStatus;
  restaurantName: string;
  pickupAddress: string;
  deliveryAddress: string;
  total: number;
  paymentMethod: "CASH" | "CARD";
  createdAt: string;
}

export async function acceptOrder(orderId: number): Promise<void> {
  const res = await fetch(`${BASE}/api/orders/${orderId}/accept`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? `Error ${res.status}`);
  }
}

export async function getActiveOrders(
  deliveryPersonId: number,
  page = 0,
  size = 10,
): Promise<DriverOrder[]> {
  const res = await fetch(
    `${BASE}/api/orders/delivery-person/${deliveryPersonId}?page=${page}&size=${size}`,
    { headers: authHeaders() },
  );
  return parseList(await unwrap<DriverOrder[] | { content?: DriverOrder[] }>(res));
}

export async function getDeliveredHistory(
  deliveryPersonId: number,
  page = 0,
  size = 10,
): Promise<DriverOrder[]> {
  const res = await fetch(
    `${BASE}/api/orders/delivery-person/${deliveryPersonId}/delivered?page=${page}&size=${size}`,
    { headers: authHeaders() },
  );
  return parseList(await unwrap<DriverOrder[] | { content?: DriverOrder[] }>(res));
}

export async function confirmCashPayment(
  orderId: number,
  deliveryPersonId: number,
): Promise<void> {
  const res = await fetch(
    `${BASE}/api/orders/${orderId}/confirm-cash-payment?deliveryPersonId=${deliveryPersonId}`,
    { method: "PATCH", headers: authHeaders() },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? `Error ${res.status}`);
  }
}
