/**
 * rng.ts — Minimal seeded PRNG interface and Mulberry32 implementation.
 *
 * Provides a deterministic random number generator suitable for use in
 * puzzle generation (PermutationEngine, MaskEngine).
 */

/** Minimal RNG interface accepted by the engine modules. */
export interface RNG {
  /** Return a random 32-bit float in [0, 1). */
  next(): number;
  /** Return a random integer in [0, max). */
  nextInt(max: number): number;
}

/**
 * Create a seeded PRNG using the Mulberry32 algorithm.
 * Produces the same sequence of values for the same seed.
 *
 * @param seed - Any 32-bit integer. 0 is a valid seed.
 */
export function seededRng(seed: number): RNG {
  let s = seed >>> 0; // treat as unsigned 32-bit integer
  return {
    next(): number {
      s += 0x6d2b79f5;
      let z = s;
      z = Math.imul(z ^ (z >>> 15), z | 1);
      z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
      return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
    },
    nextInt(max: number): number {
      return Math.floor(this.next() * max);
    },
  };
}

/**
 * Fisher-Yates in-place shuffle of a plain number array using the provided RNG.
 */
export function shuffle(arr: number[], rng: RNG): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    const tmp = arr[i];
    const swp = arr[j];
    if (tmp !== undefined && swp !== undefined) {
      arr[i] = swp;
      arr[j] = tmp;
    }
  }
}
