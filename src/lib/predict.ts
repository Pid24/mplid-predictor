// src/lib/predict.ts
import { h2hScore } from "@/data/h2h";

export type StandRow = {
  rank: number;
  team: string;
  points?: number | null;
  match_wl?: string | null;
  game_wl?: string | null;
  game_diff?: number | null;
  logo?: string | null;
};
export type TeamStatsRow = {
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
export type PlayerStatsRow = {
  player_name: string;
  player_logo?: string | null;
  lane?: string;
  total_games?: number;
  avg_kda?: number;
  kill_participation?: string;
};
export type PlayerPoolRow = {
  player_name: string;
  lane?: string;
  hero_pool?: Array<{ hero_logo?: string; pick?: number; pick_rate?: number }>;
};

export type PredictOutput = {
  home: string;
  away: string;
  prob_home: number;
  prob_away: number;
  score: number;
  features: Array<{ name: string; home: number; away: number; weight: number; contrib: number }>;
  explanations: { home_top: string[]; away_top: string[] };
  meta: { version: string; ts: string };
};

export const SLUG_TO_OFFICIAL: Record<string, string> = {
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
const norm = (s?: string) => (s ?? "").trim().toLowerCase();

export function minMax01(values: number[]): (x: number | null | undefined) => number {
  const nums = values.filter((v) => Number.isFinite(v)) as number[];
  const min = nums.length ? Math.min(...nums) : 0;
  const max = nums.length ? Math.max(...nums) : 1;
  return (x) => {
    if (x == null || !Number.isFinite(x)) return 0.5;
    if (max === min) return 0.5;
    return (x - min) / (max - min);
  };
}
function safePctStringToNum(s?: string | null): number | null {
  if (!s) return null;
  const m = String(s).match(/([\d.]+)/);
  if (!m) return null;
  const v = parseFloat(m[1]);
  if (!Number.isFinite(v)) return null;
  return v / 100;
}
function sigmoid(x: number, k = 2.2) {
  return 1 / (1 + Math.exp(-k * x));
}

// === Weights (aktifkan H2H manual) ===
const WEIGHTS: Record<string, number> = {
  standings_strength: 0.38,
  recent_form: 0.17, // masih netral 0.5 (belum ada endpoint khusus)
  team_efficiency: 0.2,
  head_to_head: 0.15, // <-- AKTIF (manual dari src/data/h2h.ts)
  lane_core_kda: 0.08,
  draft_edge: 0.02,
};

const LABELS: Record<string, string> = {
  standings_strength: "Standings & net game diff unggul",
  recent_form: "Form 5 match terakhir lebih baik",
  team_efficiency: "Efisiensi (gold/damage/objektif) unggul",
  head_to_head: "Head-to-head musim ini unggul",
  lane_core_kda: "Kekuatan core lanes (Jungle/Mid/Gold) lebih baik",
  draft_edge: "Hero-pool lebih lebar & fleksibel",
};

const SLUG_TO_PLAYERLOGO_RE: Record<string, RegExp> = {
  ae: /\/ae[-_]/i,
  btr: /btr[_-]vit|bigetron|\/btr/i,
  dewa: /\/dewa[-_]/i,
  evos: /\/evos[-_]/i,
  geek: /\/geek[-_]/i,
  onic: /\/onic[-_]/i,
  rrq: /\/rrq[-_]/i,
  tlid: /\/tlid[-_]|team[-_]?liquid/i,
  navi: /\/NAVI[-_]|\/navi[-_]/i,
};
function guessTeamRegex(teamOfficial: string): RegExp {
  const entry = Object.entries(SLUG_TO_OFFICIAL).find(([, off]) => norm(off) === norm(teamOfficial));
  if (!entry) return /$a/;
  const slug = entry[0] as keyof typeof SLUG_TO_PLAYERLOGO_RE;
  return SLUG_TO_PLAYERLOGO_RE[slug] ?? new RegExp(`/${slug}[-_]`, "i");
}
function heroKeyFromLogo(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/\/([^\/?#]+)\.(png|jpg|jpeg|webp)$/i);
  if (!m) return null;
  return m[1].toLowerCase();
}
function getCoreRoster(teamOfficial: string, playerStats: PlayerStatsRow[]) {
  const CORE = new Set(["JUNGLE", "MID", "GOLD"]);
  const re = guessTeamRegex(teamOfficial);
  const roster = playerStats.filter((p) => (p.player_logo ? re.test(p.player_logo) : false));
  return roster.filter((p) => (p.lane ? CORE.has(String(p.lane).toUpperCase()) : false));
}
function draftEdgeForTeam(teamOfficial: string, playerStats: PlayerStatsRow[], playerPools: PlayerPoolRow[]): number {
  const core = getCoreRoster(teamOfficial, playerStats);
  if (!core.length) return 0.5;
  const poolByName = new Map<string, PlayerPoolRow>();
  for (const pr of playerPools) poolByName.set(norm(pr.player_name), pr);

  const heroSet = new Set<string>();
  let topPickRate = 0;
  for (const p of core) {
    const pools = poolByName.get(norm(p.player_name))?.hero_pool ?? [];
    for (const h of pools) {
      const key = heroKeyFromLogo(h.hero_logo);
      if (key) heroSet.add(key);
      const pr = typeof h.pick_rate === "number" ? h.pick_rate : NaN;
      if (Number.isFinite(pr) && pr > topPickRate) topPickRate = pr;
    }
  }
  const breadthRaw = Math.min(heroSet.size, 40);
  const breadth = Math.max(0, Math.min(1, breadthRaw / 20));
  const conc = Math.max(0, Math.min(1, topPickRate / 100));
  const flexibility = 1 - conc;
  return 0.6 * breadth + 0.4 * flexibility || 0.5;
}

export function computePredict(homeSlug: string, awaySlug: string, standings: StandRow[], teamStats: TeamStatsRow[], playerStats: PlayerStatsRow[], playerPools?: PlayerPoolRow[]): PredictOutput {
  const homeName = SLUG_TO_OFFICIAL[homeSlug] || homeSlug.toUpperCase();
  const awayName = SLUG_TO_OFFICIAL[awaySlug] || awaySlug.toUpperCase();

  // Standings strength
  const scalePts = minMax01(standings.map((s) => s.points ?? 0));
  const scaleNet = minMax01(standings.map((s) => s.game_diff ?? 0));
  const standingsStrength = (teamOfficial: string) => {
    const s = standings.find((x) => norm(x.team) === norm(teamOfficial));
    if (!s) return 0.5;
    const pts = scalePts(s.points ?? 0);
    const net = scaleNet(s.game_diff ?? 0);
    return 0.6 * pts + 0.4 * net;
  };
  const f_stand_home = standingsStrength(homeName);
  const f_stand_away = standingsStrength(awayName);

  // Team efficiency
  const scaleGold = minMax01(teamStats.map((t) => t.gold ?? 0));
  const scaleDmg = minMax01(teamStats.map((t) => t.damage ?? 0));
  const scaleObj = minMax01(teamStats.map((t) => (t.lord ?? 0) + (t.tortoise ?? 0) + (t.tower ?? 0)));
  const teamEfficiency = (teamOfficial: string) => {
    const t = teamStats.find((x) => norm(x.team_name) === norm(teamOfficial));
    if (!t) return 0.5;
    const g = scaleGold(t.gold ?? 0);
    const d = scaleDmg(t.damage ?? 0);
    const o = scaleObj((t.lord ?? 0) + (t.tortoise ?? 0) + (t.tower ?? 0));
    return (g + d + o) / 3;
  };
  const f_eff_home = teamEfficiency(homeName);
  const f_eff_away = teamEfficiency(awayName);

  // Lane core KDA
  const CORE = new Set(["JUNGLE", "MID", "GOLD"]);
  const scaleKDA = minMax01(playerStats.map((p) => p.avg_kda ?? 0));
  const scaleKP = minMax01(playerStats.map((p) => (p.kill_participation ? safePctStringToNum(p.kill_participation) ?? 0 : 0)));
  const laneCoreKda = (teamOfficial: string) => {
    const re = guessTeamRegex(teamOfficial);
    const roster = playerStats.filter((p) => (p.player_logo ? re.test(p.player_logo) : false));
    const coreOnly = roster.filter((p) => (p.lane ? CORE.has(String(p.lane).toUpperCase()) : false));
    if (!coreOnly.length) return 0.5;
    const vals = coreOnly.map((p) => {
      const kda = scaleKDA(p.avg_kda ?? 0);
      const kp = scaleKP(p.kill_participation ? safePctStringToNum(p.kill_participation) ?? 0 : 0);
      return 0.7 * kda + 0.3 * kp;
    });
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };
  const f_lane_home = laneCoreKda(homeName);
  const f_lane_away = laneCoreKda(awayName);

  // Recent form (sementara netral)
  const f_form_home = 0.5;
  const f_form_away = 0.5;

  // Head-to-head dari dataset manual
  const { a: h2hA, b: h2hB } = h2hScore(homeSlug, awaySlug);
  const f_h2h_home = h2hA; // 0..1
  const f_h2h_away = h2hB;

  // Draft edge (opsional jika playerPools tersedia)
  let f_draft_home = 0.5,
    f_draft_away = 0.5;
  if (playerPools && playerPools.length) {
    f_draft_home = draftEdgeForTeam(homeName, playerStats, playerPools);
    f_draft_away = draftEdgeForTeam(awayName, playerStats, playerPools);
  }

  // Skor linear
  const features = [
    { name: "standings_strength", home: f_stand_home, away: f_stand_away, weight: WEIGHTS.standings_strength },
    { name: "recent_form", home: f_form_home, away: f_form_away, weight: WEIGHTS.recent_form },
    { name: "team_efficiency", home: f_eff_home, away: f_eff_away, weight: WEIGHTS.team_efficiency },
    { name: "head_to_head", home: f_h2h_home, away: f_h2h_away, weight: WEIGHTS.head_to_head },
    { name: "lane_core_kda", home: f_lane_home, away: f_lane_away, weight: WEIGHTS.lane_core_kda },
    { name: "draft_edge", home: f_draft_home, away: f_draft_away, weight: WEIGHTS.draft_edge },
  ].map((f) => ({ ...f, contrib: f.weight * (f.home - f.away) }));

  const score = features.reduce((acc, f) => acc + f.contrib, 0);
  const prob_home = sigmoid(score, 2.2);
  const prob_away = 1 - prob_home;

  const sorted = [...features].sort((a, b) => Math.abs(b.contrib) - Math.abs(a.contrib));
  const home_top = sorted
    .filter((f) => f.contrib > 0 && f.weight > 0)
    .slice(0, 3)
    .map((f) => LABELS[f.name]);
  const away_top = sorted
    .filter((f) => f.contrib < 0 && f.weight > 0)
    .slice(0, 3)
    .map((f) => LABELS[f.name]);

  return {
    home: homeName,
    away: awayName,
    prob_home,
    prob_away,
    score,
    features,
    explanations: { home_top, away_top },
    meta: { version: "v2.2-h2h-manual", ts: new Date().toISOString() },
  };
}
