// src/app/predictor/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type TeamItem = { id: string; name: string; logo?: string | null };

export default function PredictorPage() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [home, setHome] = useState("onic");
  const [away, setAway] = useState("rrq");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // fetch teams list utk dropdown
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/teams", { cache: "no-store" });
        if (!r.ok) throw new Error("Gagal ambil teams");
        const data = await r.json();
        setTeams(data);
      } catch (e: any) {
        setTeams([
          { id: "onic", name: "ONIC" },
          { id: "rrq", name: "RRQ HOSHI" },
          { id: "btr", name: "BIGETRON BY VIT" },
          { id: "evos", name: "EVOS" },
          { id: "geek", name: "GEEK FAM" },
          { id: "ae", name: "ALTER EGO ESPORTS" },
          { id: "dewa", name: "DEWA UNITED" },
          { id: "tlid", name: "TEAM LIQUID ID" },
          { id: "navi", name: "NAVI" },
        ]);
      }
    })();
  }, []);

  const doPredict = async () => {
    if (!home || !away || home === away) return;
    setLoading(true);
    setError(null);
    setRes(null);
    try {
      const r = await fetch(`/api/predict?home=${encodeURIComponent(home)}&away=${encodeURIComponent(away)}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Gagal prediksi");
      setRes(j);
    } catch (e: any) {
      setError(e?.message || "Gagal prediksi");
    } finally {
      setLoading(false);
    }
  };

  // UI helpers
  const homeTeam = useMemo(() => teams.find((t) => t.id === home), [teams, home]);
  const awayTeam = useMemo(() => teams.find((t) => t.id === away), [teams, away]);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Predictor</h1>
        <a href="/" className="text-sm underline">
          ← Back to Home
        </a>
      </div>

      <div className="rounded-2xl border p-4 md:p-6 bg-white">
        <div className="grid md:grid-cols-3 gap-4 items-end">
          {/* home */}
          <div>
            <label className="text-xs uppercase tracking-wide opacity-60">Home</label>
            <select value={home} onChange={(e) => setHome(e.target.value)} className="mt-1 w-full rounded-lg border p-2 bg-white">
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-center hidden md:block">
            <div className="text-xs uppercase tracking-wide opacity-60 mb-2">vs</div>
            <button
              onClick={() => {
                const a = home;
                setHome(away);
                setAway(a);
              }}
              className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
              disabled={home === away}
              title="Swap teams"
            >
              Swap
            </button>
          </div>

          {/* away */}
          <div>
            <label className="text-xs uppercase tracking-wide opacity-60">Away</label>
            <select value={away} onChange={(e) => setAway(e.target.value)} className="mt-1 w-full rounded-lg border p-2 bg-white">
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button onClick={doPredict} className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90 disabled:opacity-50" disabled={loading || !home || !away || home === away}>
            {loading ? "Predicting..." : "Predict"}
          </button>
          {home === away && <div className="text-sm text-red-600">Tim tidak boleh sama.</div>}
        </div>

        {/* hasil */}
        {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 text-sm">{error}</div>}

        {res && (
          <div className="mt-6">
            {/* header tim */}
            <div className="grid md:grid-cols-2 gap-4">
              <TeamCard team={homeTeam?.name || res.home} logo={homeTeam?.logo || undefined} prob={res.prob_home} favorite />
              <TeamCard team={awayTeam?.name || res.away} logo={awayTeam?.logo || undefined} prob={res.prob_away} />
            </div>

            {/* bar probs */}
            <div className="mt-6">
              <ProbBar leftLabel={res.home} rightLabel={res.away} left={res.prob_home} right={res.prob_away} />
            </div>

            {/* alasan top */}
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <ReasonCard title={`Kenapa ${res.home} unggul`} items={res.explanations.home_top} tone="pos" />
              <ReasonCard title={`Kenapa ${res.away} bisa menang`} items={res.explanations.away_top} tone="neu" />
            </div>

            {/* advanced */}
            <details className="mt-6 rounded-xl border p-4 bg-gray-50">
              <summary className="cursor-pointer font-medium">Advanced (fitur, bobot, kontribusi)</summary>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2">Feature</th>
                      <th>Home</th>
                      <th>Away</th>
                      <th>Weight</th>
                      <th>Contribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {res.features.map((f: any) => (
                      <tr key={f.name} className="border-b last:border-0">
                        <td className="py-2">{f.name}</td>
                        <td>{f.home.toFixed(2)}</td>
                        <td>{f.away.toFixed(2)}</td>
                        <td>{f.weight.toFixed(2)}</td>
                        <td className={f.contrib >= 0 ? "text-green-700" : "text-red-700"}>
                          {f.contrib >= 0 ? "+" : ""}
                          {f.contrib.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-xs opacity-60 mt-2">
                v{res.meta?.version} • {new Date(res.meta?.ts).toLocaleString()}
              </div>
            </details>
          </div>
        )}
      </div>
    </main>
  );
}

function TeamCard({ team, logo, prob, favorite }: { team: string; logo?: string; prob: number; favorite?: boolean }) {
  const pct = Math.round(prob * 100);
  return (
    <div className="rounded-xl border p-4 bg-white flex items-center gap-3">
      {logo ? <Image src={logo} alt={team} width={40} height={40} className="rounded" /> : <div className="h-10 w-10 rounded bg-gray-100" />}
      <div className="min-w-0">
        <div className="font-semibold truncate">
          {team} {favorite && pct >= 60 ? <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 align-middle">favorite</span> : null}
        </div>
        <div className="text-sm opacity-70">{pct}% win chance</div>
      </div>
    </div>
  );
}

function ProbBar({ leftLabel, rightLabel, left, right }: { leftLabel: string; rightLabel: string; left: number; right: number }) {
  const leftPct = Math.round(left * 100);
  const rightPct = 100 - leftPct;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-black transition-all" style={{ width: `${leftPct}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs mt-1 opacity-70">
        <span>{leftPct}%</span>
        <span>{rightPct}%</span>
      </div>
    </div>
  );
}

function ReasonCard({ title, items, tone }: { title: string; items: string[]; tone: "pos" | "neu" }) {
  const badge = tone === "pos" ? "bg-green-100 border-green-200 text-green-800" : "bg-gray-100 border-gray-200 text-gray-800";
  return (
    <div className="rounded-xl border p-4 bg-white">
      <div className="font-medium mb-2">{title}</div>
      {items.length === 0 && <div className="text-sm opacity-60">—</div>}
      <div className="flex flex-wrap gap-2">
        {items.map((s, i) => (
          <span key={i} className={`text-xs px-2 py-1 rounded-full border ${badge}`}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
