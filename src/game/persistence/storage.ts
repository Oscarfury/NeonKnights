import { WEAPONS, RUNES, STRUCTURES, ENEMIES, type WeaponId } from '../data/catalog';
import { createRun } from '../simulation/RunState';
import type { RunState } from '../simulation/types';
export interface Settings {
  motion: boolean;
  effects: boolean;
  numbers: boolean;
  sfx: number;
  music: number;
  slowToggle: boolean;
  orbit: boolean;
  uiScale: number;
  bindings: Record<string, string>;
}
export interface Profile {
  version: 2;
  best: number;
  victories: number;
  runs: number;
  discoveries: string[];
  legacyBest: number;
}
export const defaultSettings = (): Settings => ({
  motion: !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  effects: true,
  numbers: true,
  sfx: 0.4,
  music: 0.16,
  slowToggle: false,
  orbit: false,
  uiScale: 1,
  bindings: {
    north: 'KeyW',
    east: 'KeyD',
    south: 'KeyS',
    west: 'KeyA',
    slow: 'ShiftLeft',
    command: 'Space',
  },
});
const keys = {
  settings: 'neon-knights.settings.v2',
  profile: 'neon-knights.profile.v2',
  run: 'neon-knights.run.v2',
};
function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}
export function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function getSettings(): Settings {
  const d = defaultSettings(),
    s = read(keys.settings);
  if (!s || typeof s !== 'object') return d;
  const o = s as Record<string, unknown>;
  for (const k of ['motion', 'effects', 'numbers', 'slowToggle', 'orbit'] as const)
    if (typeof o[k] === 'boolean') d[k] = o[k];
  for (const k of ['sfx', 'music'] as const)
    if (typeof o[k] === 'number' && Number.isFinite(o[k])) d[k] = Math.max(0, Math.min(1, o[k]));
  if (typeof o.uiScale === 'number' && o.uiScale >= 0.85 && o.uiScale <= 1.2) d.uiScale = o.uiScale;
  const bindings = o.bindings as Record<string, unknown> | undefined;
  if (bindings && typeof bindings === 'object') {
    const seen = new Set<string>();
    for (const k of Object.keys(d.bindings)) {
      const code = bindings[k];
      if (
        typeof code === 'string' &&
        /^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Shift(Left|Right)|Space)$/.test(code) &&
        !seen.has(code)
      ) {
        d.bindings[k] = code;
        seen.add(code);
      }
    }
  }
  return d;
}
export const saveSettings = (settings: Settings) => write(keys.settings, settings);
export function getProfile(): Profile {
  const p = read(keys.profile) as Partial<Profile> | null;
  return {
    version: 2,
    best: Math.max(0, Number(p?.best) || 0),
    victories: Math.max(0, Number(p?.victories) || 0),
    runs: Math.max(0, Number(p?.runs) || 0),
    discoveries: Array.isArray(p?.discoveries)
      ? p.discoveries.filter((v): v is string => typeof v === 'string')
      : [],
    legacyBest: Math.max(0, Number(p?.legacyBest) || legacyBest()),
  };
}
function legacyBest(): number {
  for (const key of [
    'neon-knights-save-v1',
    'neonKnights',
    'neonKnightsSave',
    'neon-knights-save',
    'nk_save',
    'neon_knights_save',
  ]) {
    const data = read(key) as Record<string, unknown> | null;
    if (data && typeof data === 'object') {
      const value = Number(data.high || data.highScore || data.highscore || data.bestScore);
      if (Number.isFinite(value) && value > 0) return value;
    }
  }
  return 0;
}
export const saveProfile = (profile: Profile) => write(keys.profile, profile);
const numberFields = [
  'seed',
  'rng',
  'wave',
  'hp',
  'maxHp',
  'gold',
  'score',
  'kills',
  'seals',
  'rank',
  'branch',
  'orderRank',
  'souls',
  'babel',
  'respecAct',
  'completedWaves',
  'time',
  'worldTime',
  'tutorial',
] as const;
export function checkpoint(run: RunState): boolean {
  if (run.training || !['shop', 'event'].includes(run.phase)) return true;
  const data: Record<string, unknown> = {
    version: 2,
    phase: run.phase,
    weapon: run.weapon,
    difficulty: run.difficulty,
    order: run.order,
    endless: run.endless,
    capstone: run.capstone,
    dragonkin: run.dragonkin,
    runes: run.runes,
    pads: run.pads,
    bosses: run.bosses,
    offers: run.offers,
    rerolls: run.rerolls,
    lastLedger: run.lastLedger,
    damageTaken: run.damageTaken,
    damageBySource: run.damageBySource,
    eventChoice: run.eventChoice,
  };
  for (const k of numberFields) data[k] = run[k];
  return write(keys.run, data);
}
export function decodeCheckpoint(data: unknown): RunState | null {
  if (!data || typeof data !== 'object') return null;
  const s = data as Record<string, any>;
  if (
    s.version !== 2 ||
    !['shop', 'event'].includes(s.phase) ||
    !Object.hasOwn(WEAPONS, s.weapon) ||
    !['story', 'standard', 'veteran'].includes(s.difficulty) ||
    !['cavalry', 'aegis'].includes(s.order)
  )
    return null;
  for (const key of numberFields)
    if (typeof s[key] !== 'number' || !Number.isFinite(s[key])) return null;
  if (
    !Number.isInteger(s.wave) ||
    s.wave < 1 ||
    s.wave > 999 ||
    s.hp <= 0 ||
    s.hp > s.maxHp ||
    s.maxHp < 1 ||
    s.maxHp > 10000 ||
    s.gold < 0 ||
    s.gold > 1e9 ||
    s.rank < 1 ||
    s.rank > 3 ||
    !Number.isInteger(s.rank) ||
    s.branch < -1 ||
    s.branch > 1 ||
    !Number.isInteger(s.branch) ||
    s.orderRank < 1 ||
    s.orderRank > 3 ||
    s.seals < 0
  )
    return null;
  if (
    !s.runes ||
    typeof s.runes !== 'object' ||
    Array.isArray(s.runes) ||
    Object.keys(s.runes).length > 3
  )
    return null;
  for (const [key, value] of Object.entries(s.runes))
    if (
      !Object.hasOwn(RUNES, key) ||
      !Number.isInteger(value) ||
      (value as number) < 1 ||
      (value as number) > RUNES[key as keyof typeof RUNES].max
    )
      return null;
  if (
    !Array.isArray(s.pads) ||
    s.pads.length !== 4 ||
    s.pads.some(
      (p: any) =>
        p !== null && (!p || !Object.hasOwn(STRUCTURES, p.kind) || ![1, 2, 3].includes(p.rank)),
    )
  )
    return null;
  if (
    !Array.isArray(s.bosses) ||
    s.bosses.some((b: unknown) => typeof b !== 'string' || !Object.hasOwn(ENEMIES, b))
  )
    return null;
  if (
    !Array.isArray(s.offers) ||
    s.offers.length > 3 ||
    s.offers.some(
      (o: any) =>
        !o ||
        typeof o.id !== 'string' ||
        o.id.length > 100 ||
        typeof o.bought !== 'boolean' ||
        !['weapon', 'rune', 'structure', 'order', 'fort'].includes(o.kind) ||
        !(o.kind === 'weapon'
          ? Object.hasOwn(WEAPONS, o.key)
          : o.kind === 'rune'
            ? Object.hasOwn(RUNES, o.key)
            : o.kind === 'structure'
              ? Object.hasOwn(STRUCTURES, o.key)
              : o.kind === 'order'
                ? ['cavalry', 'aegis'].includes(o.key)
                : o.key === 'fort'),
    )
  )
    return null;
  const run = createRun(s.seed, s.weapon as WeaponId, s.difficulty);
  for (const key of numberFields) (run as unknown as Record<string, unknown>)[key] = s[key];
  run.phase = s.phase;
  run.order = s.order;
  run.runes = { ...s.runes };
  run.pads = s.pads.map((p: any) =>
    p ? { kind: p.kind, rank: p.rank, cooldown: 0, built: 1 } : null,
  );
  run.bosses = [...s.bosses];
  run.offers = s.offers.map((o: any) => ({ ...o }));
  for (const key of ['endless', 'capstone', 'dragonkin'] as const) run[key] = s[key] === true;
  run.rerolls = Number.isInteger(s.rerolls) && s.rerolls >= 0 && s.rerolls <= 2 ? s.rerolls : 0;
  for (const key of ['damageTaken', 'damageBySource', 'lastLedger'] as const)
    if (s[key] && typeof s[key] === 'object' && !Array.isArray(s[key]))
      for (const [name, value] of Object.entries(s[key]))
        if (
          typeof value === 'number' &&
          Number.isFinite(value) &&
          value >= 0 &&
          /^[a-zA-Z ]+$/.test(name)
        )
          (run[key] as Record<string, number>)[name] = value;
  return run;
}
export const loadCheckpoint = () => decodeCheckpoint(read(keys.run));
export function clearCheckpoint() {
  try {
    localStorage.removeItem(keys.run);
  } catch {
    /* Storage may be disabled. */
  }
}
