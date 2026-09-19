import { describe, it, expect } from "vitest";
import { solve, hasUniqueSolution, validatePuzzle } from "./DLXSolver";
import { validateGrid } from "../generator/SeedGrid";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

/** The well-known Wikipedia example puzzle and its unique solution. */
const KNOWN_PUZZLE = new Int32Array([
  5, 3, 0, 0, 7, 0, 0, 0, 0,
  6, 0, 0, 1, 9, 5, 0, 0, 0,
  0, 9, 8, 0, 0, 0, 0, 6, 0,
  8, 0, 0, 0, 6, 0, 0, 0, 3,
  4, 0, 0, 8, 0, 3, 0, 0, 1,
  7, 0, 0, 0, 2, 0, 0, 0, 6,
  0, 6, 0, 0, 0, 0, 2, 8, 0,
  0, 0, 0, 4, 1, 9, 0, 0, 5,
  0, 0, 0, 0, 8, 0, 0, 7, 9,
]);

const KNOWN_SOLUTION = new Int32Array([
  5, 3, 4, 6, 7, 8, 9, 1, 2,
  6, 7, 2, 1, 9, 5, 3, 4, 8,
  1, 9, 8, 3, 4, 2, 5, 6, 7,
  8, 5, 9, 7, 6, 1, 4, 2, 3,
  4, 2, 6, 8, 5, 3, 7, 9, 1,
  7, 1, 3, 9, 2, 4, 8, 5, 6,
  9, 6, 1, 5, 3, 7, 2, 8, 4,
  2, 8, 7, 4, 1, 9, 6, 3, 5,
  3, 4, 5, 2, 8, 6, 1, 7, 9,
]);

/** An invalid puzzle: digit 5 appears twice in row 0. */
const INVALID_PUZZLE = new Int32Array([
  5, 5, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0,
]);

/** A puzzle with digit out of range (10 in cell 0). */
const OUT_OF_RANGE_PUZZLE = new Int32Array([
  10, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0,
]);

/**
 * An unsolvable puzzle: cells (0,0)=1 and (0,8)=1 forces row-1 constraint conflict
 * but all other cells are zero. Even so, the row already has two 1s — invalid and thus
 * unsolvable. We use a more subtle example: fill the first row with 1-9, then make
 * cell (1,0)=1 which conflicts with col 0 having 1 in row 0.
 * Actually the simplest approach: row 0 has 1..9, row 1 cell 0 = 1 → conflict in col 0.
 */
const UNSOLVABLE_PUZZLE = (() => {
  const p = new Int32Array(81);
  // Row 0: 1..9 (valid row)
  for (let c = 0; c < 9; c++) p[c] = c + 1;
  // Row 1, col 0: 1 — conflicts with row 0 col 0 = 1 in column 0
  p[9] = 1;
  return p;
})();

/** Empty grid — many solutions. */
const EMPTY_PUZZLE = new Int32Array(81);

// ---------------------------------------------------------------------------
// validatePuzzle
// ---------------------------------------------------------------------------

describe("validatePuzzle", () => {
  it("accepts the empty grid", () => {
    expect(validatePuzzle(new Int32Array(81))).toBe(true);
  });

  it("accepts the known puzzle", () => {
    expect(validatePuzzle(KNOWN_PUZZLE)).toBe(true);
  });

  it("rejects duplicate in row", () => {
    expect(validatePuzzle(INVALID_PUZZLE)).toBe(false);
  });

  it("rejects out-of-range digit (10)", () => {
    expect(validatePuzzle(OUT_OF_RANGE_PUZZLE)).toBe(false);
  });

  it("rejects grids that are not 81 elements", () => {
    expect(validatePuzzle(new Int32Array(80))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// solve
// ---------------------------------------------------------------------------

describe("solve — empty Sudoku", () => {
  it("returns a non-null grid", () => {
    const result = solve(EMPTY_PUZZLE);
    expect(result).not.toBeNull();
  });

  it("solution is a valid completed Sudoku", () => {
    const result = solve(EMPTY_PUZZLE)!;
    const validation = validateGrid(result);
    expect(validation.valid).toBe(true);
  });

  it("solution has 81 cells", () => {
    expect(solve(EMPTY_PUZZLE)!.length).toBe(81);
  });
});

describe("solve — known valid puzzle", () => {
  it("returns the known unique solution", () => {
    const result = solve(KNOWN_PUZZLE);
    expect(result).not.toBeNull();
    expect(Array.from(result!)).toStrictEqual(Array.from(KNOWN_SOLUTION));
  });

  it("preserves all given cells", () => {
    const result = solve(KNOWN_PUZZLE)!;
    for (let i = 0; i < 81; i++) {
      const given = KNOWN_PUZZLE[i] ?? 0;
      if (given !== 0) {
        expect(result[i]).toBe(given);
      }
    }
  });

  it("solution passes validateGrid", () => {
    const result = solve(KNOWN_PUZZLE)!;
    expect(validateGrid(result).valid).toBe(true);
  });
});

describe("solve — invalid puzzle", () => {
  it("returns null for a puzzle with duplicate digit in a row", () => {
    expect(solve(INVALID_PUZZLE)).toBeNull();
  });

  it("returns null for a digit out of range (10)", () => {
    expect(solve(OUT_OF_RANGE_PUZZLE)).toBeNull();
  });

  it("returns null for wrong-length input", () => {
    expect(solve(new Int32Array(80))).toBeNull();
  });
});

describe("solve — unsolvable puzzle", () => {
  it("returns null when no solution exists", () => {
    expect(solve(UNSOLVABLE_PUZZLE)).toBeNull();
  });
});

describe("solve — does NOT mutate input", () => {
  it("original puzzle array is unchanged after solve", () => {
    const original = new Int32Array(KNOWN_PUZZLE);
    const backup = new Int32Array(KNOWN_PUZZLE);
    solve(original);
    expect(Array.from(original)).toStrictEqual(Array.from(backup));
  });

  it("original empty grid is unchanged after solve", () => {
    const original = new Int32Array(81);
    solve(original);
    for (let i = 0; i < 81; i++) {
      expect(original[i]).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------------
// hasUniqueSolution
// ---------------------------------------------------------------------------

describe("hasUniqueSolution — known puzzle is unique", () => {
  it("returns true for the known puzzle", () => {
    expect(hasUniqueSolution(KNOWN_PUZZLE)).toBe(true);
  });

  it("returns true for the solved grid itself", () => {
    // A fully filled valid grid is trivially unique (already solved)
    expect(hasUniqueSolution(KNOWN_SOLUTION)).toBe(true);
  });
});

describe("hasUniqueSolution — multiple solutions", () => {
  it("returns false for an empty grid (many solutions)", () => {
    expect(hasUniqueSolution(EMPTY_PUZZLE)).toBe(false);
  });

  it("returns false for a grid with only one given cell", () => {
    const p = new Int32Array(81);
    p[0] = 5; // only one clue — thousands of solutions
    expect(hasUniqueSolution(p)).toBe(false);
  });
});

describe("hasUniqueSolution — invalid or unsolvable", () => {
  it("returns false for an invalid puzzle (row duplicate)", () => {
    expect(hasUniqueSolution(INVALID_PUZZLE)).toBe(false);
  });

  it("returns false for an unsolvable puzzle", () => {
    expect(hasUniqueSolution(UNSOLVABLE_PUZZLE)).toBe(false);
  });

  it("returns false for wrong-length input", () => {
    expect(hasUniqueSolution(new Int32Array(80))).toBe(false);
  });
});
