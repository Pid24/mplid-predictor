import Link from "next/link";
import { getBaseUrl } from "@/lib/base-url";

type HeroRow = {
  hero_name: string;
  hero_logo?: string | null;
  players?: Array<{ pick?: number | null }>;
};

function HeroLogoOrBadge({ src, alt }: { src?: string | null; alt: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} width={28} height={28} className="h-7 w-7 rounded object-cover" />;
  }
  return (
    <div className="h-7 w-7 rounded bg-gray-200 flex items-center justify-center text-[10px]" aria-label={alt} title={alt}>
      {alt?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

async function getTopHeroes(limit = 5) {
  const base = await getBaseUrl(); 
  const res = await fetch(`${base}/api/player-pools?raw=1`, { cache: "no-store", next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Failed to load player-pools (${res.status})`);

  const data: HeroRow[] = await res.json();

  const ranked = (Array.isArray(data) ? data : [])
    .map((h) => {
      const totalPicks = (h.players ?? []).reduce((sum, p) => sum + (typeof p?.pick === "number" ? p.pick : 0), 0);
      return { ...h, totalPicks };
    })
    .sort((a, b) => (b as any).totalPicks - (a as any).totalPicks)
    .slice(0, limit);

  return ranked as Array<HeroRow & { totalPicks: number }>;
}

export default async function PlayerPoolsMini({ limit = 5 }: { limit?: number }) {
  const top = await getTopHeroes(limit);

  return (
    <section>
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
                <HeroLogoOrBadge src={h.hero_logo} alt={h.hero_name} />
                <span className="font-medium">{h.hero_name}</span>
              </div>
              <span className="text-sm text-[var(--text-dim)]">{(h as any).totalPicks} picks</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
