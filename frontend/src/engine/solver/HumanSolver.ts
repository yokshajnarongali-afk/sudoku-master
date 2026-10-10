import { SudokuGrid, CellState, CellDigit, RowIndex, ColIndex } from "@sudoku/shared";

export type Hint = {
  strategy: string;
  cells: { row: RowIndex; col: ColIndex }[];
  text: string;
};

export class HumanSolver {
  private grid: SudokuGrid<CellState>;

  constructor(grid: SudokuGrid<CellState>) {
    this.grid = grid;
  }

  public getHint(): Hint | null {
    // 1. Look for Naked Single (a cell with only one possible valid digit)
    const nakedSingle = this.findNakedSingle();
    if (nakedSingle) return nakedSingle;

    // 2. Look for Hidden Single (a digit that can only go in one cell in a row/col/box)
    const hiddenSingle = this.findHiddenSingle();
    if (hiddenSingle) return hiddenSingle;

    // Add more advanced human strategies here...

    return null;
  }

  private findNakedSingle(): Hint | null {
    // Iterate all empty cells
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.grid[r]![c]!.value === null) {
          const possibilities = this.getPossibilities(r as RowIndex, c as ColIndex);
          if (possibilities.length === 1) {
            return {
              strategy: "Naked Single",
              cells: [{ row: r as RowIndex, col: c as ColIndex }],
              text: `Look closely at Row ${r + 1}, Col ${c + 1}. There is only one possible number that can fit here based on intersecting rules!`
            };
          }
        }
      }
    }
    return null;
  }

  private findHiddenSingle(): Hint | null {
    for (let box = 0; box < 9; box++) {
      for (let digit = 1; digit <= 9; digit++) {
        const possibleCells = [];
        const startRow = Math.floor(box / 3) * 3;
        const startCol = (box % 3) * 3;
        
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const row = (startRow + r) as RowIndex;
            const col = (startCol + c) as ColIndex;
            if (this.grid[row]![col]!.value === null && this.canPlace(row, col, digit as CellDigit)) {
              possibleCells.push({ row, col });
            }
          }
        }
        
        if (possibleCells.length === 1) {
          return {
            strategy: "Hidden Single",
            cells: [possibleCells[0]!],
            text: `Focus on Box ${box + 1}. Where can the number ${digit} go? There's only one valid empty cell left for it!`
          };
        }
      }
    }
    return null;
  }

  private getPossibilities(r: RowIndex, c: ColIndex): CellDigit[] {
    const p: CellDigit[] = [];
    for (let i = 1; i <= 9; i++) {
      if (this.canPlace(r, c, i as CellDigit)) p.push(i as CellDigit);
    }
    return p;
  }

  private canPlace(r: RowIndex, c: ColIndex, v: CellDigit): boolean {
    // Check row & col
    for (let i = 0; i < 9; i++) {
      if (this.grid[r]![i]!.value === v) return false;
      if (this.grid[i]![c]!.value === v) return false;
    }
    // Check box
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (this.grid[br + i]![bc + j]!.value === v) return false;
      }
    }
    return true;
  }
}
