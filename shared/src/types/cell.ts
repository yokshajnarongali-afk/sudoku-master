/**
 * A valid Sudoku digit (1–9).
 */
export type CellDigit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * The value currently entered in a cell: a digit, or null if the cell is empty.
 */
export type CellValue = CellDigit | null;

/**
 * Zero-based row/column position within the 9×9 grid.
 */
export type RowIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type ColIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** A row/column coordinate pair on the board. */
export interface CellPosition {
  readonly row: RowIndex;
  readonly col: ColIndex;
}

/**
 * Pencil marks: the set of candidate digits a player has noted for a cell.
 * Stored as an array of digits (1–9); order is not significant.
 * Uses an array (not Set) for JSON-safe serialisation.
 */
export type PencilMarks = readonly CellDigit[];

/** The complete state of a single cell during an active game. */
export interface CellState {
  /** Current entered value (null = empty). */
  readonly value: CellValue;
  /** True if this cell was provided as a puzzle clue — must not be changed. */
  readonly given: boolean;
  /** Player-annotated candidate digits. */
  readonly pencilMarks: PencilMarks;
  /** True if the current value conflicts with another cell in the same row/column/box. */
  readonly isError: boolean;
  /**
   * The player ID currently "occupying" / editing this cell in a multiplayer game.
   * null = no player is focused on this cell.
   */
  readonly lockedBy: string | null;
}

/**
 * A 9-element tuple representing one row of the Sudoku grid.
 * Using a tuple (not array) ensures `noUncheckedIndexedAccess` returns T, not T | undefined.
 */
export type SudokuRow<T> = readonly [T, T, T, T, T, T, T, T, T];

/**
 * The full 9×9 Sudoku grid as a tuple of rows.
 * `SudokuGrid<CellState>` — live game board.
 * `SudokuGrid<CellValue>` — puzzle clues or solution.
 */
export type SudokuGrid<T> = readonly [
  SudokuRow<T>,
  SudokuRow<T>,
  SudokuRow<T>,
  SudokuRow<T>,
  SudokuRow<T>,
  SudokuRow<T>,
  SudokuRow<T>,
  SudokuRow<T>,
  SudokuRow<T>,
];
