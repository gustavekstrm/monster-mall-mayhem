import { describe, expect, it } from "vitest";
import { collapseAndFill } from "../src/math/cascades";
import { createEmptyGrid } from "../src/math/grid";
import { SeededRng } from "../src/math/rng";
import type { SymbolId } from "../src/math/symbols";

describe("collapseAndFill", () => {
  it("pulls symbols down and refills from the top with deterministic rng", () => {
    const rng = new SeededRng(999);
    const g = createEmptyGrid();
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        g[r]![c] = "L1";
      }
    }
    g[0]![0] = "H2";
    g[1]![0] = "H2";
    g[2]![0] = "H2";

    const removed = new Set(["0,0", "1,0", "2,0"]);
    collapseAndFill(g, removed, rng);

    /** Column 0 bottom three cells should be refilled; survivors L1 shift down */
    const col: SymbolId[] = [];
    for (let r = 0; r < 7; r++) {
      col.push(g[r]![0]!);
    }
    expect(col.slice(4, 7).every((s) => s === "L1")).toBe(true);
    expect(col.slice(0, 4).some((s) => s !== "L1")).toBe(true);
  });

  it("keeps unrelated columns untouched when collapsing one column only", () => {
    const rng = new SeededRng(12345);
    const g = createEmptyGrid();
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        g[r]![c] = "L4";
      }
    }
    const removed = new Set(["6,5", "5,5", "4,5"]);
    collapseAndFill(g, removed, rng);
    for (let r = 0; r < 7; r++) {
      expect(g[r]![0]).toBe("L4");
    }
    expect(g.map((row) => row[5])).toHaveLength(7);
  });
});
