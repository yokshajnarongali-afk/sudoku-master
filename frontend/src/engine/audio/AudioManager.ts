export class AudioManager {
  private static instance: AudioManager | null = null;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  
  public enabled = false;
  public volume = 0.5;

  private constructor() {
    if (typeof window !== "undefined") {
      const savedVol = localStorage.getItem("sudoku-volume");
      if (savedVol) this.volume = parseFloat(savedVol);
      const savedEnabled = localStorage.getItem("sudoku-audio-enabled");
      if (savedEnabled) this.enabled = savedEnabled === "true";
    }
  }

  public static getInstance(): AudioManager {
    if (!this.instance) {
      this.instance = new AudioManager();
    }
    return this.instance;
  }

  public init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.enabled ? this.volume : 0;
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx?.state === "suspended") {
      this.ctx.resume();
    }
    this.updateAmbientState();
  }

  private updateAmbientState() {
    if (!this.ctx || !this.masterGain) return;
    
    if (this.enabled) {
      if (!this.ambientOsc) {
        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.value = 0.05; // Very quiet background drone
        this.ambientGain.connect(this.masterGain);
        
        this.ambientOsc = this.ctx.createOscillator();
        this.ambientOsc.type = "sine";
        this.ambientOsc.frequency.value = 110; // Low A
        this.ambientOsc.connect(this.ambientGain);
        this.ambientOsc.start();
        
        // Gentle modulation
        const lfo = this.ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.1; // 10s cycle
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 10; // +-10hz wobble
        lfo.connect(lfoGain);
        lfoGain.connect(this.ambientOsc.frequency);
        lfo.start();
      }
    } else {
      if (this.ambientOsc) {
        this.ambientOsc.stop();
        this.ambientOsc.disconnect();
        this.ambientOsc = null;
        this.ambientGain?.disconnect();
        this.ambientGain = null;
      }
    }
  }

  public setVolume(vol: number) {
    this.volume = vol;
    if (typeof window !== "undefined") localStorage.setItem("sudoku-volume", vol.toString());
    if (this.masterGain && this.enabled) {
      this.masterGain.gain.setTargetAtTime(vol, this.ctx!.currentTime, 0.1);
    }
  }

  public toggleMute(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== "undefined") localStorage.setItem("sudoku-audio-enabled", enabled.toString());
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(enabled ? this.volume : 0, this.ctx!.currentTime, 0.1);
    }
    if (enabled && !this.ctx) {
      this.init();
    }
    this.updateAmbientState();
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volMultiplier = 1) {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5 * volMultiplier, this.ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public playDigitPlace(isCorrect: boolean) {
    if (isCorrect) {
      this.playTone(600, "sine", 0.1); // soft pop
    } else {
      this.playTone(150, "sawtooth", 0.2, 0.5); // dull buzz
    }
  }

  public playSelect() {
    this.playTone(400, "sine", 0.05, 0.3);
  }

  public playErase() {
    this.playTone(300, "triangle", 0.1, 0.5);
  }

  public playWin() {
    if (!this.enabled || !this.ctx) return;
    // Simple arpeggio
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, "sine", 0.3), i * 150);
    });
  }

  public playCardUse() {
    if (!this.enabled || !this.ctx) return;
    this.playTone(880, "square", 0.2, 0.2);
    setTimeout(() => this.playTone(440, "square", 0.3, 0.2), 100);
  }
}
