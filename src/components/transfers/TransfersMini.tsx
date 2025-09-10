// src/components/transfers/TransfersMini.tsx
// Server Component

type TransferRaw = {
  transfer_date: string;
  player_name: string;
  player_role?: string | null;
  from_team_name?: string | null;
  from_team_logo?: string | null;
  to_team_name?: string | null;
  to_team_logo?: string | null;
};

type Transfer = {
  dateISO: string | null;
  dateText: string;
  player: string;
  role: string | null;
  fromTeam: string | null;
  toTeam: string | null;
  fromLogo: string | null;
  toLogo: string | null;
  isCoach: boolean;
};

function toISO(d?: string | null) {
  if (!d) return null;
  const t = Date.parse(d);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

function normalize(raw: TransferRaw[]): Transfer[] {
  return (raw || []).map((t) => ({
    dateISO: toISO(t.transfer_date),
    dateText: t.transfer_date,
    player: t.player_name,
    role: t.player_role ?? null,
    fromTeam: t.from_team_name ?? null,
    toTeam: t.to_team_name ?? null,
    fromLogo: t.from_team_logo ?? null,
    toLogo: t.to_team_logo ?? null,
    isCoach: (t.player_role || "").toLowerCase().includes("coach"),
  }));
}

async function fetchTransfers(): Promise<Transfer[]> {
  const res = await fetch("https://mlbb-stats.ridwaanhall.com/api/mplid/transfers/", {
    cache: "no-store",
    // @ts-ignore Next 15
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Failed to load transfers (${res.status})`);
  const data: TransferRaw[] = await res.json();
  return normalize(data);
}

// 1x1 transparent PNG (fallback agar tidak ada broken icon kalau logo null)
const BLANK = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

export default async function TransfersMini({ limit = 6, filterTeam }: { limit?: number; filterTeam?: string }) {
  const data = await fetchTransfers();
  const key = filterTeam?.toLowerCase();

  const items = data
    .filter((t) => !key || t.toTeam?.toLowerCase() === key || t.fromTeam?.toLowerCase() === key)
    .sort((a, b) => (Date.parse(b.dateISO || "") || 0) - (Date.parse(a.dateISO || "") || 0))
    .slice(0, limit);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border p-4">
        <div className="mb-2 font-semibold">Recent Transfers</div>
        <div className="text-sm text-[var(--text-dim)]">Belum ada data.</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-4">
      <div className="mb-3 font-semibold">Recent Transfers</div>
      <div className="grid gap-2">
        {items.map((t, i) => (
          <div key={`${t.player}-${t.dateText}-${i}`} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.toLogo || BLANK} alt={t.toTeam || ""} width={24} height={24} className="h-6 w-6 rounded object-contain bg-white" decoding="async" loading="lazy" referrerPolicy="no-referrer" />
              <div className="text-sm">
                <div className="font-medium">
                  {t.player} {t.role ? `· ${t.role}` : ""}
                </div>
                <div className="text-gray-500">
                  {t.fromTeam && t.fromTeam !== "FREE AGENT" ? t.fromTeam : "FREE AGENT"} → {t.toTeam ?? "-"}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">{t.dateText}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
