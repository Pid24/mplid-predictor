import { NextResponse } from "next/server";

const REMOTE = "https://mlbb-stats.ridwaanhall.com/api/mplid/transfers/";

export async function GET() {
  try {
    const res = await fetch(REMOTE, { cache: "no-store", next: { revalidate: 0 } });
    if (!res.ok) {
      return NextResponse.json({ error: "Upstream error", status: res.status }, { status: res.status });
    }
    const data = await res.json();
    // langsung forward raw array dari upstream
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch transfers" }, { status: 502 });
  }
}
