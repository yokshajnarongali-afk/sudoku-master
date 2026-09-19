import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GameRoom } from "../Room";
import type { PlayerIdentity, RoomConfig } from "@sudoku/shared";

const hostIdentity: PlayerIdentity = { id: "host1", displayName: "Alice" };
const guestIdentity: PlayerIdentity = { id: "guest1", displayName: "Bob" };
const spectatorIdentity: PlayerIdentity = { id: "spec1", displayName: "Charlie" };

const defaultConfig: RoomConfig = {
  maxPlayers: 4,
  gameMode: "cooperative",
  difficulty: "medium",
  timeLimit: null,
  allowSpectators: false,
  chaosEnabled: false,
  actionCardsEnabled: false,
};

describe("GameRoom", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes correctly with the host", () => {
    const room = new GameRoom(hostIdentity, defaultConfig);
    expect(room.hostId).toBe(hostIdentity.id);
    expect(room.status).toBe("waiting");
    expect(room.code).toHaveLength(6);
    expect(room.hasPlayer(hostIdentity.id)).toBe(true);
    
    const hostPlayer = room.getPlayer(hostIdentity.id);
    expect(hostPlayer?.isReady).toBe(true);
  });

  it("allows players to join and leave", () => {
    const room = new GameRoom(hostIdentity, defaultConfig);
    
    const joined = room.addPlayer(guestIdentity);
    expect(joined).toBe(true);
    expect(room.getSnapshot().players).toHaveLength(2);

    room.removePlayer(guestIdentity.id);
    expect(room.getSnapshot().players).toHaveLength(1);
    expect(room.hasPlayer(guestIdentity.id)).toBe(false);
  });

  it("prevents joining if room is full", () => {
    const smallConfig = { ...defaultConfig, maxPlayers: 1 };
    const room = new GameRoom(hostIdentity, smallConfig);
    
    const joined = room.addPlayer(guestIdentity);
    expect(joined).toBe(false);
    expect(room.getSnapshot().players).toHaveLength(1);
  });

  it("prevents joining in-progress games unless spectators are allowed", () => {
    const room = new GameRoom(hostIdentity, defaultConfig);
    room.setStatus("playing");
    
    let joined = room.addPlayer(guestIdentity);
    expect(joined).toBe(false); // allowSpectators is false

    room.updateConfig({ allowSpectators: true });
    // Note: updateConfig is blocked if status !== 'waiting', so let's set it manually for the test
    room.config = { ...room.config, allowSpectators: true };

    joined = room.addPlayer(spectatorIdentity);
    expect(joined).toBe(true);
  });

  it("handles disconnect and reconnect with grace period", () => {
    const room = new GameRoom(hostIdentity, defaultConfig);
    let fullyRemoved = false;

    // Disconnect
    room.handleDisconnect(hostIdentity.id, () => {
      fullyRemoved = true;
    });

    const player = room.getPlayer(hostIdentity.id);
    expect(player?.status).toBe("disconnected");

    // Reconnect within grace period
    vi.advanceTimersByTime(10000); // 10s
    expect(fullyRemoved).toBe(false);

    room.handleReconnect(hostIdentity.id);
    expect(room.getPlayer(hostIdentity.id)?.status).toBe("connected");

    // Advance past grace period to ensure timer was cleared
    vi.advanceTimersByTime(25000); // 35s total
    expect(fullyRemoved).toBe(false); // Shouldn't fire
    expect(room.hasPlayer(hostIdentity.id)).toBe(true);
  });

  it("removes player permanently if grace period expires", () => {
    const room = new GameRoom(hostIdentity, defaultConfig);
    let fullyRemoved = false;

    room.handleDisconnect(hostIdentity.id, () => {
      fullyRemoved = true;
    });

    // Fast-forward past 30 seconds
    vi.advanceTimersByTime(31000);
    
    expect(fullyRemoved).toBe(true);
    expect(room.hasPlayer(hostIdentity.id)).toBe(false);
  });

  it("transfers host when current host leaves", () => {
    const room = new GameRoom(hostIdentity, defaultConfig);
    room.addPlayer(guestIdentity);

    expect(room.hostId).toBe(hostIdentity.id);
    
    room.removePlayer(hostIdentity.id);
    
    expect(room.hasPlayer(hostIdentity.id)).toBe(false);
    expect(room.hostId).toBe(guestIdentity.id);
  });
});
