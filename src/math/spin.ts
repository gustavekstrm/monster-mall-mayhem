import type { SeededRng } from "./rng";
import { findClusters } from "./clusters";
import { totalPayoutForClusters } from "./payouts";
import { collapseAndFill } from "./cascades";
import type { Grid } from "./grid";
import type { ChaosMeterSnapshot, MonsterEffectPick } from "./gameTypes";
import { LOW_PAY_SYMBOLS } from "./symbols";
import { GRID_SIZE } from "./symbols";
import { cellKey } from "./grid";
import { evaluateBonusTrigger, type FreeSpinAward } from "./bonus";
import { fillGridRandom } from "./grid";

export interface SpinLimits {
  bet: number;
  baseMaxBetMultiple: number;
  bonusMaxBetMultiple: number;
}

export const DEFAULT_SPIN_LIMITS: SpinLimits = {
  bet: 1,
  baseMaxBetMultiple: 500,
  bonusMaxBetMultiple: 10_000,
};

export interface ChaosMeterState {
  value: number;
  threshold: number;
}

export interface SpinOutcome {
  totalWinBetMultiples: number;
  /** Wins after applying max-win cap for the phase (base spin). */
  cappedTotalWinBetMultiples: number;
  finalGrid: Grid;
  bonusAward: FreeSpinAward;
  chaosSnapshots: ChaosMeterSnapshot[];
}

export interface BonusSessionOutcome {
  totalWinBetMultiples: number;
  cappedTotalWinBetMultiples: number;
}

export function createChaosMeter(threshold = 100): ChaosMeterState {
  return { value: 0, threshold };
}

function pickMonsterEffect(rng: SeededRng): MonsterEffectPick {
  return rng.pickWeighted(
    ["CASCADE_MULTIPLIER", "LOW_TO_WILD", "REMOVE_RANDOM"] as const,
    [30, 35, 35],
  );
}

function convertRandomLowTierToWilds(grid: Grid, rng: SeededRng): void {
  const tier = LOW_PAY_SYMBOLS[rng.nextInt(LOW_PAY_SYMBOLS.length)]!;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r]![c] === tier) {
        grid[r]![c] = "WILD";
      }
    }
  }
}

function removeRandomNonBonusCells(grid: Grid, rng: SeededRng, count: number): void {
  const keys: string[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r]![c] !== "BONUS") {
        keys.push(cellKey(r, c));
      }
    }
  }
  rng.shuffleInPlace(keys);
  const remove = keys.slice(0, Math.min(count, keys.length));
  collapseAndFill(grid, new Set(remove), rng);
}

const MAX_CASCADE_STEPS = 80;

/** One base-game spin incl. cascading, chaos/monster hooks, caps; bonus triggers read from settled grid only. */
export function playBaseGameSpin(rng: SeededRng, limits: SpinLimits = DEFAULT_SPIN_LIMITS): SpinOutcome {
  const grid = fillGridRandom(rng);
  const chaos = createChaosMeter();
  const chaosSnapshots: ChaosMeterSnapshot[] = [];
  let total = 0;
  let steps = 0;

  while (steps < MAX_CASCADE_STEPS) {
    steps++;
    const clusters = findClusters(grid);
    if (clusters.length === 0) {
      break;
    }
    let roundWin = totalPayoutForClusters(clusters);
    chaos.value += 18;
    let monster: MonsterEffectPick | null = null;
    if (chaos.value >= chaos.threshold) {
      chaos.value = 0;
      monster = pickMonsterEffect(rng);
      if (monster === "CASCADE_MULTIPLIER") {
        roundWin *= 2;
      }
    }
    total += roundWin;
    chaosSnapshots.push({ value: chaos.value, threshold: chaos.threshold, monster });

    const toRemove = new Set<string>();
    for (const cl of clusters) {
      for (const k of cl.cells) {
        toRemove.add(k);
      }
    }
    collapseAndFill(grid, toRemove, rng);

    if (monster === "LOW_TO_WILD") {
      convertRandomLowTierToWilds(grid, rng);
    } else if (monster === "REMOVE_RANDOM") {
      removeRandomNonBonusCells(grid, rng, rng.nextIntInclusive(3, 6));
    }
  }

  const capped = Math.min(total, limits.baseMaxBetMultiple);
  const bonusAward = evaluateBonusTrigger(grid);
  return {
    totalWinBetMultiples: total,
    cappedTotalWinBetMultiples: capped,
    finalGrid: grid,
    bonusAward,
    chaosSnapshots,
  };
}

export function playBonusSession(
  rng: SeededRng,
  award: FreeSpinAward,
  limits: SpinLimits = DEFAULT_SPIN_LIMITS,
): BonusSessionOutcome {
  if (award.mode === "none" || award.spins <= 0) {
    return { totalWinBetMultiples: 0, cappedTotalWinBetMultiples: 0 };
  }

  let sum = 0;
  for (let i = 0; i < award.spins; i++) {
    const grid = fillGridRandom(rng);
    const chaos = createChaosMeter();
    let steps = 0;
    while (steps < MAX_CASCADE_STEPS) {
      steps++;
      const clusters = findClusters(grid);
      if (clusters.length === 0) {
        break;
      }
      let roundWin = totalPayoutForClusters(clusters) * award.sessionMultiplier;
      chaos.value += 18;
      let monster: MonsterEffectPick | null = null;
      if (chaos.value >= chaos.threshold) {
        chaos.value = 0;
        monster = pickMonsterEffect(rng);
        if (monster === "CASCADE_MULTIPLIER") {
          roundWin *= 2;
        }
      }
      sum += roundWin;

      const toRemove = new Set<string>();
      for (const cl of clusters) {
        for (const k of cl.cells) {
          toRemove.add(k);
        }
      }
      collapseAndFill(grid, toRemove, rng);

      if (monster === "LOW_TO_WILD") {
        convertRandomLowTierToWilds(grid, rng);
      } else if (monster === "REMOVE_RANDOM") {
        removeRandomNonBonusCells(grid, rng, rng.nextIntInclusive(3, 6));
      }
    }
  }

  return {
    totalWinBetMultiples: sum,
    cappedTotalWinBetMultiples: Math.min(sum, limits.bonusMaxBetMultiple),
  };
}

export function playFullRound(
  rng: SeededRng,
  limits: SpinLimits = DEFAULT_SPIN_LIMITS,
): {
  base: SpinOutcome;
  bonus: BonusSessionOutcome;
  /** Total capped contribution for reporting in bet multiples. */
  totalCappedBetMultiples: number;
} {
  const base = playBaseGameSpin(rng, limits);
  const bonus = playBonusSession(rng, base.bonusAward, limits);
  return {
    base,
    bonus,
    totalCappedBetMultiples: base.cappedTotalWinBetMultiples + bonus.cappedTotalWinBetMultiples,
  };
}
