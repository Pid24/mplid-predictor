// src/components/transfers/TransfersMini.skeleton.tsx
export default function TransfersMiniSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-2xl border px-3 py-2">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="h-6 w-6 rounded bg-gray-200 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
