import type { SeededRng } from "./rng";
import { GRID_SIZE, type SymbolId, drawSymbol } from "./symbols";

export type Grid = SymbolId[][];

export function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => "L1" as SymbolId),
  );
}

export function fillGridRandom(rng: SeededRng): Grid {
  const g = createEmptyGrid();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      g[r]![c] = drawSymbol(rng);
    }
  }
  return g;
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.slice());
}

export function cellKey(r: number, c: number): string {
  return `${r},${c}`;
}

export function parseKey(key: string): { r: number; c: number } {
  const [rs, cs] = key.split(",");
  return { r: Number(rs), c: Number(cs) };
}

export function placeSymbol(grid: Grid, r: number, c: number, symbol: SymbolId): void {
  grid[r]![c] = symbol;
}

export function countSymbol(grid: Grid, symbol: SymbolId): number {
  let n = 0;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r]![c] === symbol) {
        n++;
      }
    }
  }
  return n;
}
