import { ANCHORS, type WeaponId } from '../data/catalog';
import type { Ledger, RunState } from './types';
export const emptyLedger = (): Ledger => ({
  bounties: 0,
  completion: 0,
  skill: 0,
  treasury: 0,
  spent: 0,
});
export function createRun(
  seed = Date.now() >>> 0,
  weapon: WeaponId = 'stormbow',
  difficulty: RunState['difficulty'] = 'standard',
): RunState {
  return {
    version: 2,
    seed: seed >>> 0,
    rng: seed >>> 0,
    phase: 'menu',
    paused: false,
    difficulty,
    wave: 1,
    endless: false,
    training: false,
    time: 0,
    worldTime: 0,
    waveTime: 0,
    hp: difficulty === 'story' ? 260 : 200,
    maxHp: difficulty === 'story' ? 260 : 200,
    gold: 80,
    score: 0,
    combo: 1,
    kills: 0,
    seals: 0,
    bosses: [],
    weapon,
    rank: 1,
    branch: -1,
    capstone: false,
    runes: {},
    pads: [null, null, null, null],
    order: 'cavalry',
    orderRank: 1,
    sector: 1,
    player: { ...ANCHORS[1] },
    aim: { x: 1000, y: 420 },
    energy: 100,
    slow: false,
    regenDelay: 0,
    slowLocked: false,
    fireCooldown: 0,
    charge: 0,
    heat: 0,
    overheated: false,
    momentum: 0,
    momentumCooldown: 0,
    commandCooldown: 0,
    altCooldown: 0,
    orbitalCooldown: 0,
    souls: 0,
    echoes: 0,
    radiance: 0,
    babel: 0,
    dragonkin: false,
    healed: 0,
    nextId: 1,
    spawnIndex: 0,
    spawns: [],
    enemies: [],
    projectiles: [],
    marks: [],
    knights: [],
    effects: [],
    offers: [],
    rerolls: 0,
    respecAct: 0,
    eventChoice: '',
    ledger: emptyLedger(),
    lastLedger: emptyLedger(),
    damageTaken: {},
    damageBySource: {},
    lastThreat: '',
    lastSector: 1,
    message: '',
    messageTime: 0,
    tutorial: 0,
    completedWaves: 0,
    revision: 0,
  };
}
export function random(run: RunState): number {
  run.rng = (Math.imul(run.rng, 1664525) + 1013904223) >>> 0;
  return run.rng / 4294967296;
}
export const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);
export const structureRank = (run: RunState, kind: string) =>
  run.pads.reduce((n, p) => n + (p?.kind === kind ? p.rank : 0), 0);
export function notifyRun(run: RunState, message: string) {
  run.message = message;
  run.messageTime = 3;
}
