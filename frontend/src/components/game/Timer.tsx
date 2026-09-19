import React, { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const Timer: React.FC = () => {
  const timer = useGameStore(state => state.timer);
  const phase = useGameStore(state => state.phase);
  const incrementTimer = useGameStore(state => state.incrementTimer);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (phase === "playing") {
      interval = setInterval(() => {
        incrementTimer();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [phase, incrementTimer]);

  return (
    <div className="font-mono text-xl sm:text-2xl text-slate-300">
      {formatTime(timer)}
    </div>
  );
};
