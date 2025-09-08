type TeamDetail = { id?: string; name: string; tag?: string; logo?: string /* tambahkan sesuai API */ };

async function getTeam(id: string): Promise<TeamDetail | null> {
  try {
    const res = await fetch(`/api/teams/${id}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  const team = await getTeam(params.id);
  if (!team) {
    return <main className="p-6">Team tidak ditemukan.</main>;
  }
  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex items-center gap-3">
        {team.logo && <img src={team.logo} alt={team.name} className="h-12 w-12 rounded" />}
        <h1 className="text-2xl font-bold">{team.name}</h1>
      </div>
      {/* render detail lain sesuai shape API */}
    </main>
  );
}
