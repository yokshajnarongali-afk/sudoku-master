import React from "react";
import type { CellState, RowIndex, ColIndex } from "@sudoku/shared";

interface SudokuCellProps {
  cell: CellState;
  row: RowIndex;
  col: ColIndex;
  isSelected: boolean;
  isPeerSelected?: boolean;
  onClick: (r: RowIndex, c: ColIndex, shiftKey: boolean) => void;
}

const PENCIL_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const SudokuCell: React.FC<SudokuCellProps> = React.memo(({
  cell,
  row,
  col,
  isSelected,
  isPeerSelected,
  onClick
}) => {
  const handleClick = (e: React.MouseEvent) => {
    // Only standard left click or shift+left click
    if (e.button === 0) {
      e.preventDefault();
      onClick(row, col, e.shiftKey);
    }
  };

  // Determine cell background and text styling
  let bgClass = cell.given ? "bg-slate-600" : "bg-slate-700";
  
  if (isSelected) {
    // Selection ring overrides background slightly to make it pop, or just rely on ring
    // We'll keep the base bg and add the ring
  } else if (isPeerSelected) {
    // Highlight cells in the same row/col/box as the selected cell
    bgClass = cell.given ? "bg-slate-500/80" : "bg-slate-600/80";
  }

  // Error overlay
  const errorClass = cell.isError ? "bg-red-500/20" : "";

  // Selection ring
  const ringClass = isSelected ? "ring-2 ring-inset ring-indigo-500 z-10" : "";

  // Player Lock Ring
  const getLockColorClass = (id: string) => {
    // Deterministic ring color based on ID length/characters
    const colors = ["ring-rose-500", "ring-emerald-500", "ring-cyan-500", "ring-fuchsia-500", "ring-amber-500"];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const lockRingClass = cell.lockedBy ? `ring-2 ring-inset ${getLockColorClass(cell.lockedBy)} z-10 shadow-[0_0_8px_rgba(0,0,0,0.5)]` : "";

  // Combine rings (selection takes precedence visually if both exist, though locked cells can't be modified)
  const combinedRings = isSelected ? ringClass : lockRingClass;

  const finalTextColor = cell.given 
    ? "text-slate-50 font-bold sm:text-2xl text-xl"
    : cell.isError
      ? "text-red-400 sm:text-2xl text-xl"
      : cell.lockedBy 
        ? "text-slate-200 sm:text-2xl text-xl font-medium" // Slightly distinct if locked by a player
        : "text-slate-50 sm:text-2xl text-xl";

  const ariaLabel = cell.value !== null
    ? `${cell.isError ? "Incorrect " : ""}${cell.value} at row ${row + 1} column ${col + 1}`
    : `Empty cell at row ${row + 1} column ${col + 1}${cell.pencilMarks.length > 0 ? `, pencil marks ${cell.pencilMarks.join(", ")}` : ""}`;

  return (
    <div
      role="gridcell"
      aria-label={ariaLabel}
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
      onMouseDown={handleClick}
      className={`
        relative flex items-center justify-center 
        w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 
        rounded-sm cursor-pointer select-none transition-colors
        ${bgClass} ${combinedRings}
      `}
    >
      {/* Error tint overlay */}
      {cell.isError && (
        <div className="absolute inset-0 bg-red-500/20 rounded-sm pointer-events-none" />
      )}

      {/* Main digit */}
      {cell.value !== null ? (
        <span className={`relative z-0 ${finalTextColor} leading-none`}>
          {cell.value}
        </span>
      ) : (
        /* Pencil marks mini-grid */
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-0.5 sm:p-1 pointer-events-none">
          {PENCIL_DIGITS.map(d => (
            <div key={d} className="flex items-center justify-center text-[10px] sm:text-[12px] text-slate-400 leading-none">
              {cell.pencilMarks.includes(d) ? d : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

SudokuCell.displayName = "SudokuCell";
