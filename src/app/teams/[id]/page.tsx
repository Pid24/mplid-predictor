// src/app/teams/[id]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type TeamDetailUpstream = {
  id?: string | number;
  name?: string;
  team_name?: string;
  tag?: string | null;
  team_logo?: string | null;
  logo?: string | null;
};

type TeamNorm = { id: string; name: string; tag?: string | null; logo?: string | null };
type TeamStats = { team: string; kda?: number; gpm?: number; obj_rate?: number };

function norm(s?: string) {
  return (s ?? "").trim().toLowerCase();
}
function getBaseUrl() {
  const env = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "");
  if (env) return env;
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function TeamDetailPage(props: { params: Promise<{ id: string }> }) {
  // ✅ Next.js 15: params harus di-await
  const { id } = await props.params;

  // 1) Coba fetch detail upstream by id (kalau endpoint itu mendukung slug)
  let name: string | undefined;
  let logo: string | null | undefined;
  let tag: string | null | undefined;

  try {
    const detailRes = await fetch(`https://mlbb-stats.ridwaanhall.com/api/mplid/teams/${encodeURIComponent(id)}/?format=json`, { cache: "no-store", headers: { Accept: "application/json" } });

    if (detailRes.ok) {
      const d = (await detailRes.json()) as TeamDetailUpstream;
      name = d.name || d.team_name || name;
      logo = d.logo ?? d.team_logo ?? logo;
      tag = d.tag ?? tag;
    }
  } catch {
    // diamkan; kita punya fallback di bawah
  }

  // 2) Fallback: ambil dari /api/teams (list) lalu cari yang id-nya cocok
  if (!name) {
    const base = getBaseUrl();
    try {
      const listRes = await fetch(`${base}/api/teams`, { next: { revalidate: 300 } });
      if (listRes.ok) {
        const teams = (await listRes.json()) as TeamNorm[];
        const t = teams.find((x) => x.id === id);
        if (t) {
          name = t.name;
          logo = t.logo ?? null;
          tag = t.tag ?? null;
        }
      }
    } catch {
      // ignore
    }
  }

  // 3) Jika tetap tidak ketemu
  if (!name) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <Link href="/teams" className="underline text-sm">
          ← Back to Teams
        </Link>
        <h1 className="text-2xl font-bold mt-3">Team not found</h1>
        <p className="opacity-70 mt-2">ID: {id}</p>
      </main>
    );
  }

  // 4) Ambil team-stats untuk metrik
  let tStats: TeamStats | undefined;
  try {
    const statsRes = await fetch(`https://mlbb-stats.ridwaanhall.com/api/mplid/team-stats/?format=json`, { cache: "no-store", headers: { Accept: "application/json" } });
    if (statsRes.ok) {
      const stats = (await statsRes.json()) as TeamStats[];
      tStats = stats.find((s) => norm(s.team) === norm(name));
    }
  } catch {
    // ignore
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/teams" className="underline text-sm">
        ← Back to Teams
      </Link>

      <div className="flex items-center gap-3 mt-3">
        {logo ? <Image src={logo} alt={name} width={56} height={56} className="rounded" /> : <div className="h-14 w-14 rounded bg-gray-100" />}
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          {tag && <div className="text-sm opacity-70">{tag}</div>}
          <div className="text-xs opacity-60 mt-1">ID: {id}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="rounded-xl border p-4">
          <div className="text-sm opacity-70">KDA</div>
          <div className="text-xl font-semibold">{tStats?.kda ?? "-"}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm opacity-70">GPM</div>
          <div className="text-xl font-semibold">{tStats?.gpm ?? "-"}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm opacity-70">Objective Rate</div>
          <div className="text-xl font-semibold">{tStats?.obj_rate ?? "-"}</div>
        </div>
      </div>

      <div className="mt-6 text-sm opacity-70">Detail & statistik ditarik langsung; kalau endpoint detail tidak mendukung slug ini, data diambil dari list tim dan team-stats sebagai fallback.</div>
    </main>
  );
}
