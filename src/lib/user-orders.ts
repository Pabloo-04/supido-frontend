import { getToken } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_URL;

function authHeaders(json = false): Record<string, string> {
  const token = getToken();
  const h: Record<string, string> = {};
  if (token) h.Authorization = `Bearer ${token}`;
  if (json) h["Content-Type"] = "application/json";
  return h;
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? `Error ${res.status}`);
  }
  const json = await res.json();
  return json?.data ?? json;
}

export type PaymentMethod = "CASH" | "CARD";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "ON_THE_WAY"
  | "DELIVERED"
  | "CANCELLED";

export interface CreateOrderRequest {
  restaurantId: number;
  userAddressId: number;
  items: { menuItemId: number; quantity: number; notes?: string }[];
  paymentMethod: PaymentMethod;
  tip?: number;
  couponId?: number;
}

export interface OrderReceiptItem {
  id?: number;
  menuItemId?: number;
  menuItemName: string;
  name?: string;          // alias kept for compatibility
  quantity: number;
  unitPrice: number;
  subtotal?: number;
  notes?: string | null;
}

export interface OrderReceipt {
  orderId: number;
  restaurantName: string;
  items?: OrderReceiptItem[];
  subtotal?: number;
  tip?: number;
  discount?: number;
  total?: number;
  paymentMethod?: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
  deliveryPersonId?: number | null;
}

export interface DeliveryStats {
  driverName?: string;
  estimatedMinutes?: number;
  distanceKm?: number;
  latitude?: number;
  longitude?: number;
}

export interface OrderSummary {
  id: number;
  status: OrderStatus;
  restaurantName: string;
  total: number;
  createdAt: string;
  paymentMethod: PaymentMethod;
}

export async function placeOrder(body: CreateOrderRequest): Promise<{ id: number }> {
  const res = await fetch(`${BASE}/api/orders`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(body),
  });
  return unwrap<{ id: number }>(res);
}

export async function cancelOrder(orderId: number): Promise<void> {
  const res = await fetch(`${BASE}/api/orders/${orderId}/cancel`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? `Error ${res.status}`);
  }
}

export async function getOrderReceipt(orderId: number): Promise<OrderReceipt> {
  const res = await fetch(`${BASE}/api/orders/${orderId}/receipt`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? `Error ${res.status}`);
  }
  const json = await res.json();
  // Response shape: { data: { order: {...}, payment: {...}, claims: [] } }
  const data    = json?.data ?? json;
  const order   = data?.order   ?? data;
  const payment = data?.payment ?? null;

  return {
    orderId:         order.id,
    restaurantName:  order.restaurant?.name ?? order.restaurantName ?? "",
    status:          order.status,
    createdAt:       order.createdAt,
    items:           order.items ?? [],
    subtotal:        order.subtotal,
    tip:             order.tip,
    discount:        order.discount,
    total:           order.total,
    paymentMethod:   (payment?.method ?? order.paymentMethod) as PaymentMethod | undefined,
    deliveryPersonId: order.deliveryPersonId ?? null,
  };
}

export interface OrderRating {
  id: number;
  orderId: number;
  ratedById: number;
  type: "RESTAURANT" | "DELIVERY_PERSON";
  score: number;
}

export async function getRatingsForOrder(orderId: number): Promise<OrderRating[]> {
  const res = await fetch(`${BASE}/api/ratings/order/${orderId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) return [];
  const json = await res.json();
  const data = json?.data ?? json;
  return Array.isArray(data) ? data : [];
}

export async function submitRating(payload: {
  orderId: number;
  ratedById: number;
  type: "RESTAURANT" | "DELIVERY_PERSON";
  score: number;
}): Promise<void> {
  const res = await fetch(`${BASE}/api/ratings`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? "Error al enviar la calificación.");
  }
}

export async function getDeliveryStats(orderId: number): Promise<DeliveryStats> {
  const res = await fetch(`${BASE}/api/orders/${orderId}/order-stats`, {
    headers: authHeaders(),
  });
  return unwrap<DeliveryStats>(res);
}

export interface OrderTrackingData {
  id?: number;
  orderId?: number;
  status?: string;
  latitude: number;
  longitude: number;
  recordedAt?: string;
}

export async function getOrderTracking(orderId: number): Promise<OrderTrackingData | null> {
  const res = await fetch(`${BASE}/api/order-tracking/order/${orderId}`, {
    headers: authHeaders(),
  });
  if (res.status === 404 || !res.ok) return null;
  const json = await res.json();
  return json?.data ?? json;
}

export async function getMyOrders(
  userId: number,
  page = 0,
  size = 10,
): Promise<{ orders: OrderSummary[]; totalPages: number }> {
  const res = await fetch(
    `${BASE}/api/orders/user/${userId}?page=${page}&size=${size}`,
    { headers: authHeaders() },
  );
  const json = await unwrap<
    OrderSummary[] | { content?: OrderSummary[]; totalPages?: number }
  >(res);
  if (Array.isArray(json)) return { orders: json, totalPages: 1 };
  const paged = json as { content?: OrderSummary[]; totalPages?: number };
  return {
    orders: Array.isArray(paged.content) ? paged.content : [],
    totalPages: paged.totalPages ?? 1,
  };
}
