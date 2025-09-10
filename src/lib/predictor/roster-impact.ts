import type { Transfer } from "../mplid/transfers";

/**
 * Hitung skor dampak roster untuk sebuah tim:
 * - Transfer <= N hari terakhir kena penalti (makin baru, makin besar)
 * - Pemain inti (starterNames) bobot lebih tinggi
 * - Coach kena bobot kecil (tetap ada dampak strategi)
 */
export function computeRosterImpactScore(
  teamNameOrCode: string,
  transfers: Transfer[],
  opts?: {
    daysWindow?: number;
    starterNames?: string[]; // nama-nama inti (lower/Title bebas, dicocokkan case-insensitive)
  }
) {
  const daysWindow = opts?.daysWindow ?? 30;
  const starters = new Set((opts?.starterNames ?? []).map((s) => s.toLowerCase()));
  const key = teamNameOrCode.toLowerCase();
  const now = Date.now();

  const related = transfers.filter((t) => t.toTeam?.toLowerCase() === key || t.fromTeam?.toLowerCase() === key);

  let impact = 0; // negatif = nurunin keyakinan win
  for (const t of related) {
    const ts = t.dateISO ? Date.parse(t.dateISO) : NaN;
    if (Number.isNaN(ts)) continue;

    const diffDays = Math.max(0, Math.floor((now - ts) / 86400000));
    if (diffDays > daysWindow) continue;

    const freshness = 1 - diffDays / daysWindow; // 0..1
    const isCore = starters.has(t.player.toLowerCase());
    const isCoach = t.isCoach;

    const base = 4; // basis dampak
    const mul = isCoach ? 0.5 : isCore ? 1.8 : 1.0;

    impact -= base * mul * freshness;
  }
  return impact; // contoh: -2.5 .. -10
}

/** Terapkan impact ke winrate (0..100) dengan penjagaan batas */
export function applyRosterImpactToWinrate(winPct: number, impact: number) {
  const delta = Math.max(-12, Math.min(12, impact)); // batasi pergeseran
  const adjusted = Math.max(1, Math.min(99, winPct + delta));
  return Math.round(adjusted * 10) / 10;
}
