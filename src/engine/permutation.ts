// src/engine/permutation.ts

export class PermutationEngine {
  /**
   * Rotates the 81-element array 90 degrees clockwise.
   */
  public static rotate90(grid: number[]): number[] {
    const result = new Array(81);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        result[c * 9 + (8 - r)] = grid[r * 9 + c];
      }
    }
    return result;
  }

  /**
   * Flips the board horizontally across the central vertical axis.
   */
  public static flipHorizontal(grid: number[]): number[] {
    const result = new Array(81);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        result[r * 9 + (8 - c)] = grid[r * 9 + c];
      }
    }
    return result;
  }

  /**
   * Swaps two digits across the entire board (e.g. replace all 3s with 7s and vice-versa).
   */
  public static swapDigits(grid: number[], digitA: number, digitB: number): number[] {
    return grid.map((val) => {
      if (val === digitA) return digitB;
      if (val === digitB) return digitA;
      return val;
    });
  }

  /**
   * Swaps two rows within the same 3-row band.
   */
  public static swapRowsInBand(grid: number[], band: 0 | 1 | 2, row1: 0 | 1 | 2, row2: 0 | 1 | 2): number[] {
    if (row1 === row2) return [...grid];
    const result = [...grid];
    const r1Global = band * 3 + row1;
    const r2Global = band * 3 + row2;

    for (let c = 0; c < 9; c++) {
      const idx1 = r1Global * 9 + c;
      const idx2 = r2Global * 9 + c;
      const temp = result[idx1];
      result[idx1] = result[idx2];
      result[idx2] = temp;
    }
    return result;
  }

  /**
   * Applies a random series of valid transformations to a board.
   */
  public static randomize(grid: number[]): number[] {
    let current = [...grid];

    // 1. Random rotations (0-3 times)
    const rotations = Math.floor(Math.random() * 4);
    for (let i = 0; i < rotations; i++) {
      current = this.rotate90(current);
    }

    // 2. Random horizontal flip
    if (Math.random() > 0.5) {
      current = this.flipHorizontal(current);
    }

    // 3. Relabel digits randomly (1-9 permutation)
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
    const map = new Map<number, number>();
    for (let i = 0; i < 9; i++) map.set(i + 1, digits[i]);
    current = current.map((val) => (val > 0 ? map.get(val)! : 0));

    return current;
  }
}