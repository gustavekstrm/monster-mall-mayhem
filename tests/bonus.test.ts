import { describe, expect, it } from "vitest";
import { createEmptyGrid, placeSymbol } from "../src/math/grid";
import { evaluateBonusTrigger } from "../src/math/bonus";

describe("evaluateBonusTrigger", () => {
  it("requires at least three scatters", () => {
    const g = createEmptyGrid();
    expect(evaluateBonusTrigger(g).mode).toBe("none");
  });

  it("awards standard free spins", () => {
    const g = createEmptyGrid();
    placeSymbol(g, 0, 0, "BONUS");
    placeSymbol(g, 0, 1, "BONUS");
    placeSymbol(g, 0, 2, "BONUS");
    const r = evaluateBonusTrigger(g);
    expect(r.mode).toBe("standard");
    expect(r.spins).toBe(8);
    expect(r.sessionMultiplier).toBe(1);
  });

  it("awards enhanced free spins for four or more scatters", () => {
    const g = createEmptyGrid();
    for (let c = 0; c < 4; c++) {
      placeSymbol(g, 3, c, "BONUS");
    }
    const r = evaluateBonusTrigger(g);
    expect(r.mode).toBe("enhanced");
    expect(r.spins).toBe(12);
    expect(r.sessionMultiplier).toBe(2);
  });
});
