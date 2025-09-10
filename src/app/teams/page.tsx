import Image from "next/image";
import Link from "next/link";
import { getBaseUrl } from "@/lib/base-url";

export const dynamic = "force-dynamic";

type TeamNorm = { id: string; name: string; tag?: string | null; logo?: string | null };

// bentuk mentah dari upstream (fallback)
type TeamRaw = {
  team_url?: string;
  team_logo?: string | null;
  team_name?: string;
};

function deriveIdFromUrl(u?: string): string | null {
  if (!u) return null;
  try {
    const url = new URL(u);
    const parts = url.pathname.split("/").filter(Boolean);
    const slug = parts[parts.length - 1];
    return slug || null;
  } catch {
    const m = u.match(/\/team\/([^\/\?#]+)/i);
    return m?.[1] ?? null;
  }
}

async function getTeams(): Promise<{ teams: TeamNorm[]; ok: boolean; note?: string }> {
  try {
    const base = await getBaseUrl(); // ⬅️ penting: await
    const res = await fetch(`${base}/api/teams`, { next: { revalidate: 300 } });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return { teams: [], ok: false, note: j?.error || `HTTP ${res.status}` };
    }
    const data = (await res.json()) as any[];

    if (Array.isArray(data) && data.length && "id" in data[0] && "name" in data[0]) {
      return { teams: data as TeamNorm[], ok: true };
    }

    // fallback normalisasi
    const mapped: TeamNorm[] = (data as TeamRaw[])
      .map((t) => {
        const id = deriveIdFromUrl(t.team_url) ?? (t.team_name ?? "").toLowerCase();
        return { id, name: t.team_name ?? "Unknown", logo: t.team_logo ?? null, tag: null };
      })
      .filter((t) => !!t.id && !!t.name);

    return { teams: mapped, ok: true };
  } catch (e: any) {
    return { teams: [], ok: false, note: e?.message || String(e) };
  }
}

export default async function TeamsPage() {
  const { teams, ok, note } = await getTeams();

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teams</h1>
        <Link href="/" className="text-sm underline">
          ← Back to Home
        </Link>
      </div>

      {!ok && (
        <div className="rounded border p-4 text-sm my-4">
          <div className="font-medium">Gagal ambil data tim.</div>
          {note && <div className="opacity-70">{note}</div>}
        </div>
      )}

      {teams.length === 0 ? (
        <div className="rounded border p-4 text-sm">Belum ada data tim.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
          {teams.map((t) => (
            <Link key={t.id} href={`/teams/${encodeURIComponent(t.id)}`} className="border rounded-xl p-3 hover:shadow-sm transition flex items-center gap-3 bg-white">
              {t.logo ? <Image src={t.logo} alt={t.name} width={40} height={40} className="rounded" /> : <div className="h-10 w-10 rounded bg-gray-100" />}
              <div className="min-w-0">
                <div className="font-medium truncate">{t.name}</div>
                {t.tag && <div className="text-xs opacity-70">{t.tag}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
