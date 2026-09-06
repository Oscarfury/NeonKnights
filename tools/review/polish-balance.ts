import {
  Battle,
  deltaAngle,
  distance,
  inTelegraph,
  wallPosition,
} from '../../src/next/castle/Battle';
import * as C from '../../src/next/castle/Campaign';

const results = [];
for (const loadout of ['solo', 'recruited'] as const) {
  const s = C.createCampaign();
  if (loadout === 'recruited') {
    C.build(s, 'tavern', 'inner-sw');
    C.recruit(s, 'elin');
    C.build(s, 'ballista', 'west-watch');
  }
  const b = new Battle(s);
  b.start();
  for (let frame = 0; frame < 60 * 120 && b.phase === 'battle'; frame++) {
    const targets = b.enemies
      .filter((e) => e.hp > 0)
      .sort((a, c) => distance(a, b.king) - distance(c, b.king));
    let heading = targets.length ? Math.atan2(targets[0].x, targets[0].z) : b.angle;
    if (b.dangers.some((t) => inTelegraph(t, wallPosition(heading, 2.28)))) {
      const safe = Array.from({ length: 64 }, (_, i) => (i * Math.PI) / 32).filter(
        (a) => !b.dangers.some((t) => inTelegraph(t, wallPosition(a, 2.28))),
      );
      safe.sort((a, c) => Math.abs(deltaAngle(a, b.angle)) - Math.abs(deltaAngle(c, b.angle)));
      heading = safe[0] ?? heading;
    }
    b.tick(1 / 60, {
      rotate: 0,
      heading,
      charge: false,
      decree: b.power >= 100 && targets.some((e) => distance(e, b.king) < 11),
    });
  }
  results.push({
    loadout,
    phase: b.phase,
    seconds: +b.time.toFixed(1),
    kingHp: b.king.hp,
    knightHp: b.knights.map((k) => Math.round(k.hp)),
    walls: b.state.walls,
    companyDamage: Math.round(b.stats.companyDamage),
    loot: b.loot,
  });
}
console.log(JSON.stringify(results, null, 2));
if (results.some((r) => r.phase !== 'won')) process.exitCode = 1;
