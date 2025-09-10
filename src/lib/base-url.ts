// src/lib/base-url.ts
import { headers } from "next/headers";

/**
 * Kembalikan absolute base URL untuk server components / route handlers.
 * - Pakai env kalau ada (mis. untuk preview deploy)
 * - Kalau tidak ada, ambil dari request headers (dev & prod)
 */
export function getBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "");
  if (fromEnv) return fromEnv;

  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
