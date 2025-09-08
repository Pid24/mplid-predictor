// src/app/standings/page.tsx
import Image from "next/image";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type Row = {
  rank: number;
  team: string;
  wins: number;
  losses: number;
  points?: number | null;
  game_diff?: number | null;
  logo?: string | null;
  match_wl?: string | null;
  game_wl?: string | null;
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

function formatJakarta(iso?: string | null) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  } catch {
    return iso ?? "-";
  }
}

async function getStandings(): Promise<{
  rows: Row[];
  from: string;
  ok: boolean;
  note?: string;
  lastUpdated?: string;
}> {
  try {
    const base = getBaseUrl();
    const url = `${base}/api/standings`;
    const res = await fetch(url, { next: { revalidate: 0 } });

    const lastUpdated = res.headers.get("x-data-fetched-at") ?? undefined;

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return {
        rows: [],
        from: url,
        ok: false,
        note: j?.note || j?.error || `HTTP ${res.status}`,
        lastUpdated,
      };
    }

    const data = (await res.json()) as Row[];
    return { rows: data, from: url, ok: true, lastUpdated };
  } catch (e: any) {
    return { rows: [], from: "-", ok: false, note: e?.message || String(e) };
  }
}

export default async function StandingsPage() {
  const { rows, from, ok, note, lastUpdated } = await getStandings();

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">MPL ID Standings</h1>
        <div className="text-xs opacity-70">Last updated: {formatJakarta(lastUpdated)}</div>
      </div>

      {!ok && (
        <div className="rounded border p-4 text-sm my-4">
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
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 px-2">#</th>
                <th className="px-2">Team</th>
                <th className="px-2">Match W–L</th>
                <th className="px-2">Game W–L</th>
                <th className="px-2">Pts</th>
                <th className="px-2">Net GW</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-2">{r.rank}</td>
                  <td className="px-2">
                    <div className="flex items-center gap-2">
                      {r.logo ? <Image src={r.logo} alt={r.team} width={24} height={24} className="rounded" /> : null}
                      <span className="font-medium">{r.team}</span>
                    </div>
                  </td>
                  <td className="px-2">{r.match_wl ?? `${r.wins}-${r.losses}`}</td>
                  <td className="px-2">{r.game_wl ?? "-"}</td>
                  <td className="px-2">{r.points ?? "-"}</td>
                  <td className="px-2">{r.game_diff ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
