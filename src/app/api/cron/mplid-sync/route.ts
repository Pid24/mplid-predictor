import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getJSON, StandingDTO, TeamDTO, TeamStatsDTO } from "@/lib/mpl";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";
// Pastikan route ini berjalan di Node.js runtime (bukan Edge) karena Prisma.
export const runtime = "nodejs";

export async function GET() {
  try {
    const [teams, standings, teamStats] = await Promise.all<[TeamDTO[], StandingDTO[], TeamStatsDTO[]]>([getJSON("/teams/"), getJSON("/standings/"), getJSON("/team-stats/")]);

    const teamIdByName = new Map<string, string>();

    // Helper: upsert team by name dan cache id-nya di map
    const ensureTeamId = async (nameRaw: string) => {
      const name = nameRaw.trim(); // normalisasi ringan
      const cached = teamIdByName.get(name);
      if (cached) return cached;

      const rec = await prisma.team.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      teamIdByName.set(name, rec.id);
      return rec.id;
    };

    // 1) Teams
    for (const t of teams) {
      const name = t.name.trim();
      const team = await prisma.team.upsert({
        where: { name },
        update: {
          tag: t.tag ?? null,
          logo: t.logo ?? null,
          extId: t.id ?? null,
        },
        create: {
          name,
          tag: t.tag ?? null,
          logo: t.logo ?? null,
          extId: t.id ?? null,
        },
      });
      teamIdByName.set(name, team.id);
    }

    // 2) Standings + rating seed
    for (const s of standings) {
      const teamId = await ensureTeamId(s.team);
      const season = s.season ?? "S??";

      const games = s.wins + s.losses || 1;
      const winPct = s.wins / games;
      const gd = s.game_diff ?? 0;
      const pts = s.points ?? 0;

      // Seed rating sederhana (silakan tweak koefisien)
      const seededRating = 1500 + (winPct - 0.5) * 400 + gd * 8 + pts * 5;

      await prisma.standing.upsert({
        where: { teamId_season: { teamId, season } },
        update: {
          rank: s.rank,
          wins: s.wins,
          losses: s.losses,
          points: s.points ?? null,
        },
        create: {
          teamId,
          season,
          rank: s.rank,
          wins: s.wins,
          losses: s.losses,
          points: s.points ?? null,
        },
      });

      await prisma.team.update({
        where: { id: teamId },
        data: { rating: seededRating, season },
      });
    }

    // 3) Team stats
    for (const ts of teamStats) {
      const teamId = await ensureTeamId(ts.team);

      await prisma.teamStats.upsert({
        where: { teamId },
        update: {
          gamesPlayed: ts.games_played,
          wins: ts.wins,
          losses: ts.losses,
          kda: ts.kda ?? null,
          gpm: ts.gpm ?? null,
          objRate: ts.obj_rate ?? null,
        },
        create: {
          teamId,
          gamesPlayed: ts.games_played,
          wins: ts.wins,
          losses: ts.losses,
          kda: ts.kda ?? null,
          gpm: ts.gpm ?? null,
          objRate: ts.obj_rate ?? null,
        },
      });
    }

    // Revalidate semua halaman/endpoint yang pakai tag "mplid"
    revalidateTag("mplid");

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    // log singkat + response konsisten
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[mplid-sync] error:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
