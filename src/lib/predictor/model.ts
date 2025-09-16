export type StandRow = {
  team: string;
  points?: number | null;
  game_diff?: number | null;
};

export type TeamStatsRow = {
  team_name: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  lord?: number;
  tortoise?: number;
  tower?: number;
};

export type PlayerPoolHero = {
  hero_name: string;
  players?: Array<{ team?: string | null; pick?: number | null }>;
};

export type TeamFeatures = {
  team: string;
  standPts: number; // 0..1
  gameDiff: number; // 0..1
  kdaEff: number; // 0..1
  objCtrl: number; // 0..1
  draftDepth: number; // 0..1
  score: number; // linear combo
};

function normNum(n?: number | null) {
  return typeof n === "number" && isFinite(n) ? n : 0;
}
function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}
function minmax(x: number, min: number, max: number) {
  if (max <= min) return 0.5;
  return clamp01((x - min) / (max - min));
}
function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}
function clampProb(p: number, lo = 0.1, hi = 0.9) {
  return Math.max(lo, Math.min(hi, p));
}

export function buildFeaturesForTeams(params: {
  teamA: string;
  teamB: string;
  standings: StandRow[];
  teamStats: TeamStatsRow[];
  playerPools: PlayerPoolHero[];
  weights?: Partial<{
    wStandPts: number;
    wGameDiff: number;
    wKdaEff: number;
    wObjCtrl: number;
    wDraftDepth: number;
    alpha: number;
  }>;
}) {
  const { teamA, teamB, standings, teamStats, playerPools, weights = {} } = params;

  const W = {
    wStandPts: weights.wStandPts ?? 0.3,
    wGameDiff: weights.wGameDiff ?? 0.2,
    wKdaEff: weights.wKdaEff ?? 0.2,
    wObjCtrl: weights.wObjCtrl ?? 0.2,
    wDraftDepth: weights.wDraftDepth ?? 0.1,
    alpha: weights.alpha ?? 3.0,
  };

  const norm = (s?: string) => (s ?? "").trim().toLowerCase();

  const ptsArr = standings.map((s) => normNum(s.points ?? 0));
  const gdArr = standings.map((s) => normNum(s.game_diff ?? 0));
  const ptsMin = Math.min(...ptsArr, 0);
  const ptsMax = Math.max(...ptsArr, 1);
  const gdMin = Math.min(...gdArr, -10);
  const gdMax = Math.max(...gdArr, 10);

  function findStand(t: string) {
    const n = norm(t);
    return standings.find((s) => norm(s.team) === n);
  }

  const kdaArr = teamStats.map((ts) => {
    const k = normNum(ts.kills);
    const d = normNum(ts.deaths);
    const a = normNum(ts.assists);
    return (k + a) / (d + 1);
  });
  const objArr = teamStats.map((ts) => normNum(ts.lord) + normNum(ts.tortoise) + normNum(ts.tower));
  const kdaMin = Math.min(...kdaArr, 0);
  const kdaMax = Math.max(...kdaArr, 5);
  const objMin = Math.min(...objArr, 0);
  const objMax = Math.max(...objArr, 50);

  function findTeamStats(t: string) {
    const n = norm(t);
    return teamStats.find((s) => norm(s.team_name) === n);
  }

  function draftDepthForTeam(t: string) {
    const n = norm(t);
    let unique = 0;
    for (const hero of playerPools) {
      const picks = (hero.players ?? []).filter((p) => p.team && norm(p.team) === n && normNum(p.pick) > 0);
      if (picks.length > 0) unique += 1;
    }
    return unique;
  }

  const depthAll: Record<string, number> = {};
  for (const hero of playerPools) {
    for (const p of hero.players ?? []) {
      if (!p.team) continue;
      const key = norm(p.team);
      depthAll[key] = (depthAll[key] ?? 0) + (normNum(p.pick) > 0 ? 1 : 0);
    }
  }
  const allDepthVals = Object.values(depthAll);
  const depthMin = Math.min(...allDepthVals, 5);
  const depthMax = Math.max(...allDepthVals, 30);

  function featuresOf(team: string): TeamFeatures {
    const st = findStand(team);
    const ts = findTeamStats(team);
    const detPts = minmax(normNum(st?.points), ptsMin, ptsMax);
    const detGd = minmax(normNum(st?.game_diff), gdMin, gdMax);

    const kda = (normNum(ts?.kills) + normNum(ts?.assists)) / (normNum(ts?.deaths) + 1);
    const kdaN = minmax(kda, kdaMin, kdaMax);

    const obj = normNum(ts?.lord) + normNum(ts?.tortoise) + normNum(ts?.tower);
    const objN = minmax(obj, objMin, objMax);

    const depth = draftDepthForTeam(team);
    const depthN = minmax(depth, depthMin, depthMax);

    const score = W.wStandPts * detPts + W.wGameDiff * detGd + W.wKdaEff * kdaN + W.wObjCtrl * objN + W.wDraftDepth * depthN;

    return {
      team,
      standPts: detPts,
      gameDiff: detGd,
      kdaEff: kdaN,
      objCtrl: objN,
      draftDepth: depthN,
      score,
    };
  }

  const fA = featuresOf(teamA);
  const fB = featuresOf(teamB);

  const margin = fA.score - fB.score;
  const pA = clampProb(sigmoid(W.alpha * margin), 0.1, 0.9);
  const pB = 1 - pA;

  return { fA, fB, pA, pB, alpha: W.alpha };
}
