// src/app/standings/page.tsx
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type Row = {
  rank: number;
  team: string;
  wins: number;
  losses: number;
  points?: number | null;
  game_diff?: number | null;
};

function getBaseUrl() {
  // 1) Kalau ada env, pakai itu
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "");
  if (fromEnv) return fromEnv;

  // 2) Deteksi dari request headers (works di dev & prod/Vercel)
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

async function getStandings(): Promise<{ rows: Row[]; from: string; ok: boolean; note?: string }> {
  try {
    const base = getBaseUrl();
    const url = `${base}/api/standings`;
    const res = await fetch(url, { next: { revalidate: 0 } });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return { rows: [], from: url, ok: false, note: j?.note || j?.error || `HTTP ${res.status}` };
    }

    const data = (await res.json()) as Row[];
    return { rows: data, from: url, ok: true };
  } catch (e: any) {
    return { rows: [], from: "-", ok: false, note: e?.message || String(e) };
  }
}

export default async function StandingsPage() {
  const { rows, from, ok, note } = await getStandings();

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold mb-4">MPL ID Standings</h1>

      {!ok && (
        <div className="rounded border p-4 text-sm mb-4">
          <div className="font-medium">Gagal ambil data API.</div>
          <div className="opacity-70 mt-1">
            URL yang dipanggil: <code>{from}</code>
          </div>
          {note && <div className="opacity-70">Catatan: {note}</div>}
          <div className="mt-2">
            Coba buka <code>/api/standings</code> langsung untuk lihat respons mentah.
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded border p-4 text-sm">
          <p>Belum ada data dari API.</p>
          <p className="opacity-70 mt-1">
            Jika upstream memang belum mengembalikan standings, gunakan endpoint lain (mis. <code>/api/teams</code>) dulu.
          </p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">#</th>
              <th>Team</th>
              <th>W</th>
              <th>L</th>
              <th>Pts</th>
              <th>Game Diff</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="py-2">{r.rank}</td>
                <td>{r.team}</td>
                <td>{r.wins}</td>
                <td>{r.losses}</td>
                <td>{r.points ?? "-"}</td>
                <td>{r.game_diff ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
