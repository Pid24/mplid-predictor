// src/app/api/hero-pools/route.ts
import { NextResponse } from "next/server";

const UPSTREAM = process.env.MPL_BASE?.replace(/\/+$/, "") || "https://mlbb-stats.ridwaanhall.com";

function normalizeName(s: string) {
  return s.normalize("NFKD").toLowerCase().replace(/\s+/g, " ").trim();
}

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const playerQ = searchParams.get("player");
  const url = `${UPSTREAM}/api/mplid/hero-pools/?format=json`;

  try {
    const res = await fetch(url, { next: { revalidate: 120 } });
    if (!res.ok) {
      return NextResponse.json({ error: "upstream_error", status: res.status, note: `Hero pools upstream HTTP ${res.status}` }, { status: 502 });
    }

    const list = (await res.json()) as any[];

    if (!playerQ) {
      // kalau gak ada filter, balikin semua (hati-hati bisa besar)
      return NextResponse.json(list, { status: 200 });
    }

    const needle = normalizeName(playerQ);
    const filtered = list.filter((x) => normalizeName(x.player_name || "") === needle);

    // Kalau gak ketemu exact, coba contains (quality-of-life)
    const finalData = filtered.length > 0 ? filtered : list.filter((x) => normalizeName(x.player_name || "").includes(needle));

    return NextResponse.json({ player: playerQ, results: finalData }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: "proxy_crash", message: e?.message || String(e), url }, { status: 500 });
  }
}
    