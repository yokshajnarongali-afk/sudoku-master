/**
 * SeedGrid.ts
 *
 * Provides a canonical, deterministic, valid completed 9×9 Sudoku grid.
 * Represented as a flat Int32Array(81): index = row * 9 + col.
 *
 * This is the foundational seed from which the puzzle generator will
 * produce new puzzles via digit substitution and band/stack shuffling.
 *
 * NO randomization is performed here.
 * NO puzzle generation (cell removal) is performed here.
 */

/** Total cells in a Sudoku grid. */
export const GRID_SIZE = 81 as const;

/** Side length of the grid (9). */
export const BOARD_SIZE = 9 as const;

/** Side length of a 3×3 box (3). */
export const BOX_SIZE = 3 as const;

/**
 * Convert (row, col) coordinates to a flat array index.
 * Both row and col must be in range [0, 8].
 */
export function cellIndex(row: number, col: number): number {
  return row * BOARD_SIZE + col;
}

/**
 * The canonical seed grid — a known-valid completed Sudoku solution.
 *
 * Visual layout:
 *   5 3 4 | 6 7 8 | 9 1 2
 *   6 7 2 | 1 9 5 | 3 4 8
 *   1 9 8 | 3 4 2 | 5 6 7
 *   ------+-------+------
 *   8 5 9 | 7 6 1 | 4 2 3
 *   4 2 6 | 8 5 3 | 7 9 1
 *   7 1 3 | 9 2 4 | 8 5 6
 *   ------+-------+------
 *   9 6 1 | 5 3 7 | 2 8 4
 *   2 8 7 | 4 1 9 | 6 3 5
 *   3 4 5 | 2 8 6 | 1 7 9
 */
export const SEED_GRID: Readonly<Int32Array> = new Int32Array([
  // Row 0
  5, 3, 4, 6, 7, 8, 9, 1, 2,
  // Row 1
  6, 7, 2, 1, 9, 5, 3, 4, 8,
  // Row 2
  1, 9, 8, 3, 4, 2, 5, 6, 7,
  // Row 3
  8, 5, 9, 7, 6, 1, 4, 2, 3,
  // Row 4
  4, 2, 6, 8, 5, 3, 7, 9, 1,
  // Row 5
  7, 1, 3, 9, 2, 4, 8, 5, 6,
  // Row 6
  9, 6, 1, 5, 3, 7, 2, 8, 4,
  // Row 7
  2, 8, 7, 4, 1, 9, 6, 3, 5,
  // Row 8
  3, 4, 5, 2, 8, 6, 1, 7, 9,
]);

// ---------------------------------------------------------------------------
// Group extractors
// ---------------------------------------------------------------------------

/**
 * Return the 9 values for row `r` (0–8) as a new Int32Array.
 */
export function getRow(grid: Int32Array, r: number): Int32Array {
  return grid.slice(r * BOARD_SIZE, r * BOARD_SIZE + BOARD_SIZE);
}

/**
 * Return the 9 values for column `c` (0–8) as a new Int32Array.
 */
export function getColumn(grid: Int32Array, c: number): Int32Array {
  const result = new Int32Array(BOARD_SIZE);
  for (let r = 0; r < BOARD_SIZE; r++) {
    result[r] = grid[r * BOARD_SIZE + c] ?? 0;
  }
  return result;
}

/**
 * Return the 9 values for 3×3 box `b` (0–8) as a new Int32Array.
 *
 * Box numbering (left-to-right, top-to-bottom):
 *   0 1 2
 *   3 4 5
 *   6 7 8
 */
export function getBox(grid: Int32Array, b: number): Int32Array {
  const result = new Int32Array(BOARD_SIZE);
  const startRow = Math.floor(b / BOX_SIZE) * BOX_SIZE;
  const startCol = (b % BOX_SIZE) * BOX_SIZE;
  let i = 0;
  for (let dr = 0; dr < BOX_SIZE; dr++) {
    for (let dc = 0; dc < BOX_SIZE; dc++) {
      result[i] = grid[(startRow + dr) * BOARD_SIZE + (startCol + dc)] ?? 0;
      i++;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Check whether a 9-element Int32Array contains every digit 1–9 exactly once.
 */
export function isValidGroup(group: Int32Array): boolean {
  if (group.length !== BOARD_SIZE) return false;
  // Bit mask: bit N is set if digit N has been seen (indices 1–9 used)
  let seen = 0;
  for (let i = 0; i < BOARD_SIZE; i++) {
    const digit = group[i] ?? 0;
    if (digit < 1 || digit > 9) return false;
    const bit = 1 << digit;
    if ((seen & bit) !== 0) return false; // duplicate
    seen |= bit;
  }
  return seen === 0b1111111110; // bits 1–9 all set
}

/** Detailed breakdown returned by validateGrid. */
export interface GridValidationResult {
  /** True only if all cells are in range AND all rows/cols/boxes are valid. */
  readonly valid: boolean;
  /** True if every cell value is between 1 and 9 (inclusive). */
  readonly allCellsInRange: boolean;
  /** Indices (0–8) of rows that do not contain 1–9 exactly once. */
  readonly invalidRows: readonly number[];
  /** Indices (0–8) of columns that do not contain 1–9 exactly once. */
  readonly invalidColumns: readonly number[];
  /** Indices (0–8) of 3×3 boxes that do not contain 1–9 exactly once. */
  readonly invalidBoxes: readonly number[];
}

/**
 * Validate a flat Int32Array(81) Sudoku grid.
 * Checks every row, column, and 3×3 box for completeness and uniqueness.
 */
export function validateGrid(grid: Int32Array): GridValidationResult {
  if (grid.length !== GRID_SIZE) {
    return {
      valid: false,
      allCellsInRange: false,
      invalidRows: [],
      invalidColumns: [],
      invalidBoxes: [],
    };
  }

  let allCellsInRange = true;
  for (let i = 0; i < GRID_SIZE; i++) {
    const v = grid[i] ?? 0;
    if (v < 1 || v > 9) {
      allCellsInRange = false;
      break;
    }
  }

  const invalidRows: number[] = [];
  const invalidColumns: number[] = [];
  const invalidBoxes: number[] = [];

  for (let i = 0; i < BOARD_SIZE; i++) {
    if (!isValidGroup(getRow(grid, i))) invalidRows.push(i);
    if (!isValidGroup(getColumn(grid, i))) invalidColumns.push(i);
    if (!isValidGroup(getBox(grid, i))) invalidBoxes.push(i);
  }

  const valid =
    allCellsInRange &&
    invalidRows.length === 0 &&
    invalidColumns.length === 0 &&
    invalidBoxes.length === 0;

  return { valid, allCellsInRange, invalidRows, invalidColumns, invalidBoxes };
}
