// src/engine/worker.ts
import { DLXSolver } from './dlx_solver';
import { PuzzleGenerator } from './puzzle_generator';
import { BoardState } from '../models/board';

export type WorkerRequest =
  | { type: 'SOLVE'; grid: number[] }
  | { type: 'CHECK_UNIQUE'; grid: number[] }
  | { type: 'GENERATE_PUZZLE'; difficulty: 'Easy' | 'Medium' | 'Hard' | 'Evil' };

export type WorkerResponse =
  | { type: 'SOLVE_RESULT'; solution: number[] | null }
  | { type: 'CHECK_UNIQUE_RESULT'; isUnique: boolean }
  | { type: 'GENERATE_PUZZLE_RESULT'; board: BoardState };

const solver = new DLXSolver();
const generator = new PuzzleGenerator();

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;

  switch (message.type) {
    case 'SOLVE': {
      const solution = solver.solve(message.grid);
      self.postMessage({ type: 'SOLVE_RESULT', solution } as WorkerResponse);
      break;
    }

    case 'CHECK_UNIQUE': {
      const isUnique = solver.hasUniqueSolution(message.grid);
      self.postMessage({ type: 'CHECK_UNIQUE_RESULT', isUnique } as WorkerResponse);
      break;
    }

    case 'GENERATE_PUZZLE': {
      const board = await generator.createPuzzle(message.difficulty);
      self.postMessage({ type: 'GENERATE_PUZZLE_RESULT', board } as WorkerResponse);
      break;
    }
  }
};