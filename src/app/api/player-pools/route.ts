// src/app/api/player-pools/route.ts
import { NextResponse } from "next/server";

export const runtime = "edge"; // ✅ Edge
export const revalidate = 0; // selalu fresh via server

const REMOTE = "https://mlbb-stats.ridwaanhall.com/api/mplid/player-pools/";

function parsePlayerInfo(info?: string) {
  if (!info) return { team: null as string | null, name: null as string | null };
  const [team, ...rest] = info.split(" - ");
  return { team: (team || "").trim() || null, name: (rest.join(" - ") || "").trim() || null };
}

function enrich(data: any[]) {
  return data.map((hero) => ({
    ...hero,
    players: (hero.players || []).map((p: any) => {
      const { team, name } = parsePlayerInfo(p.player_info);
      return { ...p, team, name };
    }),
  }));
}

function filterPools(data: any[], qTeam?: string | null, qPlayer?: string | null) {
  const team = qTeam?.toLowerCase();
  const player = qPlayer?.toLowerCase();
  if (!team && !player) return data;

  return data
    .map((hero) => {
      const players = (hero.players || []).filter((p: any) => {
        const okTeam = team ? (p.team || "").toLowerCase() === team : true;
        const okPlayer = player ? (p.name || "").toLowerCase().includes(player) : true;
        return okTeam && okPlayer;
      });
      return { ...hero, total: players.length, players };
    })
    .filter((h) => h.players.length > 0);
}

export async function GET(req: Request) {
  const fetchedAt = new Date().toISOString();
  const { searchParams } = new URL(req.url);
  const team = searchParams.get("team");
  const player = searchParams.get("player");
  const raw = searchParams.get("raw");

  try {
    const res = await fetch(REMOTE, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "MPLID-Predictor/1.0 (+player-pools)",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Upstream error", status: res.status }, { status: res.status, headers: { "x-data-fetched-at": fetchedAt } });
    }

    const data = await res.json();
    if (raw) return new NextResponse(JSON.stringify(data), { status: 200, headers: { "x-data-fetched-at": fetchedAt } });

    const enriched = enrich(data);
    const filtered = filterPools(enriched, team, player);
    return new NextResponse(JSON.stringify(filtered), { status: 200, headers: { "x-data-fetched-at": fetchedAt } });
  } catch {
    return new NextResponse(JSON.stringify({ error: "Failed to fetch player-pools upstream" }), {
      status: 502,
      headers: { "x-data-fetched-at": fetchedAt },
    });
  }
}
