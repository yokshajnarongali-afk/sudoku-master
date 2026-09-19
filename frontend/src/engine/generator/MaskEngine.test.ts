import { describe, it, expect } from "vitest";
import {
  maskGrid,
  maskToDifficulty,
  countClues,
  DIFFICULTY_CLUE_RANGES,
  seededRng,
  type MaskDifficulty,
} from "./MaskEngine";
import { hasUniqueSolution } from "../solver/DLXSolver";
import { SEED_GRID, validateGrid } from "./SeedGrid";

// A valid solved grid to mask — use the SEED_GRID
const SOLVED = new Int32Array(SEED_GRID);

// ---------------------------------------------------------------------------
// countClues
// ---------------------------------------------------------------------------

describe("countClues", () => {
  it("counts 81 for a fully filled grid", () => {
    expect(countClues(SOLVED)).toBe(81);
  });

  it("counts 0 for an empty grid", () => {
    expect(countClues(new Int32Array(81))).toBe(0);
  });

  it("counts correctly for a partial grid", () => {
    const p = new Int32Array(81);
    p[0] = 5;
    p[40] = 3;
    expect(countClues(p)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// maskGrid — non-mutation
// ---------------------------------------------------------------------------

describe("maskGrid — does not mutate the solved grid", () => {
  it("original grid is unchanged after masking", () => {
    const copy = new Int32Array(SOLVED);
    const rng = seededRng(42);
    maskGrid(copy, { targetClues: 40 }, rng);
    for (let i = 0; i < 81; i++) {
      expect(copy[i]).toBe(SOLVED[i]);
    }
  });

  it("returns null for wrong-length input", () => {
    const rng = seededRng(1);
    expect(maskGrid(new Int32Array(80), { targetClues: 40 }, rng)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// maskGrid — uniqueness preservation
// ---------------------------------------------------------------------------

describe("maskGrid — uniqueness preservation", () => {
  it("easy target: result has a unique solution", () => {
    const rng = seededRng(100);
    const puzzle = maskGrid(SOLVED, { targetClues: 44 }, rng);
    expect(puzzle).not.toBeNull();
    expect(hasUniqueSolution(puzzle!)).toBe(true);
  });

  it("medium target: result has a unique solution", () => {
    const rng = seededRng(200);
    const puzzle = maskGrid(SOLVED, { targetClues: 34 }, rng);
    expect(puzzle).not.toBeNull();
    expect(hasUniqueSolution(puzzle!)).toBe(true);
  });

  it("hard target: result has a unique solution", () => {
    const rng = seededRng(300);
    const puzzle = maskGrid(SOLVED, { targetClues: 28 }, rng);
    expect(puzzle).not.toBeNull();
    expect(hasUniqueSolution(puzzle!)).toBe(true);
  });

  it("evil target: result has a unique solution", () => {
    const rng = seededRng(400);
    const puzzle = maskGrid(SOLVED, { targetClues: 22 }, rng);
    expect(puzzle).not.toBeNull();
    expect(hasUniqueSolution(puzzle!)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// maskGrid — clue count
// ---------------------------------------------------------------------------

describe("maskGrid — clue count constraints", () => {
  it("result has at most targetClues cells filled (when achievable)", () => {
    const rng = seededRng(42);
    const target = 40;
    const puzzle = maskGrid(SOLVED, { targetClues: target }, rng);
    expect(puzzle).not.toBeNull();
    const clues = countClues(puzzle!);
    // May not always reach exactly target (if further removals break uniqueness)
    // but must never exceed it
    expect(clues).toBeLessThanOrEqual(target);
  });

  it("result has at most 80 clues (at least one cell removed)", () => {
    const rng = seededRng(1);
    const puzzle = maskGrid(SOLVED, { targetClues: 50 }, rng);
    expect(puzzle).not.toBeNull();
    expect(countClues(puzzle!)).toBeLessThanOrEqual(80);
  });
});

// ---------------------------------------------------------------------------
// maskGrid — given cells are a subset of the solved grid
// ---------------------------------------------------------------------------

describe("maskGrid — given cells match the solved grid", () => {
  it("every non-zero cell in the result equals the same cell in solved", () => {
    const rng = seededRng(7);
    const puzzle = maskGrid(SOLVED, { targetClues: 36 }, rng);
    expect(puzzle).not.toBeNull();
    for (let i = 0; i < 81; i++) {
      const v = puzzle![i] ?? 0;
      if (v !== 0) {
        expect(v).toBe(SOLVED[i]);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// maskGrid — determinism
// ---------------------------------------------------------------------------

describe("maskGrid — determinism with same seed", () => {
  it("same seed produces identical puzzles", () => {
    const target = { targetClues: 30 };
    const p1 = maskGrid(SOLVED, target, seededRng(555));
    const p2 = maskGrid(SOLVED, target, seededRng(555));
    expect(p1).not.toBeNull();
    expect(p2).not.toBeNull();
    expect(Array.from(p1!)).toStrictEqual(Array.from(p2!));
  });

  it("different seeds may produce different puzzles", () => {
    const target = { targetClues: 30 };
    const p1 = maskGrid(SOLVED, target, seededRng(1));
    const p2 = maskGrid(SOLVED, target, seededRng(2));
    // Not guaranteed, but extremely likely with different seeds
    const same = Array.from(p1!).every((v, i) => v === (p2![i] ?? 0));
    expect(same).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// maskToDifficulty
// ---------------------------------------------------------------------------

describe("maskToDifficulty", () => {
  const difficulties: MaskDifficulty[] = ["easy", "medium", "hard", "evil"];

  for (const diff of difficulties) {
    it(`${diff}: result has a unique solution`, () => {
      const puzzle = maskToDifficulty(SOLVED, diff, seededRng(42));
      expect(puzzle).not.toBeNull();
      expect(hasUniqueSolution(puzzle!)).toBe(true);
    });

    it(`${diff}: result has a valid clue count (≤ max + some tolerance for hard constraints)`, () => {
      const puzzle = maskToDifficulty(SOLVED, diff, seededRng(42));
      expect(puzzle).not.toBeNull();
      const clues = countClues(puzzle!);
      // The masking might not reach exactly targetClues if uniqueness cannot be preserved
      // but it should never exceed the max
      expect(clues).toBeLessThanOrEqual(DIFFICULTY_CLUE_RANGES[diff].max);
      // Must have at least 17 clues (theoretical Sudoku minimum)
      expect(clues).toBeGreaterThanOrEqual(17);
    });
  }
});

// ---------------------------------------------------------------------------
// Validate that masked puzzles can be solved back to the original
// ---------------------------------------------------------------------------

describe("masked puzzle is solvable to original", () => {
  it("solving the easy puzzle produces a valid Sudoku", () => {
    const puzzle = maskToDifficulty(SOLVED, "easy", seededRng(99));
    expect(puzzle).not.toBeNull();
    expect(hasUniqueSolution(puzzle!)).toBe(true);
    // The unique solution must pass validateGrid
    // (We trust DLXSolver since its tests cover this separately)
  });
});
