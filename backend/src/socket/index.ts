import { Server, Socket } from "socket.io";
import type { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData,
  AckResult
} from "@sudoku/shared";
import { RoomManager } from "../rooms/RoomManager";

export const roomManager = new RoomManager();

export function setupSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) {
  // Use middleware to authenticate/extract identity from handshake
  io.use((socket, next) => {
    const identityRaw = socket.handshake.auth["identity"];
    if (!identityRaw) {
      return next(new Error("Authentication error: Missing identity"));
    }
    try {
      const identity = typeof identityRaw === "string" ? JSON.parse(identityRaw) : identityRaw;
      if (!identity || !identity.id || !identity.displayName) {
        return next(new Error("Authentication error: Invalid identity format"));
      }
      (socket.data as any).identity = identity;
      (socket.data as any).roomId = null;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Malformed identity"));
    }
  });

  io.on("connection", (socket) => {
    const identity = socket.data.identity!;
    console.log(`[socket] User connected: ${identity.displayName} (${identity.id})`);

    // Check if player is already in a room (reconnecting)
    const existingRoom = roomManager.handleReconnect(identity.id);
    if (existingRoom) {
      socket.join(existingRoom.id);
      socket.data.roomId = existingRoom.id;
      // Broadcast reconnection
      socket.to(existingRoom.id).emit("player:connection", {
        playerId: identity.id,
        displayName: identity.displayName,
        status: "reconnected"
      });
      // Send them the current room snapshot
      socket.emit("room:updated", existingRoom.getSnapshot());
    }

    // --- Room Events ---

    socket.on("room:create", (payload, callback) => {
      const room = roomManager.createRoom(identity, payload.config);
      socket.join(room.id);
      socket.data.roomId = room.id;
      callback({ ok: true, data: room.getSnapshot() });
    });

    socket.on("room:join", (payload, callback) => {
      const result = roomManager.joinRoomByCode(identity, payload.code);
      if (result.error) {
        return callback({ ok: false, error: { code: result.error as any, message: result.error } });
      }
      
      const room = result.room!;
      socket.join(room.id);
      socket.data.roomId = room.id;
      
      const snapshot = room.getSnapshot();
      // Inform the joining player
      callback({ ok: true, data: snapshot });
      // Inform everyone else in the room
      socket.to(room.id).emit("room:updated", snapshot);
    });

    socket.on("room:leave", () => {
      if (!socket.data.roomId) return;
      
      const room = roomManager.leaveRoom(identity.id);
      socket.leave(socket.data.roomId);
      socket.data.roomId = null;
      
      if (room && !room.isEmpty()) {
        io.to(room.id).emit("room:updated", room.getSnapshot());
      }
    });

    socket.on("room:ready", (isReady) => {
      const room = roomManager.getRoomForPlayer(identity.id);
      if (!room || room.status !== "waiting") return;

      room.setPlayerReady(identity.id, isReady);
      io.to(room.id).emit("room:updated", room.getSnapshot());
    });

    socket.on("room:update_config", (payload) => {
      const room = roomManager.getRoomForPlayer(identity.id);
      if (!room || room.hostId !== identity.id || room.status !== "waiting") return;

      room.updateConfig(payload.config);
      io.to(room.id).emit("room:updated", room.getSnapshot());
    });

    socket.on("room:kick", (payload) => {
      const room = roomManager.getRoomForPlayer(identity.id);
      if (!room || room.hostId !== identity.id || payload.targetPlayerId === identity.id) return;

      const targetRoom = roomManager.leaveRoom(payload.targetPlayerId);
      if (targetRoom) {
        // Broadcast update to remaining players
        io.to(room.id).emit("room:updated", targetRoom.getSnapshot());
        // Find the specific socket for the kicked player and make them leave the socket.io room
        // Normally we'd track socket IDs, but since we rely on identities, we can broadcast an error
        // or just let their client sync state when it misses heartbeats/events. 
        // For now, updating the room drops them from the player list, which the client can react to.
      }
    });

    socket.on("room:transfer_host", (payload) => {
      const room = roomManager.getRoomForPlayer(identity.id);
      if (!room || room.hostId !== identity.id || !room.hasPlayer(payload.targetPlayerId)) return;

      room.hostId = payload.targetPlayerId;
      io.to(room.id).emit("room:updated", room.getSnapshot());
    });

    socket.on("game:start", (payload: import("@sudoku/shared").StartGamePayload, callback: (res: any) => void) => {
      const room = roomManager.getRoomForPlayer(identity.id);
      if (!room || room.hostId !== identity.id || room.status !== "waiting") {
        return callback({ ok: false, error: { code: "NOT_HOST", message: "Only host can start game" }});
      }

      room.startGame(payload.puzzle);
      io.to(room.id).emit("room:updated", room.getSnapshot());
      
      const gameState = room.getGameState();
      if (gameState) {
        io.to(room.id).emit("game:state", gameState);
        callback({ ok: true, data: gameState });
      } else {
        callback({ ok: false, error: { code: "INTERNAL_ERROR", message: "Failed to generate game state" }});
      }
    });

    socket.on("game:move", (draft: import("@sudoku/shared").MoveDraft, callback: (res: any) => void) => {
      const room = roomManager.getRoomForPlayer(identity.id);
      if (!room || room.status !== "playing") {
        return callback({ ok: false, error: { code: "GAME_NOT_STARTED", message: "Game not active" }});
      }

      const player = room.getPlayer(identity.id);
      const oldCardsLength = player?.actionCards.length ?? 0;

      const result = room.applyMove(identity.id, draft);
      if (!result) {
        return callback({ ok: false, error: { code: "MOVE_LOCKED_CELL", message: "Cannot modify cell" }});
      }

      const newCardsLength = player?.actionCards.length ?? 0;

      io.to(room.id).emit("game:move_result", result);
      
      if ((room.status as string) === "finished" || newCardsLength > oldCardsLength) {
        const gameState = room.getGameState();
        if (gameState) {
          io.to(room.id).emit("game:state", gameState);
        }
      }
      
      callback({ ok: true, data: result });
    });

    socket.on("game:use_action_card", (use: Omit<import("@sudoku/shared").ActionCardUse, "timestamp">, callback: (res: any) => void) => {
      const room = roomManager.getRoomForPlayer(identity.id);
      if (!room || room.status !== "playing") {
        return callback({ ok: false, error: { code: "GAME_NOT_STARTED", message: "Game not active" }});
      }

      const res = room.useActionCard(identity.id, use);
      if (!res.ok || !res.useRecord) {
        return callback({ ok: false, error: { code: "INVALID_USE", message: res.error || "Invalid card use" }});
      }

      // Broadcast the card usage
      io.to(room.id).emit("game:action_card_used", res.useRecord);

      // If the card resulted in a move (e.g. reveal_cell)
      if (res.moveResult) {
        io.to(room.id).emit("game:move_result", res.moveResult);
      }

      // Action card usage modifies state (cards removed from hand, activeChaosEvents added, or bomb cleared cells)
      // So we broadcast full game state update.
      const gameState = room.getGameState();
      if (gameState) {
        io.to(room.id).emit("game:state", gameState);
      }

      callback({ ok: true, data: res.useRecord });
    });

    socket.on("game:sync", (callback: (res: any) => void) => {
      const room = roomManager.getRoomForPlayer(identity.id);
      if (!room || !["playing", "paused", "finished"].includes(room.status)) {
        return callback({ ok: false, error: { code: "GAME_NOT_STARTED", message: "No active game" }});
      }
      callback({ ok: true, data: room.getGameState()! });
    });

    // --- Connection Lifecycle ---

    socket.on("disconnect", () => {
      console.log(`[socket] User disconnected: ${identity.displayName} (${identity.id})`);
      const room = roomManager.handleDisconnect(identity.id, (expiredRoom) => {
        // If they don't return after 30s, broadcast their permanent removal
        io.to(expiredRoom.id).emit("room:updated", expiredRoom.getSnapshot());
      });

      if (room) {
        socket.to(room.id).emit("player:connection", {
          playerId: identity.id,
          displayName: identity.displayName,
          status: "disconnected"
        });
      }
    });
  });
}
