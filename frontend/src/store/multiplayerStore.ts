import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Room, PlayerIdentity, CreateRoomPayload, JoinRoomPayload, UpdateRoomConfigPayload, AckResult, GameState, StartGamePayload, MoveDraft, MoveResult } from "@sudoku/shared";
import { initializeSocket, getSocket } from "../lib/socket";

interface MultiplayerState {
  // Local Player Identity
  identity: PlayerIdentity | null;
  
  // Connection State
  isConnected: boolean;
  error: string | null;

  // Room State
  currentRoom: Room | null;
  gameState: GameState | null;

  // Actions
  setIdentity: (displayName: string) => void;
  connect: () => void;
  createRoom: (payload: CreateRoomPayload) => Promise<AckResult<Room>>;
  joinRoom: (payload: JoinRoomPayload) => Promise<AckResult<Room>>;
  leaveRoom: () => void;
  kickPlayer: (targetPlayerId: string) => void;
  transferHost: (targetPlayerId: string) => void;
  toggleReady: (isReady: boolean) => void;
  updateConfig: (payload: UpdateRoomConfigPayload) => void;
  startGame: (payload: StartGamePayload) => Promise<AckResult<GameState>>;
  emitMove: (draft: MoveDraft) => Promise<AckResult<MoveResult>>;
  useActionCard: (use: Omit<import("@sudoku/shared").ActionCardUse, "timestamp">) => Promise<AckResult<import("@sudoku/shared").ActionCardUse>>;
  
  activeTargetCardId: string | null;
  setActiveTargetCardId: (id: string | null) => void;
}

// Generate UUID fallback for browser
function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15);
}

export const useMultiplayerStore = create<MultiplayerState>()(
  persist(
    (set, get) => ({
      identity: null,
      isConnected: false,
      error: null,
      currentRoom: null,
      gameState: null,
      activeTargetCardId: null,

      setActiveTargetCardId: (id) => set({ activeTargetCardId: id }),

      setIdentity: (displayName: string) => {
        const current = get().identity;
        const newIdentity = {
          id: current?.id || generateId(),
          displayName,
          ...(current?.avatarUrl ? { avatarUrl: current.avatarUrl } : {})
        };
        
        set({ identity: newIdentity as PlayerIdentity });
      },

      connect: () => {
        const { identity, isConnected } = get();
        if (!identity || isConnected) return;

        const socket = initializeSocket(identity);

        // Bind core lifecycle events exactly once
        socket.off("connect");
        socket.off("disconnect");
        socket.off("room:updated");
        socket.off("error");
        socket.off("game:state");
        socket.off("game:action_card_used");
        socket.off("game:move_result");

        socket.on("connect", () => set({ isConnected: true, error: null }));
        socket.on("disconnect", () => set({ isConnected: false }));
        
        socket.on("room:updated", (room) => {
          set({ currentRoom: room });
        });

        socket.on("game:state", (state) => {
          set({ gameState: state });
        });

        socket.on("game:action_card_used", () => {
          import("@/engine/audio/AudioManager").then(({ AudioManager }) => {
            AudioManager.getInstance().playCardUse();
          });
        });

        socket.on("game:move_result", (result) => {
          // Mutate the local board state optimistically/authoritatively
          const { gameState, currentRoom } = get();
          if (!gameState || !currentRoom) return;
          
          const isPersonalBoard = currentRoom.config.gameMode === "competitive" || currentRoom.config.gameMode === "chaos";
          const { row, col, type, value, isValid, playerId } = result;

          // Target board to clone and mutate
          const targetBoardSource = isPersonalBoard ? gameState.playerBoards[playerId] : gameState.board;
          if (!targetBoardSource) return;

          const newBoard = [...targetBoardSource] as unknown as import("@sudoku/shared").CellState[][];
          
          const newRow = [...newBoard[row]!];
          const oldCell = newRow[col]!;
          const newCell = { ...oldCell, pencilMarks: [...oldCell.pencilMarks] };
          
          if (type === "digit") {
            newCell.value = value;
            if (isValid) {
              newCell.isError = false;
              if (!isPersonalBoard) {
                newCell.lockedBy = playerId;
              }
            } else {
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

          newRow[col] = newCell;
          newBoard[row] = newRow;

          const typedNewBoard = newBoard as unknown as typeof gameState.board;

          // Update player stats
          const updatedPlayers = gameState.players.map(p => {
            if (p.identity.id === playerId) {
              return {
                ...p,
                score: Math.max(0, p.score + (result.pointsDelta || 0)),
                completedCells: type === "digit" && isValid ? p.completedCells + 1 : p.completedCells,
                errorCount: type === "digit" && !isValid ? p.errorCount + 1 : p.errorCount
              };
            }
            return p;
          });

          const myId = get().identity?.id;
          import("@/engine/audio/AudioManager").then(({ AudioManager }) => {
            const am = AudioManager.getInstance();
            if (type === "digit") {
               if (playerId === myId || !isPersonalBoard) {
                 am.playDigitPlace(!!isValid);
               }
            } else if (type === "erase") {
               if (playerId === myId || !isPersonalBoard) am.playErase();
            } else if (type.startsWith("pencil")) {
               if (playerId === myId || !isPersonalBoard) am.playSelect();
            }
          });

          set({
            gameState: {
              ...gameState,
              board: isPersonalBoard ? gameState.board : typedNewBoard,
              playerBoards: isPersonalBoard ? {
                ...gameState.playerBoards,
                [playerId]: typedNewBoard
              } : gameState.playerBoards,
              players: updatedPlayers,
              moves: [...gameState.moves, result]
            }
          });
        });

        socket.on("error", (err) => {
          set({ error: err.message });
        });
      },

      createRoom: async (payload) => {
        const socket = getSocket();
        return new Promise((resolve) => {
          socket.emit("room:create", payload, (result) => {
            if (result.ok) set({ currentRoom: result.data, error: null });
            else set({ error: result.error.message });
            resolve(result);
          });
        });
      },

      joinRoom: async (payload) => {
        const socket = getSocket();
        return new Promise((resolve) => {
          socket.emit("room:join", payload, (result) => {
            if (result.ok) set({ currentRoom: result.data, error: null });
            else set({ error: result.error.message });
            resolve(result);
          });
        });
      },

      leaveRoom: () => {
        try {
          const socket = getSocket();
          socket.emit("room:leave");
        } catch {
          // socket may not be initialized if user navigated back before connecting
        }
        set({ currentRoom: null, gameState: null });
      },

      kickPlayer: (targetPlayerId) => {
        try { getSocket().emit("room:kick", { targetPlayerId }); } catch {}
      },

      transferHost: (targetPlayerId) => {
        try { getSocket().emit("room:transfer_host", { targetPlayerId }); } catch {}
      },

      toggleReady: (isReady: boolean) => {
        try { getSocket().emit("room:ready", isReady); } catch {}
      },

      updateConfig: (payload: UpdateRoomConfigPayload) => {
        try { getSocket().emit("room:update_config", payload); } catch {}
      },

      startGame: async (payload) => {
        const socket = getSocket();
        return new Promise((resolve) => {
          socket.emit("game:start", payload, (result) => {
            if (result.ok) set({ gameState: result.data, error: null });
            else set({ error: result.error.message });
            resolve(result);
          });
        });
      },

      emitMove: async (draft) => {
        const socket = getSocket();
        return new Promise((resolve) => {
          socket.emit("game:move", draft, (result) => {
            if (!result.ok) set({ error: result.error.message });
            resolve(result);
          });
        });
      },

      useActionCard: async (use) => {
        const socket = getSocket();
        return new Promise((resolve) => {
          socket.emit("game:use_action_card", use, (result) => {
            if (!result.ok) set({ error: result.error.message });
            resolve(result);
          });
        });
      }
    }),
    {
      name: "sudoku-multiplayer-save",
      // Only persist the player identity so they don't lose their username
      partialize: (state) => ({ identity: state.identity }),
    }
  )
);
