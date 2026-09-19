/**
 * network.ts — Socket.IO event type maps and packet payload types.
 *
 * Usage:
 *   Server:  new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer)
 *   Client:  io<ServerToClientEvents, ClientToServerEvents>(url)
 */

import type { Room, RoomConfig } from "./room";
import type { GameState } from "./game";
import type { PlayerIdentity } from "./player";
import type { MoveDraft, MoveResult } from "./move";
import type { ActionCardUse } from "./action-card";
import type { ChaosEvent } from "./chaos";
import type { GameResult } from "./result";
import type { SudokuPuzzle } from "./puzzle";

// ---------------------------------------------------------------------------
// Callback / acknowledgement result types
// ---------------------------------------------------------------------------

/** Standard result wrapper for acknowledgement callbacks. */
export type AckResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: GameError };

/** Structured error payload sent by the server. */
export interface GameError {
  readonly code: GameErrorCode;
  readonly message: string;
}

/** All possible error codes the server can send. */
export type GameErrorCode =
  | "ROOM_NOT_FOUND"
  | "ROOM_FULL"
  | "ROOM_CLOSED"
  | "GAME_IN_PROGRESS"
  | "GAME_NOT_STARTED"
  | "MOVE_INVALID_POSITION"
  | "MOVE_GIVEN_CELL"
  | "MOVE_LOCKED_CELL"
  | "ACTION_CARD_NOT_HELD"
  | "ACTION_CARD_ON_COOLDOWN"
  | "ACTION_CARD_INVALID_TARGET"
  | "PLAYER_NOT_IN_ROOM"
  | "NOT_HOST"
  | "INVALID_PAYLOAD"
  | "INTERNAL_ERROR";

// ---------------------------------------------------------------------------
// Packet payload types — additional structure for specific events
// ---------------------------------------------------------------------------

/** Payload for creating a new room. */
export interface CreateRoomPayload {
  readonly identity: PlayerIdentity;
  readonly config: RoomConfig;
}

/** Payload for joining an existing room via code. */
export interface JoinRoomPayload {
  readonly identity: PlayerIdentity;
  /** 6-character join code (case-insensitive). */
  readonly code: string;
}

/** Payload sent when the host changes room configuration. */
export interface UpdateRoomConfigPayload {
  readonly config: Partial<RoomConfig>;
}

/** Payload for the host kicking a player. */
export interface KickPlayerPayload {
  readonly targetPlayerId: string;
}

/** Notification that a player's connection state changed. */
export interface PlayerConnectionEvent {
  readonly playerId: string;
  readonly displayName: string;
  readonly status: "connected" | "disconnected" | "reconnected";
}

/** Timer sync packet sent by the server every second during play. */
export interface TimerSyncPacket {
  readonly timeElapsed: number;
  readonly timeRemaining: number | null;
}

// ---------------------------------------------------------------------------
// Socket.IO event maps
// Note: Socket.IO reverses the generic parameters between Server and Socket.
//
// Server<ClientToServer, ServerToClient>
// Socket<ServerToClient, ClientToServer>          ← client-side
// ---------------------------------------------------------------------------

export interface StartGamePayload {
  readonly puzzle: SudokuPuzzle;
}

/**
 * Events emitted BY the client and received BY the server.
 * Callbacks follow the `(result: AckResult<T>) => void` pattern.
 */
export interface ClientToServerEvents {
  /** Create a new room and become the host. */
  "room:create": (
    payload: CreateRoomPayload,
    callback: (result: AckResult<Room>) => void,
  ) => void;

  /** Join an existing room by its code. */
  "room:join": (
    payload: JoinRoomPayload,
    callback: (result: AckResult<Room>) => void,
  ) => void;

  /** Leave the current room gracefully. */
  "room:leave": () => void;

  /** Toggle the player's ready state in the lobby. */
  "room:ready": (ready: boolean) => void;

  /** Host updates the room configuration before the game starts. */
  "room:update_config": (payload: UpdateRoomConfigPayload) => void;

  /** Host kicks a player from the room. */
  "room:kick": (payload: KickPlayerPayload) => void;

  /** Host transfers host status to another player. */
  "room:transfer_host": (payload: { targetPlayerId: string }) => void;

  /** Host starts the game (all players must be ready). */
  "game:start": (
    payload: StartGamePayload,
    callback: (result: AckResult<GameState>) => void
  ) => void;

  /** Submit a move on the board. */
  "game:move": (
    draft: MoveDraft,
    callback: (result: AckResult<MoveResult>) => void,
  ) => void;

  /** Activate an action card. */
  "game:use_action_card": (
    use: Omit<ActionCardUse, "timestamp">,
    callback: (result: AckResult<ActionCardUse>) => void,
  ) => void;

  /** Host pauses the game (solo only). */
  "game:pause": () => void;

  /** Host resumes a paused game. */
  "game:resume": () => void;

  /** Request the current full game state (e.g. on reconnect). */
  "game:sync": (callback: (result: AckResult<GameState>) => void) => void;
}

/**
 * Events emitted BY the server and received BY the client.
 */
export interface ServerToClientEvents {
  /** Full room snapshot after any room-level change. */
  "room:updated": (room: Room) => void;

  /** Full game state snapshot (on start, reconnect, or significant change). */
  "game:state": (state: GameState) => void;

  /** Authoritative result of a single move (sent to all players in room). */
  "game:move_result": (result: MoveResult) => void;

  /** Periodic timer sync to keep clients in sync. */
  "game:timer": (packet: TimerSyncPacket) => void;

  /** An action card was used (broadcast to all players in room). */
  "game:action_card_used": (use: ActionCardUse) => void;

  /** A chaos event was triggered (chaos mode only). */
  "game:chaos_event": (event: ChaosEvent) => void;

  /** A chaos event's effect has expired. */
  "game:chaos_event_expired": (eventId: string) => void;

  /** The game has ended — final results. */
  "game:finished": (result: GameResult) => void;

  /** A player's connection status changed. */
  "player:connection": (event: PlayerConnectionEvent) => void;

  /** Server-side error notification (non-acknowledgement path). */
  "error": (error: GameError) => void;
}

/**
 * Events used for Socket.IO server-to-server communication.
 * Reserved for future horizontal scaling (Redis adapter).
 */
export type InterServerEvents = Record<never, never>;

/**
 * Per-socket data stored server-side for the lifetime of a connection.
 * Available as `socket.data` on the server.
 */
export interface SocketData {
  /** Authenticated player identity attached on connection. */
  readonly identity: PlayerIdentity;
  /** The room the socket is currently in; null if in lobby/not joined. */
  roomId: string | null;
}
