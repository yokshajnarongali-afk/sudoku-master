import type { SudokuPuzzle } from "./puzzle";
import type { Score, Leaderboard } from "./score";

/** One player's outcome in a finished game. */
export interface PlayerResult {
  readonly playerId: string;
  readonly displayName: string;
  readonly rank: number;
  readonly score: Score;
  /** True if this player completed the puzzle (all cells correctly filled). */
  readonly completed: boolean;
  /**
   * Time (in seconds) at which this player completed the puzzle.
   * null if they did not complete it.
   */
  readonly completionTime: number | null;
}

/** The final authoritative result of a finished game. */
export interface GameResult {
  /** The room ID the game was played in. */
  readonly roomId: string;
  /** The puzzle that was played. */
  readonly puzzle: SudokuPuzzle;
  /**
   * Player ID of the winner.
   * null in co-op if the puzzle was not solved, or in solo if not completed.
   * null in competitive on a tie (check leaderboard for details).
   */
  readonly winnerId: string | null;
  /** True if the puzzle was fully solved (all correct cells filled). */
  readonly puzzleSolved: boolean;
  /** Total game duration in seconds. */
  readonly durationSeconds: number;
  /** Unix timestamp (ms) when the game ended. */
  readonly endedAt: number;
  /** Per-player results ordered by rank. */
  readonly playerResults: readonly PlayerResult[];
  /** Final leaderboard. */
  readonly leaderboard: Leaderboard;
}
