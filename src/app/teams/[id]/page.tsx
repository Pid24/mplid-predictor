import Image from "next/image";
import Link from "next/link";
import { getBaseUrl } from "@/lib/base-url";

import PlayerHeroPools from "@/components/PlayerHeroPools";

export const dynamic = "force-dynamic";

type TeamListItem = { id: string; name: string; tag?: string | null; logo?: string | null };
type StandRow = { rank: number; team: string; points?: number | null; match_wl?: string | null; game_wl?: string | null; game_diff?: number | null; logo?: string | null };
type TeamStatsRow = { team_name: string; team_logo?: string | null; kills?: number; deaths?: number; assists?: number; gold?: number; damage?: number; lord?: number; tortoise?: number; tower?: number };
type PlayerStatsRow = {
  player_name: string;
  player_logo?: string | null;
  lane?: string;
  total_games?: number;
  total_kills?: number;
  avg_kills?: number;
  total_deaths?: number;
  avg_deaths?: number;
  total_assists?: number;
  avg_assists?: number;
  avg_kda?: number;
  kill_participation?: string;
};

function norm(s?: string) {
  return (s ?? "").trim().toLowerCase();
}

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

function formatNum(n?: number | null) {
  if (n == null) return "-";
  return n.toLocaleString("id-ID");
}

export default async function TeamDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const base = await getBaseUrl(); // ⬅️ penting: await

  const teamsRes = await fetch(`${base}/api/teams`, { next: { revalidate: 300 } });
  const teams: TeamListItem[] = teamsRes.ok ? await teamsRes.json() : [];
  const team = teams.find((t) => t.id === id);

  if (!team) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <Link href="/teams" className="underline text-sm">
          ← Back to Teams
        </Link>
        <h1 className="text-2xl font-bold mt-3">Team not found</h1>
        <p className="opacity-70 mt-2">ID: {id}</p>
      </main>
    );
  }

  const official = SLUG_TO_OFFICIAL[id] || team.name;

  const [standRes, tstatsRes, pstatsRes] = await Promise.all([
    fetch(`${base}/api/standings`, { next: { revalidate: 60 } }),
    fetch(`https://mlbb-stats.ridwaanhall.com/api/mplid/team-stats/?format=json`, { cache: "no-store", headers: { Accept: "application/json" } }),
    fetch(`https://mlbb-stats.ridwaanhall.com/api/mplid/player-stats/?format=json`, { cache: "no-store", headers: { Accept: "application/json" } }),
  ]);

  const standings: StandRow[] = standRes.ok ? await standRes.json() : [];
  const teamStatsList: TeamStatsRow[] = tstatsRes.ok ? await tstatsRes.json() : [];
  const playerStatsList: PlayerStatsRow[] = pstatsRes.ok ? await pstatsRes.json() : [];

  const sRow = standings.find((s) => norm(s.team) === norm(official));
  const stRow = teamStatsList.find((s) => norm(s.team_name) === norm(official));

  const re = SLUG_TO_PLAYERLOGO_RE[id] || new RegExp(`/${id}[-_]`, "i");
  const rosterRaw = playerStatsList.filter((p) => (p.player_logo ? re.test(p.player_logo) : false));
  rosterRaw.sort((a, b) => (b.total_games ?? 0) - (a.total_games ?? 0) || (b.avg_kda ?? 0) - (a.avg_kda ?? 0));

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between">
        <Link href="/teams" className="underline text-sm">
          ← Back to Teams
        </Link>
        <div className="text-xs opacity-60">ID: {id}</div>
      </div>

      <div className="flex items-center gap-3 mt-3">
        {team.logo ? <Image src={team.logo} alt={team.name} width={56} height={56} className="rounded" /> : <div className="h-14 w-14 rounded bg-gray-100" />}
        <div>
          <h1 className="text-2xl font-bold">{official}</h1>
          {team.tag && <div className="text-sm opacity-70">{team.tag}</div>}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <div className="rounded-xl border p-4">
          <div className="text-sm opacity-70">Rank</div>
          <div className="text-2xl font-semibold">{sRow?.rank ?? "-"}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm opacity-70">Match W–L</div>
          <div className="text-2xl font-semibold">{sRow?.match_wl ?? "-"}</div>
          <div className="text-xs opacity-60 mt-1">Game W–L: {sRow?.game_wl ?? "-"}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm opacity-70">Points / Net GW</div>
          <div className="text-2xl font-semibold">
            {sRow?.points ?? "-"} <span className="text-base opacity-60">/ {sRow?.game_diff ?? "-"}</span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Team Stats</h2>
        {stRow ? (
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="rounded-xl border p-4">
              <div className="text-sm opacity-70">Kills / Deaths / Assists</div>
              <div className="text-xl font-semibold">
                {formatNum(stRow.kills)} / {formatNum(stRow.deaths)} / {formatNum(stRow.assists)}
              </div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-sm opacity-70">Gold</div>
              <div className="text-xl font-semibold">{formatNum(stRow.gold)}</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-sm opacity-70">Damage</div>
              <div className="text-xl font-semibold">{formatNum(stRow.damage)}</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-sm opacity-70">Lord / Turtle / Tower</div>
              <div className="text-xl font-semibold">
                {formatNum(stRow.lord)} / {formatNum(stRow.tortoise)} / {formatNum(stRow.tower)}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded border p-4 text-sm">Belum ada data team-stats untuk tim ini.</div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Roster (berdasarkan player-stats)</h2>
        {rosterRaw.length === 0 ? (
          <div className="rounded border p-4 text-sm">Belum ada data pemain yang cocok dengan tim ini.</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {rosterRaw.map((p, idx) => (
              <div key={`${p.player_name}-${idx}`} className="rounded-xl border p-4 flex gap-3 items-start bg-white">
                {p.player_logo ? <Image src={p.player_logo} alt={p.player_name} width={40} height={40} className="rounded" /> : <div className="h-10 w-10 rounded bg-gray-100" />}
                <div className="min-w-0">
                  <PlayerHeroPools playerName={p.player_name} className="font-medium underline underline-offset-2 decoration-dotted hover:no-underline text-blue-600" />
                  <div className="text-xs opacity-70">{p.lane || "-"}</div>
                  <div className="text-xs opacity-70 mt-1">
                    Games: {p.total_games ?? 0} • K/D/A rata-rata: {p.avg_kills ?? 0}/{p.avg_deaths ?? 0}/{p.avg_assists ?? 0} • KDA: {p.avg_kda ?? 0}
                  </div>
                  <div className="text-xs opacity-60">KP: {p.kill_participation ?? "-"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="text-xs opacity-60 mt-3">Catatan: roster diambil dari player-stats (filter berdasarkan logo pemain). Jika ada pemain salah tim, perkuat regex mapping di kode.</div>
      </div>
    </main>
  );
}
