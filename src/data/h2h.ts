// src/data/h2h.ts
export type Match = {
  week: number;
  home: string; // slug
  away: string; // slug
  homeScore: number;
  awayScore: number;
  date?: string;
};

// normalisasi nama → slug
export const TEAM_ALIASES: Record<string, string> = {
  onic: "onic",
  "onic esports": "onic",
  "onic id": "onic",

  dewa: "dewa",
  "dewa united": "dewa",

  navi: "navi",

  evos: "evos",

  tlid: "tlid",
  "team liquid id": "tlid",

  geek: "geek",
  "geek fam": "geek",

  btr: "btr",
  "bigetron by vit": "btr",
  bigetron: "btr",

  rrq: "rrq",
  "rrq hoshi": "rrq",

  ae: "ae",
  "alter ego": "ae",
  "alter ego esports": "ae",
};

export function toSlug(name: string) {
  const key = name.trim().toLowerCase();
  return TEAM_ALIASES[key] ?? key;
}

// WEEK 1–3 (dikonversi ke slug)
export const H2H_MATCHES: Match[] = [
  // WEEK 1
  { week: 1, home: toSlug("ONIC"), away: toSlug("DEWA"), homeScore: 2, awayScore: 0 },
  { week: 1, home: toSlug("NAVI"), away: toSlug("EVOS"), homeScore: 0, awayScore: 2 },

  { week: 1, home: toSlug("TLID"), away: toSlug("GEEK"), homeScore: 1, awayScore: 2 },
  { week: 1, home: toSlug("ONIC"), away: toSlug("BTR"), homeScore: 2, awayScore: 0 },
  { week: 1, home: toSlug("RRQ"), away: toSlug("AE"), homeScore: 2, awayScore: 1 },

  { week: 1, home: toSlug("BTR"), away: toSlug("NAVI"), homeScore: 1, awayScore: 2 },
  { week: 1, home: toSlug("GEEK"), away: toSlug("RRQ"), homeScore: 2, awayScore: 0 },
  { week: 1, home: toSlug("AE"), away: toSlug("DEWA"), homeScore: 2, awayScore: 0 },

  // WEEK 2
  { week: 2, home: toSlug("ONIC"), away: toSlug("GEEK"), homeScore: 2, awayScore: 0 },
  { week: 2, home: toSlug("DEWA"), away: toSlug("NAVI"), homeScore: 2, awayScore: 0 },

  { week: 2, home: toSlug("GEEK"), away: toSlug("BTR"), homeScore: 0, awayScore: 2 },
  { week: 2, home: toSlug("AE"), away: toSlug("EVOS"), homeScore: 2, awayScore: 1 },
  { week: 2, home: toSlug("TLID"), away: toSlug("DEWA"), homeScore: 1, awayScore: 2 },

  { week: 2, home: toSlug("NAVI"), away: toSlug("AE"), homeScore: 2, awayScore: 0 },
  { week: 2, home: toSlug("RRQ"), away: toSlug("TLID"), homeScore: 2, awayScore: 0 },
  { week: 2, home: toSlug("BTR"), away: toSlug("EVOS"), homeScore: 2, awayScore: 1 },

  // WEEK 3
  { week: 3, home: toSlug("NAVI"), away: toSlug("RRQ"), homeScore: 0, awayScore: 2 },
  { week: 3, home: toSlug("EVOS"), away: toSlug("TLID"), homeScore: 2, awayScore: 0 },

  { week: 3, home: toSlug("EVOS"), away: toSlug("GEEK"), homeScore: 2, awayScore: 0 },
  { week: 3, home: toSlug("BTR"), away: toSlug("AE"), homeScore: 2, awayScore: 1 },
  { week: 3, home: toSlug("RRQ"), away: toSlug("ONIC"), homeScore: 0, awayScore: 2 },

  { week: 3, home: toSlug("DEWA"), away: toSlug("BTR"), homeScore: 1, awayScore: 2 },
  { week: 3, home: toSlug("AE"), away: toSlug("ONIC"), homeScore: 1, awayScore: 2 },
  { week: 3, home: toSlug("TLID"), away: toSlug("NAVI"), homeScore: 0, awayScore: 2 },

  // WEEK 4
  { week: 4, home: toSlug("NAVI"), away: toSlug("ONIC"), homeScore: 1, awayScore: 2 },
  { week: 4, home: toSlug("EVOS"), away: toSlug("DEWA"), homeScore: 2, awayScore: 0 },

  { week: 4, home: toSlug("TLID"), away: toSlug("BTR"), homeScore: 0, awayScore: 2 },
  { week: 4, home: toSlug("RRQ"), away: toSlug("EVOS"), homeScore: 2, awayScore: 0 },
  { week: 4, home: toSlug("GEEK"), away: toSlug("AE"), homeScore: 0, awayScore: 2 },

  { week: 4, home: toSlug("ONIC"), away: toSlug("TLID"), homeScore: 2, awayScore: 0 },
  { week: 4, home: toSlug("BTR"), away: toSlug("RRQ"), homeScore: 2, awayScore: 1 },
  { week: 4, home: toSlug("DEWA"), away: toSlug("GEEK"), homeScore: 2, awayScore: 1 },
];
