/** Per-player score breakdown for a completed game. */
export interface Score {
  readonly playerId: string;
  /** Total accumulated points. */
  readonly total: number;
  /** Points from correctly-placed digits. */
  readonly correctPoints: number;
  /** Points deducted for incorrect entries. */
  readonly errorPenalty: number;
  /** Bonus for completing the puzzle quickly (speed-based). */
  readonly timeBonus: number;
  /** Bonus points from using action cards offensively (chaos mode). */
  readonly sabotageBonus: number;
  /** Number of correct moves made. */
  readonly correctMoves: number;
  /** Number of incorrect moves made. */
  readonly incorrectMoves: number;
  /** Total cells correctly filled by this player. */
  readonly cellsCompleted: number;
}

/** Leaderboard entry: score + rank. */
export interface LeaderboardEntry {
  readonly rank: number;
  readonly playerId: string;
  readonly displayName: string;
  readonly score: Score;
}

/** Ordered leaderboard for a finished game. */
export type Leaderboard = readonly LeaderboardEntry[];
