import { getToken } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export interface DeliveryPerson {
  id: number;
  available: boolean;
  [key: string]: unknown;
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchDeliveryPersonByUserId(userId: number): Promise<DeliveryPerson> {
  const res = await fetch(`${BASE}/api/delivery-persons/by-user/${userId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error("No se pudo obtener el perfil de repartidor.");
  }
  const json = await res.json();
  return json?.data ?? json;
}

export async function updateDeliveryPersonAvailability(
  id: number,
  available: boolean,
): Promise<DeliveryPerson> {
  const res = await fetch(`${BASE}/api/delivery-persons/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ available }),
  });
  if (!res.ok) {
    throw new Error("No se pudo actualizar la disponibilidad.");
  }
  const json = await res.json();
  return json?.data ?? json;
}
