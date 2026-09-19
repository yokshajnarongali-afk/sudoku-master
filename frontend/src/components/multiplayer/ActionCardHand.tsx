import React, { useState } from "react";
import { useMultiplayerStore } from "@/store/multiplayerStore";
import { ACTION_CARDS } from "@sudoku/shared";
import type { ActionCardType } from "@sudoku/shared";

export const ActionCardHand: React.FC = () => {
  const gameState = useMultiplayerStore(state => state.gameState);
  const identity = useMultiplayerStore(state => state.identity);
  const room = useMultiplayerStore(state => state.currentRoom);
  
  const selectedCardId = useMultiplayerStore(state => state.activeTargetCardId);
  const setSelectedCardId = useMultiplayerStore(state => state.setActiveTargetCardId);

  if (!gameState || !identity || !room?.config.actionCardsEnabled) return null;

  const myPlayer = gameState.players.find(p => p.identity.id === identity.id);
  if (!myPlayer || myPlayer.actionCards.length === 0) return null;

  const handleCardClick = (cardId: string, type: ActionCardType) => {
    const def = ACTION_CARDS[type];
    if (!def) return;

    if (def.targetType === "none" || def.targetType === "self" || def.targetType === "global") {
      useMultiplayerStore.getState().useActionCard({ cardId, cardType: type, usedBy: identity.id, targetPlayerId: null, targetCell: null });
      setSelectedCardId(null);
    } else {
      setSelectedCardId(selectedCardId === cardId ? null : cardId);
    }
  };

  const activeDef = selectedCardId ? ACTION_CARDS[myPlayer.actionCards.find(c => c.id === selectedCardId)?.type || ""] : null;
  const opponents = gameState.players.filter(p => p.identity.id !== identity.id);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2">
      {selectedCardId && activeDef?.targetType === "opponent" && (
        <div className="flex gap-2 p-2 bg-slate-800 rounded-lg shadow-lg border border-indigo-500/50 mb-2 animate-in slide-in-from-bottom-2">
          {opponents.length === 0 ? (
            <span className="text-sm text-slate-400 px-2">No opponents</span>
          ) : (
            opponents.map(opp => (
              <button
                key={opp.identity.id}
                onClick={() => {
                  useMultiplayerStore.getState().useActionCard({ 
                    cardId: selectedCardId, 
                    cardType: activeDef.type, 
                    usedBy: identity.id, 
                    targetPlayerId: opp.identity.id, 
                    targetCell: null 
                  });
                  setSelectedCardId(null);
                }}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-bold text-white transition-colors"
              >
                Target {opp.identity.displayName}
              </button>
            ))
          )}
        </div>
      )}

      {selectedCardId && activeDef?.targetType === "cell" && (
        <div className="px-4 py-2 bg-indigo-900/80 text-indigo-200 text-sm font-bold rounded-full border border-indigo-500 shadow-lg animate-pulse">
          Tap a cell on the board to target
        </div>
      )}

      <div className="flex gap-2">
        {myPlayer.actionCards.map(card => {
          const def = ACTION_CARDS[card.type];
          const isSelected = selectedCardId === card.id;
          
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id, card.type)}
              className={`
                relative flex flex-col items-center justify-center w-20 h-28 rounded-xl border-2 transition-all duration-200
                ${isSelected ? 'bg-indigo-600 border-indigo-400 -translate-y-4 shadow-[0_0_15px_rgba(99,102,241,0.6)]' : 'bg-slate-800 border-slate-600 hover:border-indigo-500 hover:-translate-y-2 shadow-lg'}
              `}
            >
              <span className="text-2xl mb-1">
                {card.type === "reveal_cell" && "🔍"}
                {card.type === "freeze" && "❄️"}
                {card.type === "bomb" && "💣"}
                {card.type === "shield" && "🛡️"}
              </span>
              <span className="text-[10px] font-bold text-center leading-tight px-1 text-slate-200">
                {def?.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
