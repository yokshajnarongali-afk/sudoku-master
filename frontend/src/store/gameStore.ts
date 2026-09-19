import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";
import type { 
  SudokuPuzzle, 
  SudokuGrid, 
  CellState, 
  CellDigit, 
  RowIndex, 
  ColIndex, 
  GamePhase 
} from "@sudoku/shared";
import { updateGridErrors, checkWinCondition } from "../engine/game/validation";

// Maximum history size for undo/redo
const MAX_HISTORY = 50;

interface GameState {
  // Data
  puzzle: SudokuPuzzle | null;
  board: SudokuGrid<CellState> | null;
  phase: GamePhase;
  timer: number;
  mistakes: number;
  
  // History for Undo/Redo
  history: SudokuGrid<CellState>[];
  historyIndex: number;

  // Actions
  startGame: (puzzle: SudokuPuzzle) => void;
  placeDigit: (r: RowIndex, c: ColIndex, d: CellDigit) => void;
  eraseCell: (r: RowIndex, c: ColIndex) => void;
  togglePencilMark: (r: RowIndex, c: ColIndex, d: CellDigit) => void;
  clearPencilMarks: (r: RowIndex, c: ColIndex) => void;
  useHint: () => void;
  undo: () => void;
  redo: () => void;
  incrementTimer: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  abandonGame: () => void;
}

/**
 * Initialize a new board from a puzzle's clues.
 */
function createInitialBoard(puzzle: SudokuPuzzle): SudokuGrid<CellState> {
  return puzzle.clues.map(row => 
    row.map(val => ({
      value: val,
      given: val !== null,
      pencilMarks: [],
      isError: false,
      lockedBy: null
    }))
  ) as unknown as SudokuGrid<CellState>;
}

// Custom IDB storage adapter for Zustand
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window === "undefined") return null;
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window === "undefined") return;
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof window === "undefined") return;
    await del(name);
  },
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      puzzle: null,
      board: null,
      phase: "idle",
      timer: 0,
      mistakes: 0,
      history: [],
      historyIndex: -1,

      startGame: (puzzle) => {
        const initialBoard = createInitialBoard(puzzle);
        set({
          puzzle,
          board: initialBoard,
          phase: "playing",
          timer: 0,
          mistakes: 0,
          history: [initialBoard],
          historyIndex: 0,
        });
      },

      placeDigit: (r, c, d) => {
        const { board, puzzle, history, historyIndex, phase, mistakes } = get();
        if (phase !== "playing" || !board || !puzzle) return;

        const cell = board[r][c];
        if (cell.given || cell.value === d) return;

        // Check against solution for mistake tracking
        const isCorrect = puzzle.solution[r][c] === d;
        const newMistakes = isCorrect ? mistakes : mistakes + 1;

        // Clone board
        const newBoard = board.map(row => [...row]) as unknown as CellState[][];
        newBoard[r]![c] = { ...cell, value: d };

        // Validate
        const validatedBoard = updateGridErrors(newBoard as unknown as SudokuGrid<CellState>);
        
        // Update history
        const newHistory = [...history.slice(0, historyIndex + 1), validatedBoard].slice(-MAX_HISTORY);
        const newIndex = newHistory.length - 1;

        // Check win
        const isWin = checkWinCondition(validatedBoard, puzzle.solution);

        import("@/engine/audio/AudioManager").then(({ AudioManager }) => {
          if (isWin) AudioManager.getInstance().playWin();
          else AudioManager.getInstance().playDigitPlace(isCorrect);
        });

        set({
          board: validatedBoard,
          history: newHistory,
          historyIndex: newIndex,
          phase: isWin ? "finished" : "playing",
          mistakes: newMistakes,
        });
      },

      useHint: () => {
        const { board, puzzle, phase } = get();
        if (phase !== "playing" || !board || !puzzle) return;

        // Find all empty cells
        const emptyCells: {r: RowIndex, c: ColIndex}[] = [];
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            if (board[r]![c]!.value === null) {
              emptyCells.push({ r: r as RowIndex, c: c as ColIndex });
            }
          }
        }
        
        if (emptyCells.length === 0) return;
        
        // Pick a random empty cell
        const target = emptyCells[Math.floor(Math.random() * emptyCells.length)]!;
        const correctDigit = puzzle.solution[target.r][target.c] as CellDigit;
        
        // Place the correct digit using existing action
        get().placeDigit(target.r, target.c, correctDigit);
      },

      eraseCell: (r, c) => {
        const { board, puzzle, history, historyIndex, phase } = get();
        if (phase !== "playing" || !board || !puzzle) return;

        const cell = board[r][c];
        if (cell.given) return;
        if (cell.value === null && cell.pencilMarks.length === 0) return; // Nothing to erase

        const newBoard = board.map(row => [...row]) as unknown as CellState[][];
        
        if (cell.value !== null) {
          newBoard[r]![c] = { ...cell, value: null };
        } else {
          newBoard[r]![c] = { ...cell, pencilMarks: [] };
        }

        const validatedBoard = updateGridErrors(newBoard as unknown as SudokuGrid<CellState>);
        const newHistory = [...history.slice(0, historyIndex + 1), validatedBoard].slice(-MAX_HISTORY);

        set({
          board: validatedBoard,
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });

        import("@/engine/audio/AudioManager").then(({ AudioManager }) => AudioManager.getInstance().playErase());
      },

      togglePencilMark: (r, c, d) => {
        const { board, history, historyIndex, phase } = get();
        if (phase !== "playing" || !board) return;

        const cell = board[r][c];
        if (cell.given || cell.value !== null) return; // Cannot pencil if cell is filled

        const newBoard = board.map(row => [...row]) as unknown as CellState[][];
        const marks = new Set(cell.pencilMarks);
        if (marks.has(d)) marks.delete(d);
        else marks.add(d);

        newBoard[r]![c] = {
          ...cell,
          pencilMarks: Array.from(marks).sort() as CellDigit[]
        };

        const finalBoard = newBoard as unknown as SudokuGrid<CellState>;
        const newHistory = [...history.slice(0, historyIndex + 1), finalBoard].slice(-MAX_HISTORY);

        set({
          board: finalBoard,
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });

        import("@/engine/audio/AudioManager").then(({ AudioManager }) => AudioManager.getInstance().playSelect());
      },

      clearPencilMarks: (r, c) => {
        const { board, history, historyIndex, phase } = get();
        if (phase !== "playing" || !board) return;

        const cell = board[r][c];
        if (cell.given || cell.pencilMarks.length === 0) return;

        const newBoard = board.map(row => [...row]) as unknown as CellState[][];
        newBoard[r]![c] = { ...cell, pencilMarks: [] };

        const finalBoard = newBoard as unknown as SudokuGrid<CellState>;
        const newHistory = [...history.slice(0, historyIndex + 1), finalBoard].slice(-MAX_HISTORY);

        set({
          board: finalBoard,
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      undo: () => {
        const { history, historyIndex, phase } = get();
        if (phase !== "playing") return;
        if (historyIndex > 0) {
          set({
            historyIndex: historyIndex - 1,
            board: history[historyIndex - 1]!
          });
        }
      },

      redo: () => {
        const { history, historyIndex, phase } = get();
        if (phase !== "playing") return;
        if (historyIndex < history.length - 1) {
          set({
            historyIndex: historyIndex + 1,
            board: history[historyIndex + 1]!
          });
        }
      },

      incrementTimer: () => {
        const { phase, timer } = get();
        if (phase === "playing") {
          set({ timer: timer + 1 });
        }
      },

      pauseGame: () => {
        const { phase } = get();
        if (phase === "playing") set({ phase: "paused" });
      },

      resumeGame: () => {
        const { phase } = get();
        if (phase === "paused") set({ phase: "playing" });
      },

      abandonGame: () => {
        set({
          puzzle: null,
          board: null,
          phase: "idle",
          timer: 0,
          history: [],
          historyIndex: -1,
        });
      }
    }),
    {
      name: "sudoku-master-save",
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        puzzle: state.puzzle,
        board: state.board,
        phase: state.phase,
        timer: state.timer,
        mistakes: state.mistakes,
        history: state.history,
        historyIndex: state.historyIndex,
      }),
    }
  )
);
