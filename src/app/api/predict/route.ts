import { NextRequest, NextResponse } from "next/server";
import { getJSON } from "@/lib/mpl";

type Stand = { team: string; wins: number; losses: number; points?: number; game_diff?: number };
type TeamStats = { team: string; kda?: number; gpm?: number; obj_rate?: number };

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

export async function GET(req: NextRequest) {
  const teamA = req.nextUrl.searchParams.get("teamA");
  const teamB = req.nextUrl.searchParams.get("teamB");
  if (!teamA || !teamB) return NextResponse.json({ error: "teamA & teamB required" }, { status: 400 });

  try {
    // Tarik data yang diperlukan
    const [standings, stats] = await Promise.all([getJSON<Stand[]>("/standings/"), getJSON<TeamStats[]>("/team-stats/")]);

    // Helper cari data per tim (case-insensitive + alias sederhana)
    const norm = (s: string) => s.trim().toLowerCase();
    const findStand = (name: string) => standings.find((s) => norm(s.team) === norm(name));
    const findStats = (name: string) => stats.find((s) => norm(s.team) === norm(name));

    const sA = findStand(teamA),
      sB = findStand(teamB);
    if (!sA || !sB) {
      return NextResponse.json({ error: "team not found in standings", teams: [teamA, teamB] }, { status: 404 });
    }

    // Seed rating sederhana dari standings
    const seed = (s: Stand) => {
      const games = s.wins + s.losses || 1;
      const winPct = s.wins / games;
      const gd = s.game_diff ?? 0;
      const pts = s.points ?? 0;
      return 1500 + (winPct - 0.5) * 400 + gd * 8 + pts * 5;
    };

    const rA = seed(sA);
    const rB = seed(sB);

    // Bonus kecil dari stats (kalau ada)
    const tA = findStats(teamA);
    const tB = findStats(teamB);
    const f = (v?: number) => (Number.isFinite(v as number) ? (v as number) : 0);
    const feat = 5 * (f(tA?.kda) - f(tB?.kda)) + 0.02 * (f(tA?.gpm) - f(tB?.gpm)) + 10 * (f(tA?.obj_rate) - f(tB?.obj_rate));

    // Logit konservatif
    const eloGap = rA - rB;
    const logit = eloGap / 40 + feat / 100;
    const pA = sigmoid(logit);

    return NextResponse.json({
      teamA: { name: sA.team, rating: rA },
      teamB: { name: sB.team, rating: rB },
      probA: pA,
      probB: 1 - pA,
      model: "api-elo-lite-v1",
      notes: "Tanpa DB: rating disusun dari standings + bonus kecil dari team-stats.",
    });
  } catch (e: any) {
    return NextResponse.json({ error: "upstream_error", message: e.message }, { status: 502 });
  }
}
