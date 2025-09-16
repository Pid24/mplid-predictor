// src/components/transfers/TransfersMini.tsx
// Server Component (jangan pakai onError)
import { fetchTransfersServer } from "@/lib/mplid/transfers";

function getInitials(name?: string) {
  if (!name) return "?";
  const clean = name.replace(/[^A-Za-z0-9 ]/g, " ").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function LogoOrBadge({ src, alt, size = 24 }: { src?: string | null; alt?: string; size?: number }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt ?? ""} width={size} height={size} className="rounded object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div className="rounded bg-gray-200 text-[10px] flex items-center justify-center" style={{ width: size, height: size }} aria-label={alt} title={alt}>
      {getInitials(alt)}
    </div>
  );
}

export default async function TransfersMini({ limit = 6, filterTeam }: { limit?: number; filterTeam?: string }) {
  const data = await fetchTransfersServer();

  const items = (filterTeam ? data.filter((d) => d.from_team_name === filterTeam || d.to_team_name === filterTeam) : data).slice(0, limit);

  return (
    <section>
      <h3 className="font-semibold text-lg mb-3">Transfer Terbaru</h3>
      {items.length === 0 ? (
        <div className="text-sm text-[var(--text-dim)]">Belum ada aktivitas transfer.</div>
      ) : (
        <div className="space-y-3">
          {items.map((t, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-2xl border px-3 py-2">
              <div className="flex items-center gap-3">
                <LogoOrBadge src={t.from_team_logo ?? undefined} alt={t.from_team_name} size={24} />
                <span className="text-sm">
                  <span className="font-medium">{t.player_name}</span> <span className="text-[var(--text-dim)]">({t.player_role})</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <LogoOrBadge src={t.to_team_logo ?? undefined} alt={t.to_team_name} size={24} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
