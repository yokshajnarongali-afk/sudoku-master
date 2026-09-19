import React from "react";
import type { CellDigit } from "@sudoku/shared";

interface NumberPadProps {
  onDigit: (d: CellDigit) => void;
  onErase: () => void;
  onTogglePencil: () => void;
  pencilMode: boolean;
}

export const NumberPad: React.FC<NumberPadProps> = ({
  onDigit,
  onErase,
  onTogglePencil,
  pencilMode
}) => {
  const digits: CellDigit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-sm sm:max-w-md mt-6 select-none touch-manipulation">
      {/* 
        On mobile: 2 rows (1-5, then 6-9 + tools)
        On sm+: single row of 11 items
      */}
      <div className="grid grid-cols-5 sm:flex sm:flex-row sm:justify-center gap-2 sm:gap-3 w-full">
        {digits.map((d) => (
          <button
            key={d}
            onPointerDown={(e) => {
              e.preventDefault();
              onDigit(d);
            }}
            className={`
              flex items-center justify-center 
              h-12 sm:h-14 sm:w-12 rounded-[8px] 
              bg-slate-700 hover:bg-slate-600 active:bg-indigo-500 active:text-white
              text-slate-100 font-bold text-xl sm:text-2xl transition-colors
              border border-slate-600 shadow-sm
            `}
          >
            {d}
          </button>
        ))}

        {/* Action Buttons */}
        <div className="col-span-2 sm:col-span-1 flex gap-2 sm:gap-3">
          {/* Pencil Toggle */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              onTogglePencil();
            }}
            className={`
              flex-1 sm:w-14 flex items-center justify-center 
              h-12 sm:h-14 rounded-[8px] transition-colors border shadow-sm
              ${pencilMode 
                ? "bg-indigo-500 border-indigo-400 text-white" 
                : "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
              }
            `}
            aria-label="Toggle Pencil Mode"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              <path d="m15 5 4 4"/>
            </svg>
          </button>

          {/* Erase */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              onErase();
            }}
            className="flex-1 sm:w-14 flex items-center justify-center h-12 sm:h-14 rounded-[8px] bg-slate-700 hover:bg-slate-600 border border-slate-600 text-red-400 shadow-sm transition-colors"
            aria-label="Erase Cell"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/>
              <line x1="18" x2="12" y1="9" y2="15"/>
              <line x1="12" x2="18" y1="9" y2="15"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
