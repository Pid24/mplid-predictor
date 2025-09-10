// src/app/api/player-pools/route.ts
import { NextResponse } from "next/server";

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
  const { searchParams } = new URL(req.url);
  const team = searchParams.get("team");
  const player = searchParams.get("player");
  const raw = searchParams.get("raw");

  try {
    const res = await fetch(REMOTE, { cache: "no-store", next: { revalidate: 0 } });
    if (!res.ok) {
      return NextResponse.json({ error: "Upstream error", status: res.status }, { status: res.status });
    }
    const data = await res.json();
    if (raw) return NextResponse.json(data, { status: 200 });

    const enriched = enrich(data);
    const filtered = filterPools(enriched, team, player);
    return NextResponse.json(filtered, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to fetch player-pools upstream" }, { status: 502 });
  }
}
