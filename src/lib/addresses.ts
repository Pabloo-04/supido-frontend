const BASE = process.env.NEXT_PUBLIC_API_URL;

export interface UserAddress {
  id: number;
  label: string;
  street: string;
  city: string;
  latitude: number;
  longitude: number;
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? `Error ${res.status}`);
  }
  const json = await res.json();
  return json?.data ?? json;
}

export async function fetchAddresses(token: string): Promise<UserAddress[]> {
  const res = await fetch(`${BASE}/api/users/addresses`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await unwrap<UserAddress[] | { content?: UserAddress[] }>(res);
  return Array.isArray(json)
    ? json
    : Array.isArray((json as { content?: UserAddress[] }).content)
      ? (json as { content: UserAddress[] }).content
      : [];
}

export async function createAddress(
  token: string,
  body: Omit<UserAddress, "id">,
): Promise<UserAddress> {
  const res = await fetch(`${BASE}/api/users/addresses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return unwrap<UserAddress>(res);
}
