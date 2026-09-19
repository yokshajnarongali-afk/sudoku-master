import type { ActionCard } from "./action-card";

/**
 * Immutable identity of a player: who they are, not their in-game state.
 * Stored in JWT / session; sent on connection.
 */
export interface PlayerIdentity {
  /** Stable unique identifier (UUID). */
  readonly id: string;
  /** Display name chosen by the player (max 24 chars). */
  readonly displayName: string;
  /** Optional URL to an avatar image. */
  readonly avatarUrl?: string;
}

/**
 * Connection and readiness status of a player in a room.
 */
export type PlayerStatus =
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "spectating";

/**
 * Full in-game representation of a player.
 * Combines their identity with live game state.
 */
export interface Player {
  readonly identity: PlayerIdentity;
  /** Current connection status. */
  readonly status: PlayerStatus;
  /** True once the player has pressed "Ready" in the lobby. */
  readonly isReady: boolean;
  /** Current total score for this game session. */
  readonly score: number;
  /** Number of cells this player has correctly filled. */
  readonly completedCells: number;
  /** Number of incorrect entries made. */
  readonly errorCount: number;
  /** Action cards currently held by this player. */
  readonly actionCards: readonly ActionCard[];
  /** Unix timestamp (ms) when the player joined the room. */
  readonly joinedAt: number;
}
