export type Transfer = {
  transfer_date: string;
  player_name: string;
  player_role: string;
  from_team_name: string;
  from_team_logo: string | null;
  to_team_name: string;
  to_team_logo: string | null;
};

const REMOTE = "https://mlbb-stats.ridwaanhall.com/api/mplid/transfers/";

export async function fetchTransfersServer(): Promise<Transfer[]> {
  const res = await fetch(REMOTE, {
    cache: "no-store",
    headers: { Accept: "application/json", "User-Agent": "MPLID-Predictor/1.0 (+transfers)" },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Failed to fetch transfers (${res.status})`);
  const data = (await res.json()) as Transfer[] | any;
  return Array.isArray(data) ? data : [];
}
