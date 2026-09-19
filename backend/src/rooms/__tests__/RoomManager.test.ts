import { describe, it, expect } from "vitest";
import { RoomManager } from "../RoomManager";
import type { PlayerIdentity, RoomConfig } from "@sudoku/shared";

const hostIdentity: PlayerIdentity = { id: "host1", displayName: "Alice" };
const guestIdentity: PlayerIdentity = { id: "guest1", displayName: "Bob" };

const defaultConfig: RoomConfig = {
  maxPlayers: 4,
  gameMode: "cooperative",
  difficulty: "medium",
  timeLimit: null,
  allowSpectators: false,
  chaosEnabled: false,
  actionCardsEnabled: false,
};

describe("RoomManager", () => {
  it("creates a room and maps it correctly", () => {
    const manager = new RoomManager();
    const room = manager.createRoom(hostIdentity, defaultConfig);

    expect(manager.getRoomCount()).toBe(1);
    expect(manager.getRoomForPlayer(hostIdentity.id)).toBe(room);
  });

  it("allows players to join by code", () => {
    const manager = new RoomManager();
    const room = manager.createRoom(hostIdentity, defaultConfig);

    // Join with lowercase to test case-insensitivity
    const result = manager.joinRoomByCode(guestIdentity, room.code.toLowerCase());
    
    expect(result.error).toBeUndefined();
    expect(result.room).toBe(room);
    expect(manager.getRoomForPlayer(guestIdentity.id)).toBe(room);
    expect(room.hasPlayer(guestIdentity.id)).toBe(true);
  });

  it("handles joining an invalid code", () => {
    const manager = new RoomManager();
    const result = manager.joinRoomByCode(guestIdentity, "INVALID");
    
    expect(result.error).toBe("ROOM_NOT_FOUND");
    expect(result.room).toBeUndefined();
  });

  it("removes player from previous room when joining a new one", () => {
    const manager = new RoomManager();
    const room1 = manager.createRoom(hostIdentity, defaultConfig);
    const room2 = manager.createRoom(guestIdentity, defaultConfig);

    // host1 joins room2
    manager.joinRoomByCode(hostIdentity, room2.code);

    expect(room1.hasPlayer(hostIdentity.id)).toBe(false);
    expect(room2.hasPlayer(hostIdentity.id)).toBe(true);
    expect(manager.getRoomForPlayer(hostIdentity.id)).toBe(room2);
    
    // room1 should be destroyed because it's empty
    expect(manager.getRoomCount()).toBe(1);
  });

  it("destroys room when last player leaves", () => {
    const manager = new RoomManager();
    const room = manager.createRoom(hostIdentity, defaultConfig);

    expect(manager.getRoomCount()).toBe(1);
    manager.leaveRoom(hostIdentity.id);
    expect(manager.getRoomCount()).toBe(0);
  });
});
