import type { Difficulty } from "./difficulty";
import type { CellValue, SudokuGrid } from "./cell";

/**
 * A fully-described Sudoku puzzle.
 * Clues and solution are stored as separate grids; the engine validates against solution.
 */
export interface SudokuPuzzle {
  /** Stable unique identifier (UUID). */
  readonly id: string;
  /** Human-facing difficulty level. */
  readonly difficulty: Difficulty;
  /**
   * The starting puzzle grid.
   * Given cells have a digit; empty cells have null.
   */
  readonly clues: SudokuGrid<CellValue>;
  /**
   * The unique valid solution for this puzzle.
   * Every cell has a digit (1–9); no nulls.
   */
  readonly solution: SudokuGrid<CellValue>;
  /** Total number of given (pre-filled) clue cells. */
  readonly givenCount: number;
  /**
   * Deterministic seed used by the generator to reproduce this puzzle.
   * Enables offline play without re-transmitting the full grid.
   */
  readonly seed: string;
  /** Unix timestamp (ms) when this puzzle was generated. */
  readonly generatedAt: number;
}
