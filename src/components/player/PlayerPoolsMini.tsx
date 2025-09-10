// Server Component: tidak pakai "use client"
import Link from "next/link";
import { headers } from "next/headers";

type HeroRow = {
  hero_name: string;
  hero_logo?: string | null;
  players?: Array<{ pick?: number | null }>;
};

async function getBaseUrl() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) throw new Error("Missing host header");
  return `${proto}://${host}`;
}

async function getTopHeroes(limit = 5) {
  const base = await getBaseUrl();

  // ambil raw supaya ringan (kita cuma butuh picks)
  const res = await fetch(`${base}/api/player-pools?raw=1`, {
    cache: "no-store",
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Failed to load player-pools (${res.status})`);

  const data: HeroRow[] = await res.json();

  // total picks per hero = sum pick dari semua pemain
  const ranked = (Array.isArray(data) ? data : [])
    .map((h) => {
      const totalPicks = (h.players ?? []).reduce((sum, p) => {
        const v = typeof p?.pick === "number" ? p.pick : 0;
        return sum + v;
      }, 0);
      return { ...h, totalPicks };
    })
    .sort((a, b) => b.totalPicks - a.totalPicks)
    .slice(0, limit);

  return ranked;
}

export default async function PlayerPoolsMini({ limit = 5 }: { limit?: number }) {
  const top = await getTopHeroes(limit);

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Most Pick Hero</h3>
        <Link href="/player-pools" className="text-sm text-[var(--accent-600)]">
          Lihat semua →
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {top.length === 0 ? (
          <div className="text-sm text-[var(--text-dim)]">Tidak ada data.</div>
        ) : (
          top.map((h) => (
            <div key={h.hero_name} className="flex items-center justify-between rounded-2xl border px-3 py-2">
              <div className="flex items-center gap-3">
                {/* server component: jangan pakai onError handler */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={h.hero_logo ?? ""} alt={h.hero_name} width={28} height={28} className="h-7 w-7 rounded object-cover" />
                <span className="font-medium">{h.hero_name}</span>
              </div>
              <span className="text-sm text-[var(--text-dim)]">{h.totalPicks} picks</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
