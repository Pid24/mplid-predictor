// src/app/page.tsx
import Link from "next/link";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type MVPRow = { rank: number; player_name: string; player_logo?: string | null; point: number };

function getBaseUrl() {
  const env = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "");
  if (env) return env;
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

async function getTopMVP(n = 5): Promise<MVPRow[]> {
  try {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/mvp`, { next: { revalidate: 120 } });
    if (!res.ok) return [];
    const all = (await res.json()) as MVPRow[];
    return all.slice(0, n);
  } catch {
    return [];
  }
}

export default async function Home() {
  const top = await getTopMVP();

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">MPL ID Predictor</h1>
      <p className="mt-2 text-sm opacity-70">Web kecil buat lihat klasemen, tim, MVP, dan (nanti) prediksi matchup.</p>

      <div className="mt-4 space-x-3">
        <Link className="underline" href="/standings">
          Standings
        </Link>
        <Link className="underline" href="/teams">
          Teams
        </Link>
        <Link className="underline" href="/mvp">
          MVP
        </Link>
        <Link className="underline opacity-60" href="/predictor">
          Predictor
        </Link>
      </div>

      {/* Teaser MVP */}
      {top.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Top MVP</h2>
            <Link href="/mvp" className="text-sm underline">
              Lihat semua →
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {top.map((r) => (
              <li key={r.rank} className="flex items-center gap-3 text-sm">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded border">{r.rank}</span>
                <span className="truncate flex-1">{r.player_name}</span>
                <span className="opacity-70">{r.point} pts</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
