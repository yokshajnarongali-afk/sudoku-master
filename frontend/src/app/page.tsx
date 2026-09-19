"use client";

import React, { useEffect, useState } from "react";
import { SudokuBoard } from "@/components/board/SudokuBoard";
import { NumberPad } from "@/components/board/NumberPad";
import { GameHeader } from "@/components/game/GameHeader";
import { GameControls } from "@/components/game/GameControls";
import { HomeMenu } from "@/components/home/HomeMenu";
import { LobbyScreen } from "@/components/multiplayer/LobbyScreen";
import { useGameInput } from "@/hooks/useGameInput";
import { useGameStore } from "@/store/gameStore";
import { useMultiplayerStore } from "@/store/multiplayerStore";

import { MultiplayerHUD } from "@/components/multiplayer/MultiplayerHUD";
import { ActionCardHand } from "@/components/multiplayer/ActionCardHand";

// App internal navigation state
export default function HomePage() {
  const puzzle = useGameStore(state => state.puzzle);
  const board = useGameStore(state => state.board);
  const phase = useGameStore(state => state.phase);
  
  const mpRoom = useMultiplayerStore(state => state.currentRoom);
  const mpIdentity = useMultiplayerStore(state => state.identity);

  // App internal navigation state
  const [view, setView] = useState<"home" | "solo" | "mp-lobby" | "mp-game">("home");

  // Hydration check
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const mpState = useMultiplayerStore.getState();
    if (mpState.gameState) {
      setView("mp-game");
    } else if (mpState.currentRoom) {
      setView("mp-lobby");
    } else if (useGameStore.getState().phase !== "idle") {
      setView("solo");
    }
  }, []);

  // Sync route view to multiplayer state
  const mpGameState = useMultiplayerStore(state => state.gameState);
  useEffect(() => {
    if (mpGameState) {
      setView("mp-game");
    } else if (mpRoom) {
      setView("mp-lobby");
    }
  }, [mpGameState, mpRoom]);

  // Update view based on solo game phase (e.g. if player abandons game)
  useEffect(() => {
    if (view === "solo" && phase === "idle") {
      setView("home");
    }
  }, [phase, view]);

  // Update view if player leaves multiplayer room completely
  useEffect(() => {
    if ((view === "mp-lobby" || view === "mp-game") && !mpRoom) {
      setView("home");
    }
  }, [mpRoom, view]);

  const {
    selectedCells,
    pencilMode,
    onCellClick,
    onDigit,
    onErase,
    onTogglePencil,
  } = useGameInput();

  if (!mounted) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  if (view === "home") {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <HomeMenu onMultiplayerStart={() => setView("mp-lobby")} />
      </div>
    );
  }

  if (view === "mp-lobby") {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <LobbyScreen onBack={() => setView("home")} />
      </div>
    );
  }

  // --- SOLO OR MULTIPLAYER GAME VIEW ---
  
  const isMultiplayer = view === "mp-game" && mpGameState;
  
  let activeBoard = board;
  if (isMultiplayer) {
    const isPersonalBoard = mpRoom?.config.gameMode === "competitive" || mpRoom?.config.gameMode === "chaos";
    activeBoard = isPersonalBoard && mpIdentity?.id ? mpGameState.playerBoards[mpIdentity.id] ?? null : mpGameState.board;
  }

  const activePhase = isMultiplayer ? mpGameState.phase : phase;
  
  if (!activeBoard) return null;

  const isFrozen = isMultiplayer && mpIdentity && mpGameState?.activeChaosEvents.some(
    e => e.type === "blind_zone" && e.affectedPlayerIds.includes(mpIdentity.id) && (e.expiresAt === null || e.expiresAt > Date.now())
  );

  const isShielded = isMultiplayer && mpIdentity && mpGameState?.activeChaosEvents.some(
    e => e.type === "speed_boost" && e.affectedPlayerIds.includes(mpIdentity.id)
  );

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-8 text-slate-100 font-sans">
      <div className="max-w-2xl w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
        
        {isMultiplayer ? <MultiplayerHUD /> : <GameHeader />}

        <div className={`relative ${isShielded ? "ring-4 ring-yellow-400/50 rounded-xl shadow-[0_0_30px_rgba(250,204,21,0.3)] transition-all" : ""}`}>
          <SudokuBoard
            grid={activeBoard}
            selectedCells={selectedCells}
            onCellClick={onCellClick}
          />
          
          {isFrozen && activePhase === "playing" && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-blue-500/20 rounded-[12px] backdrop-blur-[2px] animate-in fade-in duration-300 pointer-events-auto">
              <span className="text-4xl">❄️</span>
              <span className="text-xl font-bold tracking-widest text-blue-100 uppercase mt-2 drop-shadow-md">Frozen!</span>
            </div>
          )}

          {activePhase === "paused" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/80 rounded-[12px] backdrop-blur-sm">
              <span className="text-2xl font-bold tracking-widest text-white uppercase">Paused</span>
            </div>
          )}

          {activePhase === "finished" && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/80 rounded-[12px] backdrop-blur-sm animate-in fade-in duration-500">
              <span className="text-3xl font-extrabold text-green-400 mb-2">
                {isMultiplayer ? "Game Over!" : "Solved!"}
              </span>
              <button 
                onClick={() => {
                  if (isMultiplayer) {
                    useMultiplayerStore.getState().leaveRoom();
                  } else {
                    useGameStore.getState().abandonGame();
                  }
                }}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-semibold transition-colors mt-4 shadow-lg"
              >
                {isMultiplayer ? "Leave Room" : "Main Menu"}
              </button>
            </div>
          )}
        </div>

        {!isMultiplayer ? <GameControls /> : <ActionCardHand />}

        <NumberPad
          onDigit={onDigit}
          onErase={onErase}
          onTogglePencil={onTogglePencil}
          pencilMode={pencilMode}
        />
      </div>
    </div>
  );
}
