import { headers } from "next/headers";

export async function getBaseUrl(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "");
  if (fromEnv) return fromEnv;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
