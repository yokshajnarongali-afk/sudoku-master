import { GameRoom } from "./Room";
import type { RoomConfig, PlayerIdentity } from "@sudoku/shared";

export class RoomManager {
  // Map of room UUID to GameRoom
  private roomsById: Map<string, GameRoom> = new Map();
  // Map of join code to GameRoom
  private roomsByCode: Map<string, GameRoom> = new Map();
  // Map of player ID to room UUID (so we can quickly find a player's active room)
  private playerToRoomId: Map<string, string> = new Map();

  /**
   * Create a new room with the given host and config.
   */
  public createRoom(hostIdentity: PlayerIdentity, config: RoomConfig): GameRoom {
    // If player is already in a room, we could auto-leave or reject. We'll let them auto-leave.
    this.removePlayerFromCurrentRoom(hostIdentity.id);

    const room = new GameRoom(hostIdentity, config);
    
    this.roomsById.set(room.id, room);
    this.roomsByCode.set(room.code.toUpperCase(), room);
    this.playerToRoomId.set(hostIdentity.id, room.id);
    
    return room;
  }

  /**
   * Join an existing room by its join code.
   */
  public joinRoomByCode(identity: PlayerIdentity, code: string): { room?: GameRoom, error?: string } {
    const uppercaseCode = code.toUpperCase();
    const room = this.roomsByCode.get(uppercaseCode);
    
    if (!room) {
      return { error: "ROOM_NOT_FOUND" };
    }

    if (room.hasPlayer(identity.id)) {
      // Rejoining / already in room
      return { room };
    }

    this.removePlayerFromCurrentRoom(identity.id);

    const joined = room.addPlayer(identity);
    if (!joined) {
      if (room.getSnapshot().players.length >= room.config.maxPlayers) {
        return { error: "ROOM_FULL" };
      }
      return { error: "ROOM_CLOSED" };
    }

    this.playerToRoomId.set(identity.id, room.id);
    return { room };
  }

  /**
   * Get the room a player is currently in.
   */
  public getRoomForPlayer(playerId: string): GameRoom | undefined {
    const roomId = this.playerToRoomId.get(playerId);
    if (!roomId) return undefined;
    return this.roomsById.get(roomId);
  }

  /**
   * Handle a player fully leaving a room explicitly.
   */
  public leaveRoom(playerId: string): GameRoom | undefined {
    const room = this.getRoomForPlayer(playerId);
    if (room) {
      this.removePlayerFromCurrentRoom(playerId);
    }
    return room; // Returns the room they just left, so we can broadcast updates
  }

  /**
   * Handle a network disconnect (starts the grace period).
   */
  public handleDisconnect(playerId: string, onFullyRemoved: (room: GameRoom) => void): GameRoom | undefined {
    const room = this.getRoomForPlayer(playerId);
    if (!room) return undefined;

    room.handleDisconnect(playerId, () => {
      // This runs if they don't reconnect in time
      this.playerToRoomId.delete(playerId);
      this.cleanupRoomIfEmpty(room.id);
      onFullyRemoved(room);
    });

    return room;
  }

  /**
   * Handle a player reconnecting.
   */
  public handleReconnect(playerId: string): GameRoom | undefined {
    const room = this.getRoomForPlayer(playerId);
    if (room) {
      room.handleReconnect(playerId);
    }
    return room;
  }

  // --- Internal Helpers ---

  private removePlayerFromCurrentRoom(playerId: string): void {
    const roomId = this.playerToRoomId.get(playerId);
    if (!roomId) return;

    const room = this.roomsById.get(roomId);
    if (room) {
      room.removePlayer(playerId);
      this.cleanupRoomIfEmpty(roomId);
    }

    this.playerToRoomId.delete(playerId);
  }

  private cleanupRoomIfEmpty(roomId: string): void {
    const room = this.roomsById.get(roomId);
    if (room && room.isEmpty()) {
      room.cleanup();
      this.roomsById.delete(roomId);
      this.roomsByCode.delete(room.code.toUpperCase());
    }
  }

  // --- Utility ---
  
  /** For testing / admin tools */
  public getRoomCount(): number {
    return this.roomsById.size;
  }
}
