/**
 * Âm thanh tạo bằng Web Audio API (không dùng file nhạc ngoài):
 * nền ù dưới nước, bong bóng, màn trập máy ảnh, chuông ghi nhận loài mới, cảnh báo, nhặt rác.
 */
import { Save } from './Save';

class AudioSys {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambient: { stop: () => void } | null = null;
  private musicGain: GainNode | null = null;

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = Save.data.settings.volume;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = Save.data.settings.music;
      this.musicGain.connect(this.master);
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  unlock(): void {
    const c = this.ensure();
    if (c && c.state === 'suspended') void c.resume();
  }

  setVolume(v: number, music: number): void {
    if (this.master) this.master.gain.value = v;
    if (this.musicGain) this.musicGain.gain.value = music;
  }

  private noiseBuffer(c: AudioContext, seconds: number): AudioBuffer {
    const b = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02; // brown noise
      d[i] = last * 3.5;
    }
    return b;
  }

  /** Nền ù dưới nước + hợp âm drone nhẹ. depth01 làm âm trầm hơn khi xuống sâu. */
  startAmbient(depth01 = 0): void {
    const c = this.ensure();
    if (!c || !this.musicGain) return;
    this.stopAmbient();
    const src = c.createBufferSource();
    src.buffer = this.noiseBuffer(c, 4);
    src.loop = true;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420 - depth01 * 250;
    const g = c.createGain();
    g.gain.value = 0.0;
    g.gain.linearRampToValueAtTime(0.35, c.currentTime + 2);
    src.connect(lp).connect(g).connect(this.musicGain);
    src.start();
    const oscs: OscillatorNode[] = [];
    const base = 110 - depth01 * 30;
    [1, 1.5, 2.01, 2.52].forEach((m, i) => {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = base * m;
      const og = c.createGain();
      og.gain.value = 0.018 / (i + 1);
      const lfo = c.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.03;
      const lg = c.createGain();
      lg.gain.value = 0.012 / (i + 1);
      lfo.connect(lg).connect(og.gain);
      o.connect(og).connect(this.musicGain!);
      o.start();
      lfo.start();
      oscs.push(o, lfo);
    });
    this.ambient = {
      stop: () => {
        try {
          g.gain.linearRampToValueAtTime(0, c.currentTime + 0.6);
          src.stop(c.currentTime + 0.7);
          oscs.forEach((o) => o.stop(c.currentTime + 0.7));
        } catch {
          /* bỏ qua */
        }
      },
    };
  }

  stopAmbient(): void {
    this.ambient?.stop();
    this.ambient = null;
  }

  private tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.2, slideTo?: number, delay = 0): void {
    const c = this.ensure();
    if (!c || !this.master) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  bubble(): void {
    const f = 380 + Math.random() * 500;
    this.tone(f, 0.09, 'sine', 0.05, f * 2.2);
  }

  shutter(): void {
    const c = this.ensure();
    if (!c || !this.master) return;
    const src = c.createBufferSource();
    const b = c.createBuffer(1, c.sampleRate * 0.12, c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.015));
    src.buffer = b;
    const hp = c.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.value = 2400;
    const g = c.createGain();
    g.gain.value = 0.5;
    src.connect(hp).connect(g).connect(this.master);
    src.start();
    this.tone(1800, 0.05, 'square', 0.04, undefined, 0.06);
  }

  discover(legendary = false): void {
    const notes = legendary ? [523, 659, 784, 1047, 1319] : [659, 784, 988];
    notes.forEach((n, i) => this.tone(n, legendary ? 1.6 : 0.7, 'triangle', 0.12, undefined, i * (legendary ? 0.18 : 0.09)));
    if (legendary) [262, 392, 523].forEach((n) => this.tone(n, 3, 'sine', 0.08, undefined, 0.2));
  }

  warn(): void {
    this.tone(160, 0.35, 'sawtooth', 0.12, 90);
    this.tone(150, 0.35, 'square', 0.05, 80, 0.05);
  }

  pickup(): void {
    this.tone(520, 0.12, 'triangle', 0.12, 880);
  }

  coral(): void {
    this.tone(300, 0.25, 'sine', 0.1, 180);
  }

  ui(): void {
    this.tone(880, 0.06, 'sine', 0.06);
  }

  scan(): void {
    this.tone(300, 0.9, 'sine', 0.08, 1400);
  }

  lowOxygen(): void {
    this.tone(440, 0.12, 'square', 0.05);
  }
}

export const Sound = new AudioSys();
