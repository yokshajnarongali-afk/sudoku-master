"use client";
import { useEffect } from "react";
import { AudioManager } from "@/engine/audio/AudioManager";

export function AudioInitializer() {
  useEffect(() => {
    const initAudio = () => {
      AudioManager.getInstance().init();
    };
    
    // Web Audio API requires a user gesture to start
    window.addEventListener("click", initAudio, { once: true });
    window.addEventListener("keydown", initAudio, { once: true });
    window.addEventListener("touchstart", initAudio, { once: true });
    
    return () => {
      window.removeEventListener("click", initAudio);
      window.removeEventListener("keydown", initAudio);
      window.removeEventListener("touchstart", initAudio);
    };
  }, []);

  return null;
}
