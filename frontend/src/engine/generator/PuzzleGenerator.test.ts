import { describe, it, expect } from "vitest";
import { generatePuzzle, generatePuzzleFromSolved } from "./PuzzleGenerator";
import { hasUniqueSolution } from "../solver/DLXSolver";
import { validateGrid, SEED_GRID } from "./SeedGrid";
import { DIFFICULTY_CLUE_RANGES } from "./MaskEngine";
import type { Difficulty } from "@sudoku/shared";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a SudokuGrid<CellValue> back to a flat Int32Array for validation. */
function flattenGrid(grid: ReturnType<typeof generatePuzzle>["clues"]): Int32Array {
  const flat = new Int32Array(81);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = grid[r]![c]!;
      flat[r * 9 + c] = v ?? 0;
    }
  }
  return flat;
}

// ---------------------------------------------------------------------------
// generatePuzzle — structure
// ---------------------------------------------------------------------------

describe("generatePuzzle — returned SudokuPuzzle structure", () => {
  it("returns an object with all required fields", () => {
    const puzzle = generatePuzzle("easy", 1);
    expect(puzzle.id).toBeDefined();
    expect(puzzle.difficulty).toBe("easy");
    expect(puzzle.clues).toBeDefined();
    expect(puzzle.solution).toBeDefined();
    expect(typeof puzzle.givenCount).toBe("number");
    expect(typeof puzzle.seed).toBe("string");
    expect(typeof puzzle.generatedAt).toBe("number");
  });

  it("seed is stored as a string on the puzzle", () => {
    const puzzle = generatePuzzle("medium", 42);
    expect(puzzle.seed).toBe("42");
  });

  it("each puzzle gets a unique id", () => {
    const p1 = generatePuzzle("easy", 1);
    const p2 = generatePuzzle("easy", 1);
    expect(p1.id).not.toBe(p2.id); // UUIDs are always unique
  });

  it("difficulty field matches the requested difficulty", () => {
    const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert", "master"];
    for (const diff of difficulties) {
      const p = generatePuzzle(diff, 99);
      expect(p.difficulty).toBe(diff);
    }
  });
});

// ---------------------------------------------------------------------------
// generatePuzzle — solution validity
// ---------------------------------------------------------------------------

describe("generatePuzzle — solution is a valid completed Sudoku", () => {
  it("solution passes validateGrid for 'easy'", () => {
    const puzzle = generatePuzzle("easy", 10);
    const flat = flattenGrid(puzzle.solution);
    expect(validateGrid(flat).valid).toBe(true);
  });

  it("solution passes validateGrid for 'hard'", () => {
    const puzzle = generatePuzzle("hard", 20);
    const flat = flattenGrid(puzzle.solution);
    expect(validateGrid(flat).valid).toBe(true);
  });

  it("solution passes validateGrid for 'master'", () => {
    const puzzle = generatePuzzle("master", 30);
    const flat = flattenGrid(puzzle.solution);
    expect(validateGrid(flat).valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// generatePuzzle — clue count per difficulty
// ---------------------------------------------------------------------------

describe("generatePuzzle — givenCount within difficulty range", () => {
  it("easy: givenCount is in [min_easy, 81]", () => {
    const puzzle = generatePuzzle("easy", 1);
    expect(puzzle.givenCount).toBeGreaterThanOrEqual(DIFFICULTY_CLUE_RANGES.easy.min);
    expect(puzzle.givenCount).toBeLessThanOrEqual(81);
  });

  it("medium: givenCount is in [min_medium, 81]", () => {
    const puzzle = generatePuzzle("medium", 2);
    expect(puzzle.givenCount).toBeGreaterThanOrEqual(DIFFICULTY_CLUE_RANGES.medium.min);
    expect(puzzle.givenCount).toBeLessThanOrEqual(81);
  });

  it("hard: givenCount is in [min_hard, 81]", () => {
    const puzzle = generatePuzzle("hard", 3);
    expect(puzzle.givenCount).toBeGreaterThanOrEqual(DIFFICULTY_CLUE_RANGES.hard.min);
    expect(puzzle.givenCount).toBeLessThanOrEqual(81);
  });

  it("expert/master: givenCount is at least 17 (minimum valid Sudoku)", () => {
    const e = generatePuzzle("expert", 4);
    const m = generatePuzzle("master", 5);
    expect(e.givenCount).toBeGreaterThanOrEqual(17);
    expect(m.givenCount).toBeGreaterThanOrEqual(17);
  });
});

// ---------------------------------------------------------------------------
// generatePuzzle — uniqueness
// ---------------------------------------------------------------------------

describe("generatePuzzle — puzzle has a unique solution", () => {
  it("easy puzzle has unique solution", () => {
    const puzzle = generatePuzzle("easy", 100);
    const flat = flattenGrid(puzzle.clues);
    expect(hasUniqueSolution(flat)).toBe(true);
  });

  it("medium puzzle has unique solution", () => {
    const puzzle = generatePuzzle("medium", 200);
    const flat = flattenGrid(puzzle.clues);
    expect(hasUniqueSolution(flat)).toBe(true);
  });

  it("hard puzzle has unique solution", () => {
    const puzzle = generatePuzzle("hard", 300);
    const flat = flattenGrid(puzzle.clues);
    expect(hasUniqueSolution(flat)).toBe(true);
  });

  it("expert puzzle has unique solution", () => {
    const puzzle = generatePuzzle("expert", 400);
    const flat = flattenGrid(puzzle.clues);
    expect(hasUniqueSolution(flat)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// generatePuzzle — clues are a subset of the solution
// ---------------------------------------------------------------------------

describe("generatePuzzle — clues match solution", () => {
  it("every non-null clue matches the solution cell", () => {
    const puzzle = generatePuzzle("medium", 77);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const clue = puzzle.clues[r]![c]!;
        const sol  = puzzle.solution[r]![c]!;
        if (clue !== null) {
          expect(clue).toBe(sol);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// generatePuzzle — reproducibility from seed
// ---------------------------------------------------------------------------

describe("generatePuzzle — reproducible from seed", () => {
  it("same seed + difficulty produces identical clues and solution", () => {
    const p1 = generatePuzzle("hard", 42);
    const p2 = generatePuzzle("hard", 42);
    expect(flattenGrid(p1.clues)).toStrictEqual(flattenGrid(p2.clues));
    expect(flattenGrid(p1.solution)).toStrictEqual(flattenGrid(p2.solution));
    expect(p1.givenCount).toBe(p2.givenCount);
  });

  it("different seeds produce different puzzles (with very high probability)", () => {
    const p1 = flattenGrid(generatePuzzle("easy", 1).clues);
    const p2 = flattenGrid(generatePuzzle("easy", 2).clues);
    const identical = p1.every((v, i) => v === (p2[i] ?? 0));
    expect(identical).toBe(false);
  });

  it("omitting seed still produces a valid unique puzzle", () => {
    const puzzle = generatePuzzle("easy"); // no seed
    const flat = flattenGrid(puzzle.clues);
    expect(hasUniqueSolution(flat)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// generatePuzzleFromSolved
// ---------------------------------------------------------------------------

describe("generatePuzzleFromSolved", () => {
  const SOLVED = new Int32Array(SEED_GRID);

  it("returns a SudokuPuzzle when given a valid solved grid", () => {
    const p = generatePuzzleFromSolved(SOLVED, "easy", 44, 1);
    expect(p).not.toBeNull();
    expect(p!.givenCount).toBeLessThanOrEqual(44);
  });

  it("returns null for wrong-length input", () => {
    expect(generatePuzzleFromSolved(new Int32Array(80), "easy", 44, 1)).toBeNull();
  });

  it("result has unique solution", () => {
    const p = generatePuzzleFromSolved(SOLVED, "medium", 34, 9);
    expect(p).not.toBeNull();
    const flat = flattenGrid(p!.clues);
    expect(hasUniqueSolution(flat)).toBe(true);
  });

  it("solution equals the original solved grid", () => {
    const p = generatePuzzleFromSolved(SOLVED, "hard", 28, 5);
    expect(p).not.toBeNull();
    const solutionFlat = flattenGrid(p!.solution);
    for (let i = 0; i < 81; i++) {
      expect(solutionFlat[i]).toBe(SOLVED[i]);
    }
  });
});
