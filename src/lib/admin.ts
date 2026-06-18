import { getToken } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_URL;

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface Restaurant {
  id: number;
  name: string;
  category: string;
  address?: string;
  openingTime?: string;
  closingTime?: string;
  photoUrl?: string;
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
}

export interface DeliveryPerson {
  id: number;
  available: boolean;
  userId?: number;
  username?: string;
  [key: string]: unknown;
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? `Error ${res.status}`);
  }
  const json = await res.json();
  return json?.data ?? json;
}

export async function fetchAllRestaurants(): Promise<Restaurant[]> {
  const res = await fetch(`${BASE}/api/restaurants`, { headers: authHeaders() });
  const json = await unwrap<{ content?: Restaurant[] } | Restaurant[]>(res);
  return Array.isArray(json)
    ? json
    : Array.isArray((json as { content?: Restaurant[] }).content)
      ? (json as { content: Restaurant[] }).content
      : [];
}

export async function createRestaurant(
  data: Omit<Restaurant, "id">,
): Promise<Restaurant> {
  const res = await fetch(`${BASE}/api/restaurants`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  return unwrap<Restaurant>(res);
}

export async function createMenuItem(
  restaurantId: number,
  data: Omit<MenuItem, "id">,
): Promise<MenuItem> {
  const res = await fetch(`${BASE}/api/restaurants/${restaurantId}/menu-items`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  return unwrap<MenuItem>(res);
}

export async function fetchAllUsers(): Promise<User[]> {
  const res = await fetch(`${BASE}/api/users`, { headers: authHeaders() });
  const json = await unwrap<{ content?: User[] } | User[]>(res);
  return Array.isArray(json)
    ? json
    : Array.isArray((json as { content?: User[] }).content)
      ? (json as { content: User[] }).content
      : [];
}

export async function fetchAllDeliveryPersons(): Promise<DeliveryPerson[]> {
  const res = await fetch(`${BASE}/api/delivery-persons`, { headers: authHeaders() });
  const json = await unwrap<{ content?: DeliveryPerson[] } | DeliveryPerson[]>(res);
  return Array.isArray(json)
    ? json
    : Array.isArray((json as { content?: DeliveryPerson[] }).content)
      ? (json as { content: DeliveryPerson[] }).content
      : [];
}
