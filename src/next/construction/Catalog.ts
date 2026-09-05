export type DefenseKind = 'ballista' | 'aegis';
export type Rank = 1 | 2 | 3;
export interface DefenseSpec {
  name: string;
  title: string;
  cost: number;
  health: number;
  range: number;
  arc: number;
  damage: number;
  interval: number;
  capacity: number;
  recharge: number;
}
export const allotment = 1200;
export const capacityLimit = 4;
export const sites = [
  { id: 'west-watch', name: 'West watch', x: -7, y: 0, z: -5 },
  { id: 'east-watch', name: 'East watch', x: 7, y: 0, z: -5.4 },
  { id: 'west-court', name: 'West courtyard', x: -7, y: 0, z: 3.5 },
  { id: 'east-court', name: 'East courtyard', x: 7, y: 0, z: 5.4 },
] as const;
export type SiteId = (typeof sites)[number]['id'];
export const defenses: Record<
  DefenseKind,
  { name: string; subtitle: string; capacity: number; description: string; ranks: DefenseSpec[] }
> = {
  ballista: {
    name: 'Royal Ballista',
    subtitle: 'TENSION · PRECISION · REACH',
    capacity: 2,
    description:
      'A tracking siege engine. Winds, aims and releases a physical bolt inside its firing arc. Tier III bolts pierce up to three targets.',
    ranks: [
      {
        name: 'Field carriage',
        title: 'I',
        cost: 100,
        health: 140,
        range: 13,
        arc: 110,
        damage: 34,
        interval: 3,
        capacity: 0,
        recharge: 0,
      },
      {
        name: 'Armored turntable',
        title: 'II',
        cost: 160,
        health: 220,
        range: 15,
        arc: 130,
        damage: 55,
        interval: 2.5,
        capacity: 0,
        recharge: 0,
      },
      {
        name: 'Siege frame',
        title: 'III',
        cost: 240,
        health: 320,
        range: 18,
        arc: 150,
        damage: 78,
        interval: 2.8,
        capacity: 0,
        recharge: 0,
      },
    ],
  },
  aegis: {
    name: 'Aegis Projector',
    subtitle: 'COVER · RESERVE · RECOVERY',
    capacity: 1,
    description:
      'Covers allies inside its forward arc. Intercepts sweeping rays crossing the barrier from outside. Ground impacts and fire bypass the shield.',
    ranks: [
      {
        name: 'Grounded focus',
        title: 'I',
        cost: 120,
        health: 180,
        range: 3.5,
        arc: 120,
        damage: 0,
        interval: 0,
        capacity: 50,
        recharge: 6,
      },
      {
        name: 'Ward array',
        title: 'II',
        cost: 170,
        health: 250,
        range: 4.5,
        arc: 140,
        damage: 0,
        interval: 0,
        capacity: 90,
        recharge: 9,
      },
      {
        name: 'Bastion engine',
        title: 'III',
        cost: 260,
        health: 330,
        range: 5.5,
        arc: 160,
        damage: 0,
        interval: 0,
        capacity: 140,
        recharge: 12,
      },
    ],
  },
};
export const spec = (kind: DefenseKind, rank: Rank) => defenses[kind].ranks[rank - 1];
export const investment = (kind: DefenseKind, rank: Rank) =>
  defenses[kind].ranks.slice(0, rank).reduce((sum, r) => sum + r.cost, 0);
export const modelIds = (['ballista', 'aegis'] as const).flatMap((kind) =>
  [1, 2, 3].map((rank) => `${kind}-${rank}`),
);
export const assetIds = [
  'paladin',
  'stormbow',
  'sunlance',
  'courtyard',
  ...modelIds,
  'company-kit',
  'castle-1',
  'castle-2',
  'castle-3',
  'castle-ground',
  'prism-dragon',
];
export const defaultYaw = (site: (typeof sites)[number]) => Math.atan2(-site.x, -7 - site.z);
