/** Deterministic 32-bit PRNG (Mulberry32-style). */
export class SeededRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** [0, 1) */
  next(): number {
    return this.nextUint32() / 0x100000000;
  }

  nextUint32(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }

  /** Integer in [0, max) */
  nextInt(max: number): number {
    if (max <= 0) {
      throw new Error("nextInt: max must be positive");
    }
    return Math.floor(this.next() * max);
  }

  /** Integer in [min, max] inclusive */
  nextIntInclusive(min: number, max: number): number {
    if (max < min) {
      throw new Error("nextIntInclusive: max < min");
    }
    return min + this.nextInt(max - min + 1);
  }

  pickWeighted<T>(items: readonly T[], weights: readonly number[]): T {
    if (items.length !== weights.length || items.length === 0) {
      throw new Error("pickWeighted: items and weights must be same non-empty length");
    }
    let total = 0;
    for (const w of weights) {
      if (w < 0) {
        throw new Error("pickWeighted: negative weight");
      }
      total += w;
    }
    if (total === 0) {
      return items[this.nextInt(items.length)]!;
    }
    let r = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i]!;
      if (r < 0) {
        return items[i]!;
      }
    }
    return items[items.length - 1]!;
  }

  clone(): SeededRng {
    const n = new SeededRng(0);
    (n as unknown as { state: number }).state = this.state;
    return n;
  }

  shuffleInPlace<T>(items: T[]): void {
    for (let i = items.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      const tmp = items[i]!;
      items[i] = items[j]!;
      items[j] = tmp;
    }
  }
}
