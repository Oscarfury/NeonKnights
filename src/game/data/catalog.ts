export type WeaponId = 'stormbow' | 'sunlance' | 'cinder' | 'chakram' | 'starfall';
export type RuneId = 'chain' | 'multishot' | 'venom' | 'rapid' | 'precision' | 'momentum';
export type StructureId =
  | 'ballista'
  | 'tesla'
  | 'moat'
  | 'aegis'
  | 'chapel'
  | 'ossuary'
  | 'treasury'
  | 'workshop';
export type OrderId = 'cavalry' | 'aegis';
export type EnemyId =
  | 'squire'
  | 'shield'
  | 'lancer'
  | 'cleric'
  | 'wizard'
  | 'rogue'
  | 'ram'
  | 'pegasus'
  | 'dragon'
  | 'golem'
  | 'king';
export type Sector = 0 | 1 | 2 | 3;
export const SECTORS = ['North', 'East', 'South', 'West'];
export const CENTER = { x: 640, y: 420 };
export const ANCHORS = [
  { x: 640, y: 298 },
  { x: 794, y: 420 },
  { x: 640, y: 542 },
  { x: 486, y: 420 },
];
export const WEAPONS: Record<
  WeaponId,
  {
    name: string;
    icon: string;
    description: string;
    alt: string;
    weakness: string;
    damage: number;
    interval: number;
    color: string;
    branches: [string, string];
  }
> = {
  stormbow: {
    name: 'Stormbow',
    icon: '↗',
    description: 'Fast, precise arrows. A dependable answer to the approaching siege.',
    alt: 'Hold alternate to charge a piercing arrow. Release to fire.',
    weakness: 'Shields resist ordinary arrows. Charge or change your angle.',
    damage: 24,
    interval: 0.34,
    color: '#7ee7d2',
    branches: ['Forked Volley', 'Railstring'],
  },
  sunlance: {
    name: 'Sunlance',
    icon: '☀',
    description: 'A brilliant line of light that pierces an entire formation.',
    alt: 'Hold alternate for a focused, guard-breaking lance.',
    weakness: 'A long reload leaves other approaches exposed.',
    damage: 78,
    interval: 1.1,
    color: '#f3cd83',
    branches: ['Prism Lance', 'Siege Lance'],
  },
  cinder: {
    name: 'Cinder Engine',
    icon: '♨',
    description: 'A short cone of sustained fire. Keep the heat under control.',
    alt: 'Press alternate to vent, cool the engine, and push enemies back.',
    weakness: 'Short range. At full heat the engine must cool to 35%.',
    damage: 9,
    interval: 0.12,
    color: '#f79668',
    branches: ['Furnace Cone', 'Ember Mine'],
  },
  chakram: {
    name: 'Rift Chakram',
    icon: '◎',
    description: 'A wide blade strikes on its outward and returning journey.',
    alt: 'Press alternate to recall your blades toward your current bastion.',
    weakness: 'Plan the return path. Each blade has a limited flight time.',
    damage: 42,
    interval: 0.85,
    color: '#b9a0ff',
    branches: ['Orbit Guard', 'Twin Return'],
  },
  starfall: {
    name: 'Starfall Mortar',
    icon: '✦',
    description: 'Mark the earth for a delayed, devastating celestial impact.',
    alt: 'Press alternate to detonate all your active marks early.',
    weakness: 'The impact is delayed. Lead moving targets.',
    damage: 70,
    interval: 0.95,
    color: '#b7d1ff',
    branches: ['Comet Cluster', 'Crown Breaker'],
  },
};
export const weaponStats = (id: WeaponId, rank: number, rapid = 0) => ({
  damage: Math.round(WEAPONS[id].damage * (1 + (rank - 1) * 0.32)),
  interval: Number((WEAPONS[id].interval / (1 + rapid * 0.14)).toFixed(3)),
});
export const BRANCH_DETAILS: Record<WeaponId, [string, string]> = {
  stormbow: [
    'Two extra spread arrows at 30% damage. Each target is hit once per volley.',
    'Charged arrows deal a further 40% damage and pierce the formation.',
  ],
  sunlance: [
    'After piercing a line, light jumps once to another enemy within 240px for 60% damage.',
    'Every beam breaks guards, even without charging.',
  ],
  cinder: [
    'Cone range grows from 280 to 350px, with 29% less heat per tick.',
    'Venting plants an 80 damage mine at the cursor, detonating after 1.5s.',
  ],
  chakram: [
    'Returning blades orbit your current bastion briefly before being caught.',
    'The return pass deals 65% more damage. Reposition to guide it.',
  ],
  starfall: [
    'Impact radius grows from 80 to 112px.',
    'Exposed bosses take 60% more impact damage.',
  ],
};
export const CAPSTONES: Record<WeaponId, { name: string; description: string }> = {
  stormbow: {
    name: 'Tempest Crown',
    description: 'Charged arrows chain through three additional targets.',
  },
  sunlance: {
    name: 'Daybreak',
    description: 'A full charge explodes at the cursor for 40% lance damage.',
  },
  cinder: { name: 'Heart of the Furnace', description: 'Vent cooldown falls from 3s to 1.5s.' },
  chakram: {
    name: 'Riftstorm',
    description: 'Every throw launches two extra blades at 30% damage.',
  },
  starfall: {
    name: 'Heavenfall',
    description: 'Each volley gains a second delayed impact at 40% damage.',
  },
};
export const RUNES: Record<
  RuneId,
  { name: string; icon: string; description: string; max: number; weapons: WeaponId[] }
> = {
  chain: {
    name: 'Chain Lightning',
    icon: 'ϟ',
    description: 'Each attack jumps to up to 3 nearby enemies at 55% damage. Shared hit budget.',
    max: 3,
    weapons: ['stormbow', 'sunlance', 'chakram', 'starfall', 'cinder'],
  },
  multishot: {
    name: 'Multishot',
    icon: '⋔',
    description: 'Adds two wide shots at 30% damage each. A wider cone for Cinder.',
    max: 2,
    weapons: ['stormbow', 'cinder', 'chakram'],
  },
  venom: {
    name: 'Venom Seal',
    icon: '♧',
    description: 'Poison deals 3 damage per stack each second. 5 stacks maximum, lasts 3 seconds.',
    max: 1,
    weapons: ['stormbow', 'sunlance', 'chakram', 'starfall', 'cinder'],
  },
  rapid: {
    name: 'Rapid Mechanism',
    icon: '»',
    description: '14% more attacks per second per rank. Applies only to your weapon.',
    max: 3,
    weapons: ['stormbow', 'sunlance', 'chakram', 'starfall', 'cinder'],
  },
  precision: {
    name: 'Weak-point Sight',
    icon: '⊕',
    description:
      'Manual hits within 18px of an exposed target gain 40% damage. Enables Orbital Verdict.',
    max: 1,
    weapons: ['stormbow', 'sunlance', 'chakram', 'starfall', 'cinder'],
  },
  momentum: {
    name: 'Phase Momentum',
    icon: '◇',
    description:
      'The first shot within 1.5 seconds of phasing deals +45% damage. 2 second cooldown.',
    max: 1,
    weapons: ['stormbow', 'sunlance', 'chakram', 'starfall', 'cinder'],
  },
};
export const STRUCTURES: Record<
  StructureId,
  { name: string; icon: string; description: string; cost: number }
> = {
  ballista: {
    name: 'Royal Ballista',
    icon: '↟',
    description: 'Fires a 26 damage bolt every 1.3s into its sector. +26 damage per rank.',
    cost: 65,
  },
  tesla: {
    name: 'Tesla Pylon',
    icon: 'ϟ',
    description: 'A pulse jumps through 3 targets in its sector every 1.5s. 18 damage per rank.',
    cost: 75,
  },
  moat: {
    name: 'Electric Moat',
    icon: '≋',
    description: 'Near this wall, enemies move 40% slower and take 10 damage per rank per second.',
    cost: 65,
  },
  aegis: {
    name: 'Aegis Projector',
    icon: '⬡',
    description: 'Reduces incoming damage to this sector by 30% per rank, capped at 65%.',
    cost: 70,
  },
  chapel: {
    name: 'Chapel',
    icon: '✧',
    description: 'Restores 12 HP per rank after each wave. Enables Angelic Knights.',
    cost: 75,
  },
  ossuary: {
    name: 'Ossuary',
    icon: '♜',
    description: 'Eligible kills collect souls (cap 6). Commands spend souls on spectral knights.',
    cost: 75,
  },
  treasury: {
    name: 'Treasury Vault',
    icon: '◈',
    description: 'Adds 15% to eligible bounties, capped at 15 gold per rank each wave.',
    cost: 70,
  },
  workshop: {
    name: 'Engineer Workshop',
    icon: '⚒',
    description: 'Adds 25 maximum HP per rank. With Tesla, builds the Babel Engine over 3 waves.',
    cost: 80,
  },
};
export const ENEMIES: Record<
  EnemyId,
  {
    name: string;
    hp: number;
    speed: number;
    damage: number;
    bounty: number;
    radius: number;
    tip: string;
    boss?: boolean;
  }
> = {
  squire: {
    name: 'Squire',
    hp: 42,
    speed: 28,
    damage: 5,
    bounty: 4,
    radius: 12,
    tip: 'A loose formation. Clear the soldiers closest to the walls.',
  },
  shield: {
    name: 'Shield Knight',
    hp: 85,
    speed: 20,
    damage: 8,
    bounty: 7,
    radius: 15,
    tip: 'Charge a shot or phase to another angle to break its guard.',
  },
  lancer: {
    name: 'Lancer',
    hp: 55,
    speed: 35,
    damage: 15,
    bounty: 6,
    radius: 12,
    tip: 'A marked charge lane gives you time to interrupt the attack.',
  },
  cleric: {
    name: 'Cleric',
    hp: 60,
    speed: 17,
    damage: 4,
    bounty: 7,
    radius: 13,
    tip: 'Eliminate the gold halo before it heals the formation.',
  },
  wizard: {
    name: 'Wizard',
    hp: 70,
    speed: 16,
    damage: 7,
    bounty: 8,
    radius: 14,
    tip: 'Interrupt the violet sigil. Summoned troops give no bounty.',
  },
  rogue: {
    name: 'Rogue',
    hp: 48,
    speed: 42,
    damage: 12,
    bounty: 7,
    radius: 11,
    tip: 'Watch the footprints and the dagger warning near the wall.',
  },
  ram: {
    name: 'Siege Ram',
    hp: 240,
    speed: 14,
    damage: 25,
    bounty: 16,
    radius: 23,
    tip: 'Break its escort and focus the exposed wooden chassis.',
  },
  pegasus: {
    name: 'Pegasus',
    hp: 75,
    speed: 34,
    damage: 12,
    bounty: 7,
    radius: 16,
    tip: 'Flying troops ignore the moat. Track their dive warning.',
  },
  dragon: {
    name: 'Prism Dragon',
    hp: 1650,
    speed: 0,
    damage: 24,
    bounty: 80,
    radius: 52,
    tip: 'Break the chest rune during breath preparation. Its chest stays exposed after the attack.',
    boss: true,
  },
  golem: {
    name: 'Procession Golem',
    hp: 3300,
    speed: 0,
    damage: 32,
    bounty: 120,
    radius: 57,
    tip: 'Aim at the arm nodes to disable attacks. Stop carriers before they rebuild its body.',
    boss: true,
  },
  king: {
    name: 'Hollow King',
    hp: 4800,
    speed: 0,
    damage: 36,
    bounty: 180,
    radius: 43,
    tip: 'Defeat the decree formation to expose the crown. Use time slow to interrupt the final attack.',
    boss: true,
  },
};
export const ACTS = ['The Broken Causeway', 'The Ashen Siege', 'The Hollow Crown'];
export const COMBINATIONS = [
  {
    id: 'storm',
    name: 'Storm Cavalry',
    recipe: 'Cavalry + Chain Lightning',
    description: 'Commanded knights arc lightning to a second target.',
  },
  {
    id: 'angel',
    name: 'Angelic Knights',
    recipe: 'Cavalry + Chapel or Aegis',
    description: 'A successful command restores 8 HP, at most 16 per wave.',
  },
  {
    id: 'midas',
    name: 'Midas Legion',
    recipe: 'Cavalry + Treasury',
    description: 'Spend 10 gold with a command to add two gilded knights.',
  },
  {
    id: 'radiant',
    name: 'Radiant Aegis',
    recipe: 'Cinder Engine + Aegis',
    description: 'Blocked damage stores up to 60 heat. Vent releases a solar blast.',
  },
  {
    id: 'grave',
    name: 'Graveglass',
    recipe: 'Ossuary + Time slow',
    description: 'Slow-time kills bank up to three echoes, released when time resumes.',
  },
  {
    id: 'orbital',
    name: 'Orbital Verdict',
    recipe: 'Starfall + Weak-point Sight',
    description: 'An exposed target at the mark receives a second strike. 6s cooldown.',
  },
  {
    id: 'dragonkin',
    name: 'Dragonkin Lord',
    recipe: 'Ossuary + 1 boss seal',
    description: 'A permanent spectral dragon joins your limited garrison.',
  },
  {
    id: 'babel',
    name: 'The Babel Engine',
    recipe: 'Workshop + Tesla + 3 completed waves',
    description: 'A central spire releases a 60 damage pulse every 3 seconds.',
  },
] as const;
