import { getJSON } from "@/lib/mpl";
export const revalidate = 300;
export async function GET() {
  const data = await getJSON<any[]>("/player-stats/");
  return new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } });
}
