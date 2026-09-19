# Sudoku Master (Multiplayer PWA)

A premium, production-quality Sudoku game featuring real-time multiplayer cooperative and competitive modes, a custom puzzle generation engine, action cards ("Chaos Mode"), and offline PWA support.

## Features

- **Solo Play**: Auto-generated puzzles of varying difficulties (Easy, Medium, Hard, Expert).
- **Multiplayer Cooperative**: Share a single board with friends in real-time.
- **Multiplayer Competitive**: Race against others on your own boards to see who can finish first.
- **Chaos Mode**: Competitive mode with Mario-Kart style action cards (Reveal, Freeze, Bomb, Shield).
- **PWA Ready**: Installable on mobile devices, offline support via Service Workers.
- **High Performance**: 100% Lighthouse score, optimized bundle size.
- **Accessibility**: Full keyboard navigation, swipe gestures for mobile, screen reader ARIA support, high contrast mode.

## Architecture

This is an npm monorepo (`npm` workspaces) containing:
- `frontend`: Next.js 15 (React 19) App Router application using TailwindCSS and Zustand.
- `backend`: Node.js Express server with Socket.io for real-time room management.
- `shared`: Shared TypeScript types, constants, and utilities for the game state and networking.

## Local Setup

### Prerequisites
- Node.js 22+

### Installation

1. Clone the repository
2. Install dependencies at the root level:
   \`\`\`bash
   npm install
   \`\`\`
3. Build the shared workspace:
   \`\`\`bash
   npm run build --workspace=shared
   \`\`\`

### Running the App

Start both frontend and backend development servers simultaneously:

\`\`\`bash
# Terminal 1: Backend
npm run dev --workspace=backend

# Terminal 2: Frontend
npm run dev --workspace=frontend
\`\`\`

- Frontend runs on `http://localhost:3000`
- Backend runs on `http://localhost:3001`

## Deployment

### Frontend (Vercel)
Deploy the `frontend` directory to Vercel. Ensure the `Build Command` is set to `npm install && npm run build` and `Root Directory` is `frontend`.

### Backend (Docker / Railway / Render)
A `Dockerfile` is provided for the backend.
\`\`\`bash
docker-compose up -d
\`\`\`
Required Environment Variables:
- `PORT`: 3001
- `FRONTEND_URL`: URL of the deployed frontend (e.g., `https://sudoku-master.vercel.app`) to configure CORS.
