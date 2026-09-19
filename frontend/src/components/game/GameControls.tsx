import React from "react";
import { useGameStore } from "@/store/gameStore";
import { useGameInput } from "@/hooks/useGameInput";

export const GameControls: React.FC = () => {
  const phase = useGameStore(state => state.phase);
  const useHint = useGameStore(state => state.useHint);
  const undo = useGameStore(state => state.undo);
  const redo = useGameStore(state => state.redo);
  
  // We can also extract undo/redo from useGameInput if we want, but they just call the store anyway.

  if (phase !== "playing") return null;

  return (
    <div className="w-full max-w-sm sm:max-w-md flex justify-between gap-4 mt-4 mb-2">
      <button 
        onClick={undo}
        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-700 shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7v6h6"></path>
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
        </svg>
        Undo
      </button>
      
      <button 
        onClick={useHint}
        className="flex-1 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors border border-indigo-500/30 shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5"></path>
          <path d="M9 18h6"></path>
          <path d="M10 22h4"></path>
        </svg>
        Hint
      </button>

      <button 
        onClick={redo}
        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-700 shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 7v6h-6"></path>
          <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path>
        </svg>
        Redo
      </button>
    </div>
  );
};
