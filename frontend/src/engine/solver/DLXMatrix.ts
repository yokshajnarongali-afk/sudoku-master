/**
 * DLXMatrix.ts
 *
 * Builds the Sudoku exact-cover matrix for Algorithm X / Dancing Links.
 *
 * Structure:
 *   729 candidate rows  — every (row, col, digit) triple: r*81 + c*9 + d
 *   324 constraint columns — 4 groups of 81:
 *     [  0.. 80] Cell constraints  — cell(r,c) must contain exactly one digit
 *     [ 81..161] Row constraints   — digit d must appear exactly once in row r
 *     [162..242] Column constraints— digit d must appear exactly once in col c
 *     [243..323] Box constraints   — digit d must appear exactly once in box b
 *
 * All indices are 0-based (digits 0..8 internally; +1 = actual digit 1..9).
 * Box index b = Math.floor(r/3)*3 + Math.floor(c/3).
 *
 * Each candidate row participates in exactly 4 constraint columns.
 * Each constraint column has exactly 9 nodes (one per valid placement).
 */

import {
  createColumnNode,
  createNode,
  linkRight,
  appendToColumn,
  type ColumnNode,
  type DLXNode,
} from "./DLXNode";

export { type ColumnNode, type DLXNode } from "./DLXNode";

// ---------------------------------------------------------------------------
// Public constants
// ---------------------------------------------------------------------------

/** Total constraint columns in the Sudoku exact-cover matrix. */
export const MATRIX_COLUMNS = 324 as const;

/** Total candidate rows (81 cells × 9 digits). */
export const MATRIX_ROWS = 729 as const;

// ---------------------------------------------------------------------------
// Column index helpers (exported for tests)
// ---------------------------------------------------------------------------

/** Column index for the cell-must-be-filled constraint. */
export function cellColIdx(r: number, c: number): number {
  return r * 9 + c; // [0, 80]
}

/** Column index for the row-digit constraint. */
export function rowColIdx(r: number, d: number): number {
  return 81 + r * 9 + d; // [81, 161]
}

/** Column index for the column-digit constraint. */
export function colColIdx(c: number, d: number): number {
  return 162 + c * 9 + d; // [162, 242]
}

/** Column index for the box-digit constraint. */
export function boxColIdx(b: number, d: number): number {
  return 243 + b * 9 + d; // [243, 323]
}

/** The four constraint column indices for candidate (r, c, d). */
export function candidateColumns(r: number, c: number, d: number): [number, number, number, number] {
  const box = Math.floor(r / 3) * 3 + Math.floor(c / 3);
  return [
    cellColIdx(r, c),
    rowColIdx(r, d),
    colColIdx(c, d),
    boxColIdx(box, d),
  ];
}

/** Candidate row index for placement (r, c, d). All 0-based. */
export function candidateIndex(r: number, c: number, d: number): number {
  return r * 81 + c * 9 + d; // [0, 728]
}

/** Decode a candidate index back to (r, c, d). */
export function decodeCandidate(idx: number): { r: number; c: number; d: number } {
  return {
    r: Math.floor(idx / 81),
    c: Math.floor((idx % 81) / 9),
    d: idx % 9,
  };
}

// ---------------------------------------------------------------------------
// Column name helpers (for debugging)
// ---------------------------------------------------------------------------

function columnName(idx: number): string {
  if (idx < 81) {
    const r = Math.floor(idx / 9);
    const c = idx % 9;
    return `cell(${r},${c})`;
  }
  if (idx < 162) {
    const i = idx - 81;
    const r = Math.floor(i / 9);
    const d = i % 9;
    return `row(${r},${d + 1})`;
  }
  if (idx < 243) {
    const i = idx - 162;
    const c = Math.floor(i / 9);
    const d = i % 9;
    return `col(${c},${d + 1})`;
  }
  const i = idx - 243;
  const b = Math.floor(i / 9);
  const d = i % 9;
  return `box(${b},${d + 1})`;
}

// ---------------------------------------------------------------------------
// DLXMatrix class
// ---------------------------------------------------------------------------

export class DLXMatrix {
  /** Root of the column header circular list. */
  readonly root: ColumnNode;

  /** All 324 column header nodes, indexed by column id. */
  private readonly _columns: ColumnNode[];

  /**
   * First node of each of the 729 candidate rows.
   * Indexed by candidateIndex(r, c, d).
   */
  private readonly _rows: DLXNode[];

  constructor() {
    this.root = createColumnNode(-1, "root");

    // ------ Build 324 column headers ------
    const columns: ColumnNode[] = [];
    for (let i = 0; i < MATRIX_COLUMNS; i++) {
      const col = createColumnNode(i, columnName(i));
      columns.push(col);
      // Append to the right of root (before root, since circular)
      linkRight(this.root.left, col);
    }
    this._columns = columns;

    // ------ Build 729 candidate rows ------
    const rows: DLXNode[] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const box = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        for (let d = 0; d < 9; d++) {
          const candIdx = candidateIndex(r, c, d);
          const colIndices = candidateColumns(r, c, d);

          let firstNode: DLXNode | undefined;
          let prevNode: DLXNode | undefined;

          for (const colIdx of colIndices) {
            const colHeader = this._getColumn(colIdx);
            const node = createNode(colHeader, candIdx);

            // Link vertically into column
            appendToColumn(colHeader, node);

            // Link horizontally into row (circular)
            if (firstNode === undefined) {
              firstNode = node;
              prevNode = node;
            } else {
              // Insert after prevNode, before firstNode (maintains circular order)
              linkRight(prevNode!, node);
              prevNode = node;
            }
          }

          rows.push(firstNode!);
        }
      }
    }
    this._rows = rows;
  }

  /** Number of constraint columns (always 324). */
  get columnCount(): number {
    return MATRIX_COLUMNS;
  }

  /** Number of candidate rows (always 729). */
  get rowCount(): number {
    return MATRIX_ROWS;
  }

  /**
   * Return the first node of candidate row `idx`.
   * Throws if idx is out of range.
   */
  getRow(idx: number): DLXNode {
    const row = this._rows[idx];
    if (row === undefined) {
      throw new RangeError(`DLXMatrix.getRow: idx ${idx} out of range [0, 728]`);
    }
    return row;
  }

  /**
   * Return the column header for `idx`.
   * Throws if idx is out of range.
   */
  getColumn(idx: number): ColumnNode {
    return this._getColumn(idx);
  }

  private _getColumn(idx: number): ColumnNode {
    const col = this._columns[idx];
    if (col === undefined) {
      throw new RangeError(`DLXMatrix: column ${idx} out of range [0, 323]`);
    }
    return col;
  }
}
