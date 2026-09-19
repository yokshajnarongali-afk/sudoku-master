import { describe, it, expect } from "vitest";
import {
  digitRemap,
  swapBands,
  swapStacks,
  swapRowsInBand,
  swapColsInStack,
  rotate90,
  rotate180,
  rotate270,
  flipHorizontal,
  flipVertical,
  randomize,
  seededRng,
} from "./PermutationEngine";
import { SEED_GRID, validateGrid } from "./SeedGrid";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Deep-equal check for two flat grids. */
function gridsEqual(a: Int32Array, b: Int32Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/** All cells are in range 1-9. */
function allDigitsValid(grid: Int32Array): boolean {
  for (let i = 0; i < 81; i++) {
    const v = grid[i] ?? 0;
    if (v < 1 || v > 9) return false;
  }
  return true;
}

/** Assert a grid is a valid completed Sudoku. */
function assertValidSudoku(grid: Int32Array, label: string): void {
  expect(allDigitsValid(grid), `${label}: digit range`).toBe(true);
  const result = validateGrid(grid);
  expect(result.valid, `${label}: Sudoku validity — ${JSON.stringify(result)}`).toBe(true);
}

const SEED = new Int32Array(SEED_GRID);

// ---------------------------------------------------------------------------
// digitRemap
// ---------------------------------------------------------------------------

describe("digitRemap", () => {
  it("identity mapping returns equal grid", () => {
    const mapping = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const result = digitRemap(SEED, mapping);
    expect(gridsEqual(result, SEED)).toBe(true);
  });

  it("reverse mapping produces valid Sudoku", () => {
    const mapping = [9, 8, 7, 6, 5, 4, 3, 2, 1];
    const result = digitRemap(SEED, mapping);
    assertValidSudoku(result, "digitRemap reverse");
  });

  it("swapping digits 1 and 2 produces valid Sudoku", () => {
    const mapping = [2, 1, 3, 4, 5, 6, 7, 8, 9];
    const result = digitRemap(SEED, mapping);
    assertValidSudoku(result, "digitRemap swap 1↔2");
  });

  it("does not mutate the input", () => {
    const copy = new Int32Array(SEED);
    digitRemap(copy, [9, 8, 7, 6, 5, 4, 3, 2, 1]);
    expect(gridsEqual(copy, SEED)).toBe(true);
  });

  it("applying mapping and inverse mapping returns original", () => {
    // mapping: 1→3, 2→5, 3→1, 4→7, 5→2, 6→9, 7→4, 8→6, 9→8
    const fwd = [3, 5, 1, 7, 2, 9, 4, 6, 8];
    // inverse: 3→1, 5→2, 1→3, 7→4, 2→5, 9→6, 4→7, 6→8, 8→9
    const inv = [3, 5, 1, 7, 2, 9, 4, 6, 8]; // same because fwd is self-inverse here? No.
    // Build proper inverse
    const inverse = new Array<number>(9);
    for (let i = 0; i < 9; i++) {
      inverse[(fwd[i] ?? 0) - 1] = i + 1;
    }
    const after = digitRemap(SEED, fwd);
    const restored = digitRemap(after, inverse);
    expect(gridsEqual(restored, SEED)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// swapBands
// ---------------------------------------------------------------------------

describe("swapBands", () => {
  it("swapBands(0, 1) produces valid Sudoku", () => {
    assertValidSudoku(swapBands(SEED, 0, 1), "swapBands(0,1)");
  });

  it("swapBands(0, 2) produces valid Sudoku", () => {
    assertValidSudoku(swapBands(SEED, 0, 2), "swapBands(0,2)");
  });

  it("swapBands(1, 2) produces valid Sudoku", () => {
    assertValidSudoku(swapBands(SEED, 1, 2), "swapBands(1,2)");
  });

  it("swapBands twice with same args restores original", () => {
    const result = swapBands(swapBands(SEED, 0, 2), 0, 2);
    expect(gridsEqual(result, SEED)).toBe(true);
  });

  it("does not mutate input", () => {
    const copy = new Int32Array(SEED);
    swapBands(copy, 0, 1);
    expect(gridsEqual(copy, SEED)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// swapStacks
// ---------------------------------------------------------------------------

describe("swapStacks", () => {
  it("swapStacks(0, 1) produces valid Sudoku", () => {
    assertValidSudoku(swapStacks(SEED, 0, 1), "swapStacks(0,1)");
  });

  it("swapStacks(0, 2) produces valid Sudoku", () => {
    assertValidSudoku(swapStacks(SEED, 0, 2), "swapStacks(0,2)");
  });

  it("swapStacks(1, 2) produces valid Sudoku", () => {
    assertValidSudoku(swapStacks(SEED, 1, 2), "swapStacks(1,2)");
  });

  it("swapStacks twice with same args restores original", () => {
    const result = swapStacks(swapStacks(SEED, 1, 2), 1, 2);
    expect(gridsEqual(result, SEED)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// swapRowsInBand
// ---------------------------------------------------------------------------

describe("swapRowsInBand", () => {
  it("all band/row combinations produce valid Sudoku", () => {
    for (let band = 0; band < 3; band++) {
      for (let r1 = 0; r1 < 3; r1++) {
        for (let r2 = r1 + 1; r2 < 3; r2++) {
          const result = swapRowsInBand(SEED, band, r1, r2);
          assertValidSudoku(result, `swapRowsInBand(${band},${r1},${r2})`);
        }
      }
    }
  });

  it("double-swap restores original", () => {
    const result = swapRowsInBand(swapRowsInBand(SEED, 1, 0, 2), 1, 0, 2);
    expect(gridsEqual(result, SEED)).toBe(true);
  });

  it("the correct rows are exchanged", () => {
    // Band 0, rows 0 and 1: actual rows 0 and 1
    const result = swapRowsInBand(SEED, 0, 0, 1);
    // Result row 0 should equal original row 1
    for (let c = 0; c < 9; c++) {
      expect(result[0 * 9 + c]).toBe(SEED[1 * 9 + c]);
    }
    // Result row 1 should equal original row 0
    for (let c = 0; c < 9; c++) {
      expect(result[1 * 9 + c]).toBe(SEED[0 * 9 + c]);
    }
  });
});

// ---------------------------------------------------------------------------
// swapColsInStack
// ---------------------------------------------------------------------------

describe("swapColsInStack", () => {
  it("all stack/col combinations produce valid Sudoku", () => {
    for (let stack = 0; stack < 3; stack++) {
      for (let c1 = 0; c1 < 3; c1++) {
        for (let c2 = c1 + 1; c2 < 3; c2++) {
          const result = swapColsInStack(SEED, stack, c1, c2);
          assertValidSudoku(result, `swapColsInStack(${stack},${c1},${c2})`);
        }
      }
    }
  });

  it("double-swap restores original", () => {
    const result = swapColsInStack(swapColsInStack(SEED, 2, 0, 2), 2, 0, 2);
    expect(gridsEqual(result, SEED)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// rotate90
// ---------------------------------------------------------------------------

describe("rotate90", () => {
  it("produces a valid Sudoku", () => {
    assertValidSudoku(rotate90(SEED), "rotate90");
  });

  it("applying rotate90 four times returns the original", () => {
    const r4 = rotate90(rotate90(rotate90(rotate90(SEED))));
    expect(gridsEqual(r4, SEED)).toBe(true);
  });

  it("top-left corner of original goes to top-right after rotate90", () => {
    // original[0][0] → result[0][8]  (clockwise: top-left → top-right)
    // result[r][c] = original[8-c][r] → result[0][8] = original[0][0]
    const result = rotate90(SEED);
    expect(result[0 * 9 + 8]).toBe(SEED[0 * 9 + 0]);
  });

  it("bottom-left corner of original goes to top-left after rotate90", () => {
    // original[8][0] → result[0][0]
    const result = rotate90(SEED);
    expect(result[0 * 9 + 0]).toBe(SEED[8 * 9 + 0]);
  });

  it("does not mutate input", () => {
    const copy = new Int32Array(SEED);
    rotate90(copy);
    expect(gridsEqual(copy, SEED)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// rotate180
// ---------------------------------------------------------------------------

describe("rotate180", () => {
  it("produces a valid Sudoku", () => {
    assertValidSudoku(rotate180(SEED), "rotate180");
  });

  it("applying rotate180 twice returns the original", () => {
    expect(gridsEqual(rotate180(rotate180(SEED)), SEED)).toBe(true);
  });

  it("equals rotate90 applied twice", () => {
    const r2 = rotate90(rotate90(SEED));
    const r180 = rotate180(SEED);
    expect(gridsEqual(r2, r180)).toBe(true);
  });

  it("top-left corner goes to bottom-right", () => {
    // result[8][8] = original[0][0]
    const result = rotate180(SEED);
    expect(result[8 * 9 + 8]).toBe(SEED[0 * 9 + 0]);
  });
});

// ---------------------------------------------------------------------------
// rotate270
// ---------------------------------------------------------------------------

describe("rotate270", () => {
  it("produces a valid Sudoku", () => {
    assertValidSudoku(rotate270(SEED), "rotate270");
  });

  it("equals three rotate90s", () => {
    const r270 = rotate270(SEED);
    const r3 = rotate90(rotate90(rotate90(SEED)));
    expect(gridsEqual(r270, r3)).toBe(true);
  });

  it("rotate90 + rotate270 = identity", () => {
    expect(gridsEqual(rotate270(rotate90(SEED)), SEED)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// flipHorizontal
// ---------------------------------------------------------------------------

describe("flipHorizontal", () => {
  it("produces a valid Sudoku", () => {
    assertValidSudoku(flipHorizontal(SEED), "flipHorizontal");
  });

  it("applied twice returns the original", () => {
    expect(gridsEqual(flipHorizontal(flipHorizontal(SEED)), SEED)).toBe(true);
  });

  it("first column becomes last column", () => {
    const result = flipHorizontal(SEED);
    for (let r = 0; r < 9; r++) {
      expect(result[r * 9 + 8]).toBe(SEED[r * 9 + 0]);
    }
  });
});

// ---------------------------------------------------------------------------
// flipVertical
// ---------------------------------------------------------------------------

describe("flipVertical", () => {
  it("produces a valid Sudoku", () => {
    assertValidSudoku(flipVertical(SEED), "flipVertical");
  });

  it("applied twice returns the original", () => {
    expect(gridsEqual(flipVertical(flipVertical(SEED)), SEED)).toBe(true);
  });

  it("first row becomes last row", () => {
    const result = flipVertical(SEED);
    for (let c = 0; c < 9; c++) {
      expect(result[8 * 9 + c]).toBe(SEED[0 * 9 + c]);
    }
  });
});

// ---------------------------------------------------------------------------
// randomize
// ---------------------------------------------------------------------------

describe("randomize", () => {
  it("produces a valid Sudoku", () => {
    const rng = seededRng(42);
    const result = randomize(SEED, rng);
    assertValidSudoku(result, "randomize(seed=42)");
  });

  it("all digits remain 1–9", () => {
    const rng = seededRng(12345);
    const result = randomize(SEED, rng);
    expect(allDigitsValid(result)).toBe(true);
  });

  it("is deterministic with the same seed", () => {
    const r1 = randomize(SEED, seededRng(999));
    const r2 = randomize(SEED, seededRng(999));
    expect(gridsEqual(r1, r2)).toBe(true);
  });

  it("different seeds produce different grids (with very high probability)", () => {
    const r1 = randomize(SEED, seededRng(1));
    const r2 = randomize(SEED, seededRng(2));
    expect(gridsEqual(r1, r2)).toBe(false);
  });

  it("does not mutate the input grid", () => {
    const copy = new Int32Array(SEED);
    randomize(copy, seededRng(7));
    expect(gridsEqual(copy, SEED)).toBe(true);
  });

  it("produces valid Sudoku across multiple seeds", () => {
    for (let seed = 0; seed < 20; seed++) {
      const result = randomize(SEED, seededRng(seed));
      assertValidSudoku(result, `randomize(seed=${seed})`);
    }
  });
});
