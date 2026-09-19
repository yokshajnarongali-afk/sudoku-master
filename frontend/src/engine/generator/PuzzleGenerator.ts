/**
 * PuzzleGenerator.ts
 *
 * Public API for generating Sudoku puzzles.
 * Combines SeedGrid + PermutationEngine + MaskEngine into a single call.
 *
 * Usage:
 *   const puzzle = generatePuzzle('hard');
 *   const puzzle = generatePuzzle('medium', 42);  // reproducible from seed
 */

import { randomUUID } from "crypto";
import { SEED_GRID } from "./SeedGrid";
import { randomize } from "./PermutationEngine";
import { maskToDifficulty, maskGrid, countClues, DIFFICULTY_CLUE_RANGES } from "./MaskEngine";
import { seededRng } from "../utils/rng";
import type { SudokuPuzzle } from "@sudoku/shared";
import type { Difficulty } from "@sudoku/shared";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Map shared Difficulty → MaskDifficulty.
 * 'master' uses the same range as 'evil' (17–20 clues).
 */
function toMaskDifficulty(difficulty: Difficulty): "easy" | "medium" | "hard" | "evil" {
  switch (difficulty) {
    case "easy":   return "easy";
    case "medium": return "medium";
    case "hard":   return "hard";
    case "expert":
    case "master": return "evil";
  }
}

/**
 * Convert a flat Int32Array(81) to a SudokuGrid<CellValue>.
 * Digits 1–9 → CellDigit; 0 → null.
 */
function toGrid(flat: Int32Array): import("@sudoku/shared").SudokuGrid<import("@sudoku/shared").CellValue> {
  type CellValue = import("@sudoku/shared").CellValue;
  type SudokuRow<T> = import("@sudoku/shared").SudokuRow<T>;
  type SudokuGrid<T> = import("@sudoku/shared").SudokuGrid<T>;

  const rows = Array.from({ length: 9 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => {
      const v = flat[r * 9 + c] ?? 0;
      return v === 0 ? null : (v as CellValue);
    }) as unknown as SudokuRow<CellValue>,
  ) as unknown as SudokuGrid<CellValue>;

  return rows;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a Sudoku puzzle.
 *
 * @param difficulty - 'easy' | 'medium' | 'hard' | 'expert' | 'master'
 * @param seed       - Optional integer seed for reproducible output.
 *                     If omitted, a random seed is used.
 * @returns          A fully-typed SudokuPuzzle ready for the game engine.
 */
export function generatePuzzle(difficulty: Difficulty, seed?: number): SudokuPuzzle {
  const resolvedSeed = seed ?? (Math.random() * 0xffffffff) >>> 0;
  const seedStr = String(resolvedSeed);

  // Two separate RNGs from the same seed — one for permutation, one for masking.
  // Using different offsets avoids correlation between the two phases.
  const rngPermute = seededRng(resolvedSeed);
  const rngMask    = seededRng(resolvedSeed ^ 0xdeadbeef);

  // Step 1: produce a random completed solution from the seed grid
  const solved = randomize(new Int32Array(SEED_GRID), rngPermute);

  // Step 2: remove cells while preserving uniqueness
  const maskDiff = toMaskDifficulty(difficulty);
  const clues = maskToDifficulty(solved, maskDiff, rngMask);

  // maskToDifficulty should never return null for a valid solved grid,
  // but handle gracefully anyway.
  const puzzle = clues ?? solved;

  return {
    id: randomUUID(),
    difficulty,
    clues: toGrid(puzzle),
    solution: toGrid(solved),
    givenCount: countClues(puzzle),
    seed: seedStr,
    generatedAt: Date.now(),
  };
}

/**
 * Generate a puzzle with an explicit clue count target.
 * Useful for testing or when you need a specific number of givens.
 *
 * @param solved      - A completed valid Int32Array(81).
 * @param targetClues - Desired number of given cells (17–80).
 * @param seed        - RNG seed.
 * @returns           SudokuPuzzle or null if the grid length is invalid.
 */
export function generatePuzzleFromSolved(
  solved: Int32Array,
  difficulty: Difficulty,
  targetClues: number,
  seed: number,
): SudokuPuzzle | null {
  if (solved.length !== 81) return null;

  const rng = seededRng(seed);
  const puzzle = maskGrid(solved, { targetClues }, rng) ?? solved;

  return {
    id: randomUUID(),
    difficulty,
    clues: toGrid(puzzle),
    solution: toGrid(solved),
    givenCount: countClues(puzzle),
    seed: String(seed),
    generatedAt: Date.now(),
  };
}
