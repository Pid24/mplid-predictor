// src/components/predictor/KeyPlayersPanel.tsx
"use client";

import { useEffect, useState } from "react";

type Player = {
  player_name: string;
  player_logo?: string | null;
  lane?: string | null;
  total_games?: number | null;
  avg_kda?: number | null;
  kill_participation?: string | null;
};

type Resp = {
  teamA: { id: string; players: Player[] };
  teamB: { id: string; players: Player[] };
  count: { A: number; B: number };
};

function initials(name?: string) {
  if (!name) return "?";
  const clean = name.replace(/[^A-Za-z0-9 ]/g, " ").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Avatar({ src, alt, size = 32 }: { src?: string | null; alt?: string; size?: number }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt ?? ""} width={size} height={size} className="rounded object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div className="rounded bg-gray-200 text-xs flex items-center justify-center" style={{ width: size, height: size }} aria-label={alt} title={alt}>
      {initials(alt)}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="text-[11px] opacity-70">
      {label}: <span className="font-medium opacity-100">{value ?? "-"}</span>
    </div>
  );
}

export default function KeyPlayersPanel({ teamAId, teamBId, teamAName, teamBName }: { teamAId: string; teamBId: string; teamAName?: string; teamBName?: string }) {
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!teamAId || !teamBId || teamAId === teamBId) return;
    let stop = false;
    async function run() {
      try {
        setLoading(true);
        setErr(null);
        setData(null);
        const res = await fetch(`/api/key-players?teamA=${encodeURIComponent(teamAId)}&teamB=${encodeURIComponent(teamBId)}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = (await res.json()) as Resp;
        if (!stop) setData(j);
      } catch (e: any) {
        if (!stop) setErr(e?.message || "Failed to load");
      } finally {
        if (!stop) setLoading(false);
      }
    }
    run();
    return () => {
      stop = true;
    };
  }, [teamAId, teamBId]);

  return (
    <div className="rounded-xl border p-4">
      <h3 className="font-semibold">Key Players to Watch</h3>

      {loading ? (
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-lg border p-3 animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
              {[0, 1].map((j) => (
                <div key={j} className="flex items-center gap-3 mt-2">
                  <div className="h-8 w-8 bg-gray-200 rounded" />
                  <div className="flex-1">
                    <div className="h-3 w-32 bg-gray-200 rounded mb-1" />
                    <div className="h-2 w-24 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : err ? (
        <div className="mt-3 text-sm text-red-600">Gagal memuat key players. {err}</div>
      ) : !data ? (
        <div className="mt-3 text-sm opacity-70">Pilih dua tim untuk melihat pemain kunci.</div>
      ) : (
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <TeamBox title={teamAName || teamAId} players={data.teamA.players} />
          <TeamBox title={teamBName || teamBId} players={data.teamB.players} />
        </div>
      )}
    </div>
  );
}

function TeamBox({ title, players }: { title: string; players: Player[] }) {
  return (
    <div className="rounded-lg border p-3 bg-white">
      <div className="text-sm font-medium mb-2">{title}</div>
      {players.length === 0 ? (
        <div className="text-xs opacity-70">Belum ada data pemain yang cocok.</div>
      ) : (
        <div className="space-y-2">
          {players.map((p, idx) => (
            <div key={`${p.player_name}-${idx}`} className="flex items-center gap-3">
              <Avatar src={p.player_logo} alt={p.player_name} />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{p.player_name}</div>
                <div className="flex items-center gap-4">
                  <Metric label="Lane" value={p.lane ?? "-"} />
                  <Metric label="KDA" value={p.avg_kda ?? "-"} />
                  <Metric label="KP" value={p.kill_participation ?? "-"} />
                  <Metric label="Gms" value={p.total_games ?? 0} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
