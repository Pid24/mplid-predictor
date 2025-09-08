"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Team = { id: string; name: string; tag?: string | null; logo?: string | null };
type PredictResp = {
  teamA: { id: string; name: string; score: number };
  teamB: { id: string; name: string; score: number };
  probability: { teamA: number; teamB: number };
  confidence: number;
};

export default function PredictorPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [a, setA] = useState<string>("");
  const [b, setB] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResp | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/teams", { cache: "no-store" });
        const data: Team[] = res.ok ? await res.json() : [];
        setTeams(data);
        if (data.length >= 2) {
          setA(data[0].id);
          setB(data[1].id);
        }
      } catch {
        setTeams([]);
      }
    })();
  }, []);

  const teamA = useMemo(() => teams.find((t) => t.id === a), [teams, a]);
  const teamB = useMemo(() => teams.find((t) => t.id === b), [teams, b]);

  async function predict() {
    setErr(null);
    setResult(null);
    if (!a || !b || a === b) {
      setErr("Pilih dua tim yang berbeda.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamA: a, teamB: b }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      const j = (await res.json()) as PredictResp;
      setResult(j);
    } catch (e: any) {
      setErr(e?.message || "Gagal memprediksi.");
    } finally {
      setLoading(false);
    }
  }

  const pctA = result ? Math.round(result.probability.teamA * 100) : 0;
  const pctB = result ? Math.round(result.probability.teamB * 100) : 0;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Match Predictor</h1>
        <Link href="/" className="text-sm underline">
          ← Back to Home
        </Link>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 gap-4">
        <TeamPicker label="Team A" teams={teams} value={a} onChange={setA} />
        <TeamPicker label="Team B" teams={teams} value={b} onChange={setB} />
      </div>

      <button onClick={predict} disabled={loading || !a || !b || a === b} className="mt-4 rounded-lg border px-4 py-2 hover:shadow-sm disabled:opacity-50">
        {loading ? "Predicting..." : "Predict"}
      </button>

      {err && <div className="mt-3 rounded border p-3 text-sm text-red-600 bg-red-50">{err}</div>}

      {result && (
        <div className="mt-6 space-y-4">
          <ProbCard team={teamA} percent={pctA} side="left" />
          <ProbCard team={teamB} percent={pctB} side="right" />
          <div className="text-xs opacity-70">Model confidence: {(result.confidence * 100).toFixed(0)}%. Ini probabilitas, bukan jaminan hasil 😄.</div>
        </div>
      )}

      <div className="text-[11px] opacity-60 mt-6">Catatan: Model menggabungkan standings & team-stats (gold, damage, objectives, KDA proxy) lalu memakai Bradley–Terry/logistic untuk memproyeksikan peluang menang.</div>
    </main>
  );
}

function TeamPicker({ label, teams, value, onChange }: { label: string; teams: Team[]; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="text-sm opacity-70 mb-1">{label}</div>
      <select className="w-full border rounded-lg px-3 py-2 bg-white" value={value} onChange={(e) => onChange(e.target.value)}>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.tag ? `${t.tag} — ${t.name}` : t.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProbCard({ team, percent, side }: { team?: Team; percent: number; side: "left" | "right" }) {
  return (
    <div className="border rounded-xl p-4 bg-white">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {team?.logo ? <Image src={team.logo} alt={team.name} width={36} height={36} className="rounded" /> : <div className="h-9 w-9 rounded bg-gray-100" />}
          <div>
            <div className="font-medium">{team?.name ?? "-"}</div>
            <div className="text-xs opacity-70">Win chance</div>
          </div>
        </div>
        <div className="text-2xl font-semibold">{percent}%</div>
      </div>
      <div className="mt-3 h-2 bg-gray-100 rounded">
        <div className={`h-2 rounded ${side === "left" ? "bg-black" : "bg-gray-700"}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
