import { GRID_SIZE, type PaySymbolId, type SymbolId, PAY_SYMBOLS, isPaySymbol } from "./symbols";
import type { Grid } from "./grid";
import { cellKey } from "./grid";

export interface ClusterWin {
  symbol: PaySymbolId;
  cells: readonly string[];
  size: number;
}

const DR = [1, -1, 0, 0];
const DC = [0, 0, 1, -1];

const PAY_RANK: Record<PaySymbolId, number> = {
  H2: 6,
  H1: 5,
  L4: 4,
  L3: 3,
  L2: 2,
  L1: 1,
};

const SYMBOL_ORDER = [...PAY_SYMBOLS].sort((a, b) => PAY_RANK[b] - PAY_RANK[a]);

function traversable(sym: SymbolId, tier: PaySymbolId): boolean {
  if (sym === "BONUS") {
    return false;
  }
  if (sym === "WILD" || sym === tier) {
    return true;
  }
  return false;
}

/** Greedy high → low pay tiers claim wild overlaps; rejects traversing conflicting pay symbols for the active tier. */
export function findClusters(grid: Grid): ClusterWin[] {
  const wins: ClusterWin[] = [];
  const consumed = new Set<string>();
  const deadByTier = new Map<PaySymbolId, Set<string>>();

  const deadFor = (tier: PaySymbolId): Set<string> => {
    let s = deadByTier.get(tier);
    if (!s) {
      s = new Set();
      deadByTier.set(tier, s);
    }
    return s;
  };

  for (const tier of SYMBOL_ORDER) {
    const dead = deadFor(tier);
    for (let sr = 0; sr < GRID_SIZE; sr++) {
      for (let sc = 0; sc < GRID_SIZE; sc++) {
        if (grid[sr]![sc] !== tier) {
          continue;
        }
        const seedKey = cellKey(sr, sc);
        if (consumed.has(seedKey) || dead.has(seedKey)) {
          continue;
        }

        const component: string[] = [];
        const stack: Array<{ r: number; c: number }> = [{ r: sr, c: sc }];
        const visited = new Set<string>();

        while (stack.length) {
          const cur = stack.pop()!;
          const ck = cellKey(cur.r, cur.c);
          if (visited.has(ck) || consumed.has(ck)) {
            continue;
          }
          const sym = grid[cur.r]![cur.c]!;
          if (!traversable(sym, tier)) {
            continue;
          }

          visited.add(ck);
          component.push(ck);

          for (let d = 0; d < 4; d++) {
            const nr = cur.r + DR[d]!;
            const nc = cur.c + DC[d]!;
            if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) {
              continue;
            }
            const nk = cellKey(nr, nc);
            if (visited.has(nk) || consumed.has(nk)) {
              continue;
            }
            const ns = grid[nr]![nc]!;
            if (isPaySymbol(ns) && ns !== tier) {
              continue;
            }
            if (!traversable(ns, tier)) {
              continue;
            }
            stack.push({ r: nr, c: nc });
          }
        }

        /** Wild-only blobs never originate from tier seeds placed on pay icons. Always includes ≥1 tier tile. */

        if (component.length < 5) {
          for (const k of component) {
            dead.add(k);
          }
          continue;
        }

        wins.push({ symbol: tier, cells: [...component], size: component.length });
        for (const k of component) {
          consumed.add(k);
        }
      }
    }
  }

  return wins;
}
