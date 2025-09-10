// src/app/predictor/page.tsx
import Link from "next/link";
import { getBaseUrl } from "@/lib/base-url";
import PredictorV2 from "@/components/PredictorV2";

export const dynamic = "force-dynamic";

type Team = { id: string; name: string; logo?: string | null; tag?: string | null };
type StandRow = { team: string; points?: number | null; game_diff?: number | null };

export default async function PredictorPage() {
  const base = await getBaseUrl();

  const [teamsRes, standRes] = await Promise.all([fetch(`${base}/api/teams`, { next: { revalidate: 300 } }), fetch(`${base}/api/standings`, { next: { revalidate: 60 } })]);

  const teams: Team[] = teamsRes.ok ? await teamsRes.json() : [];
  const standings: StandRow[] = standRes.ok ? await standRes.json() : [];

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Predictor</h1>
        <Link href="/" className="text-sm underline">
          ← Back to Home
        </Link>
      </div>

      <p className="mt-2 text-sm opacity-70">Pilih dua tim untuk melihat peluang kemenangan. Model: H2H (week1–3) + recent form + standings points + game diff (logistic, dikalibrasi 10–90%).</p>

      <div className="mt-6">
        <PredictorV2 teams={teams} standings={standings} />
      </div>
    </main>
  );
}
