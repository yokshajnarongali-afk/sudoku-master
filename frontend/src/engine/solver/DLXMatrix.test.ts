import { describe, it, expect } from "vitest";
import {
  DLXMatrix,
  MATRIX_COLUMNS,
  MATRIX_ROWS,
  candidateIndex,
  candidateColumns,
  decodeCandidate,
  cellColIdx,
  rowColIdx,
  colColIdx,
  boxColIdx,
} from "./DLXMatrix";
import type { DLXNode, ColumnNode } from "./DLXMatrix";

// ---------------------------------------------------------------------------
// Helper: count nodes in a column by traversal
// ---------------------------------------------------------------------------
function countNodesInColumn(col: ColumnNode): number {
  let count = 0;
  let node = col.down;
  while (node !== col) {
    count++;
    node = node.down;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Helper: count nodes in a candidate row by traversal
// ---------------------------------------------------------------------------
function countNodesInRow(firstNode: DLXNode): number {
  let count = 1;
  let node = firstNode.right;
  while (node !== firstNode) {
    count++;
    node = node.right;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Helper: collect column ids of all nodes in a candidate row
// ---------------------------------------------------------------------------
function rowColumnIds(firstNode: DLXNode): number[] {
  const ids: number[] = [firstNode.column.id];
  let node = firstNode.right;
  while (node !== firstNode) {
    ids.push(node.column.id);
    node = node.right;
  }
  return ids.sort((a, b) => a - b);
}

// ---------------------------------------------------------------------------
// Structure tests
// ---------------------------------------------------------------------------

describe("DLXMatrix — column count", () => {
  it("has exactly 324 constraint columns reachable from root", () => {
    const matrix = new DLXMatrix();
    let count = 0;
    let node = matrix.root.right;
    while (node !== matrix.root) {
      count++;
      node = node.right;
    }
    expect(count).toBe(324);
  });

  it("MATRIX_COLUMNS constant equals 324", () => {
    expect(MATRIX_COLUMNS).toBe(324);
  });

  it("getColumn returns correct column by index", () => {
    const matrix = new DLXMatrix();
    const col = matrix.getColumn(0);
    expect(col.id).toBe(0);
    const col81 = matrix.getColumn(81);
    expect(col81.id).toBe(81);
    const col323 = matrix.getColumn(323);
    expect(col323.id).toBe(323);
  });

  it("getColumn throws for out-of-range index", () => {
    const matrix = new DLXMatrix();
    expect(() => matrix.getColumn(324)).toThrow(RangeError);
    expect(() => matrix.getColumn(-1)).toThrow(RangeError);
  });
});

describe("DLXMatrix — row count", () => {
  it("has exactly 729 candidate rows", () => {
    const matrix = new DLXMatrix();
    expect(matrix.rowCount).toBe(729);
    expect(MATRIX_ROWS).toBe(729);
  });

  it("getRow(0) is accessible", () => {
    const matrix = new DLXMatrix();
    expect(() => matrix.getRow(0)).not.toThrow();
  });

  it("getRow(728) is accessible (last candidate)", () => {
    const matrix = new DLXMatrix();
    expect(() => matrix.getRow(728)).not.toThrow();
  });

  it("getRow throws for out-of-range index", () => {
    const matrix = new DLXMatrix();
    expect(() => matrix.getRow(729)).toThrow(RangeError);
    expect(() => matrix.getRow(-1)).toThrow(RangeError);
  });
});

describe("DLXMatrix — candidate rows have exactly 4 nodes each", () => {
  it("every one of the 729 candidate rows has exactly 4 nodes", () => {
    const matrix = new DLXMatrix();
    for (let i = 0; i < MATRIX_ROWS; i++) {
      const count = countNodesInRow(matrix.getRow(i));
      expect(count, `Candidate row ${i} has ${count} nodes instead of 4`).toBe(4);
    }
  });
});

describe("DLXMatrix — each constraint column has exactly 9 nodes", () => {
  it("every constraint column has size 9", () => {
    const matrix = new DLXMatrix();
    for (let i = 0; i < MATRIX_COLUMNS; i++) {
      const col = matrix.getColumn(i);
      expect(col.size, `Column ${i} (${col.name}) size should be 9`).toBe(9);
    }
  });

  it("traversal count matches size for all columns", () => {
    const matrix = new DLXMatrix();
    for (let i = 0; i < MATRIX_COLUMNS; i++) {
      const col = matrix.getColumn(i);
      const traversed = countNodesInColumn(col);
      expect(traversed, `Column ${i} traversal count mismatch`).toBe(col.size);
    }
  });
});

describe("DLXMatrix — constraint column indices for specific candidates", () => {
  it("candidate (0,0,0) — top-left, digit 1 — covers correct 4 columns", () => {
    const matrix = new DLXMatrix();
    const idx = candidateIndex(0, 0, 0); // = 0
    const ids = rowColumnIds(matrix.getRow(idx));
    expect(ids).toStrictEqual([
      cellColIdx(0, 0),  // 0
      rowColIdx(0, 0),   // 81
      colColIdx(0, 0),   // 162
      boxColIdx(0, 0),   // 243
    ].sort((a, b) => a - b));
  });

  it("candidate (4,4,4) — center cell, digit 5 — covers correct 4 columns", () => {
    // box = floor(4/3)*3 + floor(4/3) = 1*3 + 1 = 4
    const matrix = new DLXMatrix();
    const idx = candidateIndex(4, 4, 4); // = 4*81 + 4*9 + 4 = 364
    const ids = rowColumnIds(matrix.getRow(idx));
    expect(ids).toStrictEqual([
      cellColIdx(4, 4),  // 40
      rowColIdx(4, 4),   // 121
      colColIdx(4, 4),   // 202
      boxColIdx(4, 4),   // 283
    ].sort((a, b) => a - b));
  });

  it("candidate (8,8,8) — bottom-right, digit 9 — covers correct 4 columns", () => {
    // box = floor(8/3)*3 + floor(8/3) = 2*3 + 2 = 8
    const matrix = new DLXMatrix();
    const idx = candidateIndex(8, 8, 8); // = 728
    const ids = rowColumnIds(matrix.getRow(idx));
    expect(ids).toStrictEqual([
      cellColIdx(8, 8),  // 80
      rowColIdx(8, 8),   // 161
      colColIdx(8, 8),   // 242
      boxColIdx(8, 8),   // 323
    ].sort((a, b) => a - b));
  });
});

describe("DLXMatrix — structural link validity", () => {
  it("rowIndex of nodes in candidate row 364 is 364", () => {
    const matrix = new DLXMatrix();
    const firstNode = matrix.getRow(364);
    let node = firstNode;
    do {
      expect(node.rowIndex).toBe(364);
      node = node.right;
    } while (node !== firstNode);
  });

  it("each node's column pointer is a valid column header", () => {
    const matrix = new DLXMatrix();
    // Spot-check candidate 0
    let node = matrix.getRow(0);
    const start = node;
    do {
      const col = node.column;
      expect(col.id).toBeGreaterThanOrEqual(0);
      expect(col.id).toBeLessThan(324);
      expect(col.column).toBe(col); // column header points to self
      node = node.right;
    } while (node !== start);
  });

  it("left pointers are exact inverse of right pointers in each row", () => {
    const matrix = new DLXMatrix();
    const firstNode = matrix.getRow(candidateIndex(3, 6, 2));
    // Bounded right traversal — 4 nodes in a Sudoku matrix row
    const rightOrder: DLXNode[] = [firstNode];
    let n: DLXNode = firstNode.right;
    while (n !== firstNode) { rightOrder.push(n); n = n.right; }
    expect(rightOrder).toHaveLength(4);
    // Each node's .left must be the previous node in the right-order ring
    for (let i = 0; i < rightOrder.length; i++) {
      const cur = rightOrder[i]!;
      const prev = rightOrder[(i - 1 + rightOrder.length) % rightOrder.length]!;
      expect(cur.left).toBe(prev); // identity, not deep-equal (avoids circular recursion)
    }
  });
});

describe("candidateIndex / decodeCandidate round-trips", () => {
  it("decodeCandidate(candidateIndex(r,c,d)) returns original r,c,d", () => {
    const cases = [
      [0, 0, 0],
      [0, 0, 8],
      [4, 4, 4],
      [8, 8, 8],
      [2, 7, 3],
    ] as const;
    for (const [r, c, d] of cases) {
      const idx = candidateIndex(r, c, d);
      const decoded = decodeCandidate(idx);
      expect(decoded).toStrictEqual({ r, c, d });
    }
  });
});

describe("candidateColumns", () => {
  it("returns 4 distinct column indices for any placement", () => {
    const cols = candidateColumns(3, 5, 7);
    const unique = new Set(cols);
    expect(unique.size).toBe(4);
  });

  it("all column indices are in [0, 323]", () => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        for (let d = 0; d < 9; d++) {
          const cols = candidateColumns(r, c, d);
          for (const col of cols) {
            expect(col).toBeGreaterThanOrEqual(0);
            expect(col).toBeLessThan(324);
          }
        }
      }
    }
  });
});
