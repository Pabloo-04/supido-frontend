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

/* ─── Types ─── */

export interface Restaurant {
  id: number;
  name: string;
  category: string;
  address?: string;
  openingTime?: string;
  closingTime?: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  photoUrl?: string;
  available: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  role?: string;
  createdAt?: string;
}

export interface UserPage {
  users: User[];
  totalPages: number;
  totalElements: number;
}

export interface DeliveryPerson {
  id: number;
  available: boolean;
  userId?: number;
  username?: string;
  [key: string]: unknown;
}

/* ─── Restaurants ─── */

export async function fetchAllRestaurants(): Promise<Restaurant[]> {
  const res = await fetch(`${BASE}/api/restaurants`, { headers: authHeaders() });
  const json = await unwrap<{ content?: Restaurant[] } | Restaurant[]>(res);
  return Array.isArray(json)
    ? json
    : Array.isArray((json as { content?: Restaurant[] }).content)
      ? (json as { content: Restaurant[] }).content
      : [];
}

export async function createRestaurant(data: Omit<Restaurant, "id">): Promise<Restaurant> {
  const res = await fetch(`${BASE}/api/restaurants`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(data),
  });
  return unwrap<Restaurant>(res);
}

/* ─── Menu items ─── */

export async function createMenuItem(
  restaurantId: number,
  data: Omit<MenuItem, "id">,
): Promise<MenuItem> {
  const res = await fetch(`${BASE}/api/restaurants/${restaurantId}/menu-items`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(data),
  });
  return unwrap<MenuItem>(res);
}

/* ─── Users ─── */

export async function fetchAllUsers(
  page = 0,
  size = 10,
  role?: string,
): Promise<UserPage> {
  const qs = new URLSearchParams({ page: String(page), size: String(size) });
  if (role) qs.set("role", role);
  const res = await fetch(`${BASE}/api/users?${qs}`, { headers: authHeaders() });
  const json = await unwrap<
    { content?: User[]; totalPages?: number; totalElements?: number } | User[]
  >(res);
  if (Array.isArray(json)) return { users: json, totalPages: 1, totalElements: json.length };
  const paged = json as { content?: User[]; totalPages?: number; totalElements?: number };
  return {
    users: Array.isArray(paged.content) ? paged.content : [],
    totalPages: paged.totalPages ?? 1,
    totalElements: paged.totalElements ?? 0,
  };
}

export interface CreateUserRequest {
  username: string;
  password: string;
  email: string;
  phone?: string;
  role: string;
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export async function createUser(data: CreateUserRequest): Promise<User> {
  const res = await fetch(`${BASE}/api/users`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(data),
  });
  return unwrap<User>(res);
}

export async function updateUser(id: number, data: UpdateUserRequest): Promise<User> {
  const res = await fetch(`${BASE}/api/users/${id}`, {
    method: "PATCH",
    headers: authHeaders(true),
    body: JSON.stringify(data),
  });
  return unwrap<User>(res);
}

export async function changeUserRole(id: number, role: string): Promise<User> {
  const res = await fetch(`${BASE}/api/users/${id}/role`, {
    method: "PATCH",
    headers: authHeaders(true),
    body: JSON.stringify({ role }),
  });
  return unwrap<User>(res);
}

export async function deleteUser(id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/users/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? `Error ${res.status}`);
  }
}

/* ─── Delivery persons ─── */

export async function fetchAllDeliveryPersons(): Promise<DeliveryPerson[]> {
  const res = await fetch(`${BASE}/api/delivery-persons`, { headers: authHeaders() });
  const json = await unwrap<{ content?: DeliveryPerson[] } | DeliveryPerson[]>(res);
  return Array.isArray(json)
    ? json
    : Array.isArray((json as { content?: DeliveryPerson[] }).content)
      ? (json as { content: DeliveryPerson[] }).content
      : [];
}

export async function createDeliveryPerson(userId: number): Promise<DeliveryPerson> {
  const res = await fetch(`${BASE}/api/delivery-persons`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ userId, available: false }),
  });
  return unwrap<DeliveryPerson>(res);
}
