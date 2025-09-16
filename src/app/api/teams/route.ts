export const revalidate = 300;

type UpstreamTeam = {
  id?: string | number;
  name?: string;
  team_name?: string;
  tag?: string | null;
  team_logo?: string | null;
  logo?: string | null;
  team_url?: string | null;
};

function slugFromTeamUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || null;
  } catch {
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
      const fallbackId = slugFromTeamUrl((t as any).team_url) ?? (t.id != null ? String(t.id) : null);
      return {
        id: fallbackId,
        name: t.name || t.team_name || "Unknown",
        tag: t.tag ?? null,
        logo: t.logo ?? t.team_logo ?? null,
        team_url: (t as any).team_url ?? null,
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
