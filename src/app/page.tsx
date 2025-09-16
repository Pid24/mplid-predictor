import Link from "next/link";
import { Suspense } from "react";
import PlayerPoolsMini from "@/components/player/PlayerPoolsMini";
import PlayerPoolsMiniSkeleton from "@/components/player/PlayerPoolsMini.skeleton";
import TransfersMini from "@/components/transfers/TransfersMini";
import TransfersMiniSkeleton from "@/components/transfers/TransfersMini.skeleton";

export default function Home() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="card p-8 bg-grid">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
          <div className="flex-1">
            <p className="chip mb-3">MPL Indonesia</p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Klasemen, Roster, dan <span className="text-[var(--accent-600)]">Prediksi Matchup</span>
            </h1>
            <p className="mt-3 text-[var(--text-dim)] leading-relaxed">Lihat performa tim & pemain secara ringkas. Predictor akan memberi probabilitas menang berbasis data.</p>
            <div className="mt-6 flex gap-3">
              <Link href="/predictor" className="btn">
                Coba Predictor
              </Link>
              <Link href="/standings" className="btn-ghost">
                Lihat Standings →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick sections */}
      <section className="grid md:grid-cols-3 gap-4">
        <Link href="/standings" className="card p-6 card-hover">
          <h3 className="font-semibold text-lg">Standings</h3>
          <p className="text-sm text-[var(--text-dim)] mt-1">Poin, win–loss, dan net game win terbaru.</p>
        </Link>
        <Link href="/teams" className="card p-6 card-hover">
          <h3 className="font-semibold text-lg">Teams</h3>
          <p className="text-sm text-[var(--text-dim)] mt-1">Logo, roster, dan metrik ringkas tiap tim.</p>
        </Link>
        <Link href="/mvp" className="card p-6 card-hover">
          <h3 className="font-semibold text-lg">MVP Radar</h3>
          <p className="text-sm text-[var(--text-dim)] mt-1">Top pemain berdasarkan poin MVP.</p>
        </Link>
      </section>

      {/* 2-kolom teaser: Player Pools & Transfers */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-3">Player Pools Teratas</h3>
          <Suspense fallback={<PlayerPoolsMiniSkeleton rows={5} />}>
            {/* @ts-expect-error Server Component in Server Component */}
            <PlayerPoolsMini limit={5} />
          </Suspense>
        </div>

        <div className="card p-6">
          <Suspense fallback={<TransfersMiniSkeleton rows={6} />}>
            {/* @ts-expect-error Server Component in Server Component */}
            <TransfersMini limit={6} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
