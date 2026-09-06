import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../src/next/castle/Campaign';
import {
  Battle,
  clearGroundPath,
  distance,
  inTelegraph,
  type Actor,
  type Telegraph,
} from '../src/next/castle/Battle';
import { mounts, mountHeight } from '../src/next/castle/Catalog';
import { Group, Mesh, BoxGeometry, MeshStandardMaterial } from 'three';
import { WallDamage } from '../src/next/castle/WallDamage';

function battle() {
  const b = new Battle(C.createCampaign());
  b.start();
  b.spawnTimer = 9999;
  b.king.cooldown = 9999;
  return b;
}
function step(b: Battle, seconds: number) {
  for (let i = 0; i < seconds * 60; i++) b.tick(1 / 60);
}
function enemy(b: Battle, p: Partial<Actor> = {}) {
  const e: Actor = {
    ...structuredClone(b.knights[0]),
    id: 88000 + b.enemies.length,
    role: 'raider',
    name: 'Raider',
    x: 12,
    y: 0,
    z: 0,
    hp: 300,
    maxHp: 300,
    deployed: true,
    cooldown: 9999,
    talents: [],
    ...p,
  };
  b.enemies.push(e);
  return e;
}
const danger = (p: Partial<Telegraph> = {}): Telegraph => ({
  id: 9000,
  kind: 'breath',
  x: 0,
  z: 14,
  yaw: Math.PI,
  radius: 1.5,
  arc: 0.74,
  length: 19,
  age: 0,
  windup: 1.85,
  duration: 0.95,
  damage: 39,
  hits: [],
  ...p,
});

test('one starting knight; tavern unlocks recruitment and recruits deploy into free places', () => {
  const s = C.createCampaign();
  assert.deepEqual(
    s.knights.map((k) => k.id),
    ['aldren'],
  );
  const before = structuredClone(s);
  assert.match(C.recruit(s, 'elin')!, /tavern/);
  assert.deepEqual(s, before);
  assert.equal(C.build(s, 'tavern', 'inner-sw'), null);
  assert.equal(C.recruit(s, 'elin'), null);
  assert.equal(s.knights[1].active, true);
  assert.equal(s.gold, 100);
  assert.deepEqual(C.decodeCampaign(JSON.stringify(s)), s);
  s.buildings[0].hp = 0;
  assert.match(C.recruit(s, 'corvin')!, /tavern/);
});

test('four inner slots and four defense mounts enforce zoning, power and atomic moves', () => {
  const s = C.createCampaign();
  s.gold = 4000;
  assert.equal(mounts.filter((m) => m.inner).length, 4);
  assert.equal(mounts.filter((m) => !m.inner).length, 4);
  assert.ok(C.build(s, 'tavern', 'west-watch'));
  assert.ok(C.build(s, 'ballista', 'inner-se'));
  C.build(s, 'tavern', 'inner-nw');
  s.encounter = 5;
  assert.equal(C.build(s, 'sanctuary', 'inner-ne'), null);
  assert.equal(C.build(s, 'forge', 'inner-se'), null);
  assert.equal(C.build(s, 'war-room', 'inner-sw'), null);
  assert.equal(C.capacity(s), 0);
  for (const site of ['west-watch', 'east-watch', 'east-court', 'west-court'] as const)
    assert.equal(C.build(s, 'spire', site), null);
  assert.equal(s.buildings.length, 8);
  const before = structuredClone(s);
  assert.ok(C.moveBuilding(s, s.buildings[0].id, 'east-watch'));
  assert.deepEqual(s, before);
  assert.deepEqual(C.decodeCampaign(JSON.stringify(s)), s);
  const b = new Battle(s);
  for (const d of b.defenses) assert.equal(d.y, mountHeight(d.site, 1));
});

test('legacy sanctuary and full company migrate without charging or removing existing knights', () => {
  const s = C.createCampaign();
  s.gold = 2000;
  C.build(s, 'tavern', 'inner-nw');
  C.recruit(s, 'elin');
  s.encounter = 2;
  C.recruit(s, 'corvin');
  s.encounter = 5;
  s.wallTier = 2;
  s.walls = s.walls.map(() => 360);
  C.build(s, 'sanctuary', 'inner-se', 2);
  s.buildings = s.buildings.filter((b) => b.kind !== 'tavern');
  s.buildings[0].site = 'east-court';
  s.buildings[0].hp = 123;
  delete s.playability;
  const migrated = C.decodeCampaign(JSON.stringify(s))!;
  assert.equal(migrated.gold, s.gold);
  assert.deepEqual(migrated.knights, s.knights);
  assert.ok(migrated.buildings[0].site.startsWith('inner-'));
  assert.equal(migrated.buildings[0].hp, 123);
  assert.equal(migrated.buildings[0].rank, 2);
  const invalid = structuredClone(migrated);
  invalid.buildings[0].site = 'east-court';
  assert.equal(C.decodeCampaign(JSON.stringify(invalid)), null);
});

test('guarding knights reinforce a distant threatened front instead of standing at their home', () => {
  const b = battle(),
    k = b.knights[0];
  Object.assign(k, {
    deployed: true,
    x: 0,
    z: -9.5,
    home: { x: 0, y: 0, z: -9.5 },
    stance: 'guard',
  });
  const e = enemy(b, { x: 9.5, z: 0 });
  const initial = distance(k, e);
  step(b, 5);
  assert.ok(distance(k, e) < initial - 5);
  assert.ok(k.attacks > 0 || k.moving);
  assert.ok(Math.hypot(k.x, k.z) >= 7);
});

test('marksmen route around the curtain and do not shoot through the castle', () => {
  const b = battle(),
    k = b.knights[0];
  Object.assign(k, { role: 'marksman', deployed: true, x: -7.2, z: 0, cooldown: 0 });
  enemy(b, { x: 7.2, z: 0 });
  assert.equal(clearGroundPath(k, b.enemies[0]), false);
  step(b, 0.5);
  assert.ok(k.moving);
  assert.equal(b.bolts.filter((p) => p.owner === k.id).length, 0);
});

test('an already drawn marksman shot cannot become melee damage through a wall', () => {
  const b = battle(),
    k = b.knights[0];
  Object.assign(k, {
    role: 'marksman',
    deployed: true,
    x: -3.7,
    z: 6.3,
    action: 'bow_fire',
    actionTime: 0.65,
    fired: false,
  });
  const e = enemy(b, { x: 3.7, z: 6.3 });
  b.tick(1 / 60);
  assert.equal(e.hp, 300);
  assert.equal(b.bolts.filter((p) => p.owner === k.id).length, 0);
});

test('knights escape warning footprints and resume combat without taking the committed hit', () => {
  const b = battle(),
    k = b.knights[0];
  Object.assign(k, { deployed: true, x: 0, z: 10, home: { x: 0, y: 0, z: 10 }, cooldown: 0 });
  enemy(b, { x: 0, z: 14, role: 'dragon', action: 'stagger', actionTime: -10 });
  const t = danger();
  b.dangers.push(t);
  const hp = k.hp;
  step(b, 1.8);
  assert.equal(inTelegraph(t, k), false);
  step(b, 1.1);
  assert.equal(k.hp, hp);
  step(b, 1);
  assert.notEqual(k.action, 'dodge');
  assert.ok(k.attacks > 0);
});

test('claw gale uses a fixed width lane, tail has a rear safe gap and breath has a near hole', () => {
  const t = danger({ kind: 'rake', x: 0, z: 0, yaw: 0, width: 3.4 });
  assert.equal(inTelegraph(t, { x: 1.6, y: 0, z: 18 }), true);
  assert.equal(inTelegraph(t, { x: 1.8, y: 0, z: 18 }), false);
  assert.equal(inTelegraph(danger({ x: 0, z: 0, yaw: 0 }), { x: 0, y: 0, z: 1 }), false);
  const tail = danger({ kind: 'tail', x: 0, z: 0, yaw: 0, radius: 0, arc: 3.8, length: 7.5 });
  assert.equal(inTelegraph(tail, { x: 0, y: 0, z: 6 }), true);
  assert.equal(inTelegraph(tail, { x: 0, y: 0, z: -6 }), false);
});

test('off-centre dragon strikes damage the curved wall exactly once and create masonry impact events', () => {
  const b = battle();
  const angle = Math.PI / 8,
    x = Math.sin(angle) * 14,
    z = Math.cos(angle) * 14;
  b.dangers.push(danger({ x, z, yaw: angle + Math.PI, arc: 0.08 }));
  step(b, 2);
  assert.equal(b.state.walls[2], 191);
  assert.ok(b.wallImpacts[2] > 0);
  assert.ok(b.effects.some((e) => e.kind === 'wall'));
  step(b, 0.7);
  assert.equal(b.state.walls[2], 191);
});

test('an exposed dragon takes bonus damage while ordinary royal hits preserve its commitment', () => {
  const b = battle(),
    e = enemy(b, { role: 'dragon', action: 'breath', actionTime: 0.5, hp: 900, maxHp: 900 });
  b.dangers.push(danger());
  b.damage(e, 90, b.king, b.king.id, true, true);
  assert.equal(e.action, 'breath');
  assert.equal(b.bossInterrupts, 0);
  e.exposed = 1;
  const hp = e.hp;
  b.damage(e, 100, b.king, b.king.id, true, true);
  assert.equal(e.hp, hp - 130);
});

test('kill chains award fixed bounties once, expire, and defeat preserves the starting ledger', () => {
  const b = battle(),
    initial = b.state.gold;
  for (let i = 0; i < 4; i++) {
    const e = enemy(b, { hp: 1 });
    b.damage(e, 20, b.king, b.king.id, true);
    b.damage(e, 20, b.king, b.king.id, true);
  }
  assert.equal(b.kills, 4);
  assert.equal(b.streak, 4);
  assert.equal(b.loot, 8);
  assert.equal(b.state.gold, initial + 8);
  b.paused = true;
  step(b, 6);
  assert.equal(b.streakTime, 5);
  b.paused = false;
  step(b, 5.1);
  b.damage(enemy(b, { hp: 1 }), 20, b.king, b.king.id, true);
  assert.equal(b.streak, 1);
  b.state.walls[0] = 0;
  b.tick(0.02);
  assert.equal(b.checkpoint.gold, initial);
});

test('wall damage deforms cloned masonry and repairs restore the original geometry', () => {
  const castle = new Group(),
    north = new Group();
  north.name = 'NorthWall';
  castle.add(north);
  const source = new BoxGeometry(0.4, 0.8, 0.3),
    material = new MeshStandardMaterial({ color: 0x889999 });
  const block = new Mesh(source, material);
  block.position.set(0, 2.6, -6.55);
  north.add(block);
  const view = new WallDamage(castle, 2.28),
    b = battle();
  view.update(b);
  const clean = Array.from(block.geometry.getAttribute('position').array);
  b.state.walls[0] = 60;
  view.update(b);
  assert.notDeepEqual(Array.from(block.geometry.getAttribute('position').array), clean);
  assert.notEqual(block.geometry, source);
  b.state.walls[0] = 230;
  view.update(b);
  const repaired = Array.from(block.geometry.getAttribute('position').array);
  repaired.forEach((v, i) => assert.ok(Math.abs(v - clean[i]) < 0.00001));
  view.dispose();
  source.dispose();
  material.dispose();
});
