import type { SeededRng } from "./rng";

export const GRID_SIZE = 7 as const;

export type PaySymbolId = "L1" | "L2" | "L3" | "L4" | "H1" | "H2";
export type SymbolId = PaySymbolId | "WILD" | "BONUS";

export const PAY_SYMBOLS: readonly PaySymbolId[] = [
  "L1",
  "L2",
  "L3",
  "L4",
  "H1",
  "H2",
] as const;

export const LOW_PAY_SYMBOLS: readonly PaySymbolId[] = ["L1", "L2", "L3", "L4"] as const;

export function isPaySymbol(s: SymbolId): s is PaySymbolId {
  return s !== "WILD" && s !== "BONUS";
}

export function isLowPaySymbol(s: SymbolId): s is PaySymbolId {
  return (LOW_PAY_SYMBOLS as readonly SymbolId[]).includes(s);
}

/** Relative weights for fresh symbol drops (per cell). */
export const BASE_SYMBOL_WEIGHTS: Readonly<Record<SymbolId, number>> = {
  L1: 22,
  L2: 18,
  L3: 14,
  L4: 10,
  H1: 8,
  H2: 5,
  WILD: 4,
  BONUS: 3,
};

const BASE_WEIGHT_ITEMS = Object.keys(BASE_SYMBOL_WEIGHTS) as SymbolId[];
const BASE_WEIGHT_VALUES = BASE_WEIGHT_ITEMS.map((k) => BASE_SYMBOL_WEIGHTS[k]!);

export function drawSymbol(rng: SeededRng): SymbolId {
  return rng.pickWeighted(BASE_WEIGHT_ITEMS, BASE_WEIGHT_VALUES);
}
