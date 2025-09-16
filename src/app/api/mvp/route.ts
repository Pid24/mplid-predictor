import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type MVPRow = {
  rank: number;
  player_name: string;
  player_logo?: string | null;
  team_logo?: string | null;
  point: number;
};

const FALLBACK: MVPRow[] = [
  {
    rank: 1,
    player_name: "ONIC SANZ",
    player_logo:
      "https://cdn.id-mpl.com/season16/player/onic/SANZ.png?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=DO00UK9XG63MGT2KWV9H%2F20250908%2Fsgp1%2Fs3%2Faws4_request&X-Amz-Date=20250908T165929Z&X-Amz-SignedHeaders=host&X-Amz-Expires=21600&X-Amz-Signature=768266db1f0688160f7b22443426e15f20971a5bbb18285c72cacc85cf806341",
    team_logo:
      "https://cdn.id-mpl.com/data/teams/onic-b-500.png?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=DO00UK9XG63MGT2KWV9H%2F20250908%2Fsgp1%2Fs3%2Faws4_request&X-Amz-Date=20250908T165929Z&X-Amz-SignedHeaders=host&X-Amz-Expires=21600&X-Amz-Signature=637a59723202574c2e17c6cbfe1dae1e54e55ca9639e97e2235c07c5e83ded47",
    point: 35,
  },
  {
    rank: 2,
    player_name: "BTR Shogun",
    player_logo:
      "https://cdn.id-mpl.com/season16/player/btr/SHOGUN.png?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=DO00UK9XG63MGT2KWV9H%2F20250908%2Fsgp1%2Fs3%2Faws4_request&X-Amz-Date=20250908T165929Z&X-Amz-SignedHeaders=host&X-Amz-Expires=21600&X-Amz-Signature=7237cc6a0641593ba6c95f0ce22879d52bc2df80166bb090eb5a78829a90d9e9",
    team_logo:
      "https://cdn.id-mpl.com/season16/Logo/btr_vit.png?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=DO00UK9XG63MGT2KWV9H%2F20250908%2Fsgp1%2Fs3%2Faws4_request&X-Amz-Date=20250908T165701Z&X-Amz-SignedHeaders=host&X-Amz-Expires=21600&X-Amz-Signature=3d9df8d7c3fa3e59e0577a53e08ba6b94e90f5815abc8eb356f01a6ba14b89a0",
    point: 27,
  },
  {
    rank: 3,
    player_name: "ONIC Kairi",
    player_logo:
      "https://cdn.id-mpl.com/season16/player/onic/KAIRI.png?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=DO00UK9XG63MGT2KWV9H%2F20250908%2Fsgp1%2Fs3%2Faws4_request&X-Amz-Date=20250908T165929Z&X-Amz-SignedHeaders=host&X-Amz-Expires=21600&X-Amz-Signature=c4100bde083dd3b6518b3f2707ec699fe13898cba576c05418bf262c91d8bb20",
    team_logo:
      "https://cdn.id-mpl.com/data/teams/onic-b-500.png?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=DO00UK9XG63MGT2KWV9H%2F20250908%2Fsgp1%2Fs3%2Faws4_request&X-Amz-Date=20250908T165929Z&X-Amz-SignedHeaders=host&X-Amz-Expires=21600&X-Amz-Signature=637a59723202574c2e17c6cbfe1dae1e54e55ca9639e97e2235c07c5e83ded47",
    point: 21,
  },
  {
    rank: 4,
    player_name: "AE Arfy",
    player_logo:
      "https://cdn.id-mpl.com/season16/player/ae/ARFY.png?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=DO00UK9XG63MGT2KWV9H%2F20250908%2Fsgp1%2Fs3%2Faws4_request&X-Amz-Date=20250908T165929Z&X-Amz-SignedHeaders=host&X-Amz-Expires=21600&X-Amz-Signature=22b9d8bb27f74dc5168c5b32ebb5b622c1ba33cf2b66d1f03f6f85dfb60f1b32",
    team_logo:
      "https://cdn.id-mpl.com/data/teams/ae-500.png?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=DO00UK9XG63MGT2KWV9H%2F20250908%2Fsgp1%2Fs3%2Faws4_request&X-Amz-Date=20250908T165929Z&X-Amz-SignedHeaders=host&X-Amz-Expires=21600&X-Amz-Signature=51ca1c59e00d6a034ab7b964ab6cfd0e2c8cea6d16a25d8880812d1b0da28f46",
    point: 21,
  },
  {
    rank: 5,
    player_name: "BTR NNAEL",
    player_logo:
      "https://cdn.id-mpl.com/season16/player/btr/NNAEL.png?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=DO00UK9XG63MGT2KWV9H%2F20250908%2Fsgp1%2Fs3%2Faws4_request&X-Amz-Date=20250908T165929Z&X-Amz-SignedHeaders=host&X-Amz-Expires=21600&X-Amz-Signature=a160f6b46a6ac44e61402e01589e0748ba33c07e263a0b7f5274a5bb2935815a",
    team_logo:
      "https://cdn.id-mpl.com/season16/Logo/btr_vit.png?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=DO00UK9XG63MGT2KWV9H%2F20250908%2Fsgp1%2Fs3%2Faws4_request&X-Amz-Date=20250908T165701Z&X-Amz-SignedHeaders=host&X-Amz-Expires=21600&X-Amz-Signature=3d9df8d7c3fa3e59e0577a53e08ba6b94e90f5815abc8eb356f01a6ba14b89a0",
    point: 20,
  },
  {
    rank: 6,
    player_name: "RRQ Idok",
    player_logo:
      "https://cdn.id-mpl.com/season16/player/rrq/IDOK.png?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=DO00UK9XG63MGT2KWV9H%2F20250908%2Fsgp1%2Fs3%2Faws4_request&X-Amz-Date=20250908T165929Z&X-Amz-SignedHeaders=host&X-Amz-Expires=21600&X-Amz-Signature=da4a2db728038e6033c924a9014fe5ea5f8729d8192f80784f252c6fde82b0ea",
    team_logo:
      "https://cdn.id-mpl.com/data/teams/rrq-500.png?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=DO00UK9XG63MGT2KWV9H%2F20250908%2Fsgp1%2Fs3%2Faws4_request&X-Amz-Date=20250908T165700Z&X-Amz-SignedHeaders=host&X-Amz-Expires=21600&X-Amz-Signature=68f903406bad5755c37f82129104ff44ebf5edea420f3a0dad524a5e6d108847",
    point: 20,
  },
  {
    rank: 7,
    player_name: "DEWA QINN",
    player_logo:
      "https://cdn.id-mpl.com/season16/player/dewa/Qinn.png?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=DO00UK9XG63MGT2KWV9H%2F20250908%2Fsgp1%2Fs3%2Faws4_request&X-Amz-Date=20250908T165907Z&X-Amz-SignedHeaders=host&X-Amz-Expires=21600&X-Amz-Signature=829a6ecd76b463bc6c43ac0a197b39a5fe2c010f3f3eb598e2b1568b3ffae6b2",
    team_logo:
      "https://cdn.id-mpl.com/data/teams/dewa-united-500.png?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=DO00UK9XG63MGT2KWV9H%2F20250908%2Fsgp1%2Fs3%2Faws4_request&X-Amz-Date=20250908T165703Z&X-Amz-SignedHeaders=host&X-Amz-Expires=21600&X-Amz-Signature=d1ad5636a947912bad1267e4deaf58e4c5b99408b167e2fc93bb7597c34df18b",
    point: 18,
  },
  {
    rank: 8,
    player_name: "EVOS Alberttt",
    player_logo:
      "https://cdn.id-mpl.com/season16/player/evos/ALBERTTT.png?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=DO00UK9XG63MGT2KWV9H%2F20250908%2Fsgp1%2Fs3%2Faws4_request&X-Amz-Date=20250908T165911Z&X-Amz-SignedHeaders=host&X-Amz-Expires=21600&X-Amz-Signature=2ef64555217c7d7f7fd1db57670818b5d38e67cf27288ead1d330aa1af0ba845",
    team_logo:
      "https://cdn.id-mpl.com/data/teams/evos-500.png?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=DO00UK9XG63MGT2KWV9H%2F20250908%2Fsgp1%2Fs3%2Faws4_request&X-Amz-Date=20250908T165703Z&X-Amz-SignedHeaders=host&X-Amz-Expires=21600&X-Amz-Signature=7c86fb080d07b92f3e58365211839a489d0b6035131234638387a640d893a949",
    point: 18,
  },
];

export async function GET() {
  const upstream = process.env.MVP_UPSTREAM_URL;
  if (upstream) {
    try {
      const res = await fetch(upstream, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as MVPRow[];
        return NextResponse.json(Array.isArray(data) ? data : FALLBACK);
      }
    } catch {}
  }
  return NextResponse.json(FALLBACK);
}
