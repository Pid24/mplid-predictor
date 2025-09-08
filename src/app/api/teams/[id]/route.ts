import { getJSON } from "@/lib/mpl";

type Params = { params: { id: string } };

export const revalidate = 300;

export async function GET(_req: Request, { params }: Params) {
  try {
    const data = await getJSON<any>(`/teams/${params.id}/`);
    return new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "upstream_error", message: e.message }), { status: 502 });
  }
}
