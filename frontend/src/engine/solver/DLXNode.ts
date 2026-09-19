/**
 * DLXNode.ts
 *
 * Doubly-linked node structure for Algorithm X / Dancing Links (Knuth's DLX).
 *
 * The matrix is toroidal — every row and column forms a circular doubly-linked list:
 *   Horizontally: left ↔ right  (circular per candidate row)
 *   Vertically:   up   ↔ down   (circular per constraint column)
 *
 * All pointers default to self on creation (isolated, self-referential).
 * Links are established explicitly via linkRight / appendToColumn.
 */

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/**
 * A single node in the DLX toroidal matrix.
 */
export interface DLXNode {
  left: DLXNode;
  right: DLXNode;
  up: DLXNode;
  down: DLXNode;
  /**
   * The column header this node belongs to.
   * Column header nodes point to themselves.
   */
  column: ColumnNode;
  /**
   * Index of the candidate row (0–728 for a Sudoku matrix).
   * -1 for column header nodes.
   */
  rowIndex: number;
}

/**
 * A column header node — the list sentinel for one constraint column.
 * Extends DLXNode with bookkeeping fields used by the DLX algorithm.
 */
export interface ColumnNode extends DLXNode {
  /** Current number of uncovered nodes in this column. */
  size: number;
  /** Stable unique column index (0–323 for a Sudoku DLX matrix). */
  id: number;
  /** Human-readable label for debugging, e.g. "cell(0,0)" or "row(3,7)". */
  name: string;
}

// ---------------------------------------------------------------------------
// Factory functions
// ---------------------------------------------------------------------------

/**
 * Create a regular DLX node.
 * All four directional pointers are initialised to self (isolated node).
 */
export function createNode(column: ColumnNode, rowIndex: number): DLXNode {
  const node = {} as DLXNode;
  node.left = node;
  node.right = node;
  node.up = node;
  node.down = node;
  node.column = column;
  node.rowIndex = rowIndex;
  return node;
}

/**
 * Create a column header node.
 * `column` is set to self; `rowIndex` is -1; `size` is 0.
 */
export function createColumnNode(id: number, name: string): ColumnNode {
  const node = {} as ColumnNode;
  node.left = node;
  node.right = node;
  node.up = node;
  node.down = node;
  node.column = node; // column header is its own column
  node.rowIndex = -1;
  node.size = 0;
  node.id = id;
  node.name = name;
  return node;
}

// ---------------------------------------------------------------------------
// Structural linking utilities
// ---------------------------------------------------------------------------

/**
 * Insert `node` immediately to the right of `target` in the horizontal
 * circular doubly-linked list.
 *
 * Before: … ↔ target ↔ (target.right) ↔ …
 * After:  … ↔ target ↔ node ↔ (old target.right) ↔ …
 *
 * To append at the end of a list rooted at `root`, call:
 *   linkRight(root.left, node)
 */
export function linkRight(target: DLXNode, node: DLXNode): void {
  node.right = target.right;
  node.left = target;
  target.right.left = node;
  target.right = node;
}

/**
 * Append `node` to the bottom of the column's vertical circular list
 * (i.e., just above the column header, since the list is circular).
 * Increments the column's size counter.
 *
 * Before: … ↔ colHeader.up ↔ colHeader
 * After:  … ↔ (old colHeader.up) ↔ node ↔ colHeader
 */
export function appendToColumn(colHeader: ColumnNode, node: DLXNode): void {
  node.up = colHeader.up;
  node.down = colHeader;
  colHeader.up.down = node;
  colHeader.up = node;
  colHeader.size++;
}
