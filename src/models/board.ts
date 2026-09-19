// Example TypeScript data model
export interface Cell {
  index: number;         // 0 to 80
  value: number;         // 0 (empty) or 1-9
  solution: number;      // Correct answer 1-9
  isGiven: boolean;      // Initial puzzle clue (true/false)
  notes: number[];       // Pencil marks (1-9)
  isError: boolean;      // Triggers error styling/penalties
}

export interface BoardState {
  grid: Cell[];
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Evil';
  hash: string;          // SHA-256 string for duplicate checking
}