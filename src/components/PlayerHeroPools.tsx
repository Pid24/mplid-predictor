// src/components/PlayerHeroPools.tsx
"use client";

import { useEffect, useState } from "react";

type Hero = { hero_logo?: string; pick?: number; pick_rate?: number };
type PlayerPool = {
  player_name: string;
  lane?: string;
  total_heroes?: number;
  hero_pool?: Hero[];
};

export default function PlayerHeroPools({ playerName, className }: { playerName: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PlayerPool | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/hero-pools?player=${encodeURIComponent(playerName)}`, { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      const j = await res.json();
      const first = Array.isArray(j?.results) ? (j.results[0] as PlayerPool | undefined) : undefined;
      if (!first) {
        setError("Hero pool tidak ditemukan untuk pemain ini.");
      } else {
        setData(first);
      }
    } catch (e: any) {
      setError(e?.message || "Gagal memuat hero pool.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, playerName]);

  return (
    <>
      <button onClick={() => setOpen(true)} className={className ?? "underline hover:no-underline text-blue-600"} aria-label={`Lihat hero pool ${playerName}`}>
        {playerName}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          {/* Modal Card */}
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Hero Pool • {playerName}</h3>
              <button className="text-sm opacity-70 hover:opacity-100" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>

            <div className="mt-4">
              {loading ? (
                <div className="text-sm">Memuat…</div>
              ) : error ? (
                <div className="rounded border p-3 text-sm text-red-600 bg-red-50">{error}</div>
              ) : !data ? (
                <div className="text-sm opacity-70">Tidak ada data.</div>
              ) : (
                <>
                  {/* Info ringkas */}
                  <div className="text-sm opacity-80 mb-3">
                    Lane: <b>{data.lane || "-"}</b> • Total Heroes: <b>{data.total_heroes ?? data.hero_pool?.length ?? 0}</b>
                  </div>

                  {/* Grid hero */}
                  {data.hero_pool && data.hero_pool.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {data.hero_pool.map((h, idx) => (
                        <div key={idx} className="border rounded-xl p-3 flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={h.hero_logo || "/placeholder-hero.png"} alt="hero" className="h-10 w-10 rounded object-cover" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium">Pick: {h.pick ?? 0}</div>
                            <div className="text-xs opacity-70">Win rate: {h.pick_rate ?? 0}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded border p-3 text-sm">Hero pool kosong.</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
