/** Checks authored design data and a purchase worksheet, not playable campaign balance. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

interface Packet {
  trigger: string;
  side: string;
  units: Record<string, number>;
}
interface Level {
  level: number;
  act: number;
  name: string;
  targetSeconds: number;
  reward: number;
  maxActive: number;
  introduces: string | null;
  boss: string | null;
  groups: Packet[];
}
interface Purchase {
  after: number;
  items: { name: string; cost: number }[];
  repairReserve: number;
}
const root = new URL('../../docs/overhaul-v3/', import.meta.url);
const design = JSON.parse(readFileSync(new URL('campaign-15.json', root), 'utf8')) as {
  status: string;
  startingCrowns: number;
  enemyBounty: Record<string, number>;
  levels: Level[];
  referencePurchases: Purchase[];
};
assert.equal(design.status, 'design-only');
assert.equal(design.levels.length, 15);
assert.equal(new Set(design.levels.map((l) => l.name)).size, 15);
assert.deepEqual(
  design.levels.filter((l) => l.boss).map((l) => l.level),
  [5, 10, 15],
);
const available = new Set<string>();
for (const [i, level] of design.levels.entries()) {
  assert.equal(level.level, i + 1);
  assert.equal(level.act, Math.floor(i / 5) + 1);
  assert.ok(level.maxActive >= 1 && level.maxActive <= (level.boss ? 5 : 11));
  assert.ok(level.targetSeconds >= 25 && level.targetSeconds <= 120);
  assert.ok(Number.isInteger(level.reward) && level.reward >= 0);
  if (level.introduces) {
    assert.ok(!available.has(level.introduces));
    available.add(level.introduces);
  }
  let lastTime = -1,
    lastHp = 100;
  for (const packet of level.groups) {
    assert.ok(['N', 'E', 'S', 'W'].includes(packet.side));
    if (packet.trigger.startsWith('hp')) {
      assert.ok(level.boss);
      const hp = Number(packet.trigger.slice(2));
      assert.ok(hp > 0 && hp < lastHp);
      lastHp = hp;
    } else {
      const time = Number(packet.trigger);
      assert.ok(Number.isFinite(time) && time > lastTime && time < level.targetSeconds);
      lastTime = time;
    }
    assert.ok(Object.keys(packet.units).length > 0);
    for (const [role, count] of Object.entries(packet.units)) {
      assert.ok(available.has(role), `Level ${level.level} uses untaught ${role}`);
      assert.ok(Object.hasOwn(design.enemyBounty, role));
      assert.ok(Number.isInteger(count) && count > 0);
    }
  }
}
assert.equal(available.size, 8);
const bounty = (level: Level) =>
  level.groups.reduce(
    (sum, packet) =>
      sum +
      Object.entries(packet.units).reduce(
        (n, [role, count]) => n + design.enemyBounty[role] * count,
        0,
      ),
    0,
  );

// Exact costs/gates for the illustrated route, taken from UPGRADE_PATHS.md.
// Other legal builds are intentionally not inferred from this one route.
const catalogue: Record<string, { cost: number; after: number; requires: string[] }> = {};
const add = (name: string, cost: number, after: number, ...requires: string[]) => {
  catalogue[name] = { cost, after, requires };
};
add('Tavern I', 120, 0);
add('Recruit Elin', 140, 0, 'Tavern I');
add('Ballista I', 100, 0);
add('Sanctuary I', 110, 0);
add('Recruit Iona', 160, 3, 'Tavern I');
add('Stormbow II', 150, 3);
add('Stonehold II', 260, 4);
add('Forge I', 100, 5);
add('Storm Spire I', 140, 0);
add('War Room I', 110, 5);
add('Quickdraw', 100, 0);
add('Crownspire III', 460, 9, 'Stonehold II');
add('Stormbow III', 280, 10, 'Stormbow II');
add('Sanctuary II', 170, 5, 'Sanctuary I', 'Stonehold II');
add('Sanctuary III', 250, 10, 'Sanctuary II', 'Crownspire III');
add('Ballista II', 160, 5, 'Ballista I', 'Stonehold II');
add('Ballista III', 240, 10, 'Ballista II', 'Crownspire III');
add('Storm Spire II', 180, 5, 'Storm Spire I', 'Stonehold II');
add('War Room II', 140, 5, 'War Room I', 'Stonehold II');
add('Aegis I', 120, 0);
add('Sundering', 110, 0);
add('Cinder Mortar I', 160, 7);
for (const name of ['Aldren', 'Elin', 'Iona']) {
  add(name + ' II', 100, 5, ...(name === 'Aldren' ? [] : ['Recruit ' + name]));
  add(name + ' III', 180, 10, name + ' II');
}
assert.equal(design.referencePurchases.length, 15);
let bank = design.startingCrowns,
  repairs = 0,
  invested = 0;
const owned = new Set<string>();
const recruitedAt = new Map([['Aldren', 0]]);
const csv = [
  'after_level,level_name,clear_purse,bounties,purchases,repair_reserve,remaining_crowns,choices',
];
for (const [i, visit] of design.referencePurchases.entries()) {
  assert.equal(visit.after, i);
  const level = design.levels[i - 1];
  const earned = level ? level.reward + bounty(level) : 0;
  bank += earned;
  for (const item of visit.items) {
    const rule = catalogue[item.name];
    assert.ok(rule, `Unknown worksheet purchase ${item.name}`);
    assert.equal(item.cost, rule.cost);
    assert.ok(visit.after >= rule.after, `${item.name} is locked`);
    assert.ok(
      rule.requires.every((r) => owned.has(r)),
      `${item.name} lacks its prerequisite`,
    );
    assert.ok(!owned.has(item.name), `Duplicate purchase ${item.name}`);
    if (item.name.startsWith('Recruit ')) recruitedAt.set(item.name.slice(8), visit.after);
    const promotion = /^(Aldren|Elin|Iona) (II|III)$/.exec(item.name);
    if (promotion) {
      const recruited = recruitedAt.get(promotion[1])!;
      const xp = Math.min(16, recruited * 2) + (visit.after - recruited) * 2;
      assert.ok(xp >= (promotion[2] === 'II' ? 6 : 16), 'Promotion lacks service XP');
    }
    owned.add(item.name);
    bank -= item.cost;
    invested += item.cost;
    assert.ok(bank >= 0, `Cannot afford ${item.name} after ${visit.after}`);
  }
  bank -= visit.repairReserve;
  repairs += visit.repairReserve;
  assert.ok(bank >= 0, `No repair reserve after ${visit.after}`);
  csv.push(
    [
      visit.after,
      level?.name ?? 'Opening council',
      level?.reward ?? 0,
      level ? bounty(level) : 0,
      visit.items.reduce((n, x) => n + x.cost, 0),
      visit.repairReserve,
      bank,
      '"' + visit.items.map((x) => x.name).join('; ') + '"',
    ].join(','),
  );
}
const total = design.startingCrowns + design.levels.reduce((s, l) => s + l.reward + bounty(l), 0);
assert.equal(total, 4845);
assert.equal(repairs, 385);
assert.equal(bank, 56);
assert.ok(
  [
    'Tavern I',
    'Sanctuary I',
    'Forge I',
    'War Room I',
    'Ballista I',
    'Storm Spire I',
    'Aegis I',
    'Cinder Mortar I',
  ].every((x) => owned.has(x)),
);
const main = readFileSync(new URL('CAMPAIGN_15.md', root), 'utf8');
assert.ok(main.includes('4,801 spendable crowns'));
assert.ok(main.includes(`**${repairs} crowns for repairs**`));
assert.ok(main.includes(`**${bank} crowns before level 15**`));
if (process.argv.includes('--write'))
  writeFileSync(new URL('campaign-economy.csv', root), csv.join('\n') + '\n');
console.log(
  JSON.stringify(
    {
      status: 'Design consistency passed; no combat simulation',
      levels: 15,
      enemyRoles: available.size,
      bosses: 3,
      nominalCombatSeconds: design.levels.reduce((s, l) => s + l.targetSeconds, 0),
      crownsBeforeFinale: total - bounty(design.levels[14]),
      referenceInvestment: invested,
      repairReserve: repairs,
      referenceCrownsBeforeFinale: bank,
    },
    null,
    2,
  ),
);
