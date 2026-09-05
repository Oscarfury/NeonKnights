import type { WeaponId, RuneId, StructureId, OrderId, EnemyId, Sector } from '../data/catalog';
export interface Point {
  x: number;
  y: number;
}
export type Phase = 'menu' | 'battle' | 'shop' | 'event' | 'victory' | 'defeat';
export interface Enemy extends Point {
  id: number;
  kind: EnemyId;
  hp: number;
  maxHp: number;
  sector: Sector;
  attackSector: Sector;
  timer: number;
  windup: number;
  exposed: number;
  stagger: number;
  poison: number;
  poisonTime: number;
  statusTick: number;
  dead: boolean;
  reward: boolean;
  summons: number;
  phase: number;
  limbs: [number, number];
  hitFlash: number;
}
export interface Attack {
  id: number;
  source: 'player' | 'structure' | 'squad' | 'status';
  weapon: WeaponId | 'bolt' | 'soul';
  damage: number;
  charge: number;
  chain: number;
  poison: boolean;
  hit: number[];
  guardBreak: boolean;
}
export interface Projectile extends Point {
  id: number;
  vx: number;
  vy: number;
  life: number;
  age: number;
  radius: number;
  attack: Attack;
  pierce: number;
  returning: boolean;
  returnHit: number[];
}
export interface Mark extends Point {
  id: number;
  life: number;
  radius: number;
  attack: Attack;
  orbital?: boolean;
}
export interface Effect extends Point {
  kind: 'hit' | 'line' | 'ring' | 'phase' | 'text';
  life: number;
  maxLife: number;
  color: string;
  x2?: number;
  y2?: number;
  radius?: number;
  text?: string;
}
export interface Knight extends Point {
  id: number;
  life: number;
  cooldown: number;
  spectral: boolean;
  dragon: boolean;
  target: Point;
}
export interface Spawn {
  time: number;
  kind: EnemyId;
  sector: Sector;
  offset: number;
  reward: boolean;
}
export interface Pad {
  kind: StructureId;
  rank: number;
  cooldown: number;
  built: number;
}
export interface Offer {
  id: string;
  kind: 'weapon' | 'rune' | 'structure' | 'order' | 'fort';
  key: string;
  bought: boolean;
}
export interface Ledger {
  bounties: number;
  completion: number;
  skill: number;
  treasury: number;
  spent: number;
}
export interface RunState {
  version: 2;
  seed: number;
  rng: number;
  phase: Phase;
  paused: boolean;
  difficulty: 'story' | 'standard' | 'veteran';
  wave: number;
  endless: boolean;
  training: boolean;
  time: number;
  worldTime: number;
  waveTime: number;
  hp: number;
  maxHp: number;
  gold: number;
  score: number;
  combo: number;
  kills: number;
  seals: number;
  bosses: EnemyId[];
  weapon: WeaponId;
  rank: number;
  branch: number;
  capstone: boolean;
  runes: Partial<Record<RuneId, number>>;
  pads: (Pad | null)[];
  order: OrderId;
  orderRank: number;
  sector: Sector;
  player: Point;
  aim: Point;
  energy: number;
  slow: boolean;
  regenDelay: number;
  slowLocked: boolean;
  fireCooldown: number;
  charge: number;
  heat: number;
  overheated: boolean;
  momentum: number;
  momentumCooldown: number;
  commandCooldown: number;
  altCooldown: number;
  orbitalCooldown: number;
  souls: number;
  echoes: number;
  radiance: number;
  babel: number;
  dragonkin: boolean;
  healed: number;
  nextId: number;
  spawnIndex: number;
  spawns: Spawn[];
  enemies: Enemy[];
  projectiles: Projectile[];
  marks: Mark[];
  knights: Knight[];
  effects: Effect[];
  offers: Offer[];
  rerolls: number;
  respecAct: number;
  eventChoice: string;
  ledger: Ledger;
  lastLedger: Ledger;
  damageTaken: Record<string, number>;
  damageBySource: Record<string, number>;
  lastThreat: string;
  lastSector: Sector;
  message: string;
  messageTime: number;
  tutorial: number;
  completedWaves: number;
  revision: number;
}
export interface Controls {
  fire: boolean;
  alt: boolean;
  slow: boolean;
  command: boolean;
  sector: Sector | null;
  aim: Point;
  orbit: boolean;
}
export const emptyControls = (): Controls => ({
  fire: false,
  alt: false,
  slow: false,
  command: false,
  sector: null,
  aim: { x: 940, y: 420 },
  orbit: false,
});
