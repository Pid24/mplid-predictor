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
/**
 * Strength map berbasis standings:
 * - strength mentah = points + 0.5*game_diff (keduanya dari standings)
 * - normalisasi z-score agar liga punya mean~0, std~1
 * - konversi ke skala centering di 1.0 (1 + z/stdlike*scale) supaya tidak negatif
 * Rumus ini sederhana tapi stabil buat backbone SoS.
 */
function buildOpponentStrengthMap(standMap: Map<string, { points: number; gdiff: number }>) {
  const keys = Array.from(standMap.keys());
  const raw = keys.map((k) => {
    const r = standMap.get(k)!;
    return safeNum(r.points) + 0.5 * safeNum(r.gdiff);
  });
  const m = mean(raw);
  const s = stddev(raw) || 1;

  // skala 0.75 → strength rata2 ~1.0; kuat ~1.2; lemah ~0.8 (kurang lebih)
  const SCALE = 0.75;

  const map = new Map<string, number>();
  keys.forEach((k, i) => {
    const zed = (raw[i] - m) / s;
    const strength = 1 + SCALE * zed;
    // jaga batas supaya tidak ekstrem
    map.set(k, Math.max(0.6, Math.min(1.4, strength)));
  });
  return map;
}

/**
 * Bobot waktu berbasis "week" (semakin baru semakin berat).
 * τ (tau) dalam satuan minggu. default 3 → match 3 minggu lalu bobotnya ~e^-1 ≈ 0.37
 */
function timeDecayByWeek(currWeek: number, matchWeek: number, tau = 3) {
  const delta = Math.max(0, currWeek - matchWeek);
  return Math.exp(-(delta / Math.max(1, tau)));
}

/**
 * Hitung SoS-adjusted form untuk sebuah tim:
 * - Ambil N match terakhir dari H2H_MATCHES (semua lawan).
 * - Setiap match punya:
 *    * result = +1 (menang seri) / -1 (kalah seri) / 0 (draw; jarang)
 *    * weight waktu = exp(-Δweek/τ)
 *    * strength lawan = dari standings map (normalized ~ [0.6..1.4])
 * - Skor form = Σ (result * weight * strength) / Σ weight
 * - Mapping ke skala ringkas ~ [-3..+3] (agar seragam ke fitur lain).
 */
function computeSoSForm(slug: string, standMap: Map<string, { points: number; gdiff: number }>, opts?: { lastN?: number; tau?: number }) {
  const s = toSlug(slug);
  const all = H2H_MATCHES.filter((m) => m.home === s || m.away === s).sort((a, b) => a.week - b.week);

  const lastN = Math.max(1, opts?.lastN ?? 5); // default 5 seri terakhir
  const tau = opts?.tau ?? 3; // peluruhan mingguan

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
    const oppStr = strengthMap.get(oppSlug) ?? 1.0; // kalau tidak ada, anggap 1

    const wTime = timeDecayByWeek(currentWeek, m.week, tau);
    const w = wTime;

    num += result * w * oppStr;
    den += w;
  }

  if (den <= 0) return 0;
  const score = num / den; // biasanya sekitar [-1..+1] jika strength mendatar

  // scale ke ~[-3..+3] agar sebanding dengan z lainnya
  const S = 3.0;
  return Math.max(-S, Math.min(S, score * S));
}

/**
 * Head-to-Head ringkas (total diff) antara A dan B.
 * Diberi decay waktu agar yang terbaru lebih menonjol (opsional kecil).
 */
function h2hDiffRecent(a: string, b: string, opts?: { tau?: number }) {
  const tau = opts?.tau ?? 4; // decay lebih lambat dari form
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

  const diff = aScore - bScore; // bisa non-integer karena weighted
  return { aWins: aScore, bWins: bScore, diff };
}

// -------------------- existing helper --------------------
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

// -------------------- MODEL: linear + logistic (SoS-enabled) --------------------
export function predictAB(aSlug: string, bSlug: string, standMap: Map<string, { points: number; gdiff: number }>): Explain {
  const a = toSlug(aSlug),
    b = toSlug(bSlug);

  // --- fitur utama ---
  // (1) Form SoS-adjusted + time-decay
  const formA = computeSoSForm(a, standMap, { lastN: 5, tau: 3 });
  const formB = computeSoSForm(b, standMap, { lastN: 5, tau: 3 });

  // (2) H2H dengan decay ringan (biar yang baru lebih berpengaruh)
  const { diff: h2h } = h2hDiffRecent(a, b, { tau: 4 });

  // (3) Poin standings & game diff mentah
  const pa = standMap.get(a)?.points ?? 0;
  const pb = standMap.get(b)?.points ?? 0;
  const ga = standMap.get(a)?.gdiff ?? 0;
  const gb = standMap.get(b)?.gdiff ?? 0;

  // --- normalisasi ke skala seragam (heuristik) ---
  // Catatan: form SoS sudah dalam skala [-3..+3]; jadi std ~ 1 kira-kira.
  const zFormA = formA; // treat already scaled
  const zFormB = formB;

  // H2H recent akan kecil; kita skala tipis agar comparable
  const zH2H = h2h; // biarkan relatif kecil, bobot akan mengontrol

  // Standings heuristik
  const zPtsA = z(pa, 6, 3); // asumsi range poin musim reguler
  const zPtsB = z(pb, 6, 3);
  const zGDifA = z(ga, 0, 4);
  const zGDifB = z(gb, 0, 4);

  // --- bobot (bisa di-tweak) ---
  // Prioritas: form (SoS+decay) > points > game diff > H2H
  const wForm = 1.1;
  const wPts = 0.7;
  const wGd = 0.45;
  const wH2H = 0.35;

  // --- skor linear (A minus B) ---
  const score = wForm * (zFormA - zFormB) + wPts * (zPtsA - zPtsB) + wGd * (zGDifA - zGDifB) + wH2H * zH2H;

  // --- mapping ke probabilitas ---
  const alpha = 2.8; // “tajamnya” sigmoid (tune via backtest)
  const pA = clamp01(logistic(alpha * score));
  const pB = 1 - pA;

  return {
    h2h: { a: Number(Math.max(0, zH2H).toFixed(2)), b: Number(Math.max(0, -zH2H).toFixed(2)), diff: Number(zH2H.toFixed(2)), weight: wH2H },
    form: { a: Number(zFormA.toFixed(2)), b: Number(zFormB.toFixed(2)), diff: Number((zFormA - zFormB).toFixed(2)), weight: wForm },
    points: { a: pa, b: pb, diff: pa - pb, weight: wPts },
    gdiff: { a: ga, b: gb, diff: ga - gb, weight: wGd },
    rawScore: Number(score.toFixed(4)),
    probA: pA,
    probB: pB,
  };
}
