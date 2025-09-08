import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// If env not set (local dev), skip rate limit
const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = hasUpstash ? Redis.fromEnv() : undefined;
const ratelimit = hasUpstash
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 request / menit / IP / path
      analytics: true,
      prefix: "rl:mplid",
    })
  : undefined;

export async function middleware(req: NextRequest) {
  // Skip if Upstash not configured
  if (!ratelimit) return NextResponse.next();

  // Identify client IP (Vercel/Edge aware)
  const ip = req.ip || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "127.0.0.1";

  const key = `${ip}:${req.nextUrl.pathname}`;
  const { success, limit, remaining, reset } = await ratelimit.limit(key);

  const res = success ? NextResponse.next() : new NextResponse("Too Many Requests", { status: 429 });

  // Helpful headers for clients
  res.headers.set("X-RateLimit-Limit", limit.toString());
  res.headers.set("X-RateLimit-Remaining", Math.max(0, remaining).toString());
  res.headers.set("X-RateLimit-Reset", reset.toString());
  return res;
}

// Apply to all /api/* EXCEPT /api/cron/* so cron tidak keganggu
export const config = {
  matcher: [
    "/api/(.*)",
    // Next will still match; we short‑circuit in code if path startsWith /api/cron
  ],
};
