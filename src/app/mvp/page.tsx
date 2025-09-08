// src/app/mvp/page.tsx
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type MVPRow = {
  rank: number;
  player_name: string;
  player_logo?: string | null;
  team_logo?: string | null;
  point: number;
};

function getBaseUrl() {
  const env = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "");
  if (env) return env;
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function MVPPage() {
  const base = getBaseUrl();

  // Ambil dari API internal /api/mvp (yang sudah kamu buat)
  const res = await fetch(`${base}/api/mvp`, { cache: "no-store" });
  const rows: MVPRow[] = res.ok ? await res.json() : [];

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">MVP Leaderboard</h1>
        <Link href="/" className="text-sm underline">
          ← Back to Home
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded border p-4 text-sm mt-4">Belum ada data MVP.</div>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((r) => (
            <div key={r.rank} className="flex items-center justify-between border rounded-xl p-3 bg-white">
              <div className="flex items-center gap-3">
                <div className="text-xs font-semibold border rounded px-2 py-1">#{r.rank}</div>
                {r.player_logo ? <Image src={r.player_logo} alt={r.player_name} width={36} height={36} className="rounded" /> : <div className="h-9 w-9 rounded bg-gray-100" />}
                <div>
                  <div className="font-medium leading-tight">{r.player_name}</div>
                  <div className="text-xs opacity-70 leading-tight">Points: {r.point}</div>
                </div>
              </div>
              {r.team_logo ? <Image src={r.team_logo} alt="team" width={28} height={28} className="rounded" /> : <div className="h-7 w-7 rounded bg-gray-100" />}
            </div>
          ))}
        </div>
      )}

      <div className="text-[11px] opacity-60 mt-3">Catatan: Data untuk hiburan & informasi. Update interval ±2 menit.</div>
    </main>
  );
}
