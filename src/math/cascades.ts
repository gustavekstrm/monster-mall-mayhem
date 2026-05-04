import type { SeededRng } from "./rng";
import { GRID_SIZE, type SymbolId, drawSymbol } from "./symbols";
import type { Grid } from "./grid";
import { cellKey } from "./grid";

/** Remove marked cells; symbols fall toward bottom (higher row index); new symbols fall in from top. */
export function collapseAndFill(
  grid: Grid,
  removed: ReadonlySet<string>,
  rng: SeededRng,
): void {
  for (let c = 0; c < GRID_SIZE; c++) {
    const survivors: SymbolId[] = [];
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      const k = cellKey(r, c);
      if (!removed.has(k)) {
        survivors.push(grid[r]![c]!);
      }
    }
    let write = GRID_SIZE - 1;
    for (const s of survivors) {
      grid[write]![c] = s;
      write--;
    }
    while (write >= 0) {
      grid[write]![c] = drawSymbol(rng);
      write--;
    }
  }
}

export function removeCells(grid: Grid, keys: Iterable<string>, rng: SeededRng): void {
  const set = new Set(keys);
  collapseAndFill(grid, set, rng);
}
