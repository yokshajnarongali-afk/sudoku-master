import { randomUUID } from "crypto";
import type { 
  Room as RoomType, 
  RoomConfig, 
  RoomStatus, 
  Player, 
  PlayerIdentity 
} from "@sudoku/shared";

// Generate a random 6-character alphanumeric code
function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed I, O, 1, 0
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export class GameRoom {
  public readonly id: string;
  public readonly code: string;
  public readonly createdAt: number;
  
  public hostId: string;
  public config: RoomConfig;
  public status: RoomStatus;
  
  // Game State
  public puzzle: import("@sudoku/shared").SudokuPuzzle | null = null;
  public board: import("@sudoku/shared").SudokuGrid<import("@sudoku/shared").CellState> | null = null;
  public startedAt: number | null = null;
  public endedAt: number | null = null;
  public timeElapsed: number = 0;
  public moves: import("@sudoku/shared").Move[] = [];
  public activeChaosEvents: import("@sudoku/shared").ChaosEvent[] = [];
  private timerInterval: NodeJS.Timeout | null = null;
  private chaosInterval: NodeJS.Timeout | null = null;

  // Players mapped by playerId
  private playersMap: Map<string, Player> = new Map();
  // Timers mapped by playerId for reconnection
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(hostIdentity: PlayerIdentity, config: RoomConfig) {
    this.id = randomUUID();
    this.code = generateJoinCode();
    this.createdAt = Date.now();
    this.hostId = hostIdentity.id;
    this.config = config;
    this.status = "waiting";

    // Add host as the first player
    this.playersMap.set(hostIdentity.id, {
      identity: hostIdentity,
      status: "connected",
      isReady: true, // Host is always ready by default, or they can explicitly toggle
      score: 0,
      completedCells: 0,
      errorCount: 0,
      actionCards: [],
      joinedAt: this.createdAt,
    });
  }

  public playerBoards: Record<string, import("@sudoku/shared").SudokuGrid<import("@sudoku/shared").CellState>> = {};

  public getGameState(): import("@sudoku/shared").GameState | null {
    if (!this.puzzle || !this.board || this.startedAt === null) return null;
    
    // Clean up expired chaos events
    const now = Date.now();
    this.activeChaosEvents = this.activeChaosEvents.filter(e => e.expiresAt === null || e.expiresAt > now);

    return {
      puzzle: this.puzzle,
      board: this.board,
      playerBoards: this.playerBoards,
      phase: this.status === "playing" || this.status === "paused" || this.status === "finished" 
        ? this.status as "playing" | "paused" | "finished" 
        : "idle",
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      timeElapsed: this.timeElapsed,
      timeRemaining: this.config.timeLimit ? this.config.timeLimit - this.timeElapsed : null,
      players: Array.from(this.playersMap.values()),
      moves: this.moves,
      activeChaosEvents: this.activeChaosEvents,
      actionCardUses: [],
    };
  }

  public startGame(puzzle: import("@sudoku/shared").SudokuPuzzle): void {
    this.puzzle = puzzle;
    // Create initial board from puzzle clues
    const initialBoard = puzzle.clues.map(row => 
      row.map(val => ({
        value: val,
        given: val !== null,
        pencilMarks: [],
        isError: false,
        lockedBy: null
      }))
    ) as unknown as import("@sudoku/shared").SudokuGrid<import("@sudoku/shared").CellState>;

    this.board = initialBoard;

    if (this.config.gameMode === "competitive" || this.config.gameMode === "chaos") {
      this.playerBoards = {};
      for (const player of this.playersMap.keys()) {
        this.playerBoards[player] = initialBoard.map(row => 
          row.map(cell => ({ ...cell, pencilMarks: [] }))
        ) as unknown as import("@sudoku/shared").SudokuGrid<import("@sudoku/shared").CellState>;
      }
    } else {
      this.playerBoards = {};
    }

    this.status = "playing";
    this.startedAt = Date.now();
    this.timeElapsed = 0;
    this.moves = [];

    if (this.timerInterval) clearInterval(this.timerInterval);
    // Note: The socket layer will handle broadcasting the timer ticks
  }

  public stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public applyMove(playerId: string, draft: import("@sudoku/shared").MoveDraft): import("@sudoku/shared").MoveResult | null {
    if (this.status !== "playing" || !this.board || !this.puzzle) return null;
    
    const player = this.playersMap.get(playerId);
    if (!player) return null;

    const { row, col, type, value } = draft;
    
    // Determine which board to apply the move to
    const isPersonalBoard = this.config.gameMode === "competitive" || this.config.gameMode === "chaos";
    const targetBoard = isPersonalBoard ? this.playerBoards[playerId] : this.board;
    if (!targetBoard) return null;

    const cell = targetBoard[row][col];
    
    // Validate position and locked state
    if (cell.given || (!isPersonalBoard && cell.lockedBy && cell.lockedBy !== playerId)) {
      return null; 
    }

    // Prepare mutable cell for update
    const newCell = { ...cell, pencilMarks: [...cell.pencilMarks] };
    let pointsDelta = 0;
    let isValid: boolean | null = null;
    let puzzleComplete = false;

    if (type === "digit") {
      const correctValue = this.puzzle.solution[row][col];
      const isCorrect = correctValue === value;
      isValid = isCorrect;
      
      newCell.value = value;
      
      if (isCorrect) {
        (player as any).completedCells++;
        pointsDelta = 10;
        newCell.isError = false;
        if (!isPersonalBoard) {
          newCell.lockedBy = playerId;
        }

        if (this.config.actionCardsEnabled && player.completedCells % 5 === 0) {
          this.dispenseCard(playerId);
        }
      } else {
        (player as any).errorCount++;
        pointsDelta = -5;
        newCell.isError = true;
      }
    } else if (type === "erase") {
      newCell.value = null;
      newCell.isError = false;
    } else if (type === "pencil_add" && value !== null) {
      if (!newCell.pencilMarks.includes(value)) {
        newCell.pencilMarks.push(value);
        newCell.pencilMarks.sort();
      }
    } else if (type === "pencil_remove" && value !== null) {
      newCell.pencilMarks = newCell.pencilMarks.filter(v => v !== value);
    }

    // Apply mutation bypassing readonly safely
    const mutableBoard = targetBoard as unknown as import("@sudoku/shared").CellState[][];
    mutableBoard[row]![col] = newCell;

    // Check Win Condition
    let isWin = true;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (targetBoard[r]![c]!.value !== this.puzzle.solution[r]![c]!) {
          isWin = false;
          break;
        }
      }
      if (!isWin) break;
    }

    if (isWin) {
      this.status = "finished";
      this.endedAt = Date.now();
      this.stopTimer();
      puzzleComplete = true;
    }

    const moveResult: import("@sudoku/shared").MoveResult = {
      id: randomUUID(),
      playerId,
      type,
      row,
      col,
      value,
      timestamp: Date.now(),
      isValid,
      pointsDelta,
      puzzleComplete
    };

    // Note: To bypass readonly assignment block for score
    (player as any).score = Math.max(0, player.score + pointsDelta);
    this.playersMap.set(playerId, player);
    this.moves.push(moveResult);

    return moveResult;
  }
  
  private dispenseCard(playerId: string): void {
    const player = this.playersMap.get(playerId);
    if (!player) return;

    // Pick a random card type
    const cardTypes: import("@sudoku/shared").ActionCardType[] = ["reveal_cell", "freeze", "bomb", "shield"];
    const type = cardTypes[Math.floor(Math.random() * cardTypes.length)]!;

    // Max hand size = 3
    if (player.actionCards.length >= 3) return;

    const card: import("@sudoku/shared").ActionCard = {
      id: randomUUID(),
      type,
      receivedAt: Date.now()
    };

    (player as any).actionCards = [...player.actionCards, card];
    this.playersMap.set(playerId, player);
  }

  public useActionCard(
    playerId: string,
    use: Omit<import("@sudoku/shared").ActionCardUse, "timestamp">
  ): { ok: boolean; error?: string; useRecord?: import("@sudoku/shared").ActionCardUse; moveResult?: import("@sudoku/shared").MoveResult } {
    if (this.status !== "playing") return { ok: false, error: "Game not active" };
    
    const player = this.playersMap.get(playerId);
    if (!player) return { ok: false, error: "Player not found" };

    const cardIndex = player.actionCards.findIndex(c => c.id === use.cardId);
    if (cardIndex === -1) return { ok: false, error: "ACTION_CARD_NOT_HELD" };

    const card = player.actionCards[cardIndex]!;
    if (card.type !== use.cardType) return { ok: false, error: "Type mismatch" };

    // Remove the card from hand
    (player as any).actionCards = player.actionCards.filter(c => c.id !== use.cardId);
    this.playersMap.set(playerId, player);

    let moveResult: import("@sudoku/shared").MoveResult | undefined;

    // Helper to check and consume shield
    const consumeShield = (targetId: string): boolean => {
      const shieldIndex = this.activeChaosEvents.findIndex(e => e.type === "speed_boost" && e.affectedPlayerIds.includes(targetId));
      if (shieldIndex !== -1) {
        this.activeChaosEvents.splice(shieldIndex, 1);
        return true; // Shield consumed, block attack
      }
      return false;
    };

    // Apply the effect
    if (card.type === "reveal_cell" && use.targetCell) {
      const correctVal = this.puzzle!.solution[use.targetCell.row][use.targetCell.col]!;
      const result = this.applyMove(playerId, { type: "digit", row: use.targetCell.row, col: use.targetCell.col, value: correctVal });
      if (result) {
        moveResult = result;
      }
    } else if (card.type === "freeze" && use.targetPlayerId) {
      if (!consumeShield(use.targetPlayerId)) {
        this.activeChaosEvents.push({
        id: randomUUID(),
        type: "blind_zone", // Repurposing blind_zone as freeze to limit visual chaos complexity
        scope: "random",
        affectedPlayerIds: [use.targetPlayerId],
        triggeredAt: Date.now(),
        duration: 5,
        expiresAt: Date.now() + 5000
      });
      }
    } else if (card.type === "shield") {
      this.activeChaosEvents.push({
        id: randomUUID(),
        type: "speed_boost", // Repurposing as shield buff
        scope: "random",
        affectedPlayerIds: [playerId],
        triggeredAt: Date.now(),
        duration: 0,
        expiresAt: null
      });
    } else if (card.type === "bomb" && use.targetPlayerId) {
      if (!consumeShield(use.targetPlayerId)) {
        // Clear 3 random cells from target player's board
        const isPersonalBoard = this.config.gameMode === "competitive" || this.config.gameMode === "chaos";
        const targetBoard = isPersonalBoard ? this.playerBoards[use.targetPlayerId] : this.board;
        if (targetBoard) {
          let cleared = 0;
          const mutableBoard = targetBoard as unknown as import("@sudoku/shared").CellState[][];
          for (let i = 0; i < 81; i++) {
             const r = Math.floor(Math.random() * 9);
             const c = Math.floor(Math.random() * 9);
             const cell = mutableBoard[r]![c]!;
             if (!cell.given && cell.value !== null) {
                mutableBoard[r]![c] = { ...cell, value: null, isError: false };
                cleared++;
                if (cleared >= 3) break;
             }
          }
        }
      }
    }

    const useRecord: import("@sudoku/shared").ActionCardUse = {
      ...use,
      timestamp: Date.now()
    };

    const resultObj: { ok: boolean; useRecord: import("@sudoku/shared").ActionCardUse; moveResult?: import("@sudoku/shared").MoveResult } = { 
      ok: true, 
      useRecord 
    };
    if (moveResult) {
      resultObj.moveResult = moveResult;
    }

    return resultObj;
  }

  public getSnapshot(): import("@sudoku/shared").Room {
    return {
      id: this.id,
      code: this.code,
      hostId: this.hostId,
      config: this.config,
      players: Array.from(this.playersMap.values()),
      status: this.status,
      createdAt: this.createdAt,
    };
  }

  public getPlayer(playerId: string): Player | undefined {
    return this.playersMap.get(playerId);
  }

  public hasPlayer(playerId: string): boolean {
    return this.playersMap.has(playerId);
  }

  public addPlayer(identity: PlayerIdentity): boolean {
    if (this.playersMap.has(identity.id)) {
      return false; // Already in room
    }
    
    if (this.playersMap.size >= this.config.maxPlayers) {
      return false; // Room full
    }

    if (this.status !== "waiting" && !this.config.allowSpectators) {
      return false; // Cannot join in progress
    }

    this.playersMap.set(identity.id, {
      identity,
      status: "connected",
      isReady: false,
      score: 0,
      completedCells: 0,
      errorCount: 0,
      actionCards: [],
      joinedAt: Date.now(),
    });

    return true;
  }

  public removePlayer(playerId: string): void {
    this.playersMap.delete(playerId);
    this.clearDisconnectTimer(playerId);

    // If host leaves, promote another player or handle room destruction later
    if (this.hostId === playerId && this.playersMap.size > 0) {
      const nextHost = this.playersMap.values().next().value;
      if (nextHost) {
        this.hostId = nextHost.identity.id;
      }
    }
  }

  public setPlayerReady(playerId: string, isReady: boolean): void {
    const player = this.playersMap.get(playerId);
    if (player) {
      this.playersMap.set(playerId, { ...player, isReady });
    }
  }

  public handleDisconnect(playerId: string, onRemove: () => void): void {
    const player = this.playersMap.get(playerId);
    if (!player) return;

    // Update status
    this.playersMap.set(playerId, { ...player, status: "disconnected" });

    // 30 second grace period
    const timer = setTimeout(() => {
      this.removePlayer(playerId);
      onRemove();
    }, 30000);

    this.disconnectTimers.set(playerId, timer);
  }

  public handleReconnect(playerId: string): void {
    const player = this.playersMap.get(playerId);
    if (!player) return;

    this.clearDisconnectTimer(playerId);
    this.playersMap.set(playerId, { ...player, status: "connected" });
  }

  private clearDisconnectTimer(playerId: string): void {
    const timer = this.disconnectTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(playerId);
    }
  }

  public updateConfig(newConfig: Partial<RoomConfig>): void {
    if (this.status !== "waiting") return; // Can only change before game starts
    this.config = { ...this.config, ...newConfig };
  }

  public allPlayersReady(): boolean {
    const players = Array.from(this.playersMap.values());
    return players.length > 0 && players.every(p => p.isReady || p.status === "disconnected");
  }

  public setStatus(status: RoomStatus): void {
    this.status = status;
  }

  public isEmpty(): boolean {
    return this.playersMap.size === 0;
  }

  public cleanup(): void {
    for (const timer of this.disconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.disconnectTimers.clear();
  }
}
