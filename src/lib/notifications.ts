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

export interface Notification {
  id: number;
  message: string;
  read: boolean;
  sentAt: string;
  type?: string;
  orderId?: number;
  userId?: number;
}

export async function fetchUnreadNotifications(): Promise<Notification[]> {
  const res = await fetch(`${BASE}/api/notifications/unread`, {
    headers: authHeaders(),
  });
  const json = await unwrap<Notification[] | { content?: Notification[] }>(res);
  if (Array.isArray(json)) return json;
  const paged = json as { content?: Notification[] };
  return Array.isArray(paged.content) ? paged.content : [];
}

export async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch(`${BASE}/api/notifications`, {
    headers: authHeaders(),
  });
  const json = await unwrap<Notification[] | { content?: Notification[] }>(res);
  if (Array.isArray(json)) return json;
  const paged = json as { content?: Notification[] };
  return Array.isArray(paged.content) ? paged.content : [];
}

export async function markNotificationRead(id: number): Promise<Notification> {
  const res = await fetch(`${BASE}/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  return unwrap<Notification>(res);
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await fetch(`${BASE}/api/notifications/read-all`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? `Error ${res.status}`);
  }
}
