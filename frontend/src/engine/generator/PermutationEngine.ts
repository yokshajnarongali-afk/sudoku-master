/**
 * PermutationEngine.ts
 *
 * Structure-preserving transformations on a completed 9×9 Sudoku grid.
 * All functions:
 *   - Accept a flat Int32Array(81): index = row * 9 + col, digits 1–9.
 *   - Return a NEW Int32Array(81) — the input is never mutated.
 *   - Preserve Sudoku validity (every transformation is a symmetry of the
 *     Sudoku constraint structure).
 *
 * No puzzle masking or randomisation of clue count is done here.
 */

import { type RNG, shuffle } from "../utils/rng";

export { type RNG, seededRng } from "../utils/rng";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const N = 9;
const SIZE = 81;

/** Flat cell index from (row, col). */
function idx(r: number, c: number): number {
  return r * N + c;
}

/** Read a cell from the grid with a 0 fallback for type safety. */
function get(grid: Int32Array, r: number, c: number): number {
  return grid[r * N + c] ?? 0;
}

// ---------------------------------------------------------------------------
// Digit remapping
// ---------------------------------------------------------------------------

/**
 * Remap every digit in the grid according to `mapping`.
 *
 * @param grid    - Completed Sudoku grid.
 * @param mapping - Array of length 9 where `mapping[d - 1]` is the new digit
 *                  for old digit `d` (1-indexed). Must be a permutation of 1–9.
 * @returns New grid with remapped digits.
 */
export function digitRemap(grid: Int32Array, mapping: readonly number[]): Int32Array {
  const result = new Int32Array(SIZE);
  for (let i = 0; i < SIZE; i++) {
    const d = grid[i] ?? 0;
    result[i] = mapping[d - 1] ?? d;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Band / stack swaps
// ---------------------------------------------------------------------------

/**
 * Swap two row-bands (groups of 3 rows).
 * Bands are numbered 0, 1, 2 (rows 0–2, 3–5, 6–8 respectively).
 */
export function swapBands(grid: Int32Array, b1: number, b2: number): Int32Array {
  const result = new Int32Array(grid);
  for (let dr = 0; dr < 3; dr++) {
    const r1 = b1 * 3 + dr;
    const r2 = b2 * 3 + dr;
    for (let c = 0; c < N; c++) {
      result[idx(r1, c)] = get(grid, r2, c);
      result[idx(r2, c)] = get(grid, r1, c);
    }
  }
  return result;
}

/**
 * Swap two column-stacks (groups of 3 columns).
 * Stacks are numbered 0, 1, 2 (cols 0–2, 3–5, 6–8 respectively).
 */
export function swapStacks(grid: Int32Array, s1: number, s2: number): Int32Array {
  const result = new Int32Array(grid);
  for (let dc = 0; dc < 3; dc++) {
    const c1 = s1 * 3 + dc;
    const c2 = s2 * 3 + dc;
    for (let r = 0; r < N; r++) {
      result[idx(r, c1)] = get(grid, r, c2);
      result[idx(r, c2)] = get(grid, r, c1);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Row / column swaps within a band / stack
// ---------------------------------------------------------------------------

/**
 * Swap two rows within the same band.
 *
 * @param band  - Band index (0, 1, or 2).
 * @param r1    - Row offset within the band (0, 1, or 2).
 * @param r2    - Row offset within the band (0, 1, or 2).
 */
export function swapRowsInBand(
  grid: Int32Array,
  band: number,
  r1: number,
  r2: number,
): Int32Array {
  const result = new Int32Array(grid);
  const row1 = band * 3 + r1;
  const row2 = band * 3 + r2;
  for (let c = 0; c < N; c++) {
    result[idx(row1, c)] = get(grid, row2, c);
    result[idx(row2, c)] = get(grid, row1, c);
  }
  return result;
}

/**
 * Swap two columns within the same stack.
 *
 * @param stack - Stack index (0, 1, or 2).
 * @param c1    - Column offset within the stack (0, 1, or 2).
 * @param c2    - Column offset within the stack (0, 1, or 2).
 */
export function swapColsInStack(
  grid: Int32Array,
  stack: number,
  c1: number,
  c2: number,
): Int32Array {
  const result = new Int32Array(grid);
  const col1 = stack * 3 + c1;
  const col2 = stack * 3 + c2;
  for (let r = 0; r < N; r++) {
    result[idx(r, col1)] = get(grid, r, col2);
    result[idx(r, col2)] = get(grid, r, col1);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Rotations and reflections
// ---------------------------------------------------------------------------

/**
 * Rotate the grid 90° clockwise.
 * Formula: result[r][c] = original[8-c][r]
 */
export function rotate90(grid: Int32Array): Int32Array {
  const result = new Int32Array(SIZE);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      result[idx(r, c)] = get(grid, 8 - c, r);
    }
  }
  return result;
}

/**
 * Rotate the grid 180°.
 * Formula: result[r][c] = original[8-r][8-c]
 */
export function rotate180(grid: Int32Array): Int32Array {
  const result = new Int32Array(SIZE);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      result[idx(r, c)] = get(grid, 8 - r, 8 - c);
    }
  }
  return result;
}

/**
 * Rotate the grid 270° clockwise (= 90° counter-clockwise).
 * Formula: result[r][c] = original[c][8-r]
 */
export function rotate270(grid: Int32Array): Int32Array {
  const result = new Int32Array(SIZE);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      result[idx(r, c)] = get(grid, c, 8 - r);
    }
  }
  return result;
}

/**
 * Flip the grid horizontally (mirror left–right).
 * Formula: result[r][c] = original[r][8-c]
 */
export function flipHorizontal(grid: Int32Array): Int32Array {
  const result = new Int32Array(SIZE);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      result[idx(r, c)] = get(grid, r, 8 - c);
    }
  }
  return result;
}

/**
 * Flip the grid vertically (mirror top–bottom).
 * Formula: result[r][c] = original[8-r][c]
 */
export function flipVertical(grid: Int32Array): Int32Array {
  const result = new Int32Array(SIZE);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      result[idx(r, c)] = get(grid, 8 - r, c);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Randomize
// ---------------------------------------------------------------------------

/**
 * Apply a random sequence of validity-preserving transformations to produce
 * a new completed Sudoku grid from the given seed grid.
 *
 * Transformations applied (in order):
 *   1. Random digit remapping (random permutation of 1–9)
 *   2. Random band order (shuffle the 3 bands)
 *   3. Random stack order (shuffle the 3 stacks)
 *   4. Random row order within each band
 *   5. Random column order within each stack
 *   6. Random reflection (one of: identity, flipH, flipV, rotate90..270)
 *
 * @param grid - A valid completed Sudoku grid (Int32Array(81)).
 * @param rng  - A seeded RNG for deterministic output.
 * @returns    A new valid completed Sudoku grid.
 */
export function randomize(grid: Int32Array, rng: RNG): Int32Array {
  let result = new Int32Array(grid);

  // 1. Random digit remapping
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  shuffle(digits, rng);
  // @ts-expect-error: TS 5.5 ArrayBufferLike vs Next.js DOM typings mismatch
  result = digitRemap(result, digits);

  // 2. Random band order
  const bands = [0, 1, 2];
  shuffle(bands, rng);
  // Apply the permutation by successive swaps
  // We achieve any permutation by applying swap(0, bands[0]), then fix, etc.
  // Simpler: rebuild row-by-row according to the new band order
  {
    const tmp = new Int32Array(result);
    for (let newBand = 0; newBand < 3; newBand++) {
      const oldBand = bands[newBand] ?? newBand;
      for (let dr = 0; dr < 3; dr++) {
        const newRow = newBand * 3 + dr;
        const oldRow = oldBand * 3 + dr;
        for (let c = 0; c < N; c++) {
          result[idx(newRow, c)] = tmp[idx(oldRow, c)] ?? 0;
        }
      }
    }
  }

  // 3. Random stack order
  const stacks = [0, 1, 2];
  shuffle(stacks, rng);
  {
    const tmp = new Int32Array(result);
    for (let newStack = 0; newStack < 3; newStack++) {
      const oldStack = stacks[newStack] ?? newStack;
      for (let dc = 0; dc < 3; dc++) {
        const newCol = newStack * 3 + dc;
        const oldCol = oldStack * 3 + dc;
        for (let r = 0; r < N; r++) {
          result[idx(r, newCol)] = tmp[idx(r, oldCol)] ?? 0;
        }
      }
    }
  }

  // 4. Random row order within each band
  for (let band = 0; band < 3; band++) {
    const rows = [0, 1, 2];
    shuffle(rows, rng);
    const tmp = new Int32Array(result);
    for (let newDr = 0; newDr < 3; newDr++) {
      const oldDr = rows[newDr] ?? newDr;
      const newRow = band * 3 + newDr;
      const oldRow = band * 3 + oldDr;
      for (let c = 0; c < N; c++) {
        result[idx(newRow, c)] = tmp[idx(oldRow, c)] ?? 0;
      }
    }
  }

  // 5. Random column order within each stack
  for (let stack = 0; stack < 3; stack++) {
    const cols = [0, 1, 2];
    shuffle(cols, rng);
    const tmp = new Int32Array(result);
    for (let newDc = 0; newDc < 3; newDc++) {
      const oldDc = cols[newDc] ?? newDc;
      const newCol = stack * 3 + newDc;
      const oldCol = stack * 3 + oldDc;
      for (let r = 0; r < N; r++) {
        result[idx(r, newCol)] = tmp[idx(r, oldCol)] ?? 0;
      }
    }
  }

  // 6. Random geometric transformation (one of 8)
  const transform = rng.nextInt(8);
  switch (transform) {
    case 0: break; // identity
    case 1: result = flipHorizontal(result) as any; break;
    case 2: result = flipVertical(result) as any; break;
    case 3: result = rotate90(result) as any; break;
    case 4: result = rotate180(result) as any; break;
    case 5: result = rotate270(result) as any; break;
    case 6: result = flipHorizontal(rotate90(result)) as any; break;
    case 7: result = flipVertical(rotate90(result)) as any; break;
  }

  return result;
}
