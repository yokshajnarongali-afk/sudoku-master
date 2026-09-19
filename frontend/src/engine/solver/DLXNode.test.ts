import { describe, it, expect } from "vitest";
import {
  createNode,
  createColumnNode,
  linkRight,
  appendToColumn,
  type DLXNode,
  type ColumnNode,
} from "./DLXNode";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function traverseRight(start: DLXNode): DLXNode[] {
  const visited: DLXNode[] = [start];
  let cur = start.right;
  while (cur !== start) {
    visited.push(cur);
    cur = cur.right;
  }
  return visited;
}

function traverseDown(col: ColumnNode): DLXNode[] {
  const visited: DLXNode[] = [];
  let cur = col.down;
  while (cur !== col) {
    visited.push(cur);
    cur = cur.down;
  }
  return visited;
}

// ---------------------------------------------------------------------------
// createColumnNode — initialisation
// ---------------------------------------------------------------------------

describe("createColumnNode — initialisation", () => {
  it("stores correct id and name", () => {
    const col = createColumnNode(7, "box(2,5)");
    expect(col.id).toBe(7);
    expect(col.name).toBe("box(2,5)");
  });

  it("size is 0", () => {
    expect(createColumnNode(0, "c").size).toBe(0);
  });

  it("rowIndex is -1", () => {
    expect(createColumnNode(0, "c").rowIndex).toBe(-1);
  });

  it("column pointer points to self", () => {
    const col = createColumnNode(0, "c");
    expect(col.column).toBe(col);
  });

  it("all four directional pointers point to self", () => {
    const col = createColumnNode(0, "c");
    expect(col.left).toBe(col);
    expect(col.right).toBe(col);
    expect(col.up).toBe(col);
    expect(col.down).toBe(col);
  });
});

// ---------------------------------------------------------------------------
// createNode — initialisation
// ---------------------------------------------------------------------------

describe("createNode — initialisation", () => {
  it("stores column and rowIndex", () => {
    const col = createColumnNode(5, "c5");
    const node = createNode(col, 42);
    expect(node.column).toBe(col);
    expect(node.rowIndex).toBe(42);
  });

  it("all four directional pointers point to self", () => {
    const col = createColumnNode(0, "c");
    const node = createNode(col, 0);
    expect(node.left).toBe(node);
    expect(node.right).toBe(node);
    expect(node.up).toBe(node);
    expect(node.down).toBe(node);
  });

  it("does not increment column size on creation", () => {
    const col = createColumnNode(0, "c");
    createNode(col, 0);
    expect(col.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// linkRight — circular horizontal linking
// ---------------------------------------------------------------------------

describe("linkRight — circular horizontal linking", () => {
  it("linking one node to root creates a 2-node circle", () => {
    const root = createColumnNode(-1, "root");
    const n1 = createColumnNode(0, "n1");
    linkRight(root, n1);
    expect(root.right).toBe(n1);
    expect(n1.right).toBe(root);
    expect(root.left).toBe(n1);
    expect(n1.left).toBe(root);
  });

  it("linking two nodes creates a 3-node circle", () => {
    const root = createColumnNode(-1, "root");
    const n1 = createColumnNode(0, "n1");
    const n2 = createColumnNode(1, "n2");
    linkRight(root, n1);
    linkRight(n1, n2);
    expect(root.right).toBe(n1);
    expect(n1.right).toBe(n2);
    expect(n2.right).toBe(root);
    expect(root.left).toBe(n2);
    expect(n2.left).toBe(n1);
    expect(n1.left).toBe(root);
  });

  it("append-to-end pattern (linkRight on root.left) preserves insertion order", () => {
    const root = createColumnNode(-1, "root");
    const n1 = createColumnNode(0, "n1");
    const n2 = createColumnNode(1, "n2");
    const n3 = createColumnNode(2, "n3");
    linkRight(root.left, n1);
    linkRight(root.left, n2);
    linkRight(root.left, n3);
    const order = traverseRight(root);
    expect(order).toStrictEqual([root, n1, n2, n3]);
  });

  it("traversing right all the way returns to start", () => {
    const root = createColumnNode(-1, "root");
    const nodes = [0, 1, 2, 3, 4].map((i) => createColumnNode(i, `n${i}`));
    nodes.forEach((n) => linkRight(root.left, n));
    const visited = traverseRight(root);
    // root + 5 nodes
    expect(visited).toHaveLength(6);
    expect(visited[0]).toBe(root);
    expect(visited[visited.length - 1]).toBe(nodes[4]);
  });

  it("left pointers are the exact inverse of right pointers", () => {
    const root = createColumnNode(-1, "root");
    const a = createColumnNode(0, "a");
    const b = createColumnNode(1, "b");
    linkRight(root.left, a);
    linkRight(root.left, b);
    // Right order: root → a → b → root
    // Left order:  root ← a ← b ← root
    expect(b.left).toBe(a);
    expect(a.left).toBe(root);
    expect(root.left).toBe(b);
  });
});

// ---------------------------------------------------------------------------
// appendToColumn — circular vertical linking
// ---------------------------------------------------------------------------

describe("appendToColumn — circular vertical linking", () => {
  it("appending one node creates a 2-node vertical circle", () => {
    const col = createColumnNode(0, "col0");
    const n1 = createNode(col, 0);
    appendToColumn(col, n1);
    expect(col.down).toBe(n1);
    expect(n1.down).toBe(col);
    expect(col.up).toBe(n1);
    expect(n1.up).toBe(col);
  });

  it("increments column size on each append", () => {
    const col = createColumnNode(0, "col0");
    expect(col.size).toBe(0);
    appendToColumn(col, createNode(col, 0));
    expect(col.size).toBe(1);
    appendToColumn(col, createNode(col, 1));
    expect(col.size).toBe(2);
  });

  it("appending three nodes creates correct top-to-bottom order", () => {
    const col = createColumnNode(0, "col0");
    const n1 = createNode(col, 0);
    const n2 = createNode(col, 1);
    const n3 = createNode(col, 2);
    appendToColumn(col, n1);
    appendToColumn(col, n2);
    appendToColumn(col, n3);
    // Down: col → n1 → n2 → n3 → col
    expect(col.down).toBe(n1);
    expect(n1.down).toBe(n2);
    expect(n2.down).toBe(n3);
    expect(n3.down).toBe(col);
    // Up: col → n3 → n2 → n1 → col
    expect(col.up).toBe(n3);
    expect(n3.up).toBe(n2);
    expect(n2.up).toBe(n1);
    expect(n1.up).toBe(col);
  });

  it("traverseDown count matches size and node count", () => {
    const col = createColumnNode(0, "col0");
    for (let i = 0; i < 9; i++) appendToColumn(col, createNode(col, i));
    expect(traverseDown(col)).toHaveLength(9);
    expect(col.size).toBe(9);
  });

  it("traversing down then all the way up returns to column header", () => {
    const col = createColumnNode(0, "col");
    const n1 = createNode(col, 0);
    const n2 = createNode(col, 1);
    appendToColumn(col, n1);
    appendToColumn(col, n2);
    // Down: col → n1 → n2 → col (wraps)
    expect(n2.down).toBe(col);
    // Up from last node: n2 → n1 → col (wraps)
    expect(n2.up).toBe(n1);
    expect(n1.up).toBe(col);
  });
});
