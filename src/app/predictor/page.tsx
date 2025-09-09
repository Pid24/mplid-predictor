"use client";
import { useMemo, useState } from "react";
import Link from "next/link";

type Team = { id: string; name: string; logo?: string | null };

export default function PredictorPage() {
  const [left, setLeft] = useState<string>("");
  const [right, setRight] = useState<string>("");

  // TODO: ganti dengan fetch /api/teams agar dinamis
  const teams: Team[] = useMemo(
    () => [
      { id: "onic", name: "ONIC" },
      { id: "rrq", name: "RRQ HOSHI" },
      { id: "btr", name: "BIGETRON BY VIT" },
      { id: "evos", name: "EVOS" },
      { id: "ae", name: "ALTER EGO ESPORTS" },
      { id: "geek", name: "GEEK FAM" },
      { id: "dewa", name: "DEWA UNITED" },
      { id: "tlid", name: "TEAM LIQUID ID" },
      { id: "navi", name: "NAVI" },
    ],
    []
  );

  // placeholder “90% look”
  const probability = useMemo(() => {
    if (!left || !right || left === right) return null;
    const seed = (left.charCodeAt(0) * 31 + right.charCodeAt(0)) % 100;
    const pLeft = Math.min(90, Math.max(10, 45 + (seed - 50))); // clamp 10–90
    return { left: pLeft, right: 100 - pLeft };
  }, [left, right]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Predictor</h1>
        <Link href="/standings" className="btn-ghost">
          Lihat Standings
        </Link>
      </div>

      <div className="card p-6">
        <div className="grid md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-sm text-[var(--text-dim)]">Team A</label>
            <select className="mt-1 w-full card p-3" value={left} onChange={(e) => setLeft(e.target.value)}>
              <option value="">— pilih —</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="text-center text-[var(--text-dim)]">vs</div>
          <div>
            <label className="text-sm text-[var(--text-dim)]">Team B</label>
            <select className="mt-1 w-full card p-3" value={right} onChange={(e) => setRight(e.target.value)}>
              <option value="">— pilih —</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {probability && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-[var(--text-dim)] mb-2">
              <span>{teams.find((t) => t.id === left)?.name}</span>
              <span>{teams.find((t) => t.id === right)?.name}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-[var(--bg-soft)] overflow-hidden">
              <div className="h-full bg-[var(--accent-600)]" style={{ width: `${probability.left}%` }} title={`${probability.left}%`} />
            </div>
            <div className="mt-2 flex items-center justify-between font-semibold">
              <span>{probability.left}%</span>
              <span>{probability.right}%</span>
            </div>
            <div className="text-xs text-[var(--text-dim)] mt-2">*Model sederhana (placeholder). Nanti bisa diganti dengan model berbasis standings, H2H, form, dsb.</div>
          </div>
        )}
      </div>
    </section>
  );
}
