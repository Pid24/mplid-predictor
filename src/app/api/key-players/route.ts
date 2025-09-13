// src/app/api/key-players/route.ts
import { NextResponse } from "next/server";

type PlayerStats = {
  player_name: string;
  player_logo?: string | null;
  lane?: string | null;
  total_games?: number | null;
  avg_kills?: number | null;
  avg_deaths?: number | null;
  avg_assists?: number | null;
  avg_kda?: number | null;
  kill_participation?: string | null; // "55%"
};

// mapping slug → pola logo pemain (biar akurat nempel ke tim)
const SLUG_TO_PLAYERLOGO_RE: Record<string, RegExp> = {
  ae: /\/ae[-_]/i,
  btr: /btr[_-]vit|bigetron|\/btr/i,
  dewa: /\/dewa[-_]/i,
  evos: /\/evos[-_]/i,
  geek: /\/geek[-_]/i,
  onic: /\/onic[-_]/i,
  rrq: /\/rrq[-_]/i,
  tlid: /\/tlid[-_]|team[-_]?liquid/i,
  navi: /\/NAVI[-_]|\/navi[-_]/i,
};

function kpToNum(kp?: string | null) {
  if (!kp) return 0;
  const m = String(kp).match(/(\d+(?:\.\d+)?)\s*%/);
  return m ? Number(m[1]) : Number(kp) || 0;
}

function pickTop(players: PlayerStats[], n = 2) {
  const arr = [...players];
  arr.sort((a, b) => (b.avg_kda ?? 0) - (a.avg_kda ?? 0) || kpToNum(b.kill_participation) - kpToNum(a.kill_participation) || (b.total_games ?? 0) - (a.total_games ?? 0));
  return arr.slice(0, n);
}

export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamA = searchParams.get("teamA")?.toLowerCase() || "";
  const teamB = searchParams.get("teamB")?.toLowerCase() || "";

  if (!teamA || !teamB || teamA === teamB) {
    return NextResponse.json({ error: "Query invalid. Gunakan ?teamA=rrq&teamB=evos (dua tim berbeda)" }, { status: 400 });
  }

  try {
    const upstream = "https://mlbb-stats.ridwaanhall.com/api/mplid/player-stats/?format=json";
    const res = await fetch(upstream, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Upstream error", status: res.status }, { status: 502 });
    }

    const data = (await res.json()) as PlayerStats[];

    const reA = SLUG_TO_PLAYERLOGO_RE[teamA] || new RegExp(`/${teamA}[-_]`, "i");
    const reB = SLUG_TO_PLAYERLOGO_RE[teamB] || new RegExp(`/${teamB}[-_]`, "i");

    const listA = data.filter((p) => (p.player_logo ? reA.test(p.player_logo) : false));
    const listB = data.filter((p) => (p.player_logo ? reB.test(p.player_logo) : false));

    const topA = pickTop(listA, 2);
    const topB = pickTop(listB, 2);

    return NextResponse.json(
      {
        teamA: { id: teamA, players: topA },
        teamB: { id: teamB, players: topB },
        count: { A: listA.length, B: listB.length },
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch player-stats" }, { status: 502 });
  }
}
