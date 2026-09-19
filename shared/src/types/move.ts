import type { CellValue, CellDigit, RowIndex, ColIndex } from "./cell";

/**
 * The kind of input a move represents.
 */
export type MoveType =
  | "digit"        // place a digit in a cell
  | "erase"        // clear a cell
  | "pencil_add"   // add a pencil mark candidate
  | "pencil_remove"; // remove a pencil mark candidate

/** A single user action on the game board. */
export interface Move {
  /** Stable unique identifier (UUID) assigned by the server. */
  readonly id: string;
  /** Player who made the move. */
  readonly playerId: string;
  readonly type: MoveType;
  readonly row: RowIndex;
  readonly col: ColIndex;
  /**
   * For 'digit' moves: the digit entered (1–9).
   * For 'erase' moves: null.
   * For pencil moves: the candidate digit being added/removed.
   */
  readonly value: CellValue;
  /** Server-assigned Unix timestamp (ms). */
  readonly timestamp: number;
  /**
   * Validation result from the server.
   * - true: move matches the solution
   * - false: move conflicts with the solution
   * - null: not yet validated (client-side optimistic update)
   */
  readonly isValid: boolean | null;
  /**
   * Points delta applied to the player's score as a result of this move.
   * Positive = gained points; negative = deducted.
   */
  readonly pointsDelta: number;
}

/**
 * The server's authoritative response to a move submission.
 * Extends Move with server-computed fields.
 */
export interface MoveResult extends Move {
  /**
   * Whether the puzzle is now complete (all cells correctly filled)
   * after this move was applied.
   */
  readonly puzzleComplete: boolean;
}

/**
 * The minimal payload a client sends to request a move.
 * The server fills in id, timestamp, isValid, pointsDelta.
 */
export type MoveDraft = Readonly<{
  type: MoveType;
  row: RowIndex;
  col: ColIndex;
  value: CellValue;
}>;
