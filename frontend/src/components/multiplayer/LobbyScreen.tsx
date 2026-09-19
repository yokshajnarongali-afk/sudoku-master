import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { useMultiplayerStore } from "@/store/multiplayerStore";
import { generatePuzzle } from "@/engine/generator/PuzzleGenerator";
import type { GameMode, Difficulty } from "@sudoku/shared";

export const LobbyScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const currentRoom = useMultiplayerStore(state => state.currentRoom);
  const identity = useMultiplayerStore(state => state.identity);
  const toggleReady = useMultiplayerStore(state => state.toggleReady);
  const updateConfig = useMultiplayerStore(state => state.updateConfig);
  const leaveRoom = useMultiplayerStore(state => state.leaveRoom);
  const startGame = useMultiplayerStore(state => state.startGame);
  const kickPlayer = useMultiplayerStore(state => state.kickPlayer);
  const transferHost = useMultiplayerStore(state => state.transferHost);

  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Auto-connect socket if identity exists
  useEffect(() => {
    useMultiplayerStore.getState().connect();
  }, []);

  // Check if we were kicked
  useEffect(() => {
    if (currentRoom && identity && !currentRoom.players.some(p => p.identity.id === identity.id)) {
      alert("You were kicked from the room.");
      leaveRoom();
      onBack();
    }
  }, [currentRoom, identity, leaveRoom, onBack]);

  if (!currentRoom || !identity) return null;

  const isHost = currentRoom.hostId === identity.id;
  const me = currentRoom.players.find(p => p.identity.id === identity.id);

  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}?room=${currentRoom.code}` : `https://sudoku.app/?room=${currentRoom.code}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = () => {
    leaveRoom();
    onBack();
  };

  const handleStartGame = async () => {
    if (!isHost) return;
    setStarting(true);
    
    // Defer generation to not block UI thread during click
    setTimeout(async () => {
      const puzzle = generatePuzzle(currentRoom.config.difficulty);
      const res = await startGame({ puzzle });
      if (!res.ok) {
        alert("Failed to start game: " + res.error.message);
        setStarting(false);
      }
    }, 50);
  };

  return (
    <div className="w-full max-w-md flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300 relative">
      
      {showQR && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md rounded-2xl p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-6">Scan to Join</h3>
          <div className="bg-white p-4 rounded-xl">
            <QRCode value={joinUrl} size={200} />
          </div>
          <button 
            onClick={() => setShowQR(false)}
            className="mt-8 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {/* Header & Code */}
      <div className="flex flex-col items-center p-6 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
        <h2 className="text-xl font-bold text-white mb-1">Waiting Lobby</h2>
        <div className="flex flex-col items-center gap-3 mt-4">
          <div className="text-4xl font-mono font-black tracking-widest text-indigo-400">
            {currentRoom.code}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowQR(true)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>
              Show QR
            </button>
            <button 
              onClick={handleCopyCode}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm font-semibold transition-colors flex items-center gap-2"
            >
              {copied ? "Copied Link!" : "Copy Link"}
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <div className="flex flex-col gap-3 p-5 bg-slate-800/50 rounded-xl border border-slate-700/50">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Game Settings</h3>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Game Mode</span>
          <select 
            disabled={!isHost}
            value={currentRoom.config.gameMode}
            onChange={(e) => updateConfig({ config: { gameMode: e.target.value as GameMode } })}
            className="bg-slate-900 border border-slate-700 text-sm text-white rounded-md px-3 py-1.5 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          >
            <option value="cooperative">Cooperative</option>
            <option value="competitive">Competitive</option>
            <option value="chaos">Chaos Mode</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Difficulty</span>
          <select 
            disabled={!isHost}
            value={currentRoom.config.difficulty}
            onChange={(e) => updateConfig({ config: { difficulty: e.target.value as Difficulty } })}
            className="bg-slate-900 border border-slate-700 text-sm text-white rounded-md px-3 py-1.5 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
          </select>
        </div>
      </div>

      {/* Players List */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">
          Players ({currentRoom.players.length}/{currentRoom.config.maxPlayers})
        </h3>
        
        {currentRoom.players.map((p) => (
          <div key={p.identity.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {p.identity.displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-slate-200 font-medium">
                {p.identity.displayName} {p.identity.id === identity.id && "(You)"} {p.identity.id === currentRoom.hostId && "👑"}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {isHost && p.identity.id !== identity.id && (
                <div className="flex gap-1 mr-2 border-r border-slate-700 pr-2">
                  <button
                    onClick={() => transferHost(p.identity.id)}
                    className="p-1.5 bg-slate-700 hover:bg-indigo-600 rounded-md text-slate-300 transition-colors"
                    title="Make Host"
                  >
                    👑
                  </button>
                  <button
                    onClick={() => kickPlayer(p.identity.id)}
                    className="p-1.5 bg-slate-700 hover:bg-red-600 rounded-md text-slate-300 transition-colors"
                    title="Kick Player"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              )}
              {p.status === "disconnected" ? (
                <span className="text-xs font-semibold px-2 py-1 bg-red-900/30 text-red-400 rounded-md">Offline</span>
              ) : p.isReady ? (
                <span className="text-xs font-semibold px-2 py-1 bg-green-900/30 text-green-400 rounded-md">Ready</span>
              ) : (
                <span className="text-xs font-semibold px-2 py-1 bg-slate-900/50 text-slate-400 rounded-md">Waiting</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4">
        <button 
          onClick={handleLeave}
          className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors"
        >
          Leave
        </button>

        {!isHost && (
          <button 
            onClick={() => toggleReady(!me?.isReady)}
            className={`flex-1 py-3 font-bold rounded-xl transition-all ${
              me?.isReady 
                ? "bg-slate-700 text-slate-300 hover:bg-slate-600" 
                : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20"
            }`}
          >
            {me?.isReady ? "Cancel Ready" : "Ready Up"}
          </button>
        )}

        {isHost && (
          <button 
            disabled={!currentRoom.players.every(p => p.isReady || p.status === "disconnected") || starting}
            onClick={handleStartGame}
            className="flex-1 py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            {starting ? "Starting..." : "Start Game"}
          </button>
        )}
      </div>
    </div>
  );
};
