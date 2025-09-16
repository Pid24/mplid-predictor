import type { Transfer } from "../mplid/transfers";

export function computeRosterImpactScore(
  teamNameOrCode: string,
  transfers: Transfer[],
  opts?: {
    daysWindow?: number;
    starterNames?: string[];
  }
) {
  const daysWindow = opts?.daysWindow ?? 30;
  const starters = new Set((opts?.starterNames ?? []).map((s) => s.toLowerCase()));
  const key = teamNameOrCode.toLowerCase();
  const now = Date.now();

  const related = transfers.filter((t) => t.toTeam?.toLowerCase() === key || t.fromTeam?.toLowerCase() === key);

  let impact = 0;
  for (const t of related) {
    const ts = t.dateISO ? Date.parse(t.dateISO) : NaN;
    if (Number.isNaN(ts)) continue;

    const diffDays = Math.max(0, Math.floor((now - ts) / 86400000));
    if (diffDays > daysWindow) continue;

    const freshness = 1 - diffDays / daysWindow;
    const isCore = starters.has(t.player.toLowerCase());
    const isCoach = t.isCoach;

    const base = 4;
    const mul = isCoach ? 0.5 : isCore ? 1.8 : 1.0;

    impact -= base * mul * freshness;
  }
  return impact;
}

export function applyRosterImpactToWinrate(winPct: number, impact: number) {
  const delta = Math.max(-12, Math.min(12, impact));
  const adjusted = Math.max(1, Math.min(99, winPct + delta));
  return Math.round(adjusted * 10) / 10;
}
