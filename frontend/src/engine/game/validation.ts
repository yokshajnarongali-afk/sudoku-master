import type { CellState, SudokuGrid, SudokuPuzzle } from "@sudoku/shared";

/**
 * Re-evaluates conflict errors for the entire grid.
 * Returns a new grid if errors changed, otherwise mutates a copy and returns it.
 * (We create a full deep copy of the rows to ensure immutable state updates).
 */
export function updateGridErrors(currentGrid: SudokuGrid<CellState>): SudokuGrid<CellState> {
  const newGrid = currentGrid.map(row => [...row]) as unknown as CellState[][];
  
  // Clear old errors
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      newGrid[r]![c] = { ...newGrid[r]![c]!, isError: false };
    }
  }

  // Find conflicts
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = newGrid[r]![c]!.value;
      if (val === null) continue;
      
      let conflict = false;
      
      // Row & Col
      for (let i = 0; i < 9; i++) {
        if (i !== c && newGrid[r]![i]!.value === val) conflict = true;
        if (i !== r && newGrid[i]![c]!.value === val) conflict = true;
      }
      
      // Box
      const startR = Math.floor(r / 3) * 3;
      const startC = Math.floor(c / 3) * 3;
      for (let br = 0; br < 3; br++) {
        for (let bc = 0; bc < 3; bc++) {
          const rr = startR + br;
          const cc = startC + bc;
          if ((rr !== r || cc !== c) && newGrid[rr]![cc]!.value === val) {
            conflict = true;
          }
        }
      }

      if (conflict) {
        newGrid[r]![c] = { ...newGrid[r]![c]!, isError: true };
      }
    }
  }

  return newGrid as unknown as SudokuGrid<CellState>;
}

/**
 * Checks if the current board is fully filled and matches the solution exactly.
 */
export function checkWinCondition(board: SudokuGrid<CellState>, solution: SudokuGrid<import("@sudoku/shared").CellValue>): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cellVal = board[r]![c]!.value;
      const solVal = solution[r]![c]!;
      if (cellVal === null || cellVal !== solVal) {
        return false;
      }
    }
  }
  return true;
}
