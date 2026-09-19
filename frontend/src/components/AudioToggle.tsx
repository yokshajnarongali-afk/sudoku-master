import React, { useEffect, useState } from "react";
import { AudioManager } from "@/engine/audio/AudioManager";

export const AudioToggle: React.FC = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Initial sync
    const checkAudio = () => {
      setEnabled(AudioManager.getInstance().enabled);
    };
    checkAudio();
    
    // Polling because audio state might change from outside (though rare)
    const interval = setInterval(checkAudio, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggle = () => {
    const am = AudioManager.getInstance();
    am.toggleMute(!am.enabled);
    setEnabled(am.enabled);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    AudioManager.getInstance().setVolume(vol);
  };

  return (
    <div className="flex items-center gap-2 group relative">
      <button 
        onClick={toggle}
        className={`p-2 rounded-lg transition-colors flex items-center justify-center ${enabled ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 bg-slate-800'}`}
        title={enabled ? "Mute Audio" : "Enable Audio"}
      >
        {enabled ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
        )}
      </button>

      {enabled && (
        <input 
          type="range" 
          min="0" max="1" step="0.05"
          defaultValue={AudioManager.getInstance().volume}
          onChange={handleVolumeChange}
          className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer hidden sm:block opacity-50 hover:opacity-100 transition-opacity"
        />
      )}
    </div>
  );
};
