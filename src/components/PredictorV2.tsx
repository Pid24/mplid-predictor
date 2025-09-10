// src/components/PredictorV2.tsx
"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { buildStandMap, predictAB, StandRow as SRow, TeamListItem as TItem } from "@/lib/predict";
import { toSlug } from "@/data/h2h";

type Props = {
  teams: TItem[];
  standings: SRow[];
};

export default function PredictorV2({ teams, standings }: Props) {
  const standMap = useMemo(() => buildStandMap(standings, teams), [standings, teams]);

  // default pilihan: dua tim pertama (atau kosong)
  const [a, setA] = useState<string>(teams[0]?.id ?? "");
  const [b, setB] = useState<string>(teams[1]?.id ?? "");

  const aTeam = teams.find((t) => t.id === a);
  const bTeam = teams.find((t) => t.id === b);

  const canPredict = a && b && a !== b;

  const result = useMemo(() => {
    if (!canPredict) return null;
    return predictAB(a, b, standMap);
  }, [a, b, canPredict, standMap]);

  return (
    <div className="rounded-2xl border bg-white/80 backdrop-blur p-5 shadow-sm">
      {/* Selector */}
      <div className="grid sm:grid-cols-2 gap-4">
        <TeamSelect label="Team A" value={a} onChange={setA} teams={teams} />
        <TeamSelect label="Team B" value={b} onChange={setB} teams={teams} />
      </div>

      {!canPredict ? (
        <div className="mt-6 rounded-lg border p-4 text-sm opacity-70">Pilih dua tim yang berbeda untuk melihat hasil.</div>
      ) : !result ? (
        <div className="mt-6 animate-pulse rounded-lg border p-5">
          <div className="h-4 w-48 bg-gray-200 rounded mb-4" />
          <div className="h-3 w-80 bg-gray-200 rounded" />
        </div>
      ) : (
        <>
          {/* Hasil */}
          <div className="mt-6 grid gap-4">
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <TeamBadge team={aTeam} />
                <div className="text-sm opacity-60">vs</div>
                <TeamBadge team={bTeam} />
              </div>

              <div className="mt-4">
                <ProbBar leftLabel={aTeam?.name ?? toSlug(a)} rightLabel={bTeam?.name ?? toSlug(b)} left={Math.round(result.probA * 100)} right={Math.round(result.probB * 100)} />
              </div>

              <div className="mt-3 text-xs opacity-60">Model dikalibrasi: tidak akan menampilkan &lt;10% atau &gt;90% untuk menghindari overconfidence.</div>
            </div>

            {/* Explainability */}
            <div className="rounded-xl border p-4">
              <h3 className="font-semibold">Why this prediction</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <ExplainRow title="Head-to-Head" a={result.h2h.a} b={result.h2h.b} weight={result.h2h.weight} hint="Selisih menang-kalah antar kedua tim (W1–W3)." />
                <ExplainRow title="Recent Form (last 3)" a={result.form.a} b={result.form.b} weight={result.form.weight} hint="Selisih performa 3 match terakhir (semua lawan)." />
                <ExplainRow title="Standings Points" a={result.points.a} b={result.points.b} weight={result.points.weight} hint="Selisih poin klasemen terkini." />
                <ExplainRow title="Game Diff" a={result.gdiff.a} b={result.gdiff.b} weight={result.gdiff.weight} hint="Selisih net game win (GW)." />
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TeamSelect({ label, value, onChange, teams }: { label: string; value: string; onChange: (v: string) => void; teams: TItem[] }) {
  return (
    <label className="block">
      <div className="text-sm mb-1 opacity-70">{label}</div>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full appearance-none rounded-xl border px-3 py-2 bg-white pr-9">
          <option value="" disabled>
            Pilih tim…
          </option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-50">▾</span>
      </div>
    </label>
  );
}

function TeamBadge({ team }: { team?: TItem }) {
  return (
    <div className="flex items-center gap-2">
      {team?.logo ? <Image src={team.logo} alt={team.name} width={28} height={28} className="rounded" /> : <div className="h-7 w-7 rounded bg-gray-100" />}
      <div className="text-sm font-medium truncate max-w-[10rem]" title={team?.name}>
        {team?.name ?? "Unknown"}
      </div>
    </div>
  );
}

function ProbBar({ leftLabel, rightLabel, left, right }: { leftLabel: string; rightLabel: string; left: number; right: number }) {
  const leftWidth = Math.max(10, Math.min(90, left)); // visual clamp biar enak dilihat
  const rightWidth = 100 - leftWidth;
  return (
    <div>
      <div className="flex items-center justify-between text-sm font-medium">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <div className="mt-2 h-3 w-full rounded-full bg-gray-100 overflow-hidden flex">
        <div className="h-full bg-blue-500" style={{ width: `${leftWidth}%` }} />
        <div className="h-full bg-rose-500" style={{ width: `${rightWidth}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-blue-600">{left}%</span>
        <span className="font-semibold text-rose-600">{right}%</span>
      </div>
    </div>
  );
}

function ExplainRow({ title, a, b, weight, hint }: { title: string; a: number; b: number; weight: number; hint: string }) {
  const diff = a - b;
  const tilt = diff === 0 ? "Netral" : diff > 0 ? "Ke A" : "Ke B";
  return (
    <li className="rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">{title}</div>
        <div className="text-xs opacity-60">weight {weight.toFixed(1)}</div>
      </div>
      <div className="mt-1 text-sm">
        A: <b>{a}</b> • B: <b>{b}</b> <span className="opacity-60">({tilt})</span>
      </div>
      <div className="text-xs opacity-60 mt-1">{hint}</div>
    </li>
  );
}
