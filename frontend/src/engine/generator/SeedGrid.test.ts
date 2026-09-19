import { describe, it, expect } from "vitest";
import {
  SEED_GRID,
  GRID_SIZE,
  BOARD_SIZE,
  validateGrid,
  getRow,
  getColumn,
  getBox,
  isValidGroup,
  cellIndex,
} from "./SeedGrid";

// ---------------------------------------------------------------------------
// SEED_GRID — structural guarantees
// ---------------------------------------------------------------------------

describe("SEED_GRID — structure", () => {
  it("is an instance of Int32Array", () => {
    expect(SEED_GRID).toBeInstanceOf(Int32Array);
  });

  it("has exactly 81 cells", () => {
    expect(SEED_GRID.length).toBe(GRID_SIZE);
    expect(SEED_GRID.length).toBe(81);
  });

  it("all 81 cells contain valid digits 1–9", () => {
    for (let i = 0; i < GRID_SIZE; i++) {
      const digit = SEED_GRID[i];
      expect(digit, `cell ${String(i)} out of range`).toBeGreaterThanOrEqual(1);
      expect(digit, `cell ${String(i)} out of range`).toBeLessThanOrEqual(9);
    }
  });

  it("is deterministic — repeated reads return the same values", () => {
    const first = Array.from(SEED_GRID);
    const second = Array.from(SEED_GRID);
    expect(first).toStrictEqual(second);
  });
});

// ---------------------------------------------------------------------------
// Row validation — every row must contain 1–9 exactly once
// ---------------------------------------------------------------------------

describe("SEED_GRID — rows", () => {
  it("every row contains digits 1–9 exactly once", () => {
    for (let r = 0; r < BOARD_SIZE; r++) {
      const row = getRow(new Int32Array(SEED_GRID), r);
      expect(
        isValidGroup(row),
        `Row ${String(r)} failed: [${Array.from(row).join(",")}]`,
      ).toBe(true);
    }
  });

  it("row 0 equals [5,3,4,6,7,8,9,1,2]", () => {
    expect(Array.from(getRow(new Int32Array(SEED_GRID), 0))).toStrictEqual([
      5, 3, 4, 6, 7, 8, 9, 1, 2,
    ]);
  });

  it("row 4 (middle) equals [4,2,6,8,5,3,7,9,1]", () => {
    expect(Array.from(getRow(new Int32Array(SEED_GRID), 4))).toStrictEqual([
      4, 2, 6, 8, 5, 3, 7, 9, 1,
    ]);
  });

  it("row 8 (last) equals [3,4,5,2,8,6,1,7,9]", () => {
    expect(Array.from(getRow(new Int32Array(SEED_GRID), 8))).toStrictEqual([
      3, 4, 5, 2, 8, 6, 1, 7, 9,
    ]);
  });
});

// ---------------------------------------------------------------------------
// Column validation — every column must contain 1–9 exactly once
// ---------------------------------------------------------------------------

describe("SEED_GRID — columns", () => {
  it("every column contains digits 1–9 exactly once", () => {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const col = getColumn(new Int32Array(SEED_GRID), c);
      expect(
        isValidGroup(col),
        `Column ${String(c)} failed: [${Array.from(col).join(",")}]`,
      ).toBe(true);
    }
  });

  it("column 0 equals [5,6,1,8,4,7,9,2,3]", () => {
    expect(Array.from(getColumn(new Int32Array(SEED_GRID), 0))).toStrictEqual([
      5, 6, 1, 8, 4, 7, 9, 2, 3,
    ]);
  });

  it("column 4 (middle) equals [7,9,4,6,5,2,3,1,8]", () => {
    expect(Array.from(getColumn(new Int32Array(SEED_GRID), 4))).toStrictEqual([
      7, 9, 4, 6, 5, 2, 3, 1, 8,
    ]);
  });

  it("column 8 (last) equals [2,8,7,3,1,6,4,5,9]", () => {
    expect(Array.from(getColumn(new Int32Array(SEED_GRID), 8))).toStrictEqual([
      2, 8, 7, 3, 1, 6, 4, 5, 9,
    ]);
  });
});

// ---------------------------------------------------------------------------
// Box validation — every 3×3 box must contain 1–9 exactly once
// ---------------------------------------------------------------------------

describe("SEED_GRID — 3×3 boxes", () => {
  it("every 3×3 box contains digits 1–9 exactly once", () => {
    for (let b = 0; b < BOARD_SIZE; b++) {
      const box = getBox(new Int32Array(SEED_GRID), b);
      expect(
        isValidGroup(box),
        `Box ${String(b)} failed: [${Array.from(box).join(",")}]`,
      ).toBe(true);
    }
  });

  it("box 0 (top-left) equals [5,3,4,6,7,2,1,9,8]", () => {
    expect(Array.from(getBox(new Int32Array(SEED_GRID), 0))).toStrictEqual([
      5, 3, 4, 6, 7, 2, 1, 9, 8,
    ]);
  });

  it("box 4 (center) equals [7,6,1,8,5,3,9,2,4]", () => {
    expect(Array.from(getBox(new Int32Array(SEED_GRID), 4))).toStrictEqual([
      7, 6, 1, 8, 5, 3, 9, 2, 4,
    ]);
  });

  it("box 8 (bottom-right) equals [2,8,4,6,3,5,1,7,9]", () => {
    expect(Array.from(getBox(new Int32Array(SEED_GRID), 8))).toStrictEqual([
      2, 8, 4, 6, 3, 5, 1, 7, 9,
    ]);
  });
});

// ---------------------------------------------------------------------------
// validateGrid — full grid validation
// ---------------------------------------------------------------------------

describe("validateGrid — SEED_GRID passes all checks", () => {
  it("returns valid: true for the seed grid", () => {
    const result = validateGrid(new Int32Array(SEED_GRID));
    expect(result.valid).toBe(true);
  });

  it("all cells are in range 1–9", () => {
    const result = validateGrid(new Int32Array(SEED_GRID));
    expect(result.allCellsInRange).toBe(true);
  });

  it("no invalid rows", () => {
    const result = validateGrid(new Int32Array(SEED_GRID));
    expect(result.invalidRows).toHaveLength(0);
  });

  it("no invalid columns", () => {
    const result = validateGrid(new Int32Array(SEED_GRID));
    expect(result.invalidColumns).toHaveLength(0);
  });

  it("no invalid boxes", () => {
    const result = validateGrid(new Int32Array(SEED_GRID));
    expect(result.invalidBoxes).toHaveLength(0);
  });
});

describe("validateGrid — rejects invalid grids", () => {
  it("rejects a grid with wrong length (< 81)", () => {
    const result = validateGrid(new Int32Array(80));
    expect(result.valid).toBe(false);
  });

  it("rejects a grid with a zero cell", () => {
    const bad = new Int32Array(SEED_GRID);
    bad[0] = 0;
    const result = validateGrid(bad);
    expect(result.valid).toBe(false);
    expect(result.allCellsInRange).toBe(false);
  });

  it("rejects a grid with a cell value of 10", () => {
    const bad = new Int32Array(SEED_GRID);
    bad[40] = 10; // center cell
    const result = validateGrid(bad);
    expect(result.valid).toBe(false);
  });

  it("identifies the correct invalid row when a duplicate is introduced", () => {
    const bad = new Int32Array(SEED_GRID);
    // Make row 0 have two 3s by setting cell (0,0)=3, which duplicates cell (0,1)=3
    bad[cellIndex(0, 0)] = 3;
    const result = validateGrid(bad);
    expect(result.invalidRows).toContain(0);
  });

  it("identifies the correct invalid column when a duplicate is introduced", () => {
    const bad = new Int32Array(SEED_GRID);
    // Set (0,0) = value already in col 0 (col 0 has 6 at row 1)
    bad[cellIndex(0, 0)] = 6;
    const result = validateGrid(bad);
    expect(result.invalidColumns).toContain(0);
  });

  it("identifies the correct invalid box when a duplicate is introduced", () => {
    const bad = new Int32Array(SEED_GRID);
    // (0,0)=3 → duplicates (0,1)=3 in box 0
    bad[cellIndex(0, 0)] = 3;
    const result = validateGrid(bad);
    expect(result.invalidBoxes).toContain(0);
  });
});

// ---------------------------------------------------------------------------
// isValidGroup — unit tests
// ---------------------------------------------------------------------------

describe("isValidGroup", () => {
  it("returns true for [1,2,3,4,5,6,7,8,9]", () => {
    expect(isValidGroup(new Int32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]))).toBe(true);
  });

  it("returns true for a reversed permutation [9,8,7,6,5,4,3,2,1]", () => {
    expect(isValidGroup(new Int32Array([9, 8, 7, 6, 5, 4, 3, 2, 1]))).toBe(true);
  });

  it("returns false for duplicate digits [1,1,3,4,5,6,7,8,9]", () => {
    expect(isValidGroup(new Int32Array([1, 1, 3, 4, 5, 6, 7, 8, 9]))).toBe(false);
  });

  it("returns false when a digit is 0", () => {
    expect(isValidGroup(new Int32Array([0, 2, 3, 4, 5, 6, 7, 8, 9]))).toBe(false);
  });

  it("returns false when a digit is 10", () => {
    expect(isValidGroup(new Int32Array([10, 2, 3, 4, 5, 6, 7, 8, 9]))).toBe(false);
  });

  it("returns false for wrong length (8 elements)", () => {
    expect(isValidGroup(new Int32Array([1, 2, 3, 4, 5, 6, 7, 8]))).toBe(false);
  });

  it("returns false for wrong length (10 elements)", () => {
    expect(isValidGroup(new Int32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 1]))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// cellIndex — coordinate to flat index
// ---------------------------------------------------------------------------

describe("cellIndex", () => {
  it("(0, 0) → 0", () => expect(cellIndex(0, 0)).toBe(0));
  it("(0, 8) → 8", () => expect(cellIndex(0, 8)).toBe(8));
  it("(1, 0) → 9", () => expect(cellIndex(1, 0)).toBe(9));
  it("(8, 8) → 80", () => expect(cellIndex(8, 8)).toBe(80));
  it("(4, 4) → 40 (center)", () => expect(cellIndex(4, 4)).toBe(40));
});
