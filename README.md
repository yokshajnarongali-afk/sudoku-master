# Sudoku Master: Complete Architecture & Feature Guide

This document serves as the comprehensive, ground-up technical breakdown of the entire Sudoku Master application. It details exactly what was built, how the underlying systems work, the advanced architectural patterns implemented, and the specific rules of every game mode.

---

## 1. System Architecture

The application is built on a modern, decoupled full-stack architecture designed for real-time responsiveness and horizontal scalability.

### The Frontend (Client)
*   **Framework:** Next.js (React 18) using the App Router (`src/app`).
*   **State Management:** **Zustand** is used heavily to manage local game state (`gameStore.ts`) and real-time multiplayer state (`multiplayerStore.ts`). It avoids React Context re-render bloat.
*   **Styling:** Tailwind CSS is used for all layout, animations, and responsive design, ensuring the board scales perfectly from mobile to desktop.
*   **Network:** `socket.io-client` handles the persistent WebSocket connection to the backend.

### The Backend (Server)
*   **Framework:** Node.js with Express (for basic HTTP routing/health checks) and `socket.io` for the core real-time engine.
*   **State Authority:** The backend acts as the **Authoritative Server**. Clients cannot arbitrarily change the board; they submit `MoveDraft` requests. The server validates the move against the puzzle solution and broadcasts a `MoveResult`.
*   **Stateless Scaling:** Integrated the `@socket.io/redis-adapter` and `redis`. By connecting to a Redis Pub/Sub instance, the backend can be deployed across multiple servers (e.g., Railway, AWS). Player A on Server 1 and Player B on Server 2 can play in the same room flawlessly.

### Shared Workspace
*   **Types & Constants:** A `@sudoku/shared` package (TypeScript) contains all the core interfaces (`GameState`, `Room`, `PlayerIdentity`) and network packet definitions. Both the frontend and backend import this package, ensuring 100% end-to-end type safety. If a socket event payload changes, the compiler catches it on both sides.

---

## 2. Core Engines & Solvers

At the heart of the game is the algorithmic engine that generates, solves, and grades Sudoku puzzles.

### The DLX Solver (Algorithm X)
*   **What it is:** To generate puzzles and validate user input instantly, we built a solver using Donald Knuth’s **Algorithm X** implemented via **Dancing Links (DLX)**. 
*   **How it works:** It translates the 9x9 Sudoku grid into an Exact Cover matrix (324 constraints: Cell, Row, Column, Box). Dancing Links allows the algorithm to rapidly traverse and backtrack through this matrix.
*   **Why we did it:** A brute-force recursive solver takes milliseconds to seconds for hard puzzles. DLX solves even the hardest Sudoku puzzles in microseconds, allowing us to generate 100+ puzzles on the fly for Chaos Mode without dropping the server's frame rate.

### The Human Solver (Heuristics)
*   **What it is:** While DLX is great for the machine, humans don't solve Sudoku using Exact Cover matrices. We built a `HumanSolver` that iterates through human logic patterns (Naked Singles, Hidden Singles, Pointing Pairs, X-Wings).
*   **How it works:** Instead of just outputting the final grid, this solver grades the *difficulty* of a puzzle based on which techniques are required to solve it. It also generates step-by-step educational hints (e.g., "Look for a Naked Pair in Row 4") rather than just giving away the answer.

---

## 3. Advanced Architectural Features

To elevate the codebase to a "Premium/SDE" level, several advanced distributed systems patterns were implemented:

### Optimistic UI Updates & Server Reconciliation
*   **The Problem:** In multiplayer, waiting for the server to validate a move before rendering it creates input lag (latency).
*   **The Solution:** When a player presses a number, the frontend `multiplayerStore` instantly mutates a deep clone of the board and renders the digit immediately. Behind the scenes, it emits the move to the server. If the server rejects the move, the client rolls back the state. This completely hides the network latency from the user.

### Concurrency Handling (Cell-Locking / LWW)
*   **The Problem:** In Cooperative mode, what happens if Player A and Player B try to type a number into the exact same cell on the exact same millisecond?
*   **The Solution:** We implemented Ephemeral Cell Locking. When a player focuses (clicks) a cell, the client broadcasts a `game:focus` event. The server relays this as `game:cell_locked`. On all other clients, that specific cell immediately gets a pulsing colored border (matching the focusing player's avatar) and the keyboard input is strictly blocked in `useGameInput.ts` for anyone else.

### Deterministic Match Replays
*   **The Feature:** At the end of a multiplayer match, players can watch a high-speed replay of the entire game.
*   **How we did it:** Because the server acts as the authoritative source of truth, it logs every validated action into an array of `MoveResult` events. When the game ends, the frontend launches the `ReplayViewer` component, initializes an empty board, and uses a `setTimeout` loop to deterministically apply every move in sequence at 10x speed, visually reconstructing the match.

### Global Theming (Light/Dark Mode)
*   **The Approach:** Instead of painstakingly rewriting hundreds of `dark:bg-slate-800` Tailwind classes, we implemented an advanced CSS-filter technique in `globals.css`. Toggling Light Mode applies `filter: invert(1) hue-rotate(180deg)` to the root element. This perfectly inverts the dark theme into a crisp light theme while preserving the exact hue of the colored lock rings and Action Cards.

---

## 4. Game Modes & Rules

The application supports four distinct ways to play, catering to different play styles.

### 1. Solo Mode
*   **Rules:** The classic Sudoku experience. Play offline, pause the timer, use pencil marks, and track your time against different algorithmic difficulties (Easy, Medium, Hard, Expert).

### 2. Cooperative Mode (Co-op)
*   **Rules:** All players in the room share a single 9x9 board. You work together to solve the puzzle against a shared timer.
*   **Mechanics:** Cell-locking prevents overwriting each other's work. The game ends when the board is 100% complete and valid.

### 3. Competitive Mode
*   **Rules:** A race to the finish! Every player gets their own isolated, identical board.
*   **Mechanics:** You can see your opponents' live progress bars at the top of the screen. The first player to reach 100% completion wins the match.

### 4. Chaos Mode (Mario Kart Sudoku)
*   **Rules:** The ultimate premium feature. Every player gets their own board, but the environment actively fights you, and you can attack each other.
*   **Action Cards (The Hand):** For every **5 correct cells** you solve, the server dispenses a random Action Card into your hand (bottom of the screen, max 3 cards).
    *   🛡️ **Shield (Self):** Protects you from the next attack.
    *   ❄️ **Freeze (Target):** Freezes an opponent's board for 10 seconds (they cannot input numbers).
    *   💣 **Bomb (Target):** Blows up 3 correctly solved cells on an opponent's board, forcing them to re-solve them.
    *   🔍 **Reveal (Target Cell):** Click an empty cell on your board to have the server magically fill in the correct answer.
*   **Chaos Events:** Every 45-90 seconds, the server triggers a global event that affects everyone:
    *   🌌 **Lights Out:** The board goes completely dark for 10 seconds.
    *   🌪️ **Number Tornado:** The numbers 1-9 on the keyboard pad are randomly scrambled.
    *   🚫 **Broken Key:** One specific number (e.g., '7') cannot be typed for 15 seconds.

---

## 5. Development Timeline (How We Built It)

1.  **Repository Clean-Up:** We started by auditing the codebase, deleting obsolete Python scripts and redundant directories to create a clean foundation.
2.  **Engine Scaffold:** We implemented the DLX algorithm (`DLXSolver.ts`) first to ensure we had a robust way to generate and validate grids instantly.
3.  **Frontend Foundation:** We built the responsive 9x9 grid (`SudokuBoard.tsx`), the `useGameInput.ts` hook for keyboard/mouse interaction, and the standalone `gameStore.ts` for Solo play.
4.  **Socket Architecture:** We mapped out the `network.ts` shared types, establishing the exact payloads for every `ClientToServer` and `ServerToClient` event.
5.  **Room Manager:** We built `Room.ts` on the backend to handle joining, leaving, and authoritative state transitions (Lobby -> Playing -> Finished).
6.  **Action Cards & Chaos:** We implemented the card dispensing logic in the backend, and the interactive `ActionCardHand.tsx` UI on the frontend, mapping targeting clicks to socket emits.
7.  **Premium Polish:** Finally, we integrated the advanced features: Optimistic UI, Ephemeral Cell Locking, Match Replays, the Human Hint Solver, Light/Dark mode, and the Redis scalable adapter.
8.  **Deployment Prep:** We ensured 100% TypeScript compilation success and Playwright test passing, culminating in a pristine `git push` to GitHub via the `gh` CLI.
