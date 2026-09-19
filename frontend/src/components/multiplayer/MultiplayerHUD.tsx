import React from "react";
import { useMultiplayerStore } from "@/store/multiplayerStore";

import { AudioToggle } from "../AudioToggle";

export const MultiplayerHUD: React.FC = () => {
  const room = useMultiplayerStore(state => state.currentRoom);
  const gameState = useMultiplayerStore(state => state.gameState);
  const identity = useMultiplayerStore(state => state.identity);

  if (!room || !gameState || !identity) return null;

  const isCompetitive = room.config.gameMode === "competitive" || room.config.gameMode === "chaos";

  // Sort players by score (desc) or completed cells (desc)
  const sortedPlayers = [...gameState.players].sort((a, b) => {
    if (isCompetitive) {
      return b.completedCells - a.completedCells;
    }
    return b.score - a.score;
  });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-2xl mb-4 flex flex-col gap-3">
      {/* Top Bar: Room Code and Timer */}
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-widest text-indigo-400">
            {room.code}
          </span>
          <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
            {room.config.gameMode}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <AudioToggle />
          <div className="text-2xl font-mono text-slate-300 font-bold">
            {formatTime(gameState.timeElapsed)}
          </div>
        </div>
      </div>

      {/* Players List / Progress Bars */}
      <div className="flex flex-col gap-2 p-3 bg-slate-800/80 rounded-xl border border-slate-700">
        {sortedPlayers.map(p => {
          const isMe = p.identity.id === identity.id;
          const progressPercent = Math.min(100, Math.max(0, (p.completedCells / 81) * 100));

          return (
            <div key={p.identity.id} className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                    {p.identity.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className={`font-semibold ${isMe ? "text-indigo-300" : "text-slate-300"}`}>
                    {p.identity.displayName} {isMe && "(You)"}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-slate-400 text-xs text-right w-16">
                    {isCompetitive ? `${Math.round(progressPercent)}%` : `${p.score} pts`}
                  </span>
                  {p.status === "disconnected" && (
                    <span className="text-[10px] text-red-400 font-bold bg-red-900/30 px-1 rounded">OFFLINE</span>
                  )}
                </div>
              </div>

              {isCompetitive && (
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${isMe ? "bg-indigo-500" : "bg-slate-500"}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
