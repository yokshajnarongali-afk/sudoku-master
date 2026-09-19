import { useState, useCallback, useEffect } from "react";
import type { RowIndex, ColIndex, CellDigit } from "@sudoku/shared";
import { useGameStore } from "../store/gameStore";
import { useMultiplayerStore } from "../store/multiplayerStore";

interface UseGameInputReturn {
  selectedCells: Set<string>;
  pencilMode: boolean;
  onCellClick: (r: RowIndex, c: ColIndex, shiftKey: boolean) => void;
  onDigit: (d: CellDigit) => void;
  onErase: () => void;
  onTogglePencil: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function useGameInput(): UseGameInputReturn {
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [pencilMode, setPencilMode] = useState(false);

  const placeDigit = useGameStore(state => state.placeDigit);
  const eraseCell = useGameStore(state => state.eraseCell);
  const togglePencilMark = useGameStore(state => state.togglePencilMark);
  const undo = useGameStore(state => state.undo);
  const redo = useGameStore(state => state.redo);

  const handleCellClick = useCallback((r: RowIndex, c: ColIndex, shiftKey: boolean) => {
    const mpState = useMultiplayerStore.getState();
    const activeCardId = mpState.activeTargetCardId;

    if (activeCardId) {
      // Find the card to know its type
      const myPlayer = mpState.gameState?.players.find(p => p.identity.id === mpState.identity?.id);
      const card = myPlayer?.actionCards.find(c => c.id === activeCardId);
      if (card && mpState.identity) {
        mpState.useActionCard({
          cardId: activeCardId,
          cardType: card.type,
          usedBy: mpState.identity.id,
          targetPlayerId: null,
          targetCell: { row: r, col: c }
        });
        mpState.setActiveTargetCardId(null);
      }
      return;
    }

    const id = `${r}-${c}`;
    setSelectedCells(prev => {
      const next = new Set(prev);
      if (shiftKey) {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      } else {
        next.clear();
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleDigit = useCallback((d: CellDigit) => {
    const mpState = useMultiplayerStore.getState();
    const isMultiplayer = !!mpState.gameState && mpState.currentRoom?.status === "playing";
    const isPersonalBoard = isMultiplayer && (mpState.currentRoom!.config.gameMode === "competitive" || mpState.currentRoom!.config.gameMode === "chaos");
    const myId = mpState.identity?.id;

    selectedCells.forEach(id => {
      const [rStr, cStr] = id.split("-");
      const r = Number(rStr) as RowIndex;
      const c = Number(cStr) as ColIndex;
      
      if (isMultiplayer) {
        const board = isPersonalBoard ? mpState.gameState!.playerBoards[myId!] : mpState.gameState!.board;
        if (!board) return;
        
        const cell = board[r][c];
        if (cell.given || (!isPersonalBoard && cell.lockedBy && cell.lockedBy !== myId)) return;

        if (pencilMode) {
          const type = cell.pencilMarks.includes(d) ? "pencil_remove" : "pencil_add";
          mpState.emitMove({ row: r, col: c, type, value: d });
        } else {
          mpState.emitMove({ row: r, col: c, type: "digit", value: d });
        }
      } else {
        if (pencilMode) {
          togglePencilMark(r, c, d);
        } else {
          placeDigit(r, c, d);
        }
      }
    });
  }, [selectedCells, pencilMode, placeDigit, togglePencilMark]);

  const handleErase = useCallback(() => {
    const mpState = useMultiplayerStore.getState();
    const isMultiplayer = !!mpState.gameState && mpState.currentRoom?.status === "playing";
    const isPersonalBoard = isMultiplayer && (mpState.currentRoom!.config.gameMode === "competitive" || mpState.currentRoom!.config.gameMode === "chaos");
    const myId = mpState.identity?.id;

    selectedCells.forEach(id => {
      const [rStr, cStr] = id.split("-");
      const r = Number(rStr) as RowIndex;
      const c = Number(cStr) as ColIndex;
      
      if (isMultiplayer) {
        const board = isPersonalBoard ? mpState.gameState!.playerBoards[myId!] : mpState.gameState!.board;
        if (!board) return;

        const cell = board[r][c];
        if (cell.given || (!isPersonalBoard && cell.lockedBy && cell.lockedBy !== myId)) return;

        mpState.emitMove({ row: r, col: c, type: "erase", value: null });
      } else {
        eraseCell(r, c);
      }
    });
  }, [selectedCells, eraseCell]);

  const togglePencil = useCallback(() => setPencilMode(p => !p), []);

  // Keyboard support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input field
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      // Undo / Redo Shortcuts (Cmd+Z, Ctrl+Z, Cmd+Shift+Z, Ctrl+Y)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      if (e.key >= "1" && e.key <= "9") {
        handleDigit(Number(e.key) as CellDigit);
      } else if (e.key === "Backspace" || e.key === "Delete") {
        handleErase();
      } else if (e.key.toLowerCase() === "p") {
        togglePencil();
      } else if (e.key.startsWith("Arrow")) {
        // Arrow navigation
        e.preventDefault();
        
        let r = 4;
        let c = 4;

        if (selectedCells.size === 1) {
          const [rStr, cStr] = Array.from(selectedCells)[0]!.split("-");
          r = Number(rStr);
          c = Number(cStr);
          
          if (e.key === "ArrowUp") r = Math.max(0, r - 1);
          if (e.key === "ArrowDown") r = Math.min(8, r + 1);
          if (e.key === "ArrowLeft") c = Math.max(0, c - 1);
          if (e.key === "ArrowRight") c = Math.min(8, c + 1);
        }
        
        handleCellClick(r as RowIndex, c as ColIndex, e.shiftKey);
      } else if (e.key === "Escape") {
        setSelectedCells(new Set());
      }
    };

    window.addEventListener("keydown", onKeyDown);

    let touchStartX = 0;
    let touchStartY = 0;
    
    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0]!.clientX;
      touchStartY = e.touches[0]!.clientY;
    };
    
    const onTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0]!.clientX;
      const touchEndY = e.changedTouches[0]!.clientY;
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      
      if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
        let key = "";
        if (Math.abs(dx) > Math.abs(dy)) {
          key = dx > 0 ? "ArrowRight" : "ArrowLeft";
        } else {
          key = dy > 0 ? "ArrowDown" : "ArrowUp";
        }
        onKeyDown(new KeyboardEvent("keydown", { key, cancelable: true }) as any);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [handleDigit, handleErase, handleCellClick, selectedCells, togglePencil, undo, redo]);

  return {
    selectedCells,
    pencilMode,
    onCellClick: handleCellClick,
    onDigit: handleDigit,
    onErase: handleErase,
    onTogglePencil: togglePencil,
    onUndo: undo,
    onRedo: redo
  };
}
