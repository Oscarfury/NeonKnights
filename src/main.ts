import Phaser from 'phaser';
import './ui/style.css';
import { createRun, structureRank } from './game/simulation/RunState';
import { step } from './game/simulation/Simulation';
import { beginWave } from './game/simulation/WaveDirector';
import {
  buyOffer,
  chooseEvent,
  combinations,
  generateOffers,
  repair,
  reroll,
  sellPad,
  upgradePad,
} from './game/simulation/EconomySystem';
import { ANCHORS, WEAPONS, type Sector, type WeaponId } from './game/data/catalog';
import {
  checkpoint,
  clearCheckpoint,
  defaultSettings,
  getProfile,
  getSettings,
  loadCheckpoint,
  saveProfile,
  saveSettings,
} from './game/persistence/storage';
import { InputController } from './game/input/InputController';
import { AudioDirector } from './game/presentation/AudioDirector';
import { BattleRenderer } from './game/presentation/BattleRenderer';
import { UI } from './ui/UI';
import type { RunState } from './game/simulation/types';

let run = createRun();
let settings = getSettings(),
  profile = getProfile(),
  input: InputController;
let previewReturn: RunState | null = null,
  previewLimit = 0;
const audio = new AudioDirector(settings);
const ui = new UI(settings, profile, {
  action: handleAction,
  touch: (name, down) => input?.touch(name, down),
  setting: changeSetting,
});
ui.hasSave = !!loadCheckpoint();
function save() {
  ui.storageWarning = !checkpoint(run);
}
function refresh() {
  save();
  ui.render(run);
}
function pause(force = false) {
  if (run.phase !== 'battle' || ui.modal) return;
  if (force && run.paused) return;
  run.paused = !run.paused;
  run.charge = 0;
  input?.clear();
  ui.render(run);
}
function start(training = false) {
  const parsed = Number(ui.seed);
  run = createRun(
    ui.seed && Number.isFinite(parsed) ? parsed >>> 0 : Date.now() >>> 0,
    ui.selectedWeapon,
    ui.difficulty,
  );
  run.tutorial = ui.guided ? 0 : 4;
  run.training = training;
  if (training) {
    run.wave = 3;
    run.rank = 2;
    run.tutorial = 4;
  } else {
    run.phase = 'shop';
    checkpoint(run);
  }
  ui.modal = '';
  input?.clear();
  beginWave(run);
  ui.render(run);
  audio.unlock();
}
function returnPreview() {
  if (previewReturn) {
    run = previewReturn;
    previewReturn = null;
    previewLimit = 0;
    input.clear();
    ui.render(run);
  } else {
    run = createRun();
    ui.hasSave = !!loadCheckpoint();
    ui.render(run);
  }
}
function handleAction(name: string, value: string) {
  audio.unlock();
  switch (name) {
    case 'weapon':
      if (Object.hasOwn(WEAPONS, value)) ui.selectedWeapon = value as WeaponId;
      break;
    case 'start':
      start();
      return;
    case 'retry':
      ui.selectedWeapon = run.weapon;
      ui.difficulty = run.difficulty;
      previewReturn = null;
      start();
      return;
    case 'resume': {
      const saved = loadCheckpoint();
      if (saved) {
        run = saved;
        if (!run.offers.length && run.phase === 'shop') beginWave(run);
        input.clear();
      }
      break;
    }
    case 'training':
      start(true);
      return;
    case 'training-weapon': {
      const keys = Object.keys(WEAPONS) as WeaponId[];
      run.weapon = keys[(keys.indexOf(run.weapon) + 1) % keys.length];
      run.heat = 0;
      run.overheated = false;
      run.charge = 0;
      run.fireCooldown = 0;
      break;
    }
    case 'training-reset':
      beginWave(run);
      break;
    case 'preview-end':
      returnPreview();
      return;
    case 'preview': {
      if (run.phase !== 'shop') return;
      const offer = run.offers.find((o) => o.id === value);
      if (!offer) return;
      previewReturn = run;
      run = structuredClone(run);
      run.gold = 9999;
      run.training = true;
      run.paused = false;
      if (offer.kind === 'structure') run.pads[ui.selectedPad] = null;
      buyOffer(run, value, ui.selectedPad);
      if (run.rank === 3 && run.branch < 0) run.branch = 0;
      run.wave = 3;
      run.tutorial = 4;
      beginWave(run);
      previewLimit = 10;
      input.clear();
      break;
    }
    case 'pause':
      pause();
      return;
    case 'settings':
    case 'codex':
      if (run.phase === 'battle') run.paused = true;
      input?.clear();
      ui.modal = name;
      break;
    case 'close-modal':
      ui.modal = '';
      break;
    case 'reset-settings':
      settings = defaultSettings();
      ui.settings = settings;
      input.settings = settings;
      audio.settings = settings;
      saveSettings(settings);
      break;
    case 'menu':
      if (previewReturn) {
        returnPreview();
        return;
      }
      run = createRun();
      input.clear();
      ui.modal = '';
      ui.hasSave = !!loadCheckpoint();
      break;
    case 'buy':
      buyOffer(run, value, ui.selectedPad);
      break;
    case 'repair':
      repair(run);
      break;
    case 'reroll':
      reroll(run);
      break;
    case 'pad':
      ui.selectedPad = Math.max(0, Math.min(3, Number(value))) as Sector;
      break;
    case 'pad-upgrade':
      upgradePad(run, ui.selectedPad);
      break;
    case 'pad-sell':
      sellPad(run, ui.selectedPad);
      break;
    case 'branch':
      if (run.phase === 'shop' && run.rank === 3 && run.branch < 0 && ['0', '1'].includes(value))
        run.branch = Number(value);
      break;
    case 'capstone':
      if (run.phase === 'shop' && run.seals > 0 && !run.capstone) {
        run.seals--;
        run.capstone = true;
      }
      break;
    case 'dragonkin':
      if (
        run.phase === 'shop' &&
        run.seals > 0 &&
        !run.dragonkin &&
        structureRank(run, 'ossuary')
      ) {
        run.seals--;
        run.dragonkin = true;
      }
      break;
    case 'event':
      chooseEvent(run, value);
      break;
    case 'next':
      if (run.phase === 'shop' && !(run.rank === 3 && run.branch < 0)) {
        save();
        input.clear();
        beginWave(run);
      }
      break;
    case 'endless':
      if (run.phase === 'victory') {
        run.endless = true;
        run.wave = 16;
        run.phase = 'shop';
        generateOffers(run);
      }
      break;
    default:
      return;
  }
  for (const id of combinations(run))
    if (!profile.discoveries.includes(id)) profile.discoveries.push(id);
  saveProfile(profile);
  refresh();
}
function changeSetting(name: string, value: string | boolean) {
  if (name === 'order') {
    if (run.phase === 'shop' && (value === 'cavalry' || value === 'aegis')) run.order = value;
    refresh();
    return;
  }
  if (name.startsWith('bind:')) {
    const binding = name.slice(5),
      old = settings.bindings[binding];
    if (!old) return;
    const occupied = Object.keys(settings.bindings).find((k) => settings.bindings[k] === value);
    if (occupied) settings.bindings[occupied] = old;
    settings.bindings[binding] = String(value);
  } else if (
    ['motion', 'effects', 'numbers', 'slowToggle', 'orbit'].includes(name) &&
    typeof value === 'boolean'
  )
    (settings as unknown as Record<string, unknown>)[name] = value;
  else if (['sfx', 'music', 'uiScale'].includes(name)) {
    const n = Number(value);
    if (Number.isFinite(n))
      (settings as unknown as Record<string, unknown>)[name] = Math.max(
        0,
        Math.min(name === 'uiScale' ? 1.2 : 1, n),
      );
  }
  saveSettings(settings);
  input.clear();
  ui.render(run);
}
class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }
  preload() {
    this.load.image('knight', `${import.meta.env.BASE_URL}assets/knight-atlas.png`);
    this.load.on('loaderror', () => {
      document.getElementById('ui')!.textContent =
        'The knight artwork could not load. Reload to try again.';
    });
  }
  create() {
    this.scene.start('battle');
  }
}
class BattleScene extends Phaser.Scene {
  private painter!: BattleRenderer;
  private surface!: Phaser.Textures.CanvasTexture;
  private accumulator = 0;
  private hudTime = 0;
  constructor() {
    super('battle');
  }
  create() {
    this.surface = this.textures.createCanvas('battle-surface', 1280, 800)!;
    this.add.image(640, 400, 'battle-surface');
    this.painter = new BattleRenderer(
      this.surface.context,
      this.textures.get('knight').getSourceImage() as HTMLImageElement,
      settings,
    );
    input = new InputController(
      this.game.canvas,
      settings,
      () => {
        if (ui.modal) {
          ui.modal = '';
          ui.render(run);
        } else pause();
      },
      () => audio.unlock(),
    );
    input.pauseIfActive = () => pause(true);
    ui.render(run);
    // Inspection exposes copies only; simulation mutation is confined to development builds.
    Object.defineProperty(window, '__NEON__', {
      value: { snapshot: () => structuredClone(run), version: '2.0.0' },
      configurable: true,
    });
    if (import.meta.env.DEV)
      Object.defineProperty(window, '__NEON_DEV__', {
        value: {
          setRun: (next: RunState) => {
            run = next;
            ui.render(run);
          },
          getRun: () => run,
          step: (n = 1) => {
            for (let i = 0; i < n; i++) step(run, input.read());
          },
        },
        configurable: true,
      });
  }
  update(_time: number, delta: number) {
    const dt = Math.min(0.1, delta / 1000),
      previous = run.phase;
    this.accumulator = Math.min(0.1, this.accumulator + dt);
    while (this.accumulator >= 1 / 60) {
      step(run, input.read());
      this.accumulator -= 1 / 60;
    }
    if (run.phase !== previous) {
      input.clear();
      if ((run.phase === 'victory' || run.phase === 'defeat') && !run.training) {
        profile.runs++;
        if (run.phase === 'victory') profile.victories++;
        profile.best = Math.max(profile.best, Math.floor(run.score));
        saveProfile(profile);
        clearCheckpoint();
      }
      refresh();
    }
    if (previewReturn && run.phase === 'battle' && !run.paused) {
      previewLimit -= dt;
      if (previewLimit <= 0) returnPreview();
    }
    this.painter.settings = settings;
    this.painter.draw(run);
    this.surface.refresh();
    audio.update(run, dt);
    this.hudTime += dt;
    if (this.hudTime >= 0.1) {
      this.hudTime = 0;
      ui.update(run);
    }
  }
}
new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'battlefield',
  width: 1280,
  height: 800,
  backgroundColor: '#0b131e',
  banner: false,
  render: { antialias: true },
  audio: { noAudio: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, BattleScene],
});
