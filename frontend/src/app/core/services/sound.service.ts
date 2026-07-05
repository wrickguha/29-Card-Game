import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private ctx: AudioContext | null = null;
  
  // Settings Signals
  soundEnabled = signal<boolean>(true);
  musicEnabled = signal<boolean>(false); // music is placeholder for now

  constructor() {
    // AudioContext will be initialized on first user interaction to bypass browser policies
  }

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.soundEnabled.update(val => !val);
    this.playClick();
  }

  toggleMusic() {
    this.musicEnabled.update(val => !val);
    this.playClick();
  }

  // Synthesize: Button Click
  playClick() {
    if (!this.soundEnabled()) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  // Synthesize: Card Dealt (soft rustle/shuffe)
  playCardDeal() {
    if (!this.soundEnabled()) return;
    this.initContext();
    if (!this.ctx) return;

    // Create noise source
    const bufferSize = this.ctx.sampleRate * 0.12; // 0.12 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter to make it sound like paper sliding
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.12);
    filter.Q.setValueAtTime(3, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  // Synthesize: Card Play / Throw (louder snap/slap on felt)
  playCardThrow() {
    if (!this.soundEnabled()) return;
    this.initContext();
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    
    // Low frequency thud
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.15);
    
    oscGain.gain.setValueAtTime(0.2, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    
    osc.start();
    osc.stop(time + 0.15);

    // High frequency paper crackle
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1500, time);
    filter.Q.setValueAtTime(5, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.05, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start();
  }

  // Synthesize: Chips clinking (used in bidding)
  playChipClick() {
    if (!this.soundEnabled()) return;
    this.initContext();
    if (!this.ctx) return;

    const playClickTone = (delay: number, freq: number, gainAmt: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
      
      gain.gain.setValueAtTime(gainAmt, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + 0.05);

      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + 0.05);
    };

    // Synthesize two quick plastic chips hitting each other
    playClickTone(0, 3200, 0.08);
    playClickTone(0.02, 2800, 0.06);
  }

  // Synthesize: Notification / Turn alert
  playNotification() {
    if (!this.soundEnabled()) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(980, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1318, this.ctx.currentTime + 0.1); // Major third jump (C to E)

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  // Synthesize: Player Join
  playPlayerJoin() {
    if (!this.soundEnabled()) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  // Synthesize: Victory Fanfare (golden sound)
  playVictory() {
    if (!this.soundEnabled()) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (C Major)

    chords.forEach((freq, index) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.12);

      gain.gain.setValueAtTime(0.0, now + index * 0.12);
      gain.gain.linearRampToValueAtTime(0.15, now + index * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 1.2);

      osc.start(now + index * 0.12);
      osc.stop(now + index * 0.12 + 1.2);
    });
  }

  // Synthesize: Defeat Slide
  playDefeat() {
    if (!this.soundEnabled()) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    
    // Low filter sweep to make it feel sad
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 1.0);

    osc.disconnect(gain);
    osc.connect(filter);
    filter.connect(gain);

    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.8);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

    osc.start();
    osc.stop(now + 1.0);
  }

  // Synthesize: Trump Reveal (dramatic major chord sweep)
  playTrumpReveal() {
    if (!this.soundEnabled()) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // G major ascending arpeggio with high resonance
    const freqs = [392.00, 493.88, 587.33, 783.99]; // G4, B4, D5, G5

    freqs.forEach((freq, index) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);

      gain.gain.setValueAtTime(0.01, now + index * 0.08);
      gain.gain.linearRampToValueAtTime(0.12, now + index * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.8);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.8);
    });
  }
}
