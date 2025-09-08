// src/app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold">MPL ID Predictor</h1>
      <p className="mt-2 text-sm opacity-70">Web kecil buat lihat klasemen, tim, dan prediksi matchup berbasis data MPL Indonesia.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/standings" className="rounded-xl border p-4 hover:shadow-sm transition bg-white">
          <div className="text-lg font-semibold">Standings</div>
          <p className="text-sm opacity-70 mt-1">Klasemen terbaru: poin, win–loss, dan net game win.</p>
        </Link>

        <Link href="/teams" className="rounded-xl border p-4 hover:shadow-sm transition bg-white">
          <div className="text-lg font-semibold">Teams</div>
          <p className="text-sm opacity-70 mt-1">Daftar tim beserta logo. Klik untuk lihat metrik ringkas.</p>
        </Link>

        <Link href="/predictor" className="rounded-xl border p-4 hover:shadow-sm transition bg-white sm:col-span-2">
          <div className="text-lg font-semibold">Predictor</div>
          <p className="text-sm opacity-70 mt-1">Pilih dua tim untuk melihat probabilitas menang (segera hadir).</p>
        </Link>
      </div>

      <div className="mt-6 text-xs opacity-60">Data bersumber dari endpoint publik MPL ID. Untuk hiburan & informasi.</div>
    </main>
  );
}
