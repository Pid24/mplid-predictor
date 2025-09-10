// src/lib/base-url.ts
import { headers } from "next/headers";

export async function getBaseUrl() {
  const h = await headers(); // ⟵ wajib await di Next 15
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) throw new Error("Missing host header");
  return `${proto}://${host}`;
}
