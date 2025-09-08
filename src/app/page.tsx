export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">MPL ID Predictor</h1>
      <p className="mt-2 text-sm opacity-70">Project starter sudah jalan. Buka /standings atau /predictor (nanti kita buat).</p>
      <div className="mt-4 space-x-3">
        <a className="underline" href="/standings">
          Standings
        </a>
        <a className="underline" href="/predictor">
          Predictor
        </a>
      </div>
    </main>
  );
}
