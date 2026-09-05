import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWorkshop,
  decodeWorkshop,
  placeDefense,
  upgradeDefense,
  relocateDefense,
  salvageDefense,
  repairDefense,
  usedCapacity,
} from '../src/next/construction/Workshop';
import {
  createDefenses,
  footprint,
  interceptRay,
  stepDefenses,
} from '../src/next/construction/DefenseSystem';
import { defaultYaw, sites, spec } from '../src/next/construction/Catalog';
import { makeDanger } from '../src/next/combat/Hazards';
import {
  createTraining,
  issueOrder,
  moveActor,
  neutralInput,
  stepTraining,
} from '../src/next/world/Training';

test('direct tier construction and sequential upgrades have the same known investment', () => {
  const direct = createWorkshop(),
    incremental = createWorkshop();
  assert.equal(placeDefense(direct, 'ballista', 'west-watch', 0, 3), null);
  assert.equal(placeDefense(incremental, 'ballista', 'west-watch', 0), null);
  assert.equal(upgradeDefense(incremental, 1), null);
  assert.equal(upgradeDefense(incremental, 1), null);
  assert.deepEqual(incremental, direct);
  assert.equal(direct.gold, 700);
});
test('failed purchases, upgrades and occupied relocations are atomic', () => {
  const s = createWorkshop();
  placeDefense(s, 'ballista', 'west-watch', 0, 3);
  placeDefense(s, 'ballista', 'east-watch', 0, 3);
  const before = structuredClone(s);
  assert.ok(placeDefense(s, 'aegis', 'west-court', 0));
  assert.ok(placeDefense(s, 'aegis', 'west-watch', 0));
  assert.ok(upgradeDefense(s, 1));
  assert.ok(relocateDefense(s, 1, 'east-watch', 1));
  assert.deepEqual(s, before);
  salvageDefense(s, 2);
  s.gold = 0;
  const broke = structuredClone(s);
  assert.ok(placeDefense(s, 'aegis', 'west-court', 0));
  assert.deepEqual(s, broke);
});
test('relocation preserves identity, rank and wounds; salvage cannot refund twice', () => {
  const s = createWorkshop();
  placeDefense(s, 'aegis', 'west-watch', 0, 3);
  s.buildings[0].hp = 42;
  assert.equal(relocateDefense(s, 1, 'west-court', 1.7), null);
  assert.equal(s.gold, 650);
  assert.equal(s.buildings[0].hp, 42);
  assert.equal(salvageDefense(s, 1), null);
  assert.equal(s.gold, 1035);
  assert.equal(usedCapacity(s), 0);
  assert.ok(salvageDefense(s, 1));
  assert.equal(s.gold, 1035);
});
test('upgrades retain missing durability; repairs charge crowns and revive a wreck', () => {
  const s = createWorkshop();
  placeDefense(s, 'ballista', 'west-watch', 0);
  s.buildings[0].hp -= 41;
  upgradeDefense(s, 1);
  assert.equal(s.buildings[0].hp, spec('ballista', 2).health - 41);
  const gold = s.gold;
  assert.equal(repairDefense(s, 1), null);
  assert.equal(s.gold, gold - 11);
  s.buildings[0].hp = 0;
  assert.ok(upgradeDefense(s, 1));
  assert.equal(repairDefense(s, 1), null);
  assert.equal(s.buildings[0].hp, 220);
});
test('save decoding rejects malformed, duplicated, overcapacity and fabricated resource data', () => {
  const s = createWorkshop();
  placeDefense(s, 'aegis', 'west-watch', 0.7, 2);
  s.buildings[0].hp = 31.5;
  assert.deepEqual(decodeWorkshop(JSON.stringify(s)), s);
  for (const raw of [
    'null',
    '{',
    '{}',
    JSON.stringify({ ...s, version: 2 }),
    JSON.stringify({ ...s, gold: 1200 }),
    JSON.stringify({ ...s, buildings: [s.buildings[0], s.buildings[0]] }),
    JSON.stringify({ ...s, buildings: [{ ...s.buildings[0], kind: 'constructor' }] }),
    JSON.stringify({ ...s, buildings: [{ ...s.buildings[0], hp: -1 }] }),
    JSON.stringify({ ...s, nextId: 1 }),
  ])
    assert.equal(decodeWorkshop(raw), null);
  const excess = createWorkshop();
  excess.gold = 0;
  excess.nextId = 4;
  excess.buildings = sites.slice(0, 3).map((site, index) => ({
    id: index + 1,
    site: site.id,
    kind: 'ballista',
    rank: 1,
    yaw: 0,
    hp: 100,
  }));
  assert.equal(decodeWorkshop(JSON.stringify(excess)), null);
});
test('ballista assembly, firing cone and target survival gate release', () => {
  const s = createWorkshop();
  placeDefense(s, 'ballista', 'west-watch', 0);
  const b = createDefenses(s),
    target = { id: 1, x: -7, z: 0, hp: 100 };
  let id = 1;
  assert.equal(stepDefenses(b, [target], 1, () => id++).length, 0);
  for (let n = 0; n < 120; n++) stepDefenses(b, [{ ...target, hp: 0 }], 1 / 60, () => id++);
  assert.equal(b[0].shots, 0);
  assert.equal(stepDefenses(b, [{ ...target, z: -9 }], 0.1, () => id++).length, 0);
  assert.equal(stepDefenses(b, [target], 0.1, () => id++).length, 1);
  assert.equal(b[0].shots, 1);
  assert.equal(stepDefenses(b, [target], 0.1, () => id++).length, 0);
});
test('ballista release produces travel before damage and does not count as a player hit', () => {
  const plan = createWorkshop();
  placeDefense(plan, 'ballista', 'west-watch', defaultYaw(sites[0]));
  const s = createTraining(plan);
  let released = false;
  for (let n = 0; n < 240; n++) {
    stepTraining(s, neutralInput());
    if (!released && s.siegeBolts.length) {
      released = true;
      assert.equal(s.structureHits, 0);
      assert.equal(
        s.targets.reduce((a, t) => a + t.hp, 0),
        300,
      );
    }
  }
  assert.ok(released);
  assert.ok(s.structureHits > 0);
  assert.equal(s.hits, 0);
  assert.equal(s.shots, 0);
});
test('piercing siege bolts hit each board once and stop after their contact budget', () => {
  const s = createTraining();
  s.targets = [0, 1, 2, 3].map((z, id) => ({ id, x: 0, z, hp: 100, flash: 0 }));
  s.siegeBolts.push({
    id: 100,
    x: 0,
    y: 1.4,
    z: -1,
    vx: 0,
    vy: 0,
    vz: 19,
    life: 1,
    damage: 78,
    owner: 1,
    remaining: 3,
    hit: [],
  });
  for (let n = 0; n < 20; n++) stepTraining(s, neutralInput());
  assert.deepEqual(
    s.targets.map((t) => t.hp),
    [22, 22, 22, 100],
  );
  assert.equal(s.structureHits, 3);
  assert.equal(s.siegeBolts.length, 0);
});
function shield() {
  const plan = createWorkshop();
  placeDefense(plan, 'aegis', 'west-court', Math.PI, 3);
  const b = createDefenses(plan);
  b[0].age = 2;
  const target = { x: -7, y: 0, z: 1 },
    ray = makeDanger(1, 'sweep', { x: -7, y: 0, z: -4 }, 0);
  return { b, target, ray };
}
test('an Aegis spends reserve only when a sweeping ray crosses its forward barrier', () => {
  const { b, target, ray } = shield();
  assert.equal(interceptRay(b, target, ray, 18), 0);
  assert.equal(b[0].charge, 122);
  assert.equal(b[0].blocked, 18);
  b[0].yaw = 0;
  assert.equal(interceptRay(b, target, ray, 18), 18);
  assert.equal(b[0].charge, 122);
  b[0].yaw = Math.PI;
  assert.equal(interceptRay(b, target, { ...ray, z: 0 }, 18), 18);
  assert.equal(interceptRay(b, { ...target, y: 1.8 }, ray, 18), 18);
  assert.equal(interceptRay(b, target, makeDanger(2, 'impact', target), 22), 22);
  assert.equal(interceptRay(b, target, makeDanger(3, 'fire', target), 6), 6);
});
test('Aegis reserve permits partial interception then recharges after a quiet interval', () => {
  const { b, target, ray } = shield();
  b[0].charge = 7;
  assert.equal(interceptRay(b, target, ray, 18), 11);
  assert.equal(interceptRay(b, target, ray, 18), 18);
  stepDefenses(b, [], 1, () => 0);
  assert.equal(b[0].charge, 0);
  for (let n = 0; n < 120; n++) stepDefenses(b, [], 1 / 60, () => 0);
  assert.ok(b[0].charge >= 17 && b[0].charge <= 19);
  b[0].hp = 0;
  const charge = b[0].charge;
  stepDefenses(b, [], 1, () => 0);
  assert.equal(b[0].charge, charge);
  assert.equal(interceptRay(b, target, ray, 18), 18);
});
test('courtyard hazard resolution consumes shield reserve and ground fire damages structures', () => {
  const plan = createWorkshop();
  placeDefense(plan, 'aegis', 'west-court', Math.PI, 3);
  const s = createTraining(plan);
  s.defenses[0].age = 2;
  Object.assign(s.player, { x: -7, z: 1 });
  s.company.forEach((a) => (a.hp = 0));
  s.hazards = [makeDanger(1, 'sweep', { x: -7, y: 0, z: -4 }, 0)];
  for (let n = 0; n < 250; n++) stepTraining(s, neutralInput());
  assert.equal(s.player.hp, 100);
  assert.equal(s.blockedDamage, 36);
  assert.equal(s.defenses[0].hp, 330);
  s.hazards = [makeDanger(2, 'fire', s.defenses[0])];
  Object.assign(s.player, { x: 0, z: 5 });
  for (let n = 0; n < 300; n++) stepTraining(s, neutralInput());
  assert.equal(s.defenses[0].hp, 330 - 36);
});
test('actors cannot enter defense footprints, including wrecks', () => {
  const plan = createWorkshop();
  placeDefense(plan, 'ballista', 'west-watch', 0);
  const b = createDefenses(plan);
  b[0].hp = 0;
  const a = { x: -7, y: 0, z: 0 };
  for (let n = 0; n < 100; n++) moveActor(a, 0, -0.07, b);
  assert.ok(Math.hypot(a.x - b[0].x, a.z - b[0].z) >= footprint('ballista', 1) + 0.28);
});

test('shield recharge starts after the cooldown at different simulation rates', () => {
  for (const dt of [1 / 30, 1 / 60, 1 / 120]) {
    const { b, target, ray } = shield();
    b[0].charge = 0;
    b[0].charge = 18;
    interceptRay(b, target, ray, 18);
    for (let n = 0; n < 3 / dt; n++) stepDefenses(b, [], dt, () => 0);
    assert.ok(Math.abs(b[0].charge - 18) < 0.001, `${dt}: ${b[0].charge}`);
  }
});
test('a company ordered across a machine routes around it and reaches its formation', () => {
  const plan = createWorkshop();
  placeDefense(plan, 'ballista', 'west-watch', 0);
  const s = createTraining(plan);
  Object.assign(s.company[0], { x: -7, z: -1 });
  Object.assign(s.company[1], { x: -5, z: -1 });
  issueOrder(s, { x: -7, y: 0, z: -8 });
  let closest = Infinity;
  for (let n = 0; n < 600; n++) {
    stepTraining(s, neutralInput());
    closest = Math.min(closest, Math.hypot(s.company[0].x + 7, s.company[0].z + 5));
  }
  assert.ok(closest >= footprint('ballista', 1) + 0.28);
  assert.ok(
    Math.hypot(s.company[0].x + 7.8, s.company[0].z + 8) < 0.3,
    JSON.stringify(s.company[0]),
  );
});

test('a company beside the collision boundary can escape and continue its route', () => {
  const plan = createWorkshop();
  placeDefense(plan, 'ballista', 'west-watch', 0, 3);
  const s = createTraining(plan);
  Object.assign(s.company[0], { x: -7, z: -5 + footprint('ballista', 3) + 0.29 });
  issueOrder(s, { x: -7, y: 0, z: -8 });
  for (let n = 0; n < 600; n++) stepTraining(s, neutralInput());
  assert.ok(Math.hypot(s.company[0].x + 7.8, s.company[0].z + 8) < 0.3);
});

test('ground formation routes go around the balcony when both endpoints are on the floor', () => {
  const plan = createWorkshop();
  placeDefense(plan, 'ballista', 'east-watch', 0);
  const s = createTraining(plan);
  Object.assign(s.company[0], { x: 7, z: 6 });
  issueOrder(s, { x: 7, y: 0, z: -8 });
  for (let n = 0; n < 900; n++) stepTraining(s, neutralInput());
  assert.ok(
    Math.hypot(s.company[0].x - 6.2, s.company[0].z + 8) < 0.3,
    JSON.stringify(s.company[0]),
  );
});
