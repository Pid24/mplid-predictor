// src/lib/predict.ts
import { H2H_MATCHES, toSlug } from "@/data/h2h";

// Bentuk minimal standings item yg kita pakai
export type StandRow = {
  team: string; // nama resmi
  points?: number | null;
  game_diff?: number | null;
};

export type TeamListItem = { id: string; name: string; logo?: string | null; tag?: string | null };

export type Explain = {
  h2h: { a: number; b: number; diff: number; weight: number };
  form: { a: number; b: number; diff: number; weight: number };
  points: { a: number; b: number; diff: number; weight: number };
  gdiff: { a: number; b: number; diff: number; weight: number };
  rawScore: number;
  probA: number;
  probB: number;
};

function z(n: number, mean: number, std: number) {
  return std > 0 ? (n - mean) / std : 0;
}

function clamp01(p: number, min = 0.1, max = 0.9) {
  return Math.min(max, Math.max(min, p));
}

function logistic(x: number) {
  return 1 / (1 + Math.exp(-x));
}

// Ambil recent form (last N series) dari H2H_MATCHES global (semua lawan)
function recentForm(slug: string, lastN = 3) {
  const played = H2H_MATCHES.filter((m) => m.home === slug || m.away === slug).sort((a, b) => a.week - b.week);
  const last = played.slice(-lastN);
  let wins = 0,
    losses = 0;
  for (const m of last) {
    const myScore = m.home === slug ? m.homeScore : m.awayScore;
    const oppScore = m.home === slug ? m.awayScore : m.homeScore;
    if (myScore > oppScore) wins++;
    else losses++;
  }
  return wins - losses; // -N..+N
}

// Head-to-Head ringkas (total diff) antara A dan B
function h2hDiff(a: string, b: string) {
  const games = H2H_MATCHES.filter((m) => (m.home === a && m.away === b) || (m.home === b && m.away === a));
  let aWins = 0,
    bWins = 0;
  for (const m of games) {
    if (m.home === a) {
      if (m.homeScore > m.awayScore) aWins++;
      else bWins++;
    } else if (m.away === a) {
      if (m.awayScore > m.homeScore) aWins++;
      else bWins++;
    }
  }
  return { aWins, bWins, diff: aWins - bWins };
}

// Normalisasi standings jadi map slug → row
export function buildStandMap(standings: StandRow[], teams: TeamListItem[]) {
  const nameBySlug = new Map<string, string>();
  for (const t of teams) {
    nameBySlug.set(t.id, t.name);
  }
  const map = new Map<string, { points: number; gdiff: number }>();
  for (const [slug, name] of nameBySlug.entries()) {
    const row = standings.find((s) => s.team.trim().toLowerCase() === name.trim().toLowerCase());
    map.set(slug, {
      points: row?.points ?? 0,
      gdiff: row?.game_diff ?? 0,
    });
  }
  return map;
}

// === Model linear sederhana + logistic ===
export function predictAB(aSlug: string, bSlug: string, standMap: Map<string, { points: number; gdiff: number }>): Explain {
  const a = toSlug(aSlug),
    b = toSlug(bSlug);

  // fitur
  const formA = recentForm(a),
    formB = recentForm(b);
  const { diff: h2h } = h2hDiff(a, b);
  const pa = standMap.get(a)?.points ?? 0;
  const pb = standMap.get(b)?.points ?? 0;
  const ga = standMap.get(a)?.gdiff ?? 0;
  const gb = standMap.get(b)?.gdiff ?? 0;

  // z-score kasar (pakai heuristik supaya skala seragam)
  const zFormA = z(formA, 0, 2);
  const zFormB = z(formB, 0, 2);
  const zH2H = z(h2h, 0, 1.5);
  const zPtsA = z(pa, 6, 3); // asumsi range poin musim reguler
  const zPtsB = z(pb, 6, 3);
  const zGDifA = z(ga, 0, 4);
  const zGDifB = z(gb, 0, 4);

  // bobot (bisa di-tweak): H2H & form > poin > game diff
  const wH2H = 0.9;
  const wForm = 0.9;
  const wPts = 0.6;
  const wGd = 0.4;

  // skor linear (A minus B)
  const score = wH2H * zH2H + wForm * (zFormA - zFormB) + wPts * (zPtsA - zPtsB) + wGd * (zGDifA - zGDifB);

  // mapping ke prob (logistic), clamp 10–90%
  const pA = clamp01(logistic(score));
  const pB = 1 - pA;

  return {
    h2h: { a: h2h + Math.max(0, 0), b: -h2h + Math.max(0, 0), diff: h2h, weight: wH2H },
    form: { a: formA, b: formB, diff: formA - formB, weight: wForm },
    points: { a: pa, b: pb, diff: pa - pb, weight: wPts },
    gdiff: { a: ga, b: gb, diff: ga - gb, weight: wGd },
    rawScore: score,
    probA: pA,
    probB: pB,
  };
}
