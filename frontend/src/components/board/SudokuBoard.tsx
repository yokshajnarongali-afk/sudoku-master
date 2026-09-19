import React from "react";
import type { CellState, RowIndex, ColIndex, SudokuGrid } from "@sudoku/shared";
import { SudokuCell } from "./SudokuCell";

interface SudokuBoardProps {
  grid: SudokuGrid<CellState>;
  selectedCells: Set<string>; // Set of "row-col" strings
  onCellClick: (r: RowIndex, c: ColIndex, shiftKey: boolean) => void;
}

/** Check if two cells are peers (same row, col, or 3x3 box) */
function isPeer(r1: number, c1: number, r2: number, c2: number): boolean {
  if (r1 === r2 && c1 === c2) return false;
  if (r1 === r2 || c1 === c2) return true;
  const b1 = Math.floor(r1 / 3) * 3 + Math.floor(c1 / 3);
  const b2 = Math.floor(r2 / 3) * 3 + Math.floor(c2 / 3);
  return b1 === b2;
}

export const SudokuBoard: React.FC<SudokuBoardProps> = ({
  grid,
  selectedCells,
  onCellClick
}) => {
  // If exactly one cell is selected, we highlight its peers
  const singleSelection = selectedCells.size === 1 ? Array.from(selectedCells)[0] : null;
  const [selR, selC] = singleSelection 
    ? singleSelection.split("-").map(Number) as [RowIndex, ColIndex]
    : [null, null];

  return (
    <div 
      className="bg-slate-800 p-3 sm:p-5 md:p-6 rounded-[12px] shadow-2xl flex flex-col items-center select-none touch-none"
    >
      {/* 
        The board surface uses gaps to create the grid lines.
        bg-slate-500 creates the 2px box borders.
        bg-slate-600 inside the boxes creates the 1px cell borders.
      */}
      <div 
        role="grid"
        aria-label="Sudoku Board"
        className="grid grid-cols-3 gap-[2px] bg-slate-500 border-2 border-slate-500 rounded-md overflow-hidden"
      >
        
        {Array.from({ length: 9 }).map((_, boxIdx) => {
          const startRow = Math.floor(boxIdx / 3) * 3;
          const startCol = (boxIdx % 3) * 3;

          return (
            <div key={boxIdx} className="grid grid-cols-3 gap-[1px] bg-slate-600">
              {Array.from({ length: 9 }).map((_, innerIdx) => {
                const r = (startRow + Math.floor(innerIdx / 3)) as RowIndex;
                const c = (startCol + (innerIdx % 3)) as ColIndex;
                const cell = grid[r][c];
                const cellId = `${r}-${c}`;
                const isSelected = selectedCells.has(cellId);
                
                const isPeerSelected = selR !== null && selC !== null 
                  ? isPeer(r, c, selR, selC) 
                  : false;

                return (
                  <SudokuCell
                    key={cellId}
                    cell={cell}
                    row={r}
                    col={c}
                    isSelected={isSelected}
                    isPeerSelected={isPeerSelected}
                    onClick={onCellClick}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
