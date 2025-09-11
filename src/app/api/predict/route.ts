// src/app/api/predict/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/base-url";
import { buildStandMap, predictAB, StandRow, TeamListItem } from "@/lib/predict";

// biar konsisten dengan route lain
export const revalidate = 30;

function norm(s?: string) {
  return (s ?? "").trim().toLowerCase();
}

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

  try {
    const base = getBaseUrl();
    // Ambil data standings (via proxy internal) & daftar teams (slug->nama)
    const [standRes, teamsRes] = await Promise.all([fetch(`${base}/api/standings`, { next: { revalidate: 60 } }), fetch(`${base}/api/teams`, { next: { revalidate: 300 } })]);

    if (!standRes.ok) throw new Error(`standings HTTP ${standRes.status}`);
    if (!teamsRes.ok) throw new Error(`teams HTTP ${teamsRes.status}`);

    const standings = (await standRes.json()) as StandRow[];
    const teams = (await teamsRes.json()) as TeamListItem[];

    // validasi slug ada di list teams
    const validSlugs = new Set(teams.map((t) => t.id));
    if (!validSlugs.has(norm(home)) || !validSlugs.has(norm(away))) {
      return NextResponse.json({ error: "Slug tim tidak valid. Gunakan: " + Array.from(validSlugs).join(", ") }, { status: 400 });
    }

    // build map dan prediksi
    const standMap = buildStandMap(standings, teams);
    const explain = predictAB(home, away, standMap);

    const homeTeam = teams.find((t) => norm(t.id) === norm(home));
    const awayTeam = teams.find((t) => norm(t.id) === norm(away));

    return NextResponse.json(
      {
        ok: true,
        teams: {
          home: { slug: homeTeam?.id, name: homeTeam?.name, logo: homeTeam?.logo, tag: homeTeam?.tag },
          away: { slug: awayTeam?.id, name: awayTeam?.name, logo: awayTeam?.logo, tag: awayTeam?.tag },
        },
        probability: {
          [homeTeam?.name || home]: explain.probA,
          [awayTeam?.name || away]: explain.probB,
        },
        explain, // berisi breakdown: h2h, form, points, gdiff, rawScore, probA, probB
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}
