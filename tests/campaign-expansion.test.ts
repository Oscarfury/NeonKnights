import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../src/next/castle/Campaign';
import { Battle, type Actor } from '../src/next/castle/Battle';
import { encounters, enemyRoles, recruits, roles } from '../src/next/castle/Catalog';
import { talents } from '../src/next/castle/Talents';
import { defenseSpec } from '../src/next/construction/DefenseSystem';
const funded = (level = 0) => {
  const s = C.createCampaign();
  s.gold = 10000;
  s.encounter = level;
  s.wins = level;
  return s;
};
const quiet = (s = C.createCampaign()) => {
  const b = new Battle(s);
  b.start();
  b.spawnTimer = 9999;
  b.king.cooldown = 999;
  return b;
};
const enemy = (b: Battle, role: Actor['role'], x = 0, z = -9): Actor => {
  const e = {
    ...structuredClone(b.king),
    id: 20000 + b.enemies.length,
    role,
    name: role,
    x,
    y: 0,
    z,
    hp: 1000,
    maxHp: 1000,
    action: '',
    cooldown: 999,
    deployed: true,
  };
  b.enemies.push(e);
  return e;
};
test('the shipped campaign has fifteen authored levels, eight enemies and bosses at 5/10/15', () => {
  assert.equal(encounters.length, 15);
  assert.equal(Object.keys(enemyRoles).length, 8);
  assert.deepEqual(
    encounters.flatMap((e, i) => (e.boss ? [[i + 1, e.boss]] : [])),
    [
      [5, 'golem'],
      [10, 'dragon'],
      [15, 'hollow-king'],
    ],
  );
  assert.ok(encounters.every((e) => e.packets.length >= 2 && e.budget > 0 && e.bounty > 0));
  assert.equal(recruits.length, 6);
  assert.equal(Object.keys(roles).length, 4);
  for (const role of Object.keys(roles))
    assert.equal(talents.filter((t) => t.role === role).length, 6);
});
test('new wings and fortifications unlock at earned councils; rejection spends nothing', () => {
  const s = funded(),
    before = structuredClone(s);
  assert.match(C.build(s, 'forge', 'inner-nw')!, /level 5/);
  assert.deepEqual(s, before);
  assert.match(C.upgradeWalls(s)!, /level 4/);
  s.encounter = 4;
  assert.equal(C.upgradeWalls(s), null);
  s.encounter = 5;
  for (const [kind, site] of [
    ['tavern', 'inner-sw'],
    ['sanctuary', 'inner-se'],
    ['forge', 'inner-ne'],
    ['war-room', 'inner-nw'],
  ] as const)
    assert.equal(C.build(s, kind, site), null);
  assert.equal(s.buildings.length, 4);
  assert.equal(C.upgradeBuilding(s, s.buildings[2].id), null);
  const saved = structuredClone(s);
  assert.ok(C.upgradeBuilding(s, s.buildings[2].id));
  assert.deepEqual(s, saved);
  s.encounter = 9;
  assert.equal(C.upgradeWalls(s), null);
  s.encounter = 10;
  for (const b of s.buildings) while (b.rank < 3) assert.equal(C.upgradeBuilding(s, b.id), null);
  assert.equal(
    C.decodeCampaign(JSON.stringify(s))?.buildings.filter((b) => b.rank === 3).length,
    4,
  );
});
test('late saves retain two relics, ascension and weapon/defense branches beyond the old finale', () => {
  const s = funded(14);
  s.wallTier = 3;
  s.walls = [520, 520, 520, 520];
  assert.equal(C.build(s, 'ballista', 'west-watch', 3), null);
  assert.equal(C.specialize(s, s.buildings[0].id, 'b'), null);
  C.improveWeapon(s, 'stormbow');
  C.improveWeapon(s, 'stormbow');
  C.setWeaponPath(s, 'hawkeye');
  assert.equal(C.chooseRelic(s, 'worldpiercer'), null);
  assert.equal(C.chooseRelic(s, 'ember-crown'), null);
  assert.ok(C.chooseRelic(s, 'storm-oath'));
  C.ascendRelic(s, 'worldpiercer');
  C.completeEncounter(s);
  assert.equal(s.encounter, 15);
  assert.deepEqual(C.decodeCampaign(JSON.stringify(s)), s);
  const versionOne = { ...s, version: 1 };
  assert.equal(C.decodeCampaign(JSON.stringify(versionOne)), null);
});
test('recruitment gates and promotions give one talent point per rank, and all classes heal after victory', () => {
  const s = funded();
  C.build(s, 'tavern', 'inner-sw');
  assert.ok(C.recruit(s, 'iona'));
  s.encounter = 6;
  for (const id of ['iona', 'mira']) assert.equal(C.recruit(s, id), null);
  for (const k of s.knights) {
    k.hp = 1;
    k.xp = 16;
    assert.equal(C.promote(s, k.id), null);
  }
  C.completeEncounter(s);
  assert.ok(s.knights.every((k) => k.hp === C.knightMax(k)));
  assert.equal(C.learnTalent(s, 'mira', 'ward-song'), null);
  assert.equal(C.learnTalent(s, 'mira', 'restoration'), null);
  assert.ok(C.learnTalent(s, 'mira', 'chorus'));
});
test('killing a lit sapper cancels its wall blast; the warning and damage share one commitment', () => {
  const b = quiet(funded(3)),
    e = enemy(b, 'sapper');
  e.cooldown = 0;
  e.x = 0;
  e.z = -7.85;
  e.yaw = 0;
  e.assault = {
    side: 0,
    slot: 5,
    position: { x: 0, y: 0, z: -7.85 },
    wall: { x: 0, y: 0, z: -6.65 },
    think: 10,
    mode: 'siege',
  };
  b.knights.forEach((k) => (k.hp = 0));
  b.tick(0.05);
  assert.equal(b.dangers.length, 1);
  assert.equal(b.dangers[0].wall, 0);
  b.damage(e, 2000, b.king, b.king.id, false, true);
  assert.equal(b.dangers.length, 0);
  for (let n = 0; n < 60 * 3; n++) b.tick(1 / 60);
  assert.equal(b.stats.wallDamage, 0);
});
test('mortar shells travel before their area impact, and the Forge tempers its sixth shot', () => {
  const s = funded(7);
  C.build(s, 'mortar', 'west-watch');
  C.build(s, 'forge', 'inner-nw');
  const b = quiet(s);
  b.knights.forEach((k) => (k.hp = 0));
  const e = enemy(b, 'ram', 0, -15);
  b.defenses[0].reload = 0;
  b.tick(0.05);
  assert.ok(b.bolts.some((p) => p.gravity && p.impact));
  assert.equal(e.hp, 1000);
  for (let n = 0; n < 60 * 2; n++) b.tick(1 / 60);
  assert.ok(e.hp < 1000);
  assert.ok(b.stats.defenseDamage > 0);
  const royal = quiet(s);
  royal.king.cooldown = 0;
  royal.angle = Math.PI;
  royal.knights.forEach((k) => (k.hp = 0));
  enemy(royal, 'ram', 0, -10);
  let tempered = false;
  for (let n = 0; n < 60 * 4; n++) {
    royal.tick(1 / 60);
    if (royal.bolts.some((p) => p.royalWeapon && p.firstBonus === 10)) tempered = true;
  }
  assert.ok(tempered);
});
test('Aegis final branches use distinct real shield pools', () => {
  assert.equal(defenseSpec({ kind: 'aegis', rank: 3, specialization: 'a' }).capacity, 180);
  assert.equal(defenseSpec({ kind: 'aegis', rank: 3, specialization: 'b' }).capacity, 100);
});
