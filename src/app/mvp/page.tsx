import Image from "next/image";

type MvpRow = {
  rank: number;
  player_name: string;
  player_logo?: string | null;
  team_logo?: string | null;
  point: number;
};

export const dynamic = "force-dynamic";

export default async function MVPPage() {
  const url = process.env.MPL_MVP_URL || "https://mlbb-stats.ridwaanhall.com/api/mplid/standings-mvp/";
  const res = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
  const data: MvpRow[] = res.ok ? await res.json() : [];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">MVP Radar</h1>
        <span className="chip">Live</span>
      </div>

      {data.length === 0 ? (
        <div className="card p-6">Belum ada data MVP.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.map((p) => (
            <div key={p.rank} className="card p-4 card-hover flex gap-3 items-center">
              <div className="shrink-0 relative h-12 w-12 rounded-xl overflow-hidden border">
                {p.player_logo ? <Image src={p.player_logo} alt={p.player_name} fill className="object-cover" unoptimized /> : <div className="h-full w-full bg-[var(--bg-soft)]" />}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="chip">#{p.rank}</span>
                  {p.team_logo && <Image src={p.team_logo} alt="team" width={18} height={18} className="rounded" unoptimized />}
                </div>
                <div className="font-semibold truncate mt-1">{p.player_name}</div>
                <div className="text-sm text-[var(--text-dim)]">Poin: {p.point}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
