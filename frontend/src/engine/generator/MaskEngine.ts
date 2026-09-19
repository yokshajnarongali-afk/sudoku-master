/**
 * MaskEngine.ts
 *
 * Removes cells from a completed Sudoku grid to create a playable puzzle,
 * while preserving uniqueness of the solution.
 *
 * Design principles:
 *   - The input solved grid is NEVER mutated.
 *   - Every removal is verified with hasUniqueSolution() before keeping it.
 *   - The algorithm is deterministic when given the same RNG.
 *   - Supported difficulty target ranges (by clue count):
 *       Easy:   42–46  (35–39 cells removed)
 *       Medium: 32–36  (45–49 cells removed)
 *       Hard:   26–30  (51–55 cells removed)
 *       Evil:   20–24  (57–61 cells removed)
 *
 * The masking algorithm (random-removal with uniqueness backtrack):
 *   1. Shuffle cell positions [0..80] using the provided RNG.
 *   2. For each position (in shuffled order):
 *      a. If current clue count ≤ targetClues, stop.
 *      b. Temporarily remove the cell.
 *      c. If the puzzle still has a unique solution, keep the removal.
 *      d. Otherwise restore the cell and continue.
 *   3. Return the masked grid.
 *
 * Note: Reaching the exact targetClues is not always possible for all seeds.
 * The function returns the best result (≥ targetClues, with ≤ clues after
 * exhausting all removal attempts).
 */

import { hasUniqueSolution } from "../solver/DLXSolver";
import { type RNG, shuffle } from "../utils/rng";

export { type RNG, seededRng } from "../utils/rng";

// ---------------------------------------------------------------------------
// Difficulty ranges
// ---------------------------------------------------------------------------

export const DIFFICULTY_CLUE_RANGES = {
  easy:   { min: 42, max: 46 },
  medium: { min: 32, max: 36 },
  hard:   { min: 26, max: 30 },
  evil:   { min: 20, max: 24 },
} as const satisfies Record<string, { min: number; max: number }>;

export type MaskDifficulty = keyof typeof DIFFICULTY_CLUE_RANGES;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Options for maskGrid. */
export interface MaskOptions {
  /**
   * Target number of given (filled) clue cells in the resulting puzzle.
   * Must be in [17, 80]. The algorithm will remove cells until this many
   * clues remain, or until no further uniqueness-preserving removal is possible.
   */
  readonly targetClues: number;
}

/**
 * Create a playable Sudoku puzzle by removing cells from a solved grid.
 *
 * @param solved  - Completed, valid Int32Array(81). NOT mutated.
 * @param options - Masking options (target clue count).
 * @param rng     - Seeded RNG for deterministic removal order.
 * @returns       A new Int32Array(81) with 0s for removed cells and the
 *                original digits for kept clue cells.
 *                Returns null if `solved` is not 81 elements.
 */
export function maskGrid(
  solved: Int32Array,
  options: MaskOptions,
  rng: RNG,
): Int32Array | null {
  if (solved.length !== 81) return null;

  const { targetClues } = options;

  // Work on a copy — never touch the original
  const puzzle = new Int32Array(solved);
  let clueCount = 81;

  // Shuffle cell positions for random removal order
  const positions = Array.from({ length: 81 }, (_, i) => i);
  shuffle(positions, rng);

  for (const pos of positions) {
    if (clueCount <= targetClues) break;

    const backup = puzzle[pos] ?? 0;
    puzzle[pos] = 0;

    if (hasUniqueSolution(puzzle)) {
      clueCount--;
    } else {
      // Removal breaks uniqueness — restore
      puzzle[pos] = backup;
    }
  }

  return puzzle;
}

/**
 * Convenience wrapper: mask a grid to a random target within the given
 * difficulty's clue range.
 *
 * @param solved     - Completed, valid Int32Array(81).
 * @param difficulty - One of 'easy', 'medium', 'hard', 'evil'.
 * @param rng        - Seeded RNG.
 * @returns          Masked puzzle or null on error.
 */
export function maskToDifficulty(
  solved: Int32Array,
  difficulty: MaskDifficulty,
  rng: RNG,
): Int32Array | null {
  const range = DIFFICULTY_CLUE_RANGES[difficulty];
  // Pick a random target within [min, max]
  const span = range.max - range.min + 1;
  const targetClues = range.min + rng.nextInt(span);
  return maskGrid(solved, { targetClues }, rng);
}

// ---------------------------------------------------------------------------
// Utility: count non-zero cells
// ---------------------------------------------------------------------------

/** Return the number of given (non-zero) cells in a (possibly partial) grid. */
export function countClues(grid: Int32Array): number {
  let count = 0;
  for (let i = 0; i < grid.length; i++) {
    if ((grid[i] ?? 0) !== 0) count++;
  }
  return count;
}
