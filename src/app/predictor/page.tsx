"use client";
import { useState } from "react";

export default function PredictorPage() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function predict() {
    if (!a || !b) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/predict?teamA=${encodeURIComponent(a)}&teamB=${encodeURIComponent(b)}`);
      setRes(await r.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold mb-4">Predictor</h1>
      <div className="grid gap-2">
        <input className="border rounded p-2" placeholder="Team A (nama atau id)" value={a} onChange={(e) => setA(e.target.value)} />
        <input className="border rounded p-2" placeholder="Team B (nama atau id)" value={b} onChange={(e) => setB(e.target.value)} />
        <button className="rounded bg-black text-white px-4 py-2 disabled:opacity-50" onClick={predict} disabled={loading}>
          {" "}
          {loading ? "Predicting..." : "Predict"}{" "}
        </button>
      </div>

      {res && !res.error && (
        <div className="mt-6 space-y-2">
          <div className="text-sm opacity-70">Model: {res.model}</div>
          <ProbBar label={res.teamA.name} p={res.probA} />
          <ProbBar label={res.teamB.name} p={res.probB} />
          <div className="text-xs opacity-70">{res.notes}</div>
        </div>
      )}

      {res?.error && <p className="text-red-600 mt-4">{res.error}</p>}
    </main>
  );
}

function ProbBar({ label, p }: { label: string; p: number }) {
  const pct = Math.round(p * 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded">
        <div className="h-2 rounded bg-blue-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
