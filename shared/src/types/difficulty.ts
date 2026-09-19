/**
 * Sudoku difficulty levels ordered from easiest to hardest.
 * The difficulty affects the number of given (pre-filled) clue cells.
 */
export type Difficulty = "easy" | "medium" | "hard" | "expert" | "master";

/** Ordered list of all difficulty levels. */
export const DIFFICULTY_LEVELS: readonly Difficulty[] = [
  "easy",
  "medium",
  "hard",
  "expert",
  "master",
] as const;

/**
 * Approximate range of given (clue) cells per difficulty.
 * Used by the puzzle generator — not enforced at the type level.
 */
export const DIFFICULTY_GIVEN_RANGE: Readonly<
  Record<Difficulty, { readonly min: number; readonly max: number }>
> = {
  easy: { min: 36, max: 46 },
  medium: { min: 27, max: 35 },
  hard: { min: 20, max: 26 },
  expert: { min: 17, max: 19 },
  master: { min: 17, max: 17 },
} as const;
