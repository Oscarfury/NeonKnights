export type WingKind = 'sanctuary' | 'tavern' | 'forge' | 'war-room';
export type DefenseKind = 'ballista' | 'aegis' | 'spire' | 'mortar' | WingKind;
export const isWing = (kind: DefenseKind): kind is WingKind =>
  ['sanctuary', 'tavern', 'forge', 'war-room'].includes(kind);
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
export type SiteId =
  | (typeof sites)[number]['id']
  | 'inner-nw'
  | 'inner-ne'
  | 'inner-se'
  | 'inner-sw';
export const defenses: Record<
  DefenseKind,
  { name: string; subtitle: string; capacity: number; description: string; ranks: DefenseSpec[] }
> = {
  forge: {
    name: 'Royal Forge',
    subtitle: 'TEMPERED ROYAL SHOTS',
    capacity: 0,
    description:
      'Every sixth royal shot gains bonus impact damage. Rank III also tempers a shot after a perfect Guard.',
    ranks: [1, 2, 3].map((rank) => ({
      name: ['Open smithy', 'Royal workshop', 'Forge tower'][rank - 1],
      title: ['I', 'II', 'III'][rank - 1],
      cost: [100, 150, 230][rank - 1],
      health: [180, 260, 360][rank - 1],
      range: 0,
      arc: 0,
      damage: [10, 16, 24][rank - 1],
      interval: 0,
      capacity: 0,
      recharge: 0,
    })),
  },
  'war-room': {
    name: 'War Room',
    subtitle: 'ROYAL DECREE & COMPANY WARD',
    capacity: 0,
    description:
      'Start with more Decree charge and recover it faster. Rank III Decrees shield your living knights.',
    ranks: [1, 2, 3].map((rank) => ({
      name: ['Map alcove', 'Command gallery', 'Crown signal room'][rank - 1],
      title: ['I', 'II', 'III'][rank - 1],
      cost: [110, 140, 220][rank - 1],
      health: [180, 260, 360][rank - 1],
      range: 0,
      arc: 0,
      damage: rank,
      interval: 0,
      capacity: 0,
      recharge: 0,
    })),
  },
  mortar: {
    name: 'Cinder Mortar',
    subtitle: 'ARCING SHELLS · AREA DAMAGE',
    capacity: 2,
    description:
      'Lobs physical shells into enemy formations. Minimum range 5m. Choose Scatterfire or Siegebreaker at rank III.',
    ranks: [1, 2, 3].map((rank) => ({
      name: ['Bombard carriage', 'Braced howitzer', 'Crown siege battery'][rank - 1],
      title: ['I', 'II', 'III'][rank - 1],
      cost: [160, 200, 280][rank - 1],
      health: [150, 225, 310][rank - 1],
      range: [13, 15, 17][rank - 1],
      arc: 150,
      damage: [45, 65, 90][rank - 1],
      interval: [4, 3.8, 3.6][rank - 1],
      capacity: 0,
      recharge: 0,
    })),
  },
  tavern: {
    name: 'The Crown & Ember',
    subtitle: 'TAVERN · RECRUITMENT',
    capacity: 0,
    description: 'Recruit knights here. Each rank grants 10 starting ward to your company.',
    ranks: [1, 2, 3].map((rank) => ({
      name: ['Hearthside tavern', 'Company inn', 'Royal guildhall'][rank - 1],
      title: ['I', 'II', 'III'][rank - 1],
      cost: [120, 140, 200][rank - 1],
      health: [180, 260, 360][rank - 1],
      range: 0,
      arc: 0,
      damage: rank * 10,
      interval: 0,
      capacity: 0,
      recharge: 0,
    })),
  },
  spire: {
    name: 'Storm Spire',
    subtitle: 'CHAIN LIGHTNING',
    capacity: 1,
    description:
      'Strikes the nearest invader, then chains to nearby enemies. Covers every direction.',
    ranks: [
      {
        name: 'Storm obelisk',
        title: 'I',
        cost: 140,
        health: 135,
        range: 10,
        arc: 360,
        damage: 20,
        interval: 3.8,
        capacity: 0,
        recharge: 0,
      },
      {
        name: 'Conductive array',
        title: 'II',
        cost: 180,
        health: 210,
        range: 12,
        arc: 360,
        damage: 30,
        interval: 3.4,
        capacity: 0,
        recharge: 0,
      },
      {
        name: 'Tempest cathedral',
        title: 'III',
        cost: 260,
        health: 290,
        range: 14,
        arc: 360,
        damage: 42,
        interval: 3,
        capacity: 0,
        recharge: 0,
      },
    ],
  },
  sanctuary: {
    name: 'Dawn Sanctuary',
    subtitle: 'COMPANY HEALING',
    capacity: 0,
    description:
      'Periodically restores health to the most wounded living knight in range. Cannot revive fallen units.',
    ranks: [
      {
        name: 'Wayside shrine',
        title: 'I',
        cost: 110,
        health: 160,
        range: 12,
        arc: 360,
        damage: 8,
        interval: 5,
        capacity: 0,
        recharge: 0,
      },
      {
        name: 'Dawn chapel',
        title: 'II',
        cost: 170,
        health: 240,
        range: 14,
        arc: 360,
        damage: 12,
        interval: 5,
        capacity: 0,
        recharge: 0,
      },
      {
        name: 'Radiant sanctum',
        title: 'III',
        cost: 250,
        health: 340,
        range: 16,
        arc: 360,
        damage: 18,
        interval: 5,
        capacity: 0,
        recharge: 0,
      },
    ],
  },
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
export const modelIds = (['ballista', 'aegis', 'spire', 'sanctuary', 'mortar'] as const).flatMap(
  (kind) => [1, 2, 3].map((rank) => `${kind}-${rank}`),
);
export const assetIds = [
  'paladin',
  'stormbow',
  'sunlance',
  'courtyard',
  ...modelIds,
  'company-kit',
  'campaign-kit',
  'iron-ram',
  'procession-golem',
  'castle-1',
  'castle-2',
  'castle-3',
  'castle-ground',
  'highland-foliage',
  'prism-dragon',
];
export const defaultYaw = (site: (typeof sites)[number]) => Math.atan2(-site.x, -7 - site.z);
