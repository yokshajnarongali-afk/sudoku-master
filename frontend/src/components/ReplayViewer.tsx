import React, { useEffect, useState, useRef } from "react";
import type { MoveResult, SudokuGrid, CellState } from "@sudoku/shared";
import { SudokuBoard } from "./board/SudokuBoard";

interface ReplayViewerProps {
  initialBoard: SudokuGrid<CellState>;
  moves: MoveResult[];
  onClose: () => void;
}

export const ReplayViewer: React.FC<ReplayViewerProps> = ({ initialBoard, moves, onClose }) => {
  const [board, setBoard] = useState<SudokuGrid<CellState>>(initialBoard);
  const [moveIndex, setMoveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    
    if (moveIndex >= moves.length) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      const move = moves[moveIndex]!;
      setBoard(prev => {
        const next = [...prev] as unknown as CellState[][];
        const newRow = [...next[move.row]!];
        
        // If it's a digit place, apply it
        if (move.value !== null && move.isValid) {
          newRow[move.col] = { ...newRow[move.col]!, value: move.value, lockedBy: move.playerId };
        } else if (move.value === null) {
          // erase
          newRow[move.col] = { ...newRow[move.col]!, value: null, lockedBy: null };
        }

        next[move.row] = newRow;
        return next as unknown as SudokuGrid<CellState>;
      });
      setMoveIndex(i => i + 1);
    }, 100);

    return () => clearTimeout(timer);
  }, [isPlaying, moveIndex, moves]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 animate-in fade-in">
      <h2 className="text-2xl font-black text-indigo-400 mb-4 tracking-widest uppercase">Match Replay</h2>
      <div className="pointer-events-none mb-6">
        <SudokuBoard 
          grid={board}
          selectedCells={new Set()}
          onCellClick={() => {}}
        />
      </div>
      <div className="flex gap-4">
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold transition-all shadow-lg"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button 
          onClick={onClose}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold transition-all"
        >
          Close Replay
        </button>
      </div>
    </div>
  );
};
