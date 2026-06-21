const BASE = process.env.NEXT_PUBLIC_API_URL;

export interface AuthResponse {
  token: string;
}

export interface RegisterResponse {
  id: number;
  username: string;
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? "Credenciales inválidas.");
  }
  return res.json();
}

export async function register(
  username: string,
  password: string,
  email: string,
  phone: string,
): Promise<RegisterResponse> {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, email, phone }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? "Error al registrar el usuario.");
  }
  return res.json();
}

export const TOKEN_KEY = "access_token";

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

interface TokenPayload {
  role?: string;
  userId?: number;
  [key: string]: unknown;
}

function decodeToken(token: string): TokenPayload | null {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function getRole(): string | null {
  const token = getToken();
  if (!token) return null;
  return decodeToken(token)?.role ?? null;
}

export function getUserId(): number | null {
  const token = getToken();
  if (!token) return null;
  return decodeToken(token)?.userId ?? null;
}
