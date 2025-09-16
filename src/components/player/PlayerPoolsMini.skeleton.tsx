export default function PlayerPoolsMiniSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="mt-2 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-2xl border px-3 py-2">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="h-4 w-16 rounded bg-gray-200 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
