type Props = { iso?: string | null; label?: string };

function formatJakarta(iso?: string | null) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  } catch {
    return iso ?? "-";
  }
}

export default function LastUpdated({ iso, label = "Last updated" }: Props) {
  return (
    <div className="text-xs text-[var(--text-dim)]">
      {label}: {formatJakarta(iso)}
    </div>
  );
}
