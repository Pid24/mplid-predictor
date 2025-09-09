// src/data/h2h.ts
// Manual H2H MPL ID (Week 1–3) — format game score (best-of-3).
// SENGAJA pakai singkatan tim biar gampang input, lalu dinormalisasi.

export type H2HRow = {
  week: number;
  a: string; // singkatan (ONIC, BTR, RRQ, AE, EVOS, GEEK, TLID, NAVI, DEWA)
  b: string;
  a_games: number; // jumlah game dimenangkan tim a
  b_games: number; // jumlah game dimenangkan tim b
};

// Normalisasi singkatan yang “typo” ke yang benar
function fixAbbr(s: string): string {
  const x = s.trim().toUpperCase();
  if (x === "GEEJ") return "GEEK"; // typo pada input week 2
  return x;
}

// Data dari user (Week 1–3)
export const H2H_RESULTS: H2HRow[] = [
  // WEEK 1
  { week: 1, a: "ONIC", b: "DEWA", a_games: 2, b_games: 0 },
  { week: 1, a: "NAVI", b: "EVOS", a_games: 0, b_games: 2 },

  { week: 1, a: "TLID", b: "GEEK", a_games: 1, b_games: 2 },
  { week: 1, a: "ONIC", b: "BTR", a_games: 2, b_games: 0 },
  { week: 1, a: "RRQ", b: "AE", a_games: 2, b_games: 1 },

  { week: 1, a: "BTR", b: "NAVI", a_games: 1, b_games: 2 },
  { week: 1, a: "GEEK", b: "RRQ", a_games: 2, b_games: 0 },
  { week: 1, a: "AE", b: "DEWA", a_games: 2, b_games: 0 },

  // WEEK 2
  { week: 2, a: "ONIC", b: "GEEK", a_games: 2, b_games: 0 },
  { week: 2, a: "DEWA", b: "NAVI", a_games: 2, b_games: 0 },

  { week: 2, a: "GEEK", b: "BTR", a_games: 0, b_games: 2 }, // GEEJ -> GEEK
  { week: 2, a: "AE", b: "EVOS", a_games: 2, b_games: 1 },
  { week: 2, a: "TLID", b: "DEWA", a_games: 1, b_games: 2 },

  { week: 2, a: "NAVI", b: "AE", a_games: 2, b_games: 0 },
  { week: 2, a: "RRQ", b: "TLID", a_games: 2, b_games: 0 },
  { week: 2, a: "BTR", b: "EVOS", a_games: 2, b_games: 1 },

  // WEEK 3
  { week: 3, a: "NAVI", b: "RRQ", a_games: 0, b_games: 2 },
  { week: 3, a: "EVOS", b: "TLID", a_games: 2, b_games: 0 },

  { week: 3, a: "EVOS", b: "GEEK", a_games: 2, b_games: 0 },
  { week: 3, a: "BTR", b: "AE", a_games: 2, b_games: 1 },
  { week: 3, a: "RRQ", b: "ONIC", a_games: 0, b_games: 2 },

  { week: 3, a: "DEWA", b: "BTR", a_games: 1, b_games: 2 },
  { week: 3, a: "AE", b: "ONIC", a_games: 1, b_games: 2 },
  { week: 3, a: "TLID", b: "NAVI", a_games: 0, b_games: 2 },
].map((r) => ({ ...r, a: fixAbbr(r.a), b: fixAbbr(r.b) }));

// Mapping singkatan -> slug (slug → nama resmi di predict.ts)
export const ABBR_TO_SLUG: Record<string, string> = {
  AE: "ae",
  BTR: "btr",
  DEWA: "dewa",
  EVOS: "evos",
  GEEK: "geek",
  ONIC: "onic",
  RRQ: "rrq",
  TLID: "tlid",
  NAVI: "navi",
};

// util: hitung H2H score (0..1) untuk team (slug) A vs B berdasar data games dimenangkan
export function h2hScore(slugA: string, slugB: string): { a: number; b: number } {
  // translate slug -> abbr
  const abbrA = Object.entries(ABBR_TO_SLUG).find(([, s]) => s === slugA)?.[0];
  const abbrB = Object.entries(ABBR_TO_SLUG).find(([, s]) => s === slugB)?.[0];
  if (!abbrA || !abbrB) return { a: 0.5, b: 0.5 };

  let aGames = 0;
  let bGames = 0;

  for (const r of H2H_RESULTS) {
    const A = r.a,
      B = r.b;
    if (A === abbrA && B === abbrB) {
      aGames += r.a_games;
      bGames += r.b_games;
    } else if (A === abbrB && B === abbrA) {
      aGames += r.b_games;
      bGames += r.a_games;
    }
  }

  const total = aGames + bGames;
  if (total === 0) return { a: 0.5, b: 0.5 }; // belum pernah ketemu
  const aPct = aGames / total;
  const bPct = bGames / total;
  return { a: aPct, b: bPct };
}
