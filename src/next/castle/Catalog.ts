import type { DefenseKind, Rank, SiteId } from '../construction/Catalog';
export type Role = 'warden' | 'marksman';
export type EnemyRole = 'raider' | 'bulwark' | 'hexcaster';
export type Relic = 'worldpiercer' | 'storm-oath' | 'black-standard';
export const wallTiers = [
  { name: 'Outpost', height: 2.28, hp: 230, cost: 0, capacity: 4 },
  { name: 'Stonehold', height: 3.28, hp: 360, cost: 260, capacity: 6 },
  { name: 'Crownspire', height: 4.28, hp: 520, cost: 460, capacity: 8 },
] as const;
export const wallSpec = (rank: Rank) => wallTiers[rank - 1];
export const mounts: {
  id: SiteId;
  name: string;
  x: number;
  z: number;
  yaw: number;
  inner?: boolean;
}[] = [
  { id: 'west-watch', name: 'North', x: 0, z: -7.6, yaw: Math.PI },
  { id: 'east-watch', name: 'East', x: 7.6, z: 0, yaw: Math.PI / 2 },
  { id: 'east-court', name: 'South', x: 0, z: 7.6, yaw: 0 },
  { id: 'west-court', name: 'West', x: -7.6, z: 0, yaw: -Math.PI / 2 },
  { id: 'inner-nw', name: 'Courtyard NW', x: -1.4, z: -1.4, yaw: Math.PI, inner: true },
  { id: 'inner-ne', name: 'Courtyard NE', x: 1.4, z: -1.4, yaw: Math.PI, inner: true },
  { id: 'inner-se', name: 'Courtyard SE', x: 1.4, z: 1.4, yaw: 0, inner: true },
  { id: 'inner-sw', name: 'Courtyard SW', x: -1.4, z: 1.4, yaw: 0, inner: true },
];
export const isSupport = (kind: DefenseKind) => kind === 'tavern' || kind === 'sanctuary';
export const fitsMount = (kind: DefenseKind, site: SiteId) =>
  mounts.some((m) => m.id === site && !!m.inner === isSupport(kind));
export const mountHeight = (site: SiteId, rank: Rank) =>
  mounts.find((m) => m.id === site)?.inner ? 0 : wallSpec(rank).height;
export const roles = {
  warden: { name: 'Warden', hp: 135, damage: 26, range: 2.1, speed: 4.3 },
  marksman: { name: 'Marksman', hp: 95, damage: 22, range: 9, speed: 4.5 },
};
export const royalWeapons = {
  stormbow: {
    name: 'Stormbow',
    description: 'Rapid arrows. Tracks moving targets and knocks them back.',
    contact: 0.07,
    interval: 0.36,
    damage: 25,
    upgrade: 7,
  },
  sunlance: {
    name: 'Sunlance',
    description: 'Piercing sunbolts. Breaks shields and drives through three invaders.',
    contact: 0.06,
    interval: 0.62,
    damage: 43,
    upgrade: 10,
  },
} as const;
export const enemyRoles = {
  raider: { name: 'Ash Raider', hp: 94, damage: 13, speed: 2.25, range: 1.8, cost: 1 },
  bulwark: { name: 'Iron Bulwark', hp: 175, damage: 23, speed: 1.25, range: 2.1, cost: 2.5 },
  hexcaster: { name: 'Hexcaster', hp: 95, damage: 19, speed: 1.65, range: 12, cost: 2 },
};
export const recruits = [
  {
    id: 'aldren',
    name: 'Aldren',
    role: 'warden' as Role,
    trait: 'Steadfast',
    bio: 'Holds a threatened gate. His shield absorbs frontal blows.',
  },
  {
    id: 'elin',
    name: 'Elin',
    role: 'marksman' as Role,
    trait: 'Watchful',
    bio: 'Keeps her distance and fires at exposed invaders.',
  },
  {
    id: 'corvin',
    name: 'Corvin',
    role: 'warden' as Role,
    trait: 'Resolute',
    bio: 'A second shield for a second front.',
  },
  {
    id: 'lysa',
    name: 'Lysa',
    role: 'marksman' as Role,
    trait: 'Fleet-footed',
    bio: 'A reserve archer who can replace a wounded knight.',
  },
] as const;
export const items = {
  'ward-seal': {
    name: 'Ward Seal',
    kind: 'gear',
    cost: 85,
    description: 'Absorbs 12 damage from one hit, then recharges in 6 seconds.',
    model: 'WardInsignia',
  },
  'storm-seal': {
    name: 'Storm Seal',
    kind: 'gear',
    cost: 100,
    description: 'Adds 6 damage to the equipped knight’s attacks.',
    model: 'StormInsignia',
  },
  'field-kit': {
    name: 'Field Surgeon’s Kit',
    kind: 'gear',
    cost: 120,
    description: 'The knight automatically rescues one nearby fallen ally per encounter.',
    model: 'WardInsignia',
  },
  quickdraw: {
    name: 'Quickdraw Sigil',
    kind: 'rune',
    cost: 100,
    description: 'The socketed royal weapon recovers 15% faster.',
    model: 'StormInsignia',
  },
  sundering: {
    name: 'Sundering Brand',
    kind: 'rune',
    cost: 110,
    description: 'Adds 14 damage against shields and bosses.',
    model: 'WardInsignia',
  },
  'vital-spark': {
    name: 'Vital Spark',
    kind: 'rune',
    cost: 95,
    description: 'Every fourth royal hit restores 6 health to the most wounded living knight.',
    model: 'StormInsignia',
  },
  'forked-light': {
    name: 'Forked Light',
    kind: 'rune',
    cost: 145,
    description:
      'Every third royal hit sends a travelling spark at another nearby invader for 16 damage.',
    model: 'StormInsignia',
  },
} as const;
export type ItemKind = keyof typeof items;
export const relics: Record<
  Relic,
  { name: string; system: string; effect: string; tradeoff: string; model: string; symbol: string }
> = {
  worldpiercer: {
    name: 'Worldpiercer',
    system: 'BALLISTA CONVERSION',
    effect:
      'Ballistas fire heavy bolts for 2.2× damage, piercing up to five invaders and ignoring their shields.',
    tradeoff: 'Reload is 75% longer, turning is 50% slower, and the firing arc narrows to 75°.',
    model: 'WorldpiercerModule',
    symbol: '✦',
  },
  'storm-oath': {
    name: 'Oath of the Storm King',
    system: 'KING & COMPANY',
    effect:
      'Royal Decree marks its surviving targets. Your knights relay a 24-damage lightning bolt from a marked target to another nearby invader.',
    tradeoff: 'One relay per knight every 3 seconds. A relay cannot trigger another relay.',
    model: 'StormInsignia',
    symbol: '♔',
  },
  'black-standard': {
    name: 'The Black Standard',
    system: 'GARRISON STANDARD',
    effect:
      'Guarding knights gain 35% attack damage while fighting within 3 meters of their assigned gate position.',
    tradeoff: 'The bonus ends when a knight leaves that position or is assigned to hunt.',
    model: 'BlackStandard',
    symbol: '⚑',
  },
};
export const encounters = [
  {
    name: 'The First Watch',
    subtitle: 'Hold every side. Send the company beyond the gates.',
    budget: 18,
    interval: 2.5,
    reward: 430,
    boss: false,
  },
  {
    name: 'Break the Siege',
    subtitle: 'Rally the knights. Break the raiders and claim a siege relic.',
    budget: 28,
    interval: 1.9,
    reward: 740,
    boss: false,
  },
  {
    name: 'Emberwing — The Final Siege',
    subtitle: 'The Dragon hunts your knights, then burns the walls. Guard the marked section.',
    budget: 18,
    interval: 3.2,
    reward: 850,
    boss: true,
  },
] as const;
