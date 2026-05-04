import { SeededRng } from "../math/rng";
import { playFullRound, DEFAULT_SPIN_LIMITS } from "../math/spin";

function main(): void {
  const seed = Number(process.env.SIM_SEED ?? "42");
  const rounds = Number(process.env.SIM_ROUNDS ?? "5000");
  const rng = new SeededRng(seed);
  const limits = DEFAULT_SPIN_LIMITS;

  let bonusEntries = 0;
  let totalCappedStakeMultiples = 0;

  for (let i = 0; i < rounds; i++) {
    const r = playFullRound(rng, limits);
    totalCappedStakeMultiples += r.totalCappedBetMultiples;
    if (r.base.bonusAward.mode !== "none") {
      bonusEntries++;
    }
  }

  const avgReturnStakeMultiples = totalCappedStakeMultiples / rounds;
  console.log("Monster Mall Mayhem — math prototype sim");
  console.log({
    seed,
    rounds,
    limits,
    avgWinBetMultiples: avgReturnStakeMultiples,
    note: "Wins scaled as multiples of the stake unit; RTP tuning (~96%) arrives in later revisions.",
    bonusTriggerRate: bonusEntries / rounds,
  });
}

main();
