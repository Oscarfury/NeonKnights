import authored from './campaign-data.json';
import type { BossRole, EnemyRole } from './Catalog';

export interface AssaultPacket {
  trigger: string;
  side: 'N' | 'E' | 'S' | 'W';
  units: Partial<Record<EnemyRole, number>>;
}
export interface Encounter {
  name: string;
  subtitle: string;
  act: number;
  budget: number;
  interval: number;
  reward: number;
  bounty: number;
  boss: BossRole | null;
  bossHp: number;
  maxActive: number;
  packets: AssaultPacket[];
}
const hints = [
  'A single front. Let Aldren intercept while you fire from the wall.',
  'Shields on the causeway. Sunlance pierces their guard.',
  'Enemy archers shelter behind the screen. Move to their flank.',
  'Sappers carry lit barrels. Kill the fuse or guard the marked wall.',
  'The Procession Golem marches. Guard its fist and flying masonry.',
  'Ground hexes scatter the company. Hunt the casters.',
  'A planted black banner strengthens its formation. Break the bearer.',
  'The ram advances behind shields. Break the escort or guard its impact.',
  'Reavers hunt your ranged knights. Keep the company together.',
  'Emberwing hunts the company, then burns a named wall. Guard the fire.',
  'A shield captain leads the line while sappers circle behind.',
  'Hunters and a Hex Prelate threaten the company from two directions.',
  'Two rams, opposite approaches. Reposition between their strikes.',
  'The last bell sounds. Hold a relay of assaults around the castle.',
  'The Hollow King has come for the crown. Break his standard and guard his decree.',
];
const bounties: Record<string, number> = {
  raider: 2,
  bulwark: 4,
  arbalist: 3,
  sapper: 3,
  hexcaster: 4,
  banneret: 5,
  ram: 10,
  reaver: 4,
};
export const encounters: Encounter[] = authored.map((e, i) => ({
  name: e.name,
  subtitle: hints[i],
  act: e.act,
  interval: 0.6,
  budget: e.groups.reduce(
    (n, p) => n + Object.values(p.units).reduce<number>((s, c) => s + (c || 0), 0),
    0,
  ),
  reward: e.reward,
  bounty: e.groups.reduce(
    (n, p) =>
      n + Object.entries(p.units).reduce((s, [role, c]) => s + (c || 0) * bounties[role], 0),
    0,
  ),
  boss:
    e.boss === 'procession-golem'
      ? 'golem'
      : e.boss === 'emberwing'
        ? 'dragon'
        : e.boss === 'hollow-king'
          ? 'hollow-king'
          : null,
  bossHp: i === 4 ? 3800 : i === 9 ? 7600 : i === 14 ? 11000 : 0,
  maxActive: e.maxActive,
  packets: e.groups as AssaultPacket[],
}));
