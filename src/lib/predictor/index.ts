import { fetchTransfersServer } from "../mplid/transfers";
import { computeRosterImpactScore, applyRosterImpactToWinrate } from "./roster-impact";

export async function predictMatchWithTransfers(params: { teamA: { nameOrCode: string; baseWinPct: number; starterNames?: string[] }; teamB: { nameOrCode: string; baseWinPct: number; starterNames?: string[] } }) {
  const transfers = await fetchTransfersServer();

  const impactA = computeRosterImpactScore(params.teamA.nameOrCode, transfers, { starterNames: params.teamA.starterNames });
  const impactB = computeRosterImpactScore(params.teamB.nameOrCode, transfers, { starterNames: params.teamB.starterNames });

  let a = applyRosterImpactToWinrate(params.teamA.baseWinPct, impactA);
  let b = 100 - a;
  b = applyRosterImpactToWinrate(params.teamB.baseWinPct, impactB);
  a = 100 - b;

  return {
    teamA: { winPct: a, impact: impactA },
    teamB: { winPct: b, impact: impactB },
    transfersUsed: transfers,
  };
}
