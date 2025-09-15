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

// -------------------- util umum --------------------
function z(n: number, mean: number, std: number) {
  return std > 0 ? (n - mean) / std : 0;
}
function clamp01(p: number, min = 0.1, max = 0.9) {
  return Math.min(max, Math.max(min, p));
}
function logistic(x: number) {
  return 1 / (1 + Math.exp(-x));
}
function mean(arr: number[]) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function stddev(arr: number[]) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const v = mean(arr.map((x) => (x - m) ** 2));
  return Math.sqrt(v);
}
function safeNum(n: number | null | undefined) {
  return typeof n === "number" && isFinite(n) ? n : 0;
}

// -------------------- SoS + Time Decay --------------------
function buildOpponentStrengthMap(standMap: Map<string, { points: number; gdiff: number }>) {
  const keys = Array.from(standMap.keys());
  const raw = keys.map((k) => {
    const r = standMap.get(k)!;
    return safeNum(r.points) + 0.5 * safeNum(r.gdiff);
  });
  const m = mean(raw);
  const s = stddev(raw) || 1;
  const SCALE = 0.75;

  const map = new Map<string, number>();
  keys.forEach((k, i) => {
    const zed = (raw[i] - m) / s;
    const strength = 1 + SCALE * zed;
    map.set(k, Math.max(0.6, Math.min(1.4, strength)));
  });
  return map;
}

function timeDecayByWeek(currWeek: number, matchWeek: number, tau = 3) {
  const delta = Math.max(0, currWeek - matchWeek);
  return Math.exp(-(delta / Math.max(1, tau)));
}

function computeSoSForm(slug: string, standMap: Map<string, { points: number; gdiff: number }>, opts?: { lastN?: number; tau?: number }) {
  const s = toSlug(slug);
  const all = H2H_MATCHES.filter((m) => m.home === s || m.away === s).sort((a, b) => a.week - b.week);

  const lastN = Math.max(1, opts?.lastN ?? 5);
  const tau = opts?.tau ?? 3;

  const last = all.slice(-lastN);
  if (last.length === 0) return 0;

  const currentWeek = Math.max(...H2H_MATCHES.map((m) => m.week), 1);
  const strengthMap = buildOpponentStrengthMap(standMap);

  let num = 0;
  let den = 0;

  for (const m of last) {
    const isHome = m.home === s;
    const myScore = isHome ? m.homeScore : m.awayScore;
    const oppScore = isHome ? m.awayScore : m.homeScore;

    let result = 0;
    if (myScore > oppScore) result = +1;
    else if (myScore < oppScore) result = -1;

    const oppSlug = isHome ? m.away : m.home;
    const oppStr = strengthMap.get(oppSlug) ?? 1.0;

    const wTime = timeDecayByWeek(currentWeek, m.week, tau);

    num += result * wTime * oppStr;
    den += wTime;
  }

  if (den <= 0) return 0;
  const score = num / den;
  const S = 3.0;
  return Math.max(-S, Math.min(S, score * S));
}

function h2hDiffRecent(a: string, b: string, opts?: { tau?: number }) {
  const tau = opts?.tau ?? 4;
  const currentWeek = Math.max(...H2H_MATCHES.map((m) => m.week), 1);

  const games = H2H_MATCHES.filter((m) => (m.home === a && m.away === b) || (m.home === b && m.away === a));
  if (games.length === 0) return { aWins: 0, bWins: 0, diff: 0 };

  let aScore = 0;
  let bScore = 0;

  for (const m of games) {
    const w = timeDecayByWeek(currentWeek, m.week, tau);
    if (m.home === a) {
      if (m.homeScore > m.awayScore) aScore += w;
      else if (m.homeScore < m.awayScore) bScore += w;
    } else if (m.away === a) {
      if (m.awayScore > m.homeScore) aScore += w;
      else if (m.awayScore < m.homeScore) bScore += w;
    }
  }

  const diff = aScore - bScore;
  return { aWins: aScore, bWins: bScore, diff };
}

// -------------------- existing helper --------------------
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

// -------------------- Best-of scaling --------------------
/**
 * boScaling menyesuaikan “tajamnya” margin untuk seri yang lebih panjang.
 * - bo=3 → 1.00 (baseline)
 * - bo=5 → ~1.10
 * - bo=7 → ~1.18
 * Kamu bisa tweak K agar lebih/kurang agresif.
 */
function boScaling(bo?: number) {
  const n = Math.max(1, Number(bo || 3));
  const K = 0.07; // sensitivitas
  return 1 + K * Math.max(0, n - 3);
}

// -------------------- MODEL: linear + logistic (SoS + BO) --------------------
export function predictAB(
  aSlug: string,
  bSlug: string,
  standMap: Map<string, { points: number; gdiff: number }>,
  opts?: { bo?: number } // <- opsional, backward-compatible
): Explain {
  const a = toSlug(aSlug),
    b = toSlug(bSlug);

  // --- fitur utama ---
  const formA = computeSoSForm(a, standMap, { lastN: 5, tau: 3 });
  const formB = computeSoSForm(b, standMap, { lastN: 5, tau: 3 });

  const { diff: h2h } = h2hDiffRecent(a, b, { tau: 4 });

  const pa = standMap.get(a)?.points ?? 0;
  const pb = standMap.get(b)?.points ?? 0;
  const ga = standMap.get(a)?.gdiff ?? 0;
  const gb = standMap.get(b)?.gdiff ?? 0;

  // --- normalisasi heuristik ---
  const zFormA = formA;
  const zFormB = formB;
  const zH2H = h2h;
  const zPtsA = z(pa, 6, 3);
  const zPtsB = z(pb, 6, 3);
  const zGDifA = z(ga, 0, 4);
  const zGDifB = z(gb, 0, 4);

  // --- bobot ---
  const wForm = 1.10;
  const wPts = 0.70;
  const wGd = 0.45;
  const wH2H = 0.35;

  // --- skor linear (A minus B) ---
  let score =
    wForm * (zFormA - zFormB) +
    wPts * (zPtsA - zPtsB) +
    wGd * (zGDifA - zGDifB) +
    wH2H * zH2H;

  // --- Best-of scaling ---
  const scale = boScaling(opts?.bo);
  score *= scale;

  // --- mapping ke probabilitas ---
  const alpha = 2.8;
  const pA = clamp01(logistic(alpha * score));
  const pB = 1 - pA;

  return {
    h2h: { a: Number((Math.max(0, zH2H)).toFixed(2)), b: Number((Math.max(0, -zH2H)).toFixed(2)), diff: Number(zH2H.toFixed(2)), weight: wH2H },
    form: { a: Number(zFormA.toFixed(2)), b: Number(zFormB.toFixed(2)), diff: Number((zFormA - zFormB).toFixed(2)), weight: wForm },
    points: { a: pa, b: pb, diff: pa - pb, weight: wPts },
    gdiff: { a: ga, b: gb, diff: ga - gb, weight: wGd },
    rawScore: Number(score.toFixed(4)),
    probA: pA,
    probB: pB,
  };
}
