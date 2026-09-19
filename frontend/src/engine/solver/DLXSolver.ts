/**
 * DLXSolver.ts
 *
 * Algorithm X with Dancing Links for solving Sudoku puzzles.
 *
 * API:
 *   solve(puzzle)           — returns a solved Int32Array(81) or null
 *   hasUniqueSolution(puzzle) — true iff the puzzle has exactly one solution
 *
 * Exported primitives (cover, uncover, chooseColumn, search) are exposed
 * for unit testing but are not intended as a public API.
 *
 * Design constraints:
 *   - Never mutates the caller's input array.
 *   - Returns null for invalid, contradictory, or unsolvable puzzles.
 *   - hasUniqueSolution stops searching after finding the 2nd solution.
 *   - Creates a fresh DLXMatrix per call — no shared mutable state.
 */

import {
  DLXMatrix,
  candidateIndex,
  decodeCandidate,
  type ColumnNode,
  type DLXNode,
} from "./DLXMatrix";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Return true if the given (partial) Sudoku grid is internally consistent:
 *   - All digits are 0 (empty) or 1–9
 *   - No digit is repeated in any row, column, or 3×3 box
 */
export function validatePuzzle(puzzle: Int32Array): boolean {
  if (puzzle.length !== 81) return false;

  for (let i = 0; i < 81; i++) {
    const v = puzzle[i] ?? 0;
    if (v !== 0 && (v < 1 || v > 9)) return false;
  }

  // Check rows
  for (let r = 0; r < 9; r++) {
    const seen = new Uint8Array(10);
    for (let c = 0; c < 9; c++) {
      const v = puzzle[r * 9 + c] ?? 0;
      if (v === 0) continue;
      if ((seen[v] ?? 0) !== 0) return false;
      seen[v] = 1;
    }
  }

  // Check columns
  for (let c = 0; c < 9; c++) {
    const seen = new Uint8Array(10);
    for (let r = 0; r < 9; r++) {
      const v = puzzle[r * 9 + c] ?? 0;
      if (v === 0) continue;
      if ((seen[v] ?? 0) !== 0) return false;
      seen[v] = 1;
    }
  }

  // Check 3×3 boxes
  for (let b = 0; b < 9; b++) {
    const startR = Math.floor(b / 3) * 3;
    const startC = (b % 3) * 3;
    const seen = new Uint8Array(10);
    for (let dr = 0; dr < 3; dr++) {
      for (let dc = 0; dc < 3; dc++) {
        const v = puzzle[(startR + dr) * 9 + (startC + dc)] ?? 0;
        if (v === 0) continue;
        if ((seen[v] ?? 0) !== 0) return false;
        seen[v] = 1;
      }
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// DLX core operations
// ---------------------------------------------------------------------------

/**
 * Cover a column: remove it from the column header list and remove all rows
 * that contain a node in this column from their respective columns.
 */
export function cover(col: ColumnNode): void {
  // Remove column header from horizontal list
  col.right.left = col.left;
  col.left.right = col.right;

  // For each row in this column, remove every other node in that row
  let row = col.down;
  while (row !== col) {
    let node = row.right;
    while (node !== row) {
      node.up.down = node.down;
      node.down.up = node.up;
      node.column.size--;
      node = node.right;
    }
    row = row.down;
  }
}

/**
 * Uncover a column: the exact reverse of cover (must be called in LIFO order
 * relative to the corresponding cover call).
 */
export function uncover(col: ColumnNode): void {
  // Restore rows in reverse order
  let row = col.up;
  while (row !== col) {
    let node = row.left;
    while (node !== row) {
      node.column.size++;
      node.up.down = node;
      node.down.up = node;
      node = node.left;
    }
    row = row.up;
  }

  // Restore column header to horizontal list
  col.right.left = col;
  col.left.right = col;
}

/**
 * Choose the column with the fewest nodes (minimum S heuristic).
 * Precondition: `root.right !== root` (at least one column remains).
 */
export function chooseColumn(root: ColumnNode): ColumnNode {
  let best = root.right as ColumnNode;
  let node = best.right as ColumnNode;
  while (node !== root) {
    if (node.size < best.size) {
      best = node;
      if (best.size === 0) break; // can't improve further
    }
    node = node.right as ColumnNode;
  }
  return best;
}

/**
 * Recursive DLX search.
 *
 * @param root          - Root of the column header list
 * @param current       - Partial solution (candidate indices chosen so far)
 * @param solutions     - Accumulates complete solutions
 * @param maxSolutions  - Stop after collecting this many solutions
 */
export function search(
  root: ColumnNode,
  current: number[],
  solutions: number[][],
  maxSolutions: number,
): void {
  // Early exit
  if (solutions.length >= maxSolutions) return;

  // All columns covered → found a complete solution
  if (root.right === root) {
    solutions.push([...current]);
    return;
  }

  const col = chooseColumn(root);

  // Dead end: a constraint cannot be satisfied
  if (col.size === 0) return;

  cover(col);

  let row: DLXNode = col.down;
  while (row !== col) {
    if (solutions.length >= maxSolutions) break;

    current.push(row.rowIndex);

    // Cover all other columns in this row
    let node = row.right;
    while (node !== row) {
      cover(node.column);
      node = node.right;
    }

    search(root, current, solutions, maxSolutions);

    // Uncover in reverse order
    node = row.left;
    while (node !== row) {
      uncover(node.column);
      node = node.left;
    }

    current.pop();
    row = row.down;
  }

  uncover(col);
}

// ---------------------------------------------------------------------------
// Puzzle-level API
// ---------------------------------------------------------------------------

/**
 * Pre-select given cells into the matrix by covering their constraint columns.
 * Returns false if any cell has an invalid or out-of-range digit.
 */
function preselectGivens(matrix: DLXMatrix, puzzle: Int32Array): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const digit = puzzle[r * 9 + c] ?? 0;
      if (digit === 0) continue;
      if (digit < 1 || digit > 9) return false;

      const d = digit - 1; // 0-indexed
      const candIdx = candidateIndex(r, c, d);
      let node = matrix.getRow(candIdx);
      const start = node;
      do {
        cover(node.column);
        node = node.right;
      } while (node !== start);
    }
  }
  return true;
}

/**
 * Reconstruct a solution grid from the full set of selected candidate indices.
 */
function reconstruct(original: Int32Array, candidateIndices: number[]): Int32Array {
  const result = new Int32Array(original);
  for (const idx of candidateIndices) {
    const { r, c, d } = decodeCandidate(idx);
    result[r * 9 + c] = d + 1; // convert back to 1-indexed digit
  }
  return result;
}

/**
 * Solve a Sudoku puzzle using DLX.
 *
 * @param puzzle - Int32Array(81): 0 = empty, 1–9 = given digit.
 *                 The array is NEVER mutated.
 * @returns      Solved Int32Array(81), or null if unsolvable / invalid.
 */
export function solve(puzzle: Int32Array): Int32Array | null {
  if (puzzle.length !== 81) return null;
  if (!validatePuzzle(puzzle)) return null;

  const matrix = new DLXMatrix();

  // Track which candidate indices were used for given cells
  const givenCandidates: number[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const digit = puzzle[r * 9 + c] ?? 0;
      if (digit === 0) continue;
      givenCandidates.push(candidateIndex(r, c, digit - 1));
    }
  }

  if (!preselectGivens(matrix, puzzle)) return null;

  const solutions: number[][] = [];
  search(matrix.root, [], solutions, 1);

  if (solutions.length === 0) return null;

  const firstSolution = solutions[0];
  if (firstSolution === undefined) return null;

  return reconstruct(puzzle, [...givenCandidates, ...firstSolution]);
}

/**
 * Return true iff the puzzle has exactly one valid solution.
 * Stops searching as soon as a second solution is found.
 *
 * @param puzzle - Int32Array(81): 0 = empty, 1–9 = given digit.
 */
export function hasUniqueSolution(puzzle: Int32Array): boolean {
  if (puzzle.length !== 81) return false;
  if (!validatePuzzle(puzzle)) return false;

  const matrix = new DLXMatrix();
  if (!preselectGivens(matrix, puzzle)) return false;

  const solutions: number[][] = [];
  search(matrix.root, [], solutions, 2);

  return solutions.length === 1;
}
