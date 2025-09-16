import Link from "next/link";
import { getBaseUrl } from "@/lib/base-url";

type Params = { id: string };

async function getPools(teamCode: string) {
  const base = getBaseUrl();
  const url = `${base}/api/player-pools?team=${encodeURIComponent(teamCode)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load pools for ${teamCode} (${res.status})`);
  return res.json();
}

export default async function TeamPoolsPage({ params }: { params: Params }) {
  const teamCode = decodeURIComponent(params.id);
  const data = await getPools(teamCode);

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{teamCode} — Player Pools</h1>
        <Link href={`/player-pools?team=${encodeURIComponent(teamCode)}`} className="text-sm text-blue-600 hover:underline">
          Lihat di halaman Player Pools →
        </Link>
      </header>

      <section className="grid gap-4">
        {Array.isArray(data) && data.length > 0 ? (
          data.map((hero: any) => (
            <div key={hero.hero_name} className="rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={hero.hero_logo} alt={hero.hero_name} width={36} height={36} className="h-9 w-9 rounded object-cover" />
                <div className="font-medium">
                  {hero.hero_name} <span className="text-gray-400 font-normal">({hero.total ?? hero.players?.length ?? 0})</span>
                </div>
              </div>

              {!!hero.players?.length && (
                <ul className="mt-3 grid gap-2">
                  {hero.players.map((p: any, idx: number) => (
                    <li key={`${hero.hero_name}-${idx}-${p.name ?? p.player_info}`} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.player_logo} alt={p.name ?? p.player_info} width={28} height={28} className="h-7 w-7 rounded-full object-cover" />
                        <div className="text-sm">
                          <div className="font-medium">{p.name ?? p.player_info}</div>
                          <div className="text-gray-500">{p.team || teamCode}</div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-semibold">{p.pick} picks</div>
                        {"pick_rate" in p && <div className="text-gray-500">{typeof p.pick_rate === "number" ? `${p.pick_rate}%` : p.pick_rate ?? "-"}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        ) : (
          <div className="text-gray-500">Belum ada data untuk {teamCode}.</div>
        )}
      </section>
    </main>
  );
}
