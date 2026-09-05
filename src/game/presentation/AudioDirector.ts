import type { Settings } from '../persistence/storage';
import type { RunState } from '../simulation/types';
export class AudioDirector {
  private context: AudioContext | null = null;
  private music: GainNode | null = null;
  private cooldown = 0;
  private prevKills = 0;
  private prevHP = 0;
  private prevWave = 0;
  constructor(public settings: Settings) {}
  unlock() {
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.music = this.context.createGain();
        this.music.gain.value = 0;
        this.music.connect(this.context.destination);
        for (const f of [55, 82.41, 110.1]) {
          const osc = this.context.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = f;
          osc.connect(this.music);
          osc.start();
        }
      }
      if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
    } catch {
      /* Audio is optional. */
    }
  }
  tone(freq: number, duration: number, volume: number, type: OscillatorType = 'sine') {
    if (!this.context || this.context.state !== 'running' || !this.settings.sfx) return;
    const now = this.context.currentTime,
      osc = this.context.createOscillator(),
      gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq * 0.4), now + duration);
    gain.gain.setValueAtTime(volume * this.settings.sfx, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.context.destination);
    osc.start(now);
    osc.stop(now + duration);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }
  update(run: RunState, dt: number) {
    const active = run.phase === 'battle' && !run.paused;
    this.cooldown -= dt;
    if (this.music && this.context)
      this.music.gain.setTargetAtTime(
        active ? this.settings.music * 0.045 : 0,
        this.context.currentTime,
        0.2,
      );
    if (active && this.cooldown <= 0) {
      if (run.hp < this.prevHP) {
        this.tone(90, 0.22, 0.3, 'triangle');
        this.cooldown = 0.15;
      } else if (run.kills > this.prevKills) {
        this.tone(380, 0.07, 0.13, 'triangle');
        this.cooldown = 0.06;
      } else if (run.wave !== this.prevWave) {
        this.tone(220, 0.6, 0.15);
      }
    }
    this.prevHP = run.hp;
    this.prevKills = run.kills;
    this.prevWave = run.wave;
  }
}
