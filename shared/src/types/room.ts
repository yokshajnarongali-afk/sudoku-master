import type { Difficulty } from "./difficulty";
import type { Player } from "./player";

/**
 * Game mode variants.
 * - solo: single player, offline-capable
 * - cooperative: players share a board and work together
 * - competitive: each player has their own board; fastest/highest score wins
 * - chaos: competitive with action cards and chaos events enabled
 */
export type GameMode = "solo" | "cooperative" | "competitive" | "chaos";

/** Lifecycle state of a room. */
export type RoomStatus =
  | "waiting"    // lobby — waiting for players to ready up
  | "countdown"  // brief countdown before game starts
  | "playing"    // game in progress
  | "paused"     // host paused (solo only)
  | "finished";  // game complete

/** Configuration chosen by the host before the game begins. */
export interface RoomConfig {
  /** Maximum number of players allowed (1–8). */
  readonly maxPlayers: number;
  readonly gameMode: GameMode;
  readonly difficulty: Difficulty;
  /** Time limit in seconds; null means untimed. */
  readonly timeLimit: number | null;
  /** Whether spectators (non-playing observers) are allowed. */
  readonly allowSpectators: boolean;
  /**
   * Whether chaos events are active.
   * Only meaningful when gameMode === 'chaos'.
   */
  readonly chaosEnabled: boolean;
  /**
   * Whether action cards are distributed during play.
   * Enabled automatically when gameMode === 'chaos' or 'competitive'.
   */
  readonly actionCardsEnabled: boolean;
}

/** A room that players join to play together. */
export interface Room {
  /** Stable unique identifier (UUID). */
  readonly id: string;
  /**
   * Short human-readable join code (e.g. "K3X9QA").
   * Used for QR codes and manual entry.
   */
  readonly code: string;
  /** Player ID of the host (has admin controls). */
  readonly hostId: string;
  readonly config: RoomConfig;
  readonly players: readonly Player[];
  readonly status: RoomStatus;
  /** Unix timestamp (ms) when the room was created. */
  readonly createdAt: number;
}
