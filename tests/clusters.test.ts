import { describe, expect, it } from "vitest";
import { findClusters } from "../src/math/clusters";
import { createEmptyGrid } from "../src/math/grid";
import type { SymbolId } from "../src/math/symbols";

function place(grid: SymbolId[][], cells: Array<[number, number, SymbolId]>): void {
  for (const [r, c, s] of cells) {
    grid[r]![c] = s;
  }
}

describe("findClusters", () => {
  it("detects orthogonal 5+ cluster", () => {
    const g = createEmptyGrid();
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        g[r]![c] = "BONUS";
      }
    }
    /** Isolated L1 snake keeps payTypes unambiguous and size exactly five. */
    place(g, [
      [3, 3, "L1"],
      [3, 4, "WILD"],
      [3, 5, "L1"],
      [4, 5, "L1"],
      [5, 5, "L1"],
    ]);
    const wins = findClusters(g);
    expect(wins).toHaveLength(1);
    expect(wins[0]!.symbol).toBe("L1");
    expect(wins[0]!.size).toBe(5);
  });

  it("does not pay wild-only clusters", () => {
    const g = createEmptyGrid();
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        g[r]![c] = "WILD";
      }
    }
    g[6]![6] = "BONUS";
    expect(findClusters(g)).toHaveLength(0);
  });

  it("assigns dominant pay tiers before lower tiers when wilds touch multiple symbols", () => {
    const g = createEmptyGrid();
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        g[r]![c] = "L2";
      }
    }
    for (let c = 0; c < 7; c++) {
      g[3]![c] = c === 3 ? "WILD" : c < 3 ? "L1" : "L2";
    }
    const wins = findClusters(g);
    expect(wins.some((w) => w.symbol === "L2" && w.size >= 5)).toBe(true);
  });

  it("scores two disjoint paying clusters independently", () => {
    const g = createEmptyGrid();
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        g[r]![c] = "BONUS";
      }
    }
    /** Block A */
    place(g, [
      [1, 1, "H1"],
      [1, 2, "H1"],
      [2, 1, "H1"],
      [2, 2, "H1"],
      [2, 3, "H1"],
    ]);
    /** Block B */
    place(g, [
      [5, 5, "L4"],
      [5, 6, "L4"],
      [6, 5, "L4"],
      [6, 6, "L4"],
      [6, 4, "L4"],
    ]);
    const wins = findClusters(g);
    const symbols = wins.map((w) => w.symbol).sort();
    expect(symbols).toEqual(["H1", "L4"]);
  });
});
