// src/app/api/teams/route.ts
export const revalidate = 300;

type UpstreamTeam = {
  id?: string | number; // kadang tidak ada
  name?: string; // alternatif nama
  team_name?: string; // nama yang dipakai upstream
  tag?: string | null;
  team_logo?: string | null;
  logo?: string | null;
  team_url?: string | null; // contoh: https://id-mpl.com/team/ae
};

function slugFromTeamUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean); // ["team","ae"]
    return parts[parts.length - 1] || null;
  } catch {
    // kalau bukan URL valid (mis. "id-mpl.com/team/ae" tanpa protokol)
    const parts = String(url).split("/").filter(Boolean);
    return parts[parts.length - 1] || null;
  }
}

export async function GET() {
  const url = "https://mlbb-stats.ridwaanhall.com/api/mplid/teams/?format=json";
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json", "User-Agent": "MPLID-Predictor/1.0" },
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return new Response(JSON.stringify({ error: "upstream_error", status: res.status, body: txt }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }

    const raw = (await res.json()) as UpstreamTeam[];

    const normalized = (raw || []).map((t) => {
      const fallbackId =
        slugFromTeamUrl((t as any).team_url) ?? // banyak payload pakai team_url
        (t.id != null ? String(t.id) : null);
      return {
        id: fallbackId, // ex: "ae", "btr", "rrq"
        name: t.name || t.team_name || "Unknown",
        tag: t.tag ?? null,
        logo: t.logo ?? t.team_logo ?? null,
        team_url: (t as any).team_url ?? null, // ikutkan untuk debug/link (opsional)
      };
    });

    return new Response(JSON.stringify(normalized), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-data-fetched-at": new Date().toISOString(),
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "proxy_crash", message: e?.message || String(e) }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}
