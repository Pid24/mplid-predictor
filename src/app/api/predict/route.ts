// src/app/api/predict/route.ts
import { NextRequest, NextResponse } from "next/server";
import { computePredict, StandRow, TeamStatsRow, PlayerStatsRow, SLUG_TO_OFFICIAL } from "@/lib/predict";

function norm(s?: string) {
  return (s ?? "").trim().toLowerCase();
}

export const revalidate = 30;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const home = searchParams.get("home");
  const away = searchParams.get("away");

  if (!home || !away) {
    return NextResponse.json({ error: "Query required: ?home=<slug>&away=<slug>" }, { status: 400 });
  }
  if (norm(home) === norm(away)) {
    return NextResponse.json({ error: "home dan away tidak boleh sama" }, { status: 400 });
  }

  // Ambil data: standings (proxy internal), team-stats & player-stats (upstream)
  // NB: sesuaikan base jika kamu punya NEXT_PUBLIC_BASE_URL
  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "";
  const standURL = base ? `${base}/api/standings` : `${req.nextUrl.origin}/api/standings`;

  try {
    const [standRes, tstatsRes, pstatsRes] = await Promise.all([
      fetch(standURL, { next: { revalidate: 60 } }),
      fetch(`https://mlbb-stats.ridwaanhall.com/api/mplid/team-stats/?format=json`, { cache: "no-store" }),
      fetch(`https://mlbb-stats.ridwaanhall.com/api/mplid/player-stats/?format=json`, { cache: "no-store" }),
    ]);

    if (!standRes.ok) throw new Error(`standings HTTP ${standRes.status}`);
    if (!tstatsRes.ok) throw new Error(`team-stats HTTP ${tstatsRes.status}`);
    if (!pstatsRes.ok) throw new Error(`player-stats HTTP ${pstatsRes.status}`);

    const standings = (await standRes.json()) as StandRow[];
    const teamStats = (await tstatsRes.json()) as TeamStatsRow[];
    const playerStats = (await pstatsRes.json()) as PlayerStatsRow[];

    // Validasi slug
    const validSlugs = new Set(Object.keys(SLUG_TO_OFFICIAL));
    if (!validSlugs.has(norm(home)) || !validSlugs.has(norm(away))) {
      return NextResponse.json({ error: "Slug tim tidak valid. Gunakan: " + Array.from(validSlugs).join(", ") }, { status: 400 });
    }

    const result = computePredict(norm(home), norm(away), standings, teamStats, playerStats);
    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}
