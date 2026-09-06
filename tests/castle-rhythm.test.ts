import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../src/next/castle/Campaign';
import { Battle, type Actor, type Telegraph } from '../src/next/castle/Battle';
import { encounters } from '../src/next/castle/Catalog';

function quiet() {
  const b = new Battle(C.createCampaign());
  b.start();
  b.spawnTimer = 9999;
  b.knights.forEach((k) => (k.hp = 0));
  return b;
}
function enemy(b: Battle, p: Partial<Actor> = {}) {
  const e: Actor = {
    ...structuredClone(b.knights[0]),
    id: 98000 + b.enemies.length,
    role: 'raider',
    name: 'Invader',
    x: 0,
    y: 0,
    z: 12,
    hp: 2000,
    maxHp: 2000,
    deployed: true,
    stunned: 999,
    action: '',
    cooldown: 999,
    ...p,
  };
  b.enemies.push(e);
  return e;
}
function step(b: Battle, time: number, input: { guard?: boolean; charge?: boolean } = {}) {
  for (let i = 0; i < Math.round(time * 60); i++)
    b.tick(1 / 60, { rotate: 0, decree: false, ...input });
}
function breath(b: Battle, owner?: number) {
  const t: Telegraph = {
    id: 9001,
    owner,
    kind: 'breath',
    wall: 2,
    targetsWalls: true,
    x: 0,
    z: 14,
    yaw: Math.PI,
    radius: 1.5,
    arc: 0.66,
    length: 9,
    windup: 1,
    duration: 0.5,
    age: 0,
    damage: 76,
    hits: [],
  };
  b.dangers.push(t);
  return t;
}
test('both auto weapons connect in under a quarter second; Sunlance pierces and pushes harder', () => {
  const travel: number[] = [];
  for (const weapon of ['stormbow', 'sunlance'] as const) {
    const b = quiet();
    b.state.weapon = weapon;
    const e = enemy(b);
    step(b, 0.25);
    assert.ok(e.hp < e.maxHp, weapon + ' did not connect');
    assert.equal(b.stats.royalShots, 1);
    assert.ok((e.pushZ || 0) > 0);
    travel.push(e.pushZ!);
    if (weapon === 'sunlance') assert.ok(b.bolts.some((p) => p.royal && p.pierce === 2));
  }
  assert.ok(travel[1] > travel[0]);
});
test('old charge/spam input cannot stall auto fire; guarding also leaves attack cadence intact', () => {
  const base = quiet(),
    spam = quiet(),
    guard = quiet();
  for (const b of [base, spam, guard]) enemy(b);
  for (let i = 0; i < 120; i++) {
    base.tick(1 / 60, { rotate: 0, decree: false });
    spam.tick(1 / 60, { rotate: 0, decree: false, charge: i % 2 === 0 });
    guard.tick(1 / 60, { rotate: 0, decree: false, guard: i === 0 });
  }
  assert.ok(base.stats.royalShots >= 5);
  assert.equal(spam.stats.royalShots, base.stats.royalShots);
  assert.equal(guard.stats.royalShots, base.stats.royalShots);
  assert.equal(spam.stats.royalDamage, base.stats.royalDamage);
});
test('fast arrows lead a moving target and apply damage through the travelled segment', () => {
  const b = quiet(),
    e = enemy(b, { velocityX: 3 });
  for (let i = 0; i < 60; i++) {
    e.x += 3 / 60;
    e.velocityX = 3;
    b.tick(1 / 60);
  }
  assert.ok(b.stats.royalShots >= 3);
  assert.ok(b.royalHits >= 2);
});
test('the King ignores damage; only wall failure loses the castle', () => {
  const b = quiet();
  b.damage(b.king, 500, b.king, -1);
  assert.equal(b.king.hp, 160);
  breath(b);
  step(b, 1.2);
  assert.equal(b.king.hp, 160);
  assert.equal(b.phase, 'battle');
  b.state.walls[1] = 0;
  b.tick(0.02);
  assert.equal(b.phase, 'lost');
});
test('wall breath affects exactly its marked section, never the opposite wall', () => {
  const b = quiet();
  breath(b);
  step(b, 1.4);
  assert.deepEqual(b.state.walls, [230, 230, 154, 230]);
  const state = [...b.state.walls];
  step(b, 0.2);
  assert.deepEqual(b.state.walls, state);
});
test('early guard reduces damage only on its locked section and cannot repeat while held', () => {
  const early = quiet();
  breath(early);
  step(early, 1.2, { guard: true });
  assert.ok(Math.abs(early.state.walls[2] - (230 - 76 * 0.2)) < 0.00001);
  assert.equal(early.stats.perfectGuards, 0);
  step(early, 5, { guard: true });
  assert.equal(early.guardTime, 0);
  assert.equal(early.guardCooldown, 0);
  const wrong = quiet();
  wrong.angle = Math.PI;
  breath(wrong);
  step(wrong, 1.2, { guard: true });
  assert.equal(wrong.guardSide, 0);
  assert.equal(wrong.state.walls[2], 154);
});
test('a timed guard blocks the impact and exposes the attacking dragon, with no fake wall debris', () => {
  const b = quiet(),
    boss = enemy(b, { role: 'dragon', action: 'breath', actionTime: 0.8, stunned: 0 });
  const t = breath(b, boss.id);
  t.age = 0.85;
  step(b, 0.25, { guard: true });
  assert.equal(b.state.walls[2], 230);
  assert.equal(b.stats.guardPrevented, 76);
  assert.equal(b.stats.perfectGuards, 1);
  assert.equal(b.bossInterrupts, 1);
  assert.equal(boss.action, 'stagger');
  assert.ok(boss.exposed > 0);
  assert.ok(!b.effects.some((e) => e.kind === 'wall'));
  const hp = boss.hp;
  b.damage(boss, 100, b.king, b.king.id, true);
  assert.equal(boss.hp, hp - 130);
});
test('the final watch introduces the dragon, which pressures knights before a named wall', () => {
  assert.deepEqual(
    encounters.map((e) => e.boss),
    [false, false, true],
  );
  const second = C.createCampaign();
  second.encounter = 1;
  const before = new Battle(second);
  before.start();
  before.spawnTimer = 9999;
  step(before, 14);
  assert.equal(before.bossSpawned, false);
  const last = C.createCampaign();
  last.encounter = 2;
  const b = new Battle(last);
  b.start();
  b.spawnTimer = 9999;
  step(b, 17.5);
  assert.equal(b.bossSpawned, true);
  assert.ok(b.dangers.some((t) => t.kind === 'rake' && t.targetsWalls === false));
  step(b, 5);
  assert.ok(b.dangers.some((t) => t.kind === 'breath' && t.wall !== undefined));
});
test('every recruited knight fully recovers after a victory, including downed and reserve knights', () => {
  const s = C.createCampaign();
  s.gold = 3000;
  C.build(s, 'tavern', 'inner-sw');
  C.recruit(s, 'elin');
  C.recruit(s, 'corvin');
  C.recruit(s, 'lysa');
  s.knights.forEach((k, i) => (k.hp = i === 0 ? 0 : 5));
  C.completeEncounter(s);
  assert.ok(s.knights.every((k) => k.hp === C.knightMax(k)));
  assert.equal(s.knights[3].xp, 0);
  assert.equal(s.knights[0].xp, 2);
  assert.deepEqual(C.decodeCampaign(JSON.stringify(s)), s);
  const b = new Battle(s);
  assert.ok(b.knights.every((k) => k.barrier === 10));
});
