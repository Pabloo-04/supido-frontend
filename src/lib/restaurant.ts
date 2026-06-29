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

/* ─── Restaurant profile ─── */

export interface MyRestaurant {
  id: number;
  userId: number;
  name: string;
  category: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  openingTime?: string;
  closingTime?: string;
  photoUrl?: string;
  averageRating?: number;
  isOpen: boolean;
}

export interface UpdateRestaurantRequest {
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  openingTime: string;
  closingTime: string;
  photoUrl?: string;
}

export async function fetchMyRestaurant(): Promise<MyRestaurant | null> {
  const res = await fetch(`${BASE}/api/restaurants/my-restaurant`, { headers: authHeaders() });
  if (res.status === 404) return null;
  return unwrap<MyRestaurant>(res);
}

export async function updateMyRestaurant(id: number, data: UpdateRestaurantRequest): Promise<MyRestaurant> {
  const res = await fetch(`${BASE}/api/restaurants/${id}`, {
    method: "PUT", headers: authHeaders(true), body: JSON.stringify(data),
  });
  return unwrap<MyRestaurant>(res);
}

export async function fetchCategories(): Promise<string[]> {
  const res = await fetch(`${BASE}/api/restaurants/categories`, { headers: authHeaders() });
  const json = await unwrap<string[]>(res);
  return Array.isArray(json) ? json : [];
}

/* ─── Menu items ─── */

export interface RestaurantMenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  photoUrl?: string;
  available: boolean;
}

export interface CreateMenuItemRequest {
  name: string;
  description: string;
  price: number;
  photoUrl?: string;
}

export async function fetchMyMenuItems(restaurantId: number, page = 0, size = 50) {
  const qs = new URLSearchParams({ page: String(page), size: String(size) });
  const res = await fetch(`${BASE}/api/restaurants/${restaurantId}/menu-items?${qs}`, { headers: authHeaders() });
  const json = await unwrap<RestaurantMenuItem[] | { content?: RestaurantMenuItem[]; totalPages?: number; totalElements?: number }>(res);
  if (Array.isArray(json)) return { items: json, totalPages: 1, totalElements: json.length };
  const paged = json as { content?: RestaurantMenuItem[]; totalPages?: number; totalElements?: number };
  return { items: Array.isArray(paged.content) ? paged.content : [], totalPages: paged.totalPages ?? 1, totalElements: paged.totalElements ?? 0 };
}

export async function createRestaurantMenuItem(restaurantId: number, data: CreateMenuItemRequest): Promise<RestaurantMenuItem> {
  const res = await fetch(`${BASE}/api/restaurants/${restaurantId}/menu-items`, {
    method: "POST", headers: authHeaders(true), body: JSON.stringify(data),
  });
  return unwrap<RestaurantMenuItem>(res);
}

export async function updateRestaurantMenuItem(restaurantId: number, itemId: number, data: Partial<CreateMenuItemRequest>): Promise<RestaurantMenuItem> {
  const res = await fetch(`${BASE}/api/restaurants/${restaurantId}/menu-items/${itemId}`, {
    method: "PUT", headers: authHeaders(true), body: JSON.stringify(data),
  });
  return unwrap<RestaurantMenuItem>(res);
}

export async function deleteRestaurantMenuItem(restaurantId: number, itemId: number): Promise<void> {
  const res = await fetch(`${BASE}/api/restaurants/${restaurantId}/menu-items/${itemId}`, {
    method: "DELETE", headers: authHeaders(),
  });
  if (!res.ok) { const err = await res.json().catch(() => null); throw new Error(err?.message ?? `Error ${res.status}`); }
}

export async function toggleMenuItemAvailability(restaurantId: number, itemId: number): Promise<RestaurantMenuItem> {
  const res = await fetch(`${BASE}/api/restaurants/${restaurantId}/menu-items/${itemId}/availability`, {
    method: "PATCH", headers: authHeaders(),
  });
  return unwrap<RestaurantMenuItem>(res);
}

/* ─── Orders ─── */

export type RestaurantOrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "ON_THE_WAY" | "DELIVERED" | "CANCELLED";

export interface RestaurantOrderItem {
  id: number; menuItemId: number; menuItemName: string;
  quantity: number; unitPrice: number; subtotal: number; notes: string | null;
}

export interface RestaurantOrder {
  id: number; status: RestaurantOrderStatus; createdAt: string; deliveredAt: string | null;
  shippingCost: number; deliveryPersonId: number | null;
  total?: number; subtotal?: number; tip?: number; paymentMethod?: string;
  items: RestaurantOrderItem[];
}

export interface RestaurantOrderPage {
  orders: RestaurantOrder[]; totalPages: number; totalElements: number;
}

export async function fetchRestaurantOrders(restaurantId: number, page = 0, size = 20, status?: RestaurantOrderStatus): Promise<RestaurantOrderPage> {
  const qs = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) qs.set("status", status);
  const res = await fetch(`${BASE}/api/orders/restaurant/${restaurantId}?${qs}`, { headers: authHeaders() });
  const json = await unwrap<RestaurantOrder[] | { content?: RestaurantOrder[]; totalPages?: number; totalElements?: number }>(res);
  if (Array.isArray(json)) return { orders: json, totalPages: 1, totalElements: json.length };
  const paged = json as { content?: RestaurantOrder[]; totalPages?: number; totalElements?: number };
  return { orders: Array.isArray(paged.content) ? paged.content : [], totalPages: paged.totalPages ?? 1, totalElements: paged.totalElements ?? 0 };
}

/* ─── Order actions ─── */

export interface OrderStats { distanceKm: number; durationSeconds: number; shippingCost: number }

async function patchOrder(path: string): Promise<RestaurantOrder | null> {
  const res = await fetch(`${BASE}${path}`, { method: "PATCH", headers: authHeaders() });
  if (!res.ok) { const err = await res.json().catch(() => null); throw new Error(err?.message ?? `Error ${res.status}`); }
  const json = await res.json(); return json?.data ?? json ?? null;
}

export const confirmOrder    = (id: number) => patchOrder(`/api/orders/${id}/confirm`);
export const prepareOrder    = (id: number) => patchOrder(`/api/orders/${id}/prepare`);
export const orderOnTheWay   = (id: number) => patchOrder(`/api/orders/${id}/on-the-way`);
export const deliverOrder    = (id: number) => patchOrder(`/api/orders/${id}/deliver`);

export async function cancelRestaurantOrder(id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/orders/${id}/cancel`, { method: "PATCH", headers: authHeaders() });
  if (!res.ok) { const err = await res.json().catch(() => null); throw new Error(err?.message ?? `Error ${res.status}`); }
}

export async function assignDeliveryPerson(orderId: number, deliveryPersonId: number): Promise<RestaurantOrder> {
  const res = await fetch(`${BASE}/api/orders/${orderId}/assign-delivery-person?deliveryPersonId=${deliveryPersonId}`, {
    method: "PATCH", headers: authHeaders(),
  });
  if (!res.ok) { const err = await res.json().catch(() => null); throw new Error(err?.message ?? `Error ${res.status}`); }
  return unwrap<RestaurantOrder>(res);
}

export async function fetchOrderStats(orderId: number): Promise<OrderStats> {
  const res = await fetch(`${BASE}/api/orders/${orderId}/order-stats`, { headers: authHeaders() });
  return unwrap<OrderStats>(res);
}
