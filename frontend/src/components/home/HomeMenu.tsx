import React, { useState } from "react";
import { generatePuzzle } from "@/engine/generator/PuzzleGenerator";
import { useGameStore } from "@/store/gameStore";
import { useMultiplayerStore } from "@/store/multiplayerStore";
import type { Difficulty } from "@sudoku/shared";

export const HomeMenu: React.FC<{ onMultiplayerStart: () => void }> = ({ onMultiplayerStart }) => {
  const [loadingDiff, setLoadingDiff] = useState<Difficulty | null>(null);
  const [joinCode, setJoinCode] = useState("");
  
  const puzzle = useGameStore(state => state.puzzle);
  const phase = useGameStore(state => state.phase);
  const startGame = useGameStore(state => state.startGame);
  const resumeGame = useGameStore(state => state.resumeGame);

  // Multiplayer
  const identity = useMultiplayerStore(state => state.identity);
  const setIdentity = useMultiplayerStore(state => state.setIdentity);
  const connect = useMultiplayerStore(state => state.connect);
  const createRoom = useMultiplayerStore(state => state.createRoom);
  const joinRoom = useMultiplayerStore(state => state.joinRoom);

  const [nameInput, setNameInput] = useState(identity?.displayName || "");

  const handleNewSolo = (diff: Difficulty) => {
    setLoadingDiff(diff);
    setTimeout(() => {
      const p = generatePuzzle(diff);
      startGame(p);
      setLoadingDiff(null);
    }, 50);
  };

  const handleCreateRoom = async () => {
    if (!nameInput.trim()) return;
    setIdentity(nameInput);
    connect();
    
    await createRoom({
      identity: useMultiplayerStore.getState().identity!,
      config: {
        maxPlayers: 4,
        gameMode: "cooperative",
        difficulty: "medium",
        timeLimit: null,
        allowSpectators: false,
        chaosEnabled: false,
        actionCardsEnabled: false,
      }
    });
    onMultiplayerStart();
  };

  const handleJoinRoom = async () => {
    if (!nameInput.trim() || !joinCode.trim()) return;
    setIdentity(nameInput);
    connect();
    
    const res = await joinRoom({
      identity: useMultiplayerStore.getState().identity!,
      code: joinCode,
    });

    if (res.ok) {
      onMultiplayerStart();
    } else {
      alert(`Failed to join: ${res.error.message}`);
    }
  };

  const hasActiveGame = puzzle !== null && phase !== "finished" && phase !== "idle";

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm gap-8 animate-in fade-in zoom-in duration-300">
      <div className="text-center mb-4">
        <h1 className="text-5xl font-extrabold tracking-tight text-white mb-2">SUDOKU</h1>
        <p className="text-indigo-400 font-medium tracking-widest uppercase text-sm">Master</p>
      </div>

      {hasActiveGame && (
        <button 
          onClick={resumeGame}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 transition-all"
        >
          Resume Solo Game
        </button>
      )}

      {/* SOLO SECTION */}
      <div className="w-full flex flex-col gap-3 p-5 bg-slate-800/40 rounded-2xl border border-slate-700/50">
        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">New Solo Game</div>
        <div className="grid grid-cols-2 gap-2">
          {(["easy", "medium", "hard", "expert"] as Difficulty[]).map((diff) => (
            <button
              key={diff}
              onClick={() => handleNewSolo(diff)}
              disabled={loadingDiff !== null}
              className={`
                py-3 rounded-lg font-semibold uppercase tracking-wider text-xs transition-all border shadow-sm
                ${loadingDiff === diff 
                  ? "bg-slate-700 text-slate-400 border-slate-600 cursor-wait" 
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-500 active:bg-slate-600"
                }
              `}
            >
              {loadingDiff === diff ? "..." : diff}
            </button>
          ))}
        </div>
      </div>

      {/* MULTIPLAYER SECTION */}
      <div className="w-full flex flex-col gap-3 p-5 bg-slate-800/40 rounded-2xl border border-slate-700/50">
        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Multiplayer</div>
        
        <input 
          type="text"
          placeholder="Your Nickname"
          value={nameInput}
          onChange={e => setNameInput(e.target.value)}
          maxLength={16}
          className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 font-medium text-sm text-center mb-2"
        />

        <button 
          onClick={handleCreateRoom}
          disabled={!nameInput.trim()}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-lg transition-all text-sm shadow-md"
        >
          Create Room
        </button>

        <div className="flex gap-2">
          <input 
            type="text"
            placeholder="Room Code"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 font-mono font-bold text-center tracking-widest uppercase text-sm"
          />
          <button 
            onClick={handleJoinRoom}
            disabled={!nameInput.trim() || joinCode.length !== 6}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-lg transition-all text-sm shadow-md"
          >
            Join
          </button>
        </div>
      </div>

    </div>
  );
};
