// src/app/player-pools/page.tsx
import PlayerRow from "@/components/player/PlayerRow";
import { headers } from "next/headers";
import * as React from "react";

type SearchParams = {
  team?: string;
  player?: string;
  raw?: string;
};

async function getBaseUrl() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) throw new Error("Missing host header");
  return `${proto}://${host}`;
}

async function getData(sp: SearchParams) {
  const qs = new URLSearchParams();
  if (sp.team) qs.set("team", sp.team);
  if (sp.player) qs.set("player", sp.player);
  if (sp.raw) qs.set("raw", sp.raw);

  const base = await getBaseUrl();
  const url = `${base}/api/player-pools${qs.toString() ? `?${qs}` : ""}`;

  const res = await fetch(url, { cache: "no-store", next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`Failed to load player-pools (${res.status})`);
  }
  return res.json();
}

// Next.js 15+ mengirim searchParams sebagai async (awaitable)
export default async function PlayerPoolsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const data = await getData(sp);

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Player Pools</h1>
        <p className="text-sm text-gray-500">Filter via querystring.</p>
      </header>

      <section className="grid gap-4">
        {Array.isArray(data) && data.length > 0 ? (
          data.map((hero: any) => (
            <div key={hero.hero_name} className="rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={hero.hero_logo} alt={hero.hero_name} width={36} height={36} className="h-9 w-9 rounded" />
                <div className="font-medium">
                  {hero.hero_name} <span className="text-gray-400 font-normal">({hero.total ?? hero.players?.length ?? 0})</span>
                </div>
              </div>

              {!!hero.players?.length && (
                <div className="mt-3 grid gap-2">
                  {hero.players.map((p: any, idx: number) => (
                    <PlayerRow key={`${hero.hero_name}-${idx}-${p.name ?? p.player_info ?? idx}`} heroName={hero.hero_name} p={p} />
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-gray-500">No data.</div>
        )}
      </section>
    </main>
  );
}
