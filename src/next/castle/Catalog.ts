import { isWing, type DefenseKind, type Rank, type SiteId } from '../construction/Catalog';
export type Role = 'warden' | 'marksman' | 'lancer' | 'chanter';
export type EnemyRole =
  | 'raider'
  | 'bulwark'
  | 'hexcaster'
  | 'arbalist'
  | 'sapper'
  | 'banneret'
  | 'ram'
  | 'reaver';
export type BossRole = 'golem' | 'dragon' | 'hollow-king';
export const isBoss = (role: string): role is BossRole =>
  ['golem', 'dragon', 'hollow-king'].includes(role);
export const isRanged = (role: string) =>
  ['marksman', 'chanter', 'hexcaster', 'arbalist'].includes(role);
export const isMeleeKnight = (role: string) => role === 'warden' || role === 'lancer';
export type Relic =
  | 'worldpiercer'
  | 'storm-oath'
  | 'black-standard'
  | 'dawn-engine'
  | 'tempest-cathedral'
  | 'ember-crown';
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
export const isSupport = isWing;
export const buildingUnlock = (kind: DefenseKind) =>
  kind === 'mortar' ? 7 : ['forge', 'war-room'].includes(kind) ? 5 : 0;
export const rankUnlock = (rank: Rank) => (rank === 3 ? 10 : rank === 2 ? 5 : 0);
export const fitsMount = (kind: DefenseKind, site: SiteId) =>
  mounts.some((m) => m.id === site && !!m.inner === isSupport(kind));
export const mountHeight = (site: SiteId, rank: Rank) =>
  mounts.find((m) => m.id === site)?.inner ? 0 : wallSpec(rank).height;
export const roles = {
  warden: { name: 'Warden', hp: 135, damage: 26, range: 2.1, speed: 4.3 },
  marksman: { name: 'Marksman', hp: 95, damage: 22, range: 9, speed: 4.5 },
  lancer: { name: 'Lancer', hp: 115, damage: 32, range: 2.8, speed: 5.2 },
  chanter: { name: 'Chanter', hp: 100, damage: 12, range: 8, speed: 4.4 },
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
  arbalist: { name: 'Ash Archer', hp: 85, damage: 18, speed: 1.5, range: 12, cost: 2 },
  sapper: { name: 'Cinder Sapper', hp: 65, damage: 50, speed: 2.8, range: 1.8, cost: 1.5 },
  banneret: { name: 'Black Banneret', hp: 150, damage: 12, speed: 1.5, range: 1.8, cost: 2 },
  ram: { name: 'Iron Ram', hp: 420, damage: 65, speed: 0.9, range: 2.1, cost: 4 },
  reaver: { name: 'Dusk Reaver', hp: 115, damage: 22, speed: 3.2, range: 1.8, cost: 2 },
};
export const enemyBounties: Record<EnemyRole, number> = {
  raider: 2,
  bulwark: 4,
  arbalist: 3,
  sapper: 3,
  hexcaster: 4,
  banneret: 5,
  ram: 10,
  reaver: 4,
};
export const recruitPrice = (id: string) => (id === 'iona' ? 160 : id === 'mira' ? 180 : 140);
export const recruitUnlock = (id: string) =>
  id === 'corvin' ? 2 : id === 'iona' ? 3 : ['lysa', 'mira'].includes(id) ? 6 : 0;
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
  {
    id: 'iona',
    name: 'Iona',
    role: 'lancer' as Role,
    trait: 'First Light',
    bio: 'A spear at the enemy flank. Charges through a clear lane to protect the company.',
  },
  {
    id: 'mira',
    name: 'Mira',
    role: 'chanter' as Role,
    trait: 'Evenhanded',
    bio: 'Keeps the company fighting with light bolts, healing hymns and protective wards.',
  },
] as const;
export const items = {
  anchor: {
    name: 'Anchor Rune',
    kind: 'rune',
    cost: 125,
    description: 'Primary shots push ordinary enemies 25% further.',
    model: 'WardInsignia',
  },
  afterglow: {
    name: 'Afterglow',
    kind: 'rune',
    cost: 140,
    description: 'A successful Guard adds 24 damage to the next shot; a perfect Guard adds 36.',
    model: 'StormInsignia',
  },
  'fleet-spurs': {
    name: 'Fleet Spurs',
    kind: 'gear',
    cost: 100,
    description: 'The equipped knight moves 15% faster.',
    model: 'WardInsignia',
  },
  'duelist-medal': {
    name: 'Duelist’s Medal',
    kind: 'gear',
    cost: 125,
    description: 'Attacks deal 20% more damage to an isolated enemy.',
    model: 'StormInsignia',
  },
  'beacon-charm': {
    name: 'Beacon Charm',
    kind: 'gear',
    cost: 130,
    description: 'The wearer’s healing abilities restore 25% more health.',
    model: 'StormInsignia',
  },
  'siege-hook': {
    name: 'Siege Hook',
    kind: 'gear',
    cost: 140,
    description: 'Attacks deal 35% more damage to Bulwarks and Rams.',
    model: 'WardInsignia',
  },
  'return-sigil': {
    name: 'Return Sigil',
    kind: 'gear',
    cost: 145,
    description: 'Once per battle, survive a lethal hit with 1 HP and 25 ward.',
    model: 'WardInsignia',
  },
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
    description: 'Every fourth successful royal shot restores 6 health to the most wounded living knight.',
    model: 'StormInsignia',
  },
  'forked-light': {
    name: 'Forked Light',
    kind: 'rune',
    cost: 145,
    description:
      'Every third successful royal shot sends a travelling spark at another nearby invader for 16 damage.',
    model: 'StormInsignia',
  },
} as const;
export type ItemKind = keyof typeof items;
export const itemUnlock = (kind: ItemKind) =>
  ['afterglow', 'return-sigil'].includes(kind)
    ? 10
    : kind === 'siege-hook'
      ? 7
      : ['forked-light', 'duelist-medal', 'beacon-charm'].includes(kind)
        ? 5
        : ['anchor', 'fleet-spurs'].includes(kind)
          ? 3
          : 0;
export const relics: Record<
  Relic,
  { name: string; system: string; effect: string; tradeoff: string; model: string; symbol: string }
> = {
  'dawn-engine': {
    name: 'Dawn Engine',
    system: 'AEGIS CONVERSION',
    effect: 'Guard discharges stored Aegis energy into nearby attackers.',
    tradeoff: 'Recharge is 20% slower. Stores up to 60 energy.',
    model: 'WorldpiercerModule',
    symbol: '☀',
  },
  'tempest-cathedral': {
    name: 'Tempest Cathedral',
    system: 'CONNECTED DEFENSES',
    effect: 'Spire attacks relay a 20-damage spark through a neighboring occupied wall mount.',
    tradeoff: 'Spire range is reduced by 2m. Relays cannot trigger another relay.',
    model: 'StormInsignia',
    symbol: 'ϟ',
  },
  'ember-crown': {
    name: 'Ember Crown',
    system: 'ROYAL GUARD',
    effect:
      'A successful Guard adds 12 damage to the next shot; a perfect Guard empowers three shots.',
    tradeoff: 'Royal Decree radius becomes 10m.',
    model: 'RoyalCrown',
    symbol: '♔',
  },
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
export { encounters } from './Encounters';
