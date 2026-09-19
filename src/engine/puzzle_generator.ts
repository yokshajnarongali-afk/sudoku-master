// src/engine/human_solver.ts

export type HumanTechnique = 'Naked Single' | 'Hidden Single' | 'Pointing Pairs' | 'X-Wing' | 'Requires Guessing';

export interface LogicRating {
  solvableWithoutGuessing: boolean;
  highestTechniqueRequired: HumanTechnique;
}

export class HumanSolver {
  /**
   * Evaluates if a puzzle can be solved strictly using human logic rules.
   */
  public static evaluate(grid: number[]): LogicRating {
    let board = [...grid];
    let candidates = this.initCandidates(board);
    let highestTechnique: HumanTechnique = 'Naked Single';
    let progress = true;

    while (this.countEmpty(board) > 0 && progress) {
      progress = false;

      // Level 1: Naked Singles
      if (this.applyNakedSingles(board, candidates)) {
        progress = true;
        continue;
      }

      // Level 2: Hidden Singles
      if (this.applyHiddenSingles(board, candidates)) {
        if (highestTechnique === 'Naked Single') highestTechnique = 'Hidden Single';
        progress = true;
        continue;
      }

      // Level 3: Pointing Pairs / Triples
      if (this.applyPointingPairs(board, candidates)) {
        if (highestTechnique === 'Naked Single' || highestTechnique === 'Hidden Single') {
          highestTechnique = 'Pointing Pairs';
        }
        progress = true;
        continue;
      }

      // Level 4: X-Wing
      if (this.applyXWing(board, candidates)) {
        highestTechnique = 'X-Wing';
        progress = true;
        continue;
      }
    }

    const isSolved = this.countEmpty(board) === 0;

    return {
      solvableWithoutGuessing: isSolved,
      highestTechniqueRequired: isSolved ? highestTechnique : 'Requires Guessing',
    };
  }

  private static countEmpty(board: number[]): number {
    return board.filter((val) => val === 0).length;
  }

  private static initCandidates(board: number[]): Set<number>[] {
    const candidates: Set<number>[] = Array.from({ length: 81 }, () => new Set());
    for (let i = 0; i < 81; i++) {
      if (board[i] === 0) {
        for (let d = 1; d <= 9; d++) candidates[i].add(d);
      }
    }
    for (let i = 0; i < 81; i++) {
      if (board[i] > 0) this.eliminateCandidate(candidates, board, i, board[i]);
    }
    return candidates;
  }

  private static eliminateCandidate(candidates: Set<number>[], board: number[], index: number, digit: number): void {
    const r = Math.floor(index / 9);
    const c = index % 9;
    const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);

    for (let i = 0; i < 81; i++) {
      const cr = Math.floor(i / 9);
      const cc = i % 9;
      const cb = Math.floor(cr / 3) * 3 + Math.floor(cc / 3);

      if (cr === r || cc === c || cb === b) {
        candidates[i].delete(digit);
      }
    }
  }

  private static applyNakedSingles(board: number[], candidates: Set<number>[]): boolean {
    let applied = false;
    for (let i = 0; i < 81; i++) {
      if (board[i] === 0 && candidates[i].size === 1) {
        const val = Array.from(candidates[i])[0];
        board[i] = val;
        candidates[i].clear();
        this.eliminateCandidate(candidates, board, i, val);
        applied = true;
      }
    }
    return applied;
  }

  private static applyHiddenSingles(board: number[], candidates: Set<number>[]): boolean {
    let applied = false;
    // Check houses (rows, columns, boxes) for unique digit candidates
    for (let digit = 1; digit <= 9; digit++) {
      for (let r = 0; r < 9; r++) {
        const possibleCols: number[] = [];
        for (let c = 0; c < 9; c++) {
          const idx = r * 9 + c;
          if (board[idx] === 0 && candidates[idx].has(digit)) possibleCols.push(c);
        }
        if (possibleCols.length === 1) {
          const idx = r * 9 + possibleCols[0];
          board[idx] = digit;
          candidates[idx].clear();
          this.eliminateCandidate(candidates, board, idx, digit);
          applied = true;
        }
      }
    }
    return applied;
  }

  private static applyPointingPairs(board: number[], candidates: Set<number>[]): boolean {
    // Basic pointing pair removal stub
    return false;
  }

  private static applyXWing(board: number[], candidates: Set<number>[]): boolean {
    // Basic X-Wing candidate reduction stub
    return false;
  }
}