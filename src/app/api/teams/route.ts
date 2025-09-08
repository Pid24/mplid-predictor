import { getJSON } from "@/lib/mpl";

export const revalidate = 300; // cache 5 menit

export async function GET() {
  try {
    const teams = await getJSON<any[]>("/teams/");
    return new Response(JSON.stringify(teams), { headers: { "content-type": "application/json" } });
  } catch (e: any) {
    console.error("teams proxy error:", e);
    return new Response(JSON.stringify({ error: "upstream_error", message: e.message }), { status: 502 });
  }
}
