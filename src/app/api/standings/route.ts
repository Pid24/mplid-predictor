// Normalisasi payload standings eksternal -> bentuk yang dipakai halaman:
// { rank, team, wins, losses, points, game_diff, logo, match_wl, game_wl }

export const revalidate = 0;

type UpstreamRow = {
  rank: number;
  team_name: string;
  team_logo?: string | null;
  match_point?: number | null; // points
  match_wl?: string | null; // "W-L" (match level)
  net_game_win?: number | null; // game diff
  game_wl?: string | null; // "GW-GL" (game level)
};

function splitPair(s?: string | null): { a: number; b: number } {
  if (!s) return { a: 0, b: 0 };
  const m = String(s).match(/^(\d+)\s*-\s*(\d+)$/);
  if (!m) return { a: 0, b: 0 };
  return { a: Number(m[1]), b: Number(m[2]) };
}

export async function GET() {
  const url = "https://mlbb-stats.ridwaanhall.com/api/mplid/standings/?format=json";
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return new Response(JSON.stringify({ error: "upstream_error", status: res.status, body: txt }), { status: 502, headers: { "content-type": "application/json" } });
    }

    const raw = (await res.json()) as UpstreamRow[];

    // Kalau upstream mengembalikan daftar endpoint (index), beri pesan jelas
    if (Array.isArray(raw) && raw[0] && (raw[0] as any).name && (raw[0] as any).url) {
      return new Response(JSON.stringify({ error: "index_payload", note: "Upstream mengembalikan daftar endpoint, bukan standings." }), { status: 502, headers: { "content-type": "application/json" } });
    }

    const normalized = (raw || []).map((r) => {
      const matchPair = splitPair(r.match_wl); // W-L (match)
      const gamePair = splitPair(r.game_wl); // GW-GL (game) — opsional kalau nanti mau dipakai

      return {
        rank: r.rank,
        team: r.team_name,
        wins: matchPair.a, // dari "match_wl"
        losses: matchPair.b,
        points: r.match_point ?? null,
        game_diff: r.net_game_win ?? null, // dari "net_game_win"
        logo: r.team_logo ?? null, // extra: bisa dipakai di UI kalau mau
        // info tambahan (kalau halaman mau menampilkan apa adanya)
        match_wl: r.match_wl ?? null,
        game_wl: r.game_wl ?? null,
        game_wins: gamePair.a,
        game_losses: gamePair.b,
      };
    });

    return new Response(JSON.stringify(normalized), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "proxy_crash", message: e?.message || String(e), url }), { status: 502, headers: { "content-type": "application/json" } });
  }
}
