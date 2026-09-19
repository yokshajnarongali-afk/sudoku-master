/**
 * Types of random chaos events that can fire during a chaos-mode game.
 * Events are triggered automatically by the server on a schedule or condition.
 */
export type ChaosEventType =
  | "shuffle_rows"       // shuffles the display order of rows within a band
  | "invert_numbers"     // inverts digits on-screen (e.g. 1↔9, 2↔8) briefly
  | "blind_zone"         // temporarily blacks out a random 3×3 box
  | "ghost_digits"       // shows phantom incorrect digits in empty cells
  | "speed_boost"        // halves the cooldown on all action cards briefly
  | "gravity"            // all cells shift visually downward (cosmetic chaos)
  | "double_error_cost"  // error penalties are doubled for a duration
  | "bonus_rain"         // bonus points awarded for next N correct moves;

/** Who is affected by a chaos event. */
export type ChaosEventScope =
  | "all"        // all players
  | "random"     // a randomly-selected player
  | "leader"     // the current leader (highest score)
  | "lagging";   // the player currently in last place

/** A single chaos event triggered during a chaos-mode game. */
export interface ChaosEvent {
  /** Unique instance identifier (UUID). */
  readonly id: string;
  readonly type: ChaosEventType;
  readonly scope: ChaosEventScope;
  /** Player IDs actually affected (resolved by server from scope). */
  readonly affectedPlayerIds: readonly string[];
  /** Server Unix timestamp (ms) when the event was triggered. */
  readonly triggeredAt: number;
  /**
   * How long the effect lasts, in seconds.
   * 0 = instant (one-shot effect with no ongoing state).
   */
  readonly duration: number;
  /**
   * Server Unix timestamp (ms) when the effect expires.
   * null if duration === 0.
   */
  readonly expiresAt: number | null;
}
