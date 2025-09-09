import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "MPL ID Predictor",
  description: "Klasemen, tim, dan prediksi matchup MPL ID",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        {/* NAVBAR */}
        <header className="sticky top-0 z-50 bg-[var(--bg)]/80 backdrop-blur border-b">
          <nav className="app-container flex items-center justify-between py-3">
            <Link href="/" className="font-extrabold text-xl tracking-tight">
              MPL<span className="text-[var(--accent-600)]">Predict</span>
            </Link>
            <div className="flex items-center gap-1">
              <Link href="/standings" className="btn-ghost">
                Standings
              </Link>
              <Link href="/teams" className="btn-ghost">
                Teams
              </Link>
              <Link href="/predictor" className="btn">
                Predictor
              </Link>
            </div>
          </nav>
        </header>

        {/* PAGE */}
        <main className="app-container">{children}</main>

        {/* FOOTER */}
        <footer className="mt-16">
          <div className="app-container card p-6">
            <div className="text-sm text-[var(--text-dim)]">Data dari endpoint publik MPL ID. Untuk hiburan & informasi.</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
