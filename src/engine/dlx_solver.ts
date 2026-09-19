// src/engine/dlx_solver.ts

class DLXNode {
  left: DLXNode = this;
  right: DLXNode = this;
  up: DLXNode = this;
  down: DLXNode = this;
  column!: ColumnNode;
  rowIndex: number = -1;
}

class ColumnNode extends DLXNode {
  size: number = 0;
  name: number = 0;
}

export class DLXSolver {
  private header: ColumnNode;
  private columns: ColumnNode[];

  constructor() {
    this.header = new ColumnNode();
    this.columns = [];
    this.buildMatrix();
  }

  /**
   * Builds the 729 x 324 exact cover matrix linked lists.
   */
  private buildMatrix(): void {
    this.header = new ColumnNode();
    let prev: DLXNode = this.header;

    // Create 324 constraint columns
    for (let i = 0; i < 324; i++) {
      const col = new ColumnNode();
      col.name = i;
      col.left = prev;
      col.right = this.header;
      prev.right = col;
      this.header.left = col;
      col.column = col;
      this.columns.push(col);
      prev = col;
    }

    // Create 729 candidate rows (81 cells * 9 digits)
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        for (let d = 1; d <= 9; d++) {
          const rowIndex = r * 81 + c * 9 + (d - 1);
          const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);

          // 4 Constraint column indices
          const cellConstraint = r * 9 + c;                  // 0..80
          const rowConstraint = 81 + r * 9 + (d - 1);         // 81..161
          const colConstraint = 162 + c * 9 + (d - 1);        // 162..242
          const boxConstraint = 243 + b * 9 + (d - 1);        // 243..323

          const constraints = [cellConstraint, rowConstraint, colConstraint, boxConstraint];
          let rowPrev: DLXNode | null = null;

          for (const colIdx of constraints) {
            const colNode = this.columns[colIdx];
            const newNode = new DLXNode();
            newNode.rowIndex = rowIndex;
            newNode.column = colNode;

            // Vertical link insertion
            newNode.up = colNode.up;
            newNode.down = colNode;
            colNode.up.down = newNode;
            colNode.up = newNode;
            colNode.size++;

            // Horizontal link insertion
            if (!rowPrev) {
              newNode.left = newNode;
              newNode.right = newNode;
              rowPrev = newNode;
            } else {
              newNode.left = rowPrev;
              newNode.right = rowPrev.right;
              rowPrev.right.left = newNode;
              rowPrev.right = newNode;
              rowPrev = newNode;
            }
          }
        }
      }
    }
  }

  /**
   * Unlinks a column and all connected rows from the matrix.
   */
  private cover(col: ColumnNode): void {
    col.right.left = col.left;
    col.left.right = col.right;

    for (let row = col.down; row !== col; row = row.down) {
      for (let node = row.right; node !== row; node = node.right) {
        node.down.up = node.up;
        node.up.down = node.down;
        node.column.size--;
      }
    }
  }

  /**
   * Relinks a column and its connected rows back into the matrix.
   */
  private uncover(col: ColumnNode): void {
    for (let row = col.up; row !== col; row = row.up) {
      for (let node = row.left; node !== row; node = node.left) {
        node.column.size++;
        node.down.up = node;
        node.up.down = node;
      }
    }
    col.right.left = col;
    col.left.right = col;
  }

  /**
   * Selects the column header with the minimum number of active nodes.
   */
  private chooseColumn(): ColumnNode {
    let minCol = this.header.right as ColumnNode;
    let minSize = Infinity;

    for (let col = this.header.right as ColumnNode; col !== this.header; col = col.right as ColumnNode) {
      if (col.size < minSize) {
        minSize = col.size;
        minCol = col;
      }
    }

    return minCol;
  }

  /**
   * Recursive depth-first search to find exact cover solutions.
   */
  private search(currentSolution: number[], solutions: number[][], maxSolutions: number): void {
    if (solutions.length >= maxSolutions) return;

    if (this.header.right === this.header) {
      solutions.push([...currentSolution]);
      return;
    }

    const col = this.chooseColumn();
    if (col.size === 0) return;

    this.cover(col);

    for (let row = col.down; row !== col; row = row.down) {
      currentSolution.push(row.rowIndex);

      for (let node = row.right; node !== row; node = node.right) {
        this.cover(node.column);
      }

      this.search(currentSolution, solutions, maxSolutions);

      currentSolution.pop();

      for (let node = row.left; node !== row; node = node.left) {
        this.uncover(node.column);
      }

      if (solutions.length >= maxSolutions) break;
    }

    this.uncover(col);
  }

  private findRowNode(rowIndex: number): DLXNode | null {
    const cellIdx = Math.floor(rowIndex / 9);
    const colNode = this.columns[cellIdx];
    for (let node = colNode.down; node !== colNode; node = node.down) {
      if (node.rowIndex === rowIndex) return node;
    }
    return null;
  }

  private coverRow(rowNode: DLXNode): void {
    this.cover(rowNode.column);
    for (let node = rowNode.right; node !== rowNode; node = node.right) {
      this.cover(node.column);
    }
  }

  /**
   * Solves a given flat 81-element Sudoku array.
   * @returns Solved 81-element array, or null if unsolvable.
   */
  public solve(grid: number[]): number[] | null {
    const solverInstance = new DLXSolver();
    const initialRows: number[] = [];

    for (let i = 0; i < 81; i++) {
      const val = grid[i];
      if (val > 0) {
        const r = Math.floor(i / 9);
        const c = i % 9;
        const rowIndex = r * 81 + c * 9 + (val - 1);
        const targetNode = solverInstance.findRowNode(rowIndex);
        if (targetNode) {
          solverInstance.coverRow(targetNode);
          initialRows.push(rowIndex);
        }
      }
    }

    const solutions: number[][] = [];
    solverInstance.search(initialRows, solutions, 1);

    if (solutions.length === 0) return null;

    const result = [...grid];
    for (const rIdx of solutions[0]) {
      const cellIdx = Math.floor(rIdx / 9);
      const digit = (rIdx % 9) + 1;
      result[cellIdx] = digit;
    }

    return result;
  }

  /**
   * Verifies if a given grid has EXACTLY one unique solution.
   * Stops searching immediately if a second solution is found.
   */
  public hasUniqueSolution(grid: number[]): boolean {
    const solverInstance = new DLXSolver();
    const initialRows: number[] = [];

    for (let i = 0; i < 81; i++) {
      const val = grid[i];
      if (val > 0) {
        const r = Math.floor(i / 9);
        const c = i % 9;
        const rowIndex = r * 81 + c * 9 + (val - 1);
        const targetNode = solverInstance.findRowNode(rowIndex);
        if (targetNode) {
          solverInstance.coverRow(targetNode);
          initialRows.push(rowIndex);
        }
      }
    }

    const solutions: number[][] = [];
    solverInstance.search(initialRows, solutions, 2);

    return solutions.length === 1;
  }
}