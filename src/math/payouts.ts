import type { PaySymbolId } from "./symbols";
import type { ClusterWin } from "./clusters";

/** Base scale per symbol; cluster payout uses size bands. */
const SYMBOL_BASE: Readonly<Record<PaySymbolId, number>> = {
  L1: 0.08,
  L2: 0.12,
  L3: 0.18,
  L4: 0.24,
  H1: 0.6,
  H2: 1.2,
};

function sizeMultiplier(size: number): number {
  if (size < 5) {
    return 0;
  }
  if (size <= 7) {
    return 1;
  }
  if (size <= 12) {
    return 1.8;
  }
  if (size <= 20) {
    return 3;
  }
  return 4.5;
}

/** Returns win as multiple of bet for a single cluster. */
export function payoutForCluster(symbol: PaySymbolId, size: number): number {
  if (size < 5) {
    return 0;
  }
  return SYMBOL_BASE[symbol] * size * sizeMultiplier(size);
}

export function totalPayoutForClusters(clusters: readonly ClusterWin[]): number {
  let t = 0;
  for (const cl of clusters) {
    t += payoutForCluster(cl.symbol, cl.size);
  }
  return t;
}
