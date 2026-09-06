import type { Battle } from './Battle';

/** Short, locally synthesised combat cues. No downloads or looping ambience. */
export class CombatAudio {
  private context?: AudioContext;
  private seen = new Set<number>();
  private cooldown = 0;
  private phase = 'planning';
  muted = false;
  constructor() {
    try {
      this.muted = localStorage.getItem('neon-knights:castle:muted') === 'true';
    } catch {
      /* session setting */
    }
  }
  unlock() {
    if (this.muted) return;
    try {
      this.context ||= new AudioContext();
      void this.context.resume().catch(() => {});
    } catch {
      /* The game remains playable without audio. */
    }
  }
  toggle() {
    this.muted = !this.muted;
    try {
      localStorage.setItem('neon-knights:castle:muted', String(this.muted));
    } catch {
      /* session setting */
    }
    if (this.muted) void this.context?.suspend().catch(() => {});
    else this.unlock();
  }
  private tone(
    from: number,
    to: number,
    length: number,
    volume: number,
    type: OscillatorType = 'sine',
  ) {
    const c = this.context;
    if (!c || c.state !== 'running' || this.muted) return;
    const o = c.createOscillator(),
      gain = c.createGain(),
      filter = c.createBiquadFilter();
    o.type = type;
    o.frequency.setValueAtTime(from, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(to, c.currentTime + length);
    filter.type = 'lowpass';
    filter.frequency.value = 1600;
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(volume, c.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + length);
    o.connect(filter).connect(gain).connect(c.destination);
    o.start();
    o.stop(c.currentTime + length + 0.02);
    o.onended = () => {
      o.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }
  update(b: Battle, dt: number) {
    if (b.phase === 'planning') {
      this.seen.clear();
      this.phase = b.phase;
      return;
    }
    if (b.paused) return;
    this.cooldown = Math.max(0, this.cooldown - dt);
    const warning = b.dangers.find((t) => t.kind !== 'hex' && !this.seen.has(t.id));
    if (warning) {
      this.seen.add(warning.id);
      this.tone(110, 230, 0.28, 0.045, 'triangle');
    }
    const fresh = b.effects.filter((e) => !this.seen.has(e.id));
    fresh.forEach((e) => this.seen.add(e.id));
    if (this.cooldown === 0 && fresh.length) {
      this.cooldown = 0.09;
      if (fresh.some((e) => e.kind === 'guard')) this.tone(420, 820, 0.18, 0.05, 'triangle');
      else if (fresh.some((e) => e.kind === 'decree')) this.tone(360, 55, 0.4, 0.09, 'triangle');
      else if (fresh.some((e) => e.kind === 'wall')) this.tone(105, 32, 0.2, 0.075, 'triangle');
      else if (fresh.some((e) => e.kind === 'death'))
        this.tone(480 + Math.min(8, b.streak) * 45, 780, 0.12, 0.035, 'sine');
      else if (fresh.some((e) => e.kind === 'charge')) this.tone(260, 960, 0.1, 0.04, 'triangle');
      else if (fresh.some((e) => e.kind === 'block')) this.tone(1400, 450, 0.07, 0.025, 'triangle');
      else if (fresh.some((e) => e.kind === 'hit')) this.tone(175, 65, 0.07, 0.035, 'triangle');
    }
    if (b.phase === 'won' && this.phase !== 'won') this.tone(392, 784, 0.5, 0.055, 'triangle');
    this.phase = b.phase;
    const live = new Set([...b.effects, ...b.dangers].map((e) => e.id));
    for (const id of this.seen) if (!live.has(id)) this.seen.delete(id);
  }
  dispose() {
    void this.context?.close().catch(() => {});
  }
}
