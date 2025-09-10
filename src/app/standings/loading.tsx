// src/app/standings/loading.tsx
export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="h-6 w-52 bg-gray-200 rounded animate-pulse" />
      <div className="mt-4">
        <div className="h-8 w-full bg-gray-100 rounded animate-pulse" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 w-full bg-gray-50 rounded mt-2 animate-pulse" />
        ))}
      </div>
    </main>
  );
}
