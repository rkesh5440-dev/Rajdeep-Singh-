class SoundFX {
  private ctx: AudioContext | null = null;
  public muted = false;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'triangle',
    gainVal = 0.12
  ) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  slash() {
    this.playTone(460, 115, 0.11, 'sawtooth', 0.08);
  }

  gunshot(kind: string) {
    if (kind === 'shotgun') {
      this.playTone(220, 45, 0.16, 'sawtooth', 0.14);
    } else if (kind === 'plasma') {
      this.playTone(760, 220, 0.13, 'sine', 0.11);
    } else if (kind === 'rifle') {
      this.playTone(540, 80, 0.14, 'square', 0.12);
    } else {
      this.playTone(440, 95, 0.08, 'square', 0.09);
    }
  }

  carTurbo() {
    this.playTone(110, 260, 0.24, 'sawtooth', 0.1);
  }

  carRam() {
    this.playTone(150, 48, 0.2, 'square', 0.15);
  }

  hit(crit = false) {
    if (crit) {
      this.playTone(280, 70, 0.18, 'square', 0.14);
      setTimeout(() => this.playTone(620, 320, 0.1, 'triangle', 0.09), 30);
    } else {
      this.playTone(190, 65, 0.12, 'square', 0.1);
    }
  }

  block() {
    this.playTone(720, 480, 0.09, 'sine', 0.12);
  }

  jump() {
    this.playTone(210, 420, 0.12, 'sine', 0.07);
  }

  dash() {
    this.playTone(340, 140, 0.1, 'triangle', 0.07);
  }

  skill(kind: string) {
    if (kind === 'heal') {
      this.playTone(440, 660, 0.22, 'sine', 0.1);
      setTimeout(() => this.playTone(660, 880, 0.24, 'sine', 0.1), 100);
    } else if (kind === 'lightning') {
      this.playTone(950, 180, 0.2, 'sawtooth', 0.12);
    } else if (kind === 'shield') {
      this.playTone(320, 520, 0.25, 'triangle', 0.1);
    } else {
      this.playTone(360, 110, 0.22, 'sawtooth', 0.12);
    }
  }

  pickup() {
    this.playTone(587, 880, 0.14, 'sine', 0.1);
  }

  potion() {
    this.playTone(420, 680, 0.16, 'sine', 0.11);
    setTimeout(() => this.playTone(680, 940, 0.18, 'triangle', 0.1), 80);
  }

  startChime() {
    this.playTone(440, 445, 0.12, 'triangle', 0.09);
    setTimeout(() => this.playTone(554, 560, 0.12, 'triangle', 0.09), 110);
    setTimeout(() => this.playTone(880, 890, 0.22, 'triangle', 0.12), 230);
  }

  death() {
    this.playTone(220, 90, 0.35, 'sawtooth', 0.13);
    setTimeout(() => this.playTone(150, 55, 0.45, 'square', 0.1), 180);
  }

  victory() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((n, idx) => {
      setTimeout(() => this.playTone(n, n * 1.02, 0.22, 'triangle', 0.11), idx * 110);
    });
  }

  defeat() {
    const notes = [330, 293, 246, 196];
    notes.forEach((n, idx) => {
      setTimeout(() => this.playTone(n, n * 0.96, 0.25, 'sawtooth', 0.08), idx * 130);
    });
  }
}

export const soundFX = new SoundFX();
