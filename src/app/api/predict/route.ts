import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

type StandRow = {
  rank: number;
  team: string;
  points?: number | null;
  match_wl?: string | null;
  game_wl?: string | null;
  game_diff?: number | null;
  logo?: string | null;
};
type TeamStatsRow = {
  team_name: string;
  team_logo?: string | null;
  kills?: number;
  deaths?: number;
  assists?: number;
  gold?: number;
  damage?: number;
  lord?: number;
  tortoise?: number;
  tower?: number;
};

function getBaseUrl() {
  const env = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "");
  if (env) return env;
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
const norm = (s?: string) => (s ?? "").trim().toLowerCase();

const SLUG_TO_OFFICIAL: Record<string, string> = {
  ae: "ALTER EGO ESPORTS",
  btr: "BIGETRON BY VIT",
  dewa: "DEWA UNITED",
  evos: "EVOS",
  geek: "GEEK FAM",
  onic: "ONIC",
  rrq: "RRQ HOSHI",
  tlid: "TEAM LIQUID ID",
  navi: "NAVI",
};

function zNorm(x: number, mean: number, std: number) {
  return std > 0 ? (x - mean) / std : 0;
}
function minMax(x: number, min: number, max: number) {
  if (max === min) return 0.5;
  return (x - min) / (max - min);
}
function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Skor komposit per tim dari standings + team-stats.
 * - standings: points (lebih berat), game_diff
 * - team-stats: gold, damage, objectives (lord+turtle+tower), KDA proxy = kills/(deaths+1)
 */
function buildScores(stand: StandRow[], tstats: TeamStatsRow[]) {
  // index untuk cepat akses
  const standMap = new Map<string, StandRow>();
  for (const s of stand) standMap.set(norm(s.team), s);

  // kumpulkan nilai untuk normalisasi
  const pointsArr = stand.map((s) => s.points ?? 0);
  const gdiffArr = stand.map((s) => s.game_diff ?? 0);

  const goldArr = tstats.map((t) => t.gold ?? 0);
  const dmgArr = tstats.map((t) => t.damage ?? 0);
  const objArr = tstats.map((t) => (t.lord ?? 0) + (t.tortoise ?? 0) + (t.tower ?? 0));
  const kdaArr = tstats.map((t) => {
    const kills = t.kills ?? 0;
    const deaths = t.deaths ?? 0;
    return kills / (deaths + 1);
  });

  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const mean = (a: number[]) => (a.length ? sum(a) / a.length : 0);
  const std = (a: number[]) => {
    const m = mean(a);
    return Math.sqrt(mean(a.map((v) => (v - m) ** 2)));
  };

  const stats = {
    points: { min: Math.min(...pointsArr, 0), max: Math.max(...pointsArr, 1) },
    gdiff: { min: Math.min(...gdiffArr, 0), max: Math.max(...gdiffArr, 1) },
    gold: { mu: mean(goldArr), sd: std(goldArr) },
    dmg: { mu: mean(dmgArr), sd: std(dmgArr) },
    obj: { mu: mean(objArr), sd: std(objArr) },
    kda: { mu: mean(kdaArr), sd: std(kdaArr) },
  };

  // bobot fitur (bisa di-tune)
  const W = {
    points: 0.3,
    gdiff: 0.2,
    gold: 0.18,
    dmg: 0.14,
    obj: 0.12,
    kda: 0.06,
  };

  const scoreMap = new Map<string, { score: number; name: string }>();

  for (const t of tstats) {
    const key = norm(t.team_name);
    const s = standMap.get(key);

    const pointsN = minMax(s?.points ?? 0, stats.points.min, stats.points.max);
    const gdiffN = minMax(s?.game_diff ?? 0, stats.gdiff.min, stats.gdiff.max);
    const goldN = sigmoid(zNorm(t.gold ?? 0, stats.gold.mu, stats.gold.sd));
    const dmgN = sigmoid(zNorm(t.damage ?? 0, stats.dmg.mu, stats.dmg.sd));
    const objTot = (t.lord ?? 0) + (t.tortoise ?? 0) + (t.tower ?? 0);
    const objN = sigmoid(zNorm(objTot, stats.obj.mu, stats.obj.sd));
    const kdaN = sigmoid(zNorm((t.kills ?? 0) / ((t.deaths ?? 0) + 1), stats.kda.mu, stats.kda.sd));

    const score = W.points * pointsN + W.gdiff * gdiffN + W.gold * goldN + W.dmg * dmgN + W.obj * objN + W.kda * kdaN;

    scoreMap.set(key, { score, name: t.team_name });
  }

  // Pastikan tim yang mungkin tak punya team-stats tetap punya skor dari standings
  for (const s of stand) {
    const key = norm(s.team);
    if (!scoreMap.has(key)) {
      const pointsN = minMax(s.points ?? 0, stats.points.min, stats.points.max);
      const gdiffN = minMax(s.game_diff ?? 0, stats.gdiff.min, stats.gdiff.max);
      const score = 0.65 * pointsN + 0.35 * gdiffN; // fallback
      scoreMap.set(key, { score, name: s.team });
    }
  }

  return scoreMap;
}

export async function POST(req: NextRequest) {
  try {
    const { teamA, teamB } = (await req.json()) as { teamA: string; teamB: string };
    if (!teamA || !teamB) {
      return NextResponse.json({ error: "teamA & teamB wajib diisi" }, { status: 400 });
    }

    const base = getBaseUrl();
    const [standRes, tstatsRes] = await Promise.all([
      fetch(`${base}/api/standings`, { next: { revalidate: 60 } }),
      fetch(`https://mlbb-stats.ridwaanhall.com/api/mplid/team-stats/?format=json`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      }),
    ]);

    if (!standRes.ok || !tstatsRes.ok) {
      return NextResponse.json({ error: "Gagal ambil data sumber" }, { status: 500 });
    }

    const standings = (await standRes.json()) as StandRow[];
    const teamStats = (await tstatsRes.json()) as TeamStatsRow[];

    const scores = buildScores(standings, teamStats);

    const nameA = SLUG_TO_OFFICIAL[teamA] || teamA;
    const nameB = SLUG_TO_OFFICIAL[teamB] || teamB;

    const keyA = norm(nameA);
    const keyB = norm(nameB);

    const SA = scores.get(keyA)?.score ?? 0.5;
    const SB = scores.get(keyB)?.score ?? 0.5;

    // Bradley-Terry style: P(A) = sigmoid(k*(SA - SB))
    // k lebih besar -> distribusi lebih ekstrem (kami set 3.0 agar bisa tembus ~0.9 pada gap besar)
    const k = 3.0;
    const pA = sigmoid(k * (SA - SB));
    const pB = 1 - pA;

    // "confidence" heuristik dari |SA-SB|
    const confidence = Math.min(0.5 + Math.abs(SA - SB) * 0.9, 0.99);

    return NextResponse.json({
      teamA: { id: teamA, name: nameA, score: SA },
      teamB: { id: teamB, name: nameB, score: SB },
      probability: { teamA: pA, teamB: pB },
      confidence,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
