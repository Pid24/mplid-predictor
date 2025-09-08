export const dynamic = "force-dynamic";

type Team = { id?: string; name: string; tag?: string; logo?: string };

async function getTeams(): Promise<Team[]> {
  try {
    const res = await fetch("/api/teams", { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function TeamsPage() {
  const teams = await getTeams();

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold mb-4">Teams</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {teams.map((t, i) => (
          <a key={i} href={t.id ? `/teams/${t.id}` : "#"} className="border rounded p-3 flex items-center gap-3 hover:bg-gray-50">
            {t.logo && <img src={t.logo} alt={t.name} className="h-8 w-8 rounded" />}
            <div>
              <div className="font-medium">{t.name}</div>
              {t.tag && <div className="text-xs opacity-70">{t.tag}</div>}
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
