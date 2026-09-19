import React from "react";
import { useGameStore } from "@/store/gameStore";
import { Timer } from "./Timer";
import { AudioToggle } from "../AudioToggle";

export const GameHeader: React.FC = () => {
  const phase = useGameStore(state => state.phase);
  const mistakes = useGameStore(state => state.mistakes);
  const puzzle = useGameStore(state => state.puzzle);
  const pauseGame = useGameStore(state => state.pauseGame);
  const resumeGame = useGameStore(state => state.resumeGame);
  const abandonGame = useGameStore(state => state.abandonGame);
  
  if (!puzzle) return null;

  return (
    <div className="w-full max-w-sm sm:max-w-md flex items-center justify-between mb-4 px-2">
      <div className="flex flex-col">
        <span className="text-xs sm:text-sm text-slate-400 font-semibold uppercase tracking-wider">
          {puzzle.difficulty}
        </span>
        <span className="text-sm sm:text-base text-red-400 font-medium">
          Mistakes: {mistakes}
        </span>
      </div>
      
      <div className="flex flex-col items-center">
        <Timer />
      </div>

      <div className="flex gap-2 items-center">
        <AudioToggle />
        {phase === "playing" ? (
          <button 
            onClick={pauseGame}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-300 transition-colors"
            title="Pause Game"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          </button>
        ) : phase === "paused" ? (
          <button 
            onClick={resumeGame}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-md text-white transition-colors"
            title="Resume Game"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>
        ) : null}

        <button 
          onClick={abandonGame}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-300 transition-colors"
          title="Quit Game"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};
