import type { Settings } from '../persistence/storage';
import { emptyControls, type Controls } from '../simulation/types';
export class InputController {
  controls: Controls = emptyControls();
  private held = new Set<string>();
  private toggled = false;
  private touches = new Set<string>();
  private pending = new Set<string>();
  constructor(
    private canvas: HTMLCanvasElement,
    public settings: Settings,
    private pause: () => void,
    private unlock: () => void,
  ) {
    const aim = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      this.controls.aim = {
        x: ((e.clientX - r.left) * 1280) / r.width,
        y: ((e.clientY - r.top) * 800) / r.height,
      };
    };
    canvas.addEventListener('pointerdown', (e) => {
      this.unlock();
      aim(e);
      if (e.button === 2) this.controls.alt = true;
      else this.controls.fire = true;
      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    canvas.addEventListener('pointermove', aim);
    canvas.addEventListener('pointerup', (e) => {
      if (e.button === 2) this.controls.alt = false;
      else this.controls.fire = false;
    });
    canvas.addEventListener('pointercancel', () => this.clear());
    canvas.addEventListener('lostpointercapture', () => {
      this.controls.fire = false;
      this.controls.alt = false;
    });
    canvas.addEventListener('pointerleave', () => {
      this.controls.fire = false;
      this.controls.alt = false;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.code === 'Escape') {
        this.pause();
        return;
      }
      if (Object.values(this.settings.bindings).includes(e.code)) {
        e.preventDefault();
        this.unlock();
        if (!e.repeat && e.code === this.settings.bindings.slow && this.settings.slowToggle)
          this.toggled = !this.toggled;
        this.held.add(e.code);
        for (const [action, code] of Object.entries(this.settings.bindings))
          if (code === e.code) this.pending.add(action);
      }
    });
    window.addEventListener('keyup', (e) => this.held.delete(e.code));
    window.addEventListener('blur', () => {
      this.clear();
      this.pauseIfActive();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.clear();
        this.pauseIfActive();
      }
    });
  }
  pauseIfActive = () => {};
  touch(action: string, down: boolean) {
    this.unlock();
    if (down) {
      this.touches.add(action);
      this.pending.add(action);
    } else this.touches.delete(action);
  }
  read(): Controls {
    const b = this.settings.bindings,
      on = (name: string) =>
        this.held.has(b[name]) || this.touches.has(name) || this.pending.has(name);
    this.controls.slow = this.settings.slowToggle
      ? this.toggled || this.touches.has('slow')
      : on('slow');
    this.controls.command = on('command');
    this.controls.orbit = this.settings.orbit;
    this.controls.sector = on('north')
      ? 0
      : on('east')
        ? 1
        : on('south')
          ? 2
          : on('west')
            ? 3
            : null;
    const result = { ...this.controls, alt: this.controls.alt || on('alt') };
    this.pending.clear();
    return result;
  }
  clear() {
    this.controls.fire = false;
    this.controls.alt = false;
    this.controls.slow = false;
    this.controls.command = false;
    this.held.clear();
    this.touches.clear();
    this.pending.clear();
    this.toggled = false;
  }
}
