import type { SudokuPuzzle } from "./puzzle";
import type { CellState, SudokuGrid } from "./cell";
import type { Player } from "./player";
import type { Move } from "./move";
import type { ChaosEvent } from "./chaos";
import type { ActionCardUse } from "./action-card";

/**
 * The phase of an active game.
 */
export type GamePhase =
  | "idle"       // not started
  | "playing"    // active
  | "paused"     // temporarily paused
  | "finished";  // completed (win/lose/timeout)

/**
 * The complete live state of a game in progress.
 * Sent to clients on join and on every significant change.
 *
 * In cooperative mode: one shared board for all players.
 * In competitive / chaos: each player has their own board (map keyed by playerId).
 */
export interface GameState {
  /** The puzzle being played. */
  readonly puzzle: SudokuPuzzle;

  /**
   * Live board state.
   * - Cooperative / solo: single board for everyone.
   * - Competitive / chaos: one board per player, keyed by player ID.
   *
   * Represented as a discriminated union on the room's gameMode.
   */
  readonly board: SudokuGrid<CellState>;

  /** Per-player board overrides in competitive modes. Key = playerId. */
  readonly playerBoards: Readonly<Record<string, SudokuGrid<CellState>>>;

  readonly phase: GamePhase;

  /** Unix timestamp (ms) when the game started. */
  readonly startedAt: number;

  /** Unix timestamp (ms) when the game ended; null if still in progress. */
  readonly endedAt: number | null;

  /** Elapsed time in seconds (updated server-side every second). */
  readonly timeElapsed: number;

  /** Remaining time in seconds; null if untimed. */
  readonly timeRemaining: number | null;

  /** All players in this game. */
  readonly players: readonly Player[];

  /** Ordered history of all moves made this game. */
  readonly moves: readonly Move[];

  /** Active chaos events currently in effect. */
  readonly activeChaosEvents: readonly ChaosEvent[];

  /** Log of action card uses this game. */
  readonly actionCardUses: readonly ActionCardUse[];
}
