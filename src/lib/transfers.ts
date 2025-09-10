export type TransferRaw = {
  transfer_date: string; // "25 Aug 2025"
  player_name: string;
  player_role?: string | null; // "Jungle", "Coach", dll
  from_team_name?: string | null; // "FREE AGENT" possible
  from_team_logo?: string | null;
  to_team_name?: string | null;
  to_team_logo?: string | null;
};

export type Transfer = {
  dateISO: string | null; // "2025-08-25T00:00:00.000Z"
  dateText: string; // original text
  player: string;
  role: string | null;
  fromTeam: string | null;
  toTeam: string | null;
  fromLogo: string | null;
  toLogo: string | null;
  isCoach: boolean;
};

function parseDateToISO(d: string | null | undefined) {
  if (!d) return null;
  // "25 Aug 2025" → Date
  const parsed = Date.parse(d);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

export function normalizeTransfers(raw: TransferRaw[]): Transfer[] {
  return (raw || []).map((t) => {
    const isCoach = (t.player_role || "").toLowerCase().includes("coach");
    return {
      dateISO: parseDateToISO(t.transfer_date),
      dateText: t.transfer_date,
      player: t.player_name,
      role: t.player_role ?? null,
      fromTeam: t.from_team_name ?? null,
      toTeam: t.to_team_name ?? null,
      fromLogo: t.from_team_logo ?? null,
      toLogo: t.to_team_logo ?? null,
      isCoach,
    };
  });
}

/** Server-side fetch (aman dipanggil dari Server Component) */
export async function fetchTransfersServer(): Promise<Transfer[]> {
  const res = await fetch("https://mlbb-stats.ridwaanhall.com/api/mplid/transfers/", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load transfers");
  const data: TransferRaw[] = await res.json();
  return normalizeTransfers(data);
}

/** Client-side fetch (pakai proxy internal) */
export async function fetchTransfersClient(): Promise<Transfer[]> {
  const res = await fetch("/api/transfers", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load transfers");
  const data: TransferRaw[] = await res.json();
  return normalizeTransfers(data);
}
