import type { Grid } from "./grid";
import { countSymbol } from "./grid";
import type { SymbolId } from "./symbols";

export type FreeSpinMode = "none" | "standard" | "enhanced";

export interface FreeSpinAward {
  mode: FreeSpinMode;
  spins: number;
  /** Global win multiplier while in bonus (enhanced only for prototype). */
  sessionMultiplier: number;
}

const BONUS: SymbolId = "BONUS";

export function countBonusSymbols(grid: Grid): number {
  return countSymbol(grid, BONUS);
}

/** Rules: 3 bonus → standard; 4+ → enhanced. */
export function evaluateBonusTrigger(grid: Grid): FreeSpinAward {
  const n = countBonusSymbols(grid);
  if (n >= 4) {
    return { mode: "enhanced", spins: 12, sessionMultiplier: 2 };
  }
  if (n >= 3) {
    return { mode: "standard", spins: 8, sessionMultiplier: 1 };
  }
  return { mode: "none", spins: 0, sessionMultiplier: 1 };
}
