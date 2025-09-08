const DEFAULT_BASE = "https://mlbb-stats.ridwaanhall.com/api/mplid";

export function buildMplUrl(path: string) {
  const base = (process.env.MPL_BASE || DEFAULT_BASE).replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`; // -> .../api/mplid/standings/
}

export async function getJSON<T>(path: string, init?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; error: any; url: string }> {
  const url = buildMplUrl(path);
  try {
    const res = await fetch(url, { cache: "no-store", ...init });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: { status: res.status, body }, url };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: { message: e?.message || String(e) }, url };
  }
}
