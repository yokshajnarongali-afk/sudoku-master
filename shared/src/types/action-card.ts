import type { CellPosition } from "./cell";

/**
 * All possible action card types.
 * Action cards are collected during play and activated by the player.
 */
export type ActionCardType =
  | "reveal_cell"       // reveals the correct digit for one chosen cell
  | "hint"              // highlights a region with an error or easy cell
  | "double_points"     // doubles points for the next N correct moves
  | "shield"            // blocks one incoming sabotage card
  | "freeze"            // freezes a target opponent for a short duration
  | "scramble_pencils"  // scrambles a target's pencil marks
  | "bomb"              // clears a target's progress in a 3×3 box
  | "time_freeze"       // pauses the shared timer (co-op only)
  | "extra_time";       // adds seconds to the player's timer (competitive)

/** Who / what an action card targets when used. */
export type ActionCardTargetType =
  | "self"       // applies to the user
  | "opponent"   // must specify a target player
  | "cell"       // must specify a target cell position
  | "global"     // applies to all players
  | "none";      // no target needed

/** Static definition of an action card type (the card's "rules"). */
export interface ActionCardDefinition {
  readonly type: ActionCardType;
  /** Short display name shown in the UI. */
  readonly name: string;
  /** One-sentence description shown on hover/tooltip. */
  readonly description: string;
  readonly targetType: ActionCardTargetType;
  /** Cooldown in seconds before the same card type can be used again. */
  readonly cooldown: number;
  /** Duration in seconds the effect lasts; 0 = instant effect. */
  readonly effectDuration: number;
}

/** An instance of an action card held by a player. */
export interface ActionCard {
  /** Unique instance ID (UUID) for this card in the player's hand. */
  readonly id: string;
  readonly type: ActionCardType;
  /**
   * Unix timestamp (ms) when this card was received.
   * Used to determine age / display order.
   */
  readonly receivedAt: number;
}

/**
 * A record of a player activating an action card.
 * Created by the server on receiving an action card use event.
 */
export interface ActionCardUse {
  /** The specific card instance that was used. */
  readonly cardId: string;
  readonly cardType: ActionCardType;
  /** Player who activated the card. */
  readonly usedBy: string;
  /** Target player (null if not applicable). */
  readonly targetPlayerId: string | null;
  /** Target cell (null if not applicable). */
  readonly targetCell: CellPosition | null;
  /** Server-assigned Unix timestamp (ms). */
  readonly timestamp: number;
}
