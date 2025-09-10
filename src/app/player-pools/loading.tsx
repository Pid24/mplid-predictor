// src/app/player-pools/loading.tsx
export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl p-6 space-y-8">
      <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="mt-3 space-y-2">
              {Array.from({ length: 3 }).map((__, j) => (
                <div key={j} className="h-8 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
