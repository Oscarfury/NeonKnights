/** Plays all levels through public campaign transactions and ordinary battle input. */
import { writeFileSync } from 'node:fs';
import * as C from '../../src/next/castle/Campaign';
import { Battle, distance, wallSide } from '../../src/next/castle/Battle';
import { encounters, items, isBoss, recruits } from '../../src/next/castle/Catalog';
import { talents, talentRemaining } from '../../src/next/castle/Talents';
import type { DefenseKind, SiteId } from '../../src/next/construction/Catalog';
let s = C.createCampaign();
const report: unknown[] = [],
  checkpoints: C.Campaign[] = [];
function building(kind: DefenseKind, site: SiteId) {
  return C.build(s, kind, site);
}
const actions: Record<number, (() => unknown)[]> = {
  0: [
    () => building('tavern', 'inner-sw'),
    () => C.recruit(s, 'elin'),
    () => building('ballista', 'west-watch'),
  ],
  2: [() => building('sanctuary', 'inner-se')],
  3: [() => C.recruit(s, 'iona'), () => C.improveWeapon(s, 'stormbow')],
  4: [() => C.upgradeWalls(s)],
  5: [() => building('forge', 'inner-ne'), () => building('spire', 'east-watch')],
  6: [() => C.promote(s, 'aldren'), () => C.promote(s, 'elin')],
  7: [
    () => building('war-room', 'inner-nw'),
    () => C.upgradeBuilding(s, s.buildings.find((b) => b.kind === 'ballista')!.id),
  ],
  8: [() => C.promote(s, 'iona')],
  9: [() => C.upgradeWalls(s)],
  10: [
    () => C.improveWeapon(s, 'stormbow'),
    () => C.upgradeBuilding(s, s.buildings.find((b) => b.kind === 'sanctuary')!.id),
  ],
  11: [() => C.upgradeBuilding(s, s.buildings.find((b) => b.kind === 'sanctuary')!.id)],
  12: [() => C.promote(s, 'aldren'), () => C.promote(s, 'elin')],
  13: [
    () => C.upgradeBuilding(s, s.buildings.find((b) => b.kind === 'spire')!.id),
    () => C.upgradeBuilding(s, s.buildings.find((b) => b.kind === 'war-room')!.id),
  ],
  14: [
    () => C.promote(s, 'iona'),
    () => building('aegis', 'west-court'),
    () => building('mortar', 'east-court'),
  ],
};
for (let level = 0; level < 15; level++) {
  if (C.relicDue(s)) C.chooseRelic(s, level === 5 ? 'worldpiercer' : 'storm-oath');
  if (level === 13) C.ascendRelic(s, 'worldpiercer');
  for (const action of actions[level] || []) {
    const error = action();
    if (error) console.log('PURCHASE', level, error);
  }
  if (level >= 6 && !s.inventory.some((i) => i.kind === 'quickdraw')) {
    const offer = s.offers.findIndex((i) => i === 'quickdraw');
    if (offer >= 0 && !C.buyOffer(s, offer)) C.equipRune(s, 'stormbow', s.inventory.at(-1)!.id);
  }
  for (const k of s.knights) {
    const branch =
      recruits.find((r) => r.id === k.id)!.role === 'warden'
        ? 'Vanguard'
        : recruits.find((r) => r.id === k.id)!.role === 'marksman'
          ? 'Lifewarden'
          : 'Cavalier';
    for (const t of talents.filter((t) => t.branch === branch))
      if (talentRemaining(k) > 0 && !k.talents.includes(t.id)) C.learnTalent(s, k.id, t.id);
  }
  C.repairWalls(s);
  for (const b of s.buildings) C.repairBuilding(s, b.id);
  if (!C.decodeCampaign(JSON.stringify(s))) throw Error('Invalid checkpoint ' + level);
  checkpoints.push(structuredClone(s));
  const b = new Battle(s);
  b.start();
  let peak = 0,
    steps = 0;
  while (b.phase === 'battle' && steps++ < 60 * 210) {
    const threat = b.dangers.find((t) => t.wall !== undefined && t.age < t.windup);
    const target = b.enemies
      .filter((e) => e.hp > 0 && e.action !== 'arrive')
      .sort((a, c) => distance(a, b.king) - distance(c, b.king))[0];
    const heading = threat
      ? Math.PI - (threat.wall! * Math.PI) / 2
      : target
        ? Math.atan2(target.x, target.z)
        : b.angle;
    const guard =
      !!threat &&
      threat.windup - threat.age < 0.22 &&
      wallSide(b.king) === threat.wall &&
      b.guardCooldown === 0;
    b.tick(1 / 60, { rotate: 0, heading, guard, decree: b.power >= 100 });
    peak = Math.max(peak, b.enemies.filter((e) => e.hp > 0).length);
  }
  const row = {
    level: level + 1,
    name: encounters[level].name,
    phase: b.phase,
    seconds: +b.time.toFixed(2),
    peak,
    bank: b.state.gold,
    walls: b.state.walls.map((n) => Math.round(n)),
    knights: b.knights.map((k) => ({ id: k.roster, hp: Math.round(k.hp) })),
    boss: b.enemies.find((e) => isBoss(e.role))?.hp,
    stats: b.stats,
  };
  report.push(row);
  console.log(JSON.stringify(row));
  writeFileSync('output/campaign-playthrough.json', JSON.stringify(report, null, 2));
  writeFileSync('output/campaign-checkpoints.json', JSON.stringify(checkpoints, null, 2));
  if (b.phase !== 'won') process.exit(1);
  s = b.state;
}
