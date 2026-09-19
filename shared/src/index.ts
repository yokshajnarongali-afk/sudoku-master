/**
 * @sudoku/shared — Public API
 *
 * All shared TypeScript types for the Sudoku Master application.
 * Import from this package in both frontend and backend:
 *
 *   import type { SudokuPuzzle, GameState, Move } from '@sudoku/shared';
 */

// Primitive / foundational types (no dependencies)
export type {
  Difficulty,
  DIFFICULTY_LEVELS,
  DIFFICULTY_GIVEN_RANGE,
} from "./types/difficulty";

export * from "./types/difficulty";

export type {
  CellDigit,
  CellValue,
  RowIndex,
  ColIndex,
  CellPosition,
  PencilMarks,
  CellState,
  SudokuRow,
  SudokuGrid,
} from "./types/cell";

export type { SudokuPuzzle } from "./types/puzzle";

// Action card types (imported by Player, so declared before player)
export type {
  ActionCardType,
  ActionCardTargetType,
  ActionCardDefinition,
  ActionCard,
  ActionCardUse,
} from "./types/action-card";

// Player
export type {
  PlayerIdentity,
  PlayerStatus,
  Player,
} from "./types/player";

// Room
export type {
  GameMode,
  RoomStatus,
  RoomConfig,
  Room,
} from "./types/room";

// Move
export type {
  MoveType,
  Move,
  MoveResult,
  MoveDraft,
} from "./types/move";

// Chaos
export type {
  ChaosEventType,
  ChaosEventScope,
  ChaosEvent,
} from "./types/chaos";

// Game state
export type {
  GamePhase,
  GameState,
} from "./types/game";

// Score & results
export type {
  Score,
  LeaderboardEntry,
  Leaderboard,
} from "./types/score";

export type {
  PlayerResult,
  GameResult,
} from "./types/result";

// Network (Socket.IO event maps)
export type {
  AckResult,
  GameError,
  GameErrorCode,
  CreateRoomPayload,
  JoinRoomPayload,
  UpdateRoomConfigPayload,
  KickPlayerPayload,
  StartGamePayload,
  PlayerConnectionEvent,
  TimerSyncPacket,
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "./types/network";
export * from "./action-cards";
