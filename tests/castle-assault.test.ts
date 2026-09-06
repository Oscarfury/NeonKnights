import test from 'node:test';
import assert from 'node:assert/strict';
import { Battle, type Actor, distance } from '../src/next/castle/Battle';
import { createCampaign } from '../src/next/castle/Campaign';
import { reserveAssault } from '../src/next/castle/Assault';

function fixture() {
  const b = new Battle(createCampaign());
  b.start();
  b.spawnTimer = 9999;
  b.king.cooldown = 9999;
  // Move the interception targets explicitly; this fixture isolates enemy decisions.
  b['tickKnight'] = () => {};
  b.knights.forEach((k) => (k.hp = 0));
  b.state.walls.fill(10000);
  return b;
}
function enemy(b: Battle, patch: Partial<Actor> = {}) {
  const e: Actor = {
    ...structuredClone(b.knights[0]),
    id: 90000 + b.enemies.length,
    role: 'raider',
    name: 'Assault test',
    x: 0,
    y: 0,
    z: 20,
    hp: 10000,
    maxHp: 10000,
    deployed: true,
    cooldown: 0,
    action: '',
    actionTime: 0,
    targetId: undefined,
    ...patch,
  };
  b.enemies.push(e);
  return e;
}
function step(b: Battle, seconds: number) {
  for (let i = 0; i < Math.round(seconds * 60); i++) b.tick(1 / 60, { rotate: 0, decree: false });
}
function knight(b: Battle, x: number, z: number) {
  const k = b.knights[0];
  Object.assign(k, {
    x,
    y: 0,
    z,
    hp: 1000,
    maxHp: 1000,
    deployed: true,
    stunned: 999,
    cooldown: 999,
  });
  return k;
}

test('an unattended assault reaches reserved wall positions and holds a steady facing', () => {
  const b = fixture();
  const attackers = Array.from({ length: 7 }, () => enemy(b));
  step(b, 10);
  assert.equal(new Set(attackers.map((e) => e.assault!.slot)).size, 7);
  assert.ok(attackers.every((e) => distance(e, e.assault!.position) < 0.2));
  const poses = attackers.map((e) => ({ x: e.x, z: e.z, yaw: e.yaw }));
  const before = b.state.walls[2];
  step(b, 5);
  assert.ok(b.state.walls[2] < before - 80, 'the line must actually damage its wall');
  assert.deepEqual(b.state.walls.slice(0, 2), [10000, 10000]);
  attackers.forEach((e, i) => {
    assert.ok(distance(e, poses[i]) < 0.03, 'planted attackers should not orbit or shuffle');
    assert.ok(Math.abs(e.yaw - poses[i].yaw) < 0.03, 'planted attackers should face their wall');
  });
});

test('a committed swing cannot swivel to a passing knight or change to a wall hit', () => {
  const b = fixture();
  const e = enemy(b, { z: 9, yaw: 0 });
  const k = knight(b, 0, 10.6);
  step(b, 0.1);
  assert.equal(e.assault!.strike?.target, k.id);
  const yaw = e.yaw;
  k.x = -1.6;
  k.z = 9;
  step(b, 0.7);
  assert.equal(e.yaw, yaw);
  assert.equal(k.hp, 1000, 'the knight moved out of the committed attack arc');
  assert.equal(b.stats.wallDamage, 0, 'a missed knight attack must not fall through to the wall');
});

test('wall strikes remain committed when a knight enters aggro range during the windup', () => {
  const b = fixture();
  const e = enemy(b, { z: 7.85, yaw: Math.PI });
  step(b, 0.1);
  assert.equal(e.assault!.strike?.wall, 2);
  const k = knight(b, 0, 9.2);
  step(b, 0.7);
  assert.equal(k.hp, 1000);
  assert.equal(b.stats.wallDamage, 13);
  assert.ok(Math.abs(e.yaw - Math.PI) < 0.01);
  step(b, 2);
  assert.equal(e.targetId, k.id, 'the next decision can engage the interceptor');
});

test('nearby targets do not alternate every frame and dead targets release the assault', () => {
  const b = fixture();
  const e = enemy(b, { z: 12, cooldown: 999 });
  const a = knight(b, -1, 12);
  const c = { ...structuredClone(a), id: a.id + 500, x: 1.1 };
  b.knights.push(c);
  step(b, 0.4);
  assert.equal(e.targetId, a.id);
  c.x = 0.85;
  step(b, 0.8);
  assert.equal(e.targetId, a.id);
  a.hp = 0;
  c.hp = 0;
  step(b, 5);
  assert.equal(e.targetId, undefined);
  assert.ok(distance(e, e.assault!.position) < 0.2);
});

test('casters approach a rear firing position and ignore knights across the castle', () => {
  const b = fixture();
  const e = enemy(b, { role: 'hexcaster' });
  const k = knight(b, 0, -8);
  step(b, 10);
  assert.equal(e.targetId, undefined);
  assert.ok(distance(e, e.assault!.position) < 0.2);
  assert.ok(Math.hypot(e.x, e.z) > 13);
  assert.ok(b.stats.wallDamage > 0, 'cast projectiles must connect with the assigned wall');
  assert.equal(k.hp, 1000);
});

test('knockback preserves the wall assignment and attackers settle again', () => {
  const b = fixture();
  const e = enemy(b, { z: 7.85, yaw: Math.PI });
  step(b, 0.1);
  const slot = e.assault!.slot;
  e.pushX = 8;
  e.pushZ = 8;
  step(b, 4);
  assert.equal(e.assault!.slot, slot);
  assert.ok(distance(e, e.assault!.position) < 0.2);
  assert.ok(Math.hypot(e.x, e.z) >= 7.35);
});

test('taunts can interrupt a return to the wall after an overlong pursuit', () => {
  const b = fixture();
  const e = enemy(b, { z: 12, cooldown: 999 });
  const k = knight(b, 0, 14);
  step(b, 0.2);
  assert.equal(e.targetId, k.id);
  e.assault!.pursuit = { x: 0, y: 0, z: 5 };
  step(b, 0.4);
  assert.equal(e.targetId, undefined);
  assert.equal(e.assault!.returning, true);
  e.taunted = 4;
  e.taunter = k.id;
  step(b, 1.2);
  assert.equal(e.targetId, k.id);
});

test('all eleven attackers can reserve distinct positions in one sector', () => {
  const b = fixture();
  for (let i = 0; i < 11; i++) {
    const e = enemy(b);
    e.assault = reserveAssault(e, b.enemies, 2);
  }
  assert.equal(new Set(b.enemies.map((e) => e.assault!.slot)).size, 11);
});
