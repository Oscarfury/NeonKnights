import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../src/next/castle/Campaign';
import {
  Battle,
  distance,
  facingShield,
  inTelegraph,
  wallPosition,
  type Actor,
  type Telegraph,
} from '../src/next/castle/Battle';
import { encounters, wallSpec } from '../src/next/castle/Catalog';
import { mounts } from '../src/next/castle/Catalog';
import { platformAt } from '../src/next/castle/Placement';
import { talentRemaining } from '../src/next/castle/Talents';
import { stepDefenses, interceptSegment } from '../src/next/construction/DefenseSystem';
const step = (b: Battle, seconds: number, input = { rotate: 0, charge: false, decree: false }) => {
  for (let n = 0; n < seconds * 60; n++) b.tick(1 / 60, input);
};
const quiet = () => {
  const b = new Battle(C.createCampaign());
  b.start();
  b.spawnTimer = 9999;
  return b;
};

test('four cardinal placement targets reject the courtyard and occupied moves are atomic', () => {
  const s = C.createCampaign();
  for (const m of mounts) assert.equal(platformAt(m.x, m.z), m.id);
  assert.equal(platformAt(0, 0), null);
  assert.equal(platformAt(6, 6), null);
  C.build(s, 'spire', 'west-watch');
  C.build(s, 'sanctuary', 'east-court');
  const saved = structuredClone(s);
  assert.ok(C.moveBuilding(s, s.buildings[0].id, 'east-court'));
  assert.deepEqual(s, saved);
  assert.equal(C.moveBuilding(s, s.buildings[0].id, 'east-watch'), null);
  assert.equal(s.gold, saved.gold);
  assert.equal(s.buildings[0].yaw, Math.PI / 2);
});
test('old checkpoints migrate to cardinal mounts without losing equipment, wounds or gold', () => {
  const s = C.createCampaign();
  C.build(s, 'ballista', 'west-watch');
  s.kingHp = 81.6;
  const raw = JSON.parse(JSON.stringify(s));
  delete raw.layout;
  for (const k of raw.knights) delete k.talents;
  raw.buildings[0].yaw = -Math.PI * 0.75;
  const migrated = C.decodeCampaign(JSON.stringify(raw))!;
  assert.equal(migrated.kingHp, 81.6);
  assert.equal(migrated.gold, s.gold);
  assert.equal(migrated.buildings[0].yaw, Math.PI);
  assert.deepEqual(migrated.knights[0].talents, []);
});
test('talent trees enforce class, prerequisite and point budgets; resets refund every point', () => {
  const s = C.createCampaign(),
    k = s.knights[0];
  assert.ok(C.learnTalent(s, k.id, 'aftershock'));
  assert.ok(C.learnTalent(s, k.id, 'mending'));
  assert.equal(C.learnTalent(s, k.id, 'slam'), null);
  assert.equal(talentRemaining(k), 0);
  const before = structuredClone(s);
  assert.ok(C.learnTalent(s, k.id, 'taunt'));
  assert.deepEqual(s, before);
  C.completeEncounter(s);
  assert.equal(talentRemaining(k), 1);
  assert.equal(C.learnTalent(s, k.id, 'aftershock'), null);
  assert.ok(C.decodeCampaign(JSON.stringify(s)));
  const invalid = structuredClone(s);
  invalid.knights[0].talents = ['earthshaker'];
  assert.equal(C.decodeCampaign(JSON.stringify(invalid)), null);
  C.resetTalents(s, k.id);
  assert.equal(talentRemaining(k), 2);
  assert.equal(s.gold, before.gold + encounters[0].reward);
});
const invader = (b: Battle, p: Partial<Actor> = {}) => {
  const actor: Actor = {
    ...structuredClone(b.knights[0]),
    id: 99901 + b.enemies.length,
    role: 'raider',
    name: 'Test raider',
    hp: 300,
    maxHp: 300,
    x: 0,
    y: 0,
    z: 12,
    deployed: true,
    talents: [],
    cooldown: 99,
    action: '',
    ...p,
  };
  b.enemies.push(actor);
  return actor;
};
test('Thunder Slam damages nearby invaders, stuns normal enemies and respects its cooldown', () => {
  const b = quiet(),
    k = b.knights[0];
  Object.assign(k, {
    x: 0,
    z: -10,
    home: { x: 0, y: 0, z: -10 },
    deployed: true,
    talents: ['slam'],
    ability: 0,
  });
  const enemy = invader(b, { x: 0, z: -12 });
  b.king.cooldown = 99;
  b.tick(0.02);
  assert.equal(enemy.hp, 276);
  assert.ok(enemy.stunned > 1);
  assert.ok(b.effects.some((e) => e.kind === 'slam'));
  const hp = enemy.hp;
  step(b, 0.3);
  assert.equal(enemy.hp, hp);
  assert.ok(k.ability > 7);
});
test('Challenging Cry redirects a hex caster away from the King and does not taunt a Dragon', () => {
  const b = quiet(),
    k = b.knights[0];
  Object.assign(k, {
    x: 4,
    z: 10,
    home: { x: 4, y: 0, z: 10 },
    deployed: true,
    talents: ['taunt'],
    cry: 0,
  });
  const e = invader(b, { role: 'hexcaster', x: 0, z: 12, cooldown: 0 });
  const dragon = invader(b, { role: 'dragon', x: 4, z: 12, action: 'arrive' });
  b.tick(0.02);
  assert.equal(e.taunter, k.id);
  assert.ok(e.taunted > 3.9);
  assert.equal(dragon.taunted, 0);
  step(b, 1);
  const shot = b.bolts.find((p) => p.owner === e.id);
  assert.ok(shot && shot.vx > 0, 'Caster shoots toward the taunting knight');
});
test('Mending Light heals living allies, grants bounded shields and never resurrects', () => {
  const b = quiet(),
    healer = b.knights[1],
    target = b.knights[2];
  Object.assign(healer, {
    x: 0,
    z: 10,
    home: { x: 0, y: 0, z: 10 },
    deployed: true,
    talents: ['mending', 'shelter'],
    healing: 0,
  });
  Object.assign(target, { x: 2, z: 10, home: { x: 2, y: 0, z: 10 }, deployed: true, hp: 50 });
  b.knights[0].hp = 0;
  b.tick(0.02);
  assert.equal(target.hp, 58);
  assert.equal(target.barrier, 10);
  assert.equal(b.knights[0].hp, 0);
  b.damage(target, 20, { x: 2, y: 0, z: 8 }, -1, true, true);
  assert.equal(target.hp, 48);
  assert.equal(target.barrier, 0);
  step(b, 4.1);
  assert.equal(target.hp, 56);
  assert.equal(target.barrier, 10);
});
test('new buildings have distinct healing and chained-damage behavior', () => {
  const s = C.createCampaign();
  C.build(s, 'spire', 'west-watch');
  C.build(s, 'sanctuary', 'east-court');
  const b = new Battle(s);
  b.start();
  b.spawnTimer = 9999;
  b.king.cooldown = 99;
  const first = invader(b, { x: 0, z: -12 }),
    second = invader(b, { x: 2, z: -13 }),
    far = invader(b, { x: 15, z: 0 });
  const k = b.knights[1];
  Object.assign(k, {
    x: 0,
    z: 11,
    home: { x: 0, y: 0, z: 11 },
    deployed: true,
    hp: 50,
    cooldown: 99,
  });
  b.defenses.forEach((d) => (d.reload = 0));
  b.tick(0.02);
  assert.equal(first.hp, 280);
  assert.equal(second.hp, 280);
  assert.equal(far.hp, 300);
  assert.equal(k.hp, 58);
  assert.equal(b.stats.defenseDamage, 40);
  assert.equal(b.bolts.filter((p) => b.defenses.some((d) => d.id === p.owner)).length, 0);
  assert.ok(b.effects.some((e) => e.kind === 'lightning' && e.end));
});

test('the King follows a continuous circular battlement at each upgraded height', () => {
  for (const tier of [1, 2, 3] as const) {
    for (let i = 0; i < 628; i++) {
      const p = wallPosition(i / 100, wallSpec(tier).height);
      assert.ok(Math.abs(Math.hypot(p.x, p.z) - 5.3) < 1e-9);
      assert.equal(p.y, wallSpec(tier).height);
      if (i) {
        const last = wallPosition((i - 1) / 100, p.y);
        assert.ok(distance(p, last) < 0.09);
      }
    }
  }
  const b = quiet();
  step(b, 2, { rotate: 1, charge: false, decree: false });
  assert.ok(distance(b.king, { x: 0, z: 4.2 }) > 4);
  const before = structuredClone(b.king);
  b.paused = true;
  step(b, 1, { rotate: -1, charge: true, decree: true });
  assert.deepEqual(b.king, before);
  assert.equal(b.charge, 0);
});
test('knights walk through both gates, hold separate positions and never expire on a summon timer', () => {
  const b = quiet();
  step(b, 5);
  assert.ok(b.knights.every((k) => k.deployed));
  assert.ok(b.knights.some((k) => k.z < -8) && b.knights.some((k) => k.z > 8));
  const ids = b.knights.map((k) => k.id);
  step(b, 55);
  assert.deepEqual(
    b.knights.map((k) => k.id),
    ids,
  );
  assert.ok(b.knights.every((k) => k.hp === k.maxHp));
  assert.ok(distance(b.knights[1], b.knights[2]) > 1);
});
test('construction commits costs once and rejected purchases preserve the complete ledger', () => {
  const s = C.createCampaign();
  assert.equal(C.build(s, 'ballista', 'east-court', 3), null);
  assert.equal(s.gold, 150);
  const before = structuredClone(s);
  assert.ok(C.build(s, 'aegis', 'east-court'));
  assert.deepEqual(s, before);
  assert.ok(C.build(s, 'aegis', 'west-court', 3));
  assert.deepEqual(s, before);
  assert.equal(C.salvage(s, s.buildings[0].id), null);
  assert.equal(s.gold, 500);
  assert.ok(C.salvage(s, 1));
  assert.equal(s.gold, 500);
});
test('wall upgrades add visible-tier capacity and preserve existing wounds', () => {
  const s = C.createCampaign();
  s.walls[1] = 100;
  assert.equal(C.upgradeWalls(s), null);
  assert.equal(s.wallTier, 2);
  assert.deepEqual(s.walls, [360, 230, 360, 360]);
  assert.equal(s.gold, 390);
  assert.ok(C.upgradeWalls(s));
  assert.equal(s.gold, 390);
  assert.equal(C.wallRepairCost(s), 22);
  C.repairWalls(s);
  assert.deepEqual(s.walls, [360, 360, 360, 360]);
  assert.equal(s.gold, 368);
});
test('six shop offers remain stable after a purchase and each item has one equipment owner', () => {
  const s = C.createCampaign(),
    offers = [...s.offers];
  C.buyOffer(s, 0);
  C.buyOffer(s, 3);
  assert.deepEqual(s.offers, offers);
  const gold = s.gold;
  assert.ok(C.buyOffer(s, 0));
  assert.equal(s.gold, gold);
  const gear = s.inventory[0].id,
    rune = s.inventory[1].id;
  assert.equal(C.equipKnight(s, 'aldren', gear), null);
  assert.equal(C.equipKnight(s, 'corvin', gear), null);
  assert.equal(s.knights[0].gear, null);
  assert.equal(s.knights[2].gear, gear);
  assert.ok(C.equipKnight(s, 'aldren', rune));
  assert.equal(C.equipRune(s, 'stormbow', rune), null);
  assert.equal(C.equipRune(s, 'sunlance', rune), null);
  assert.deepEqual(s.sockets.stormbow, []);
  assert.deepEqual(s.sockets.sunlance, [rune]);
  assert.equal(C.equipRune(s, 'sunlance', rune), null);
  assert.equal(s.gold, gold);
});
test('full rune slots reject a transfer atomically; reserve and recruitment limits hold', () => {
  const s = C.createCampaign();
  s.gold = 3000;
  C.buyOffer(s, 3);
  C.buyOffer(s, 4);
  C.equipRune(s, 'stormbow', s.inventory[0].id);
  C.equipRune(s, 'sunlance', s.inventory[1].id);
  const before = structuredClone(s);
  assert.ok(C.equipRune(s, 'stormbow', s.inventory[1].id));
  assert.deepEqual(s, before);
  C.recruit(s, 'lysa');
  assert.ok(C.assign(s, 'lysa'));
  C.assign(s, 'elin');
  assert.equal(C.assign(s, 'lysa'), null);
  assert.equal(s.knights.filter((k) => k.active).length, 3);
  const gold = s.gold;
  assert.ok(C.recruit(s, 'lysa'));
  assert.equal(s.gold, gold);
});
test('checkpoint validation accepts fractional wounds and rejects duplicate or impossible ownership', () => {
  const s = C.createCampaign();
  s.kingHp = 93.6;
  s.knights[0].hp = 76.2;
  C.buyOffer(s, 0);
  C.equipKnight(s, 'aldren', s.inventory[0].id);
  assert.deepEqual(C.decodeCampaign(JSON.stringify(s)), s);
  const duplicate = structuredClone(s);
  duplicate.knights[1].gear = s.inventory[0].id;
  assert.equal(C.decodeCampaign(JSON.stringify(duplicate)), null);
  const bad = structuredClone(s);
  bad.kingHp = 161;
  assert.equal(C.decodeCampaign(JSON.stringify(bad)), null);
  assert.equal(C.decodeCampaign('null'), null);
  assert.equal(C.decodeCampaign('{'), null);
  bad.kingHp = 160;
  bad.relic = 'worldpiercer';
  assert.equal(C.decodeCampaign(JSON.stringify(bad)), null);
});
test('shield facing changes received damage and the ward seal recharges instead of negating every hit', () => {
  const b = quiet(),
    k = b.knights[0];
  k.yaw = 0;
  k.gear = 'ward-seal';
  const front = { x: k.x, y: 0, z: k.z + 2 },
    back = { x: k.x, y: 0, z: k.z - 2 };
  assert.equal(facingShield(k, front), true);
  assert.equal(facingShield(k, back), false);
  b.damage(k, 30, front, -1);
  assert.equal(k.hp, 129);
  b.damage(k, 30, front, -1);
  assert.equal(k.hp, 111);
  b.damage(k, 30, back, -1);
  assert.equal(k.hp, 81);
  step(b, 6.1);
  b.damage(k, 30, back, -1);
  assert.equal(k.hp, 63);
});
test('mounted ballistas emit from their elevated mechanisms and aim down at field targets', () => {
  const s = C.createCampaign();
  C.build(s, 'ballista', 'east-court');
  C.upgradeWalls(s);
  const b = new Battle(s),
    defense = b.defenses[0];
  defense.reload = 0;
  const yaw = defense.yaw;
  const target = {
    id: 999,
    x: defense.x + Math.sin(yaw) * 8,
    z: defense.z + Math.cos(yaw) * 8,
    y: 0,
    hp: 100,
  };
  const bolts = stepDefenses([defense], [target], 0.02, () => 9999);
  assert.equal(bolts.length, 1);
  assert.equal(bolts[0].y, wallSpec(2).height + 1.08);
  assert.ok(bolts[0].vy < 0);
});
test('wall shields intercept at their actual height and can protect a King behind the projector', () => {
  const s = C.createCampaign();
  C.build(s, 'aegis', 'east-court');
  C.upgradeWalls(s);
  const b = new Battle(s),
    d = b.defenses[0];
  d.x = 0;
  d.z = 6;
  d.yaw = 0;
  const from = { x: 0, y: d.y + 1, z: 13 },
    to = { x: 0, y: d.y + 1, z: 4.2 };
  assert.equal(interceptSegment([d], from, to, 19), 0);
  assert.equal(d.charge, 31);
  assert.equal(d.blocked, 19);
  assert.equal(interceptSegment([d], { ...from, y: 1 }, { ...to, y: 1 }, 19), 19);
  assert.equal(d.charge, 31);
  assert.equal(
    interceptSegment([d], { x: 0, y: d.y + 1, z: 0 }, { x: 0, y: d.y + 1, z: 6 }, 19),
    19,
  );
  assert.equal(d.charge, 31);
});
test('Worldpiercer trades a narrower arc and slower reload for heavier piercing bolts', () => {
  const s = C.createCampaign();
  C.build(s, 'ballista', 'east-court');
  const b = new Battle(s),
    d = b.defenses[0];
  d.reload = 0;
  const target = { id: 999, x: d.x + Math.sin(d.yaw) * 8, z: d.z + Math.cos(d.yaw) * 8, hp: 100 };
  const emitted = stepDefenses([d], [target], 0.02, () => 9999, {
    damage: 2.2,
    pierce: 5,
    reload: 1.75,
    turning: 0.5,
    arc: 75,
  });
  assert.equal(emitted[0].damage, 34 * 2.2);
  assert.equal(emitted[0].remaining, 5);
  assert.equal(d.reload, 5.25);
  assert.equal(d.reloadDuration, 5.25);
  d.reload = 0;
  target.x = d.x + Math.sin(d.yaw + Math.PI / 4) * 8;
  target.z = d.z + Math.cos(d.yaw + Math.PI / 4) * 8;
  assert.equal(stepDefenses([d], [target], 0.02, () => 9999, { arc: 75 }).length, 0);
});
test('Dragon warning and active footprints share the same cone; committed attacks hurt only once', () => {
  const b = quiet();
  const t: Telegraph = {
    id: 99,
    kind: 'breath',
    x: 0,
    z: 14,
    yaw: Math.PI,
    radius: 1.5,
    arc: 0.7,
    length: 19,
    age: 0,
    windup: 1,
    duration: 1,
    damage: 39,
    hits: [],
  };
  assert.equal(inTelegraph(t, b.king), true);
  assert.equal(inTelegraph(t, { x: 12, y: 0, z: 4 }), false);
  b.dangers.push(t);
  step(b, 0.8);
  assert.equal(b.king.hp, 160);
  step(b, 0.4);
  assert.equal(b.king.hp, 121);
  step(b, 0.7);
  assert.equal(b.king.hp, 121);
  assert.ok(b.stats.wallDamage > 0);
});
test('the Dragon arrives from a seeded radial approach, moves, commits multiple abilities and takes physical damage', () => {
  const s = C.createCampaign();
  s.encounter = 1;
  const b = new Battle(s);
  b.start();
  b.spawned = encounters[1].budget;
  step(b, 12.1);
  const dragon = b.enemies.find((e) => e.role === 'dragon')!;
  assert.ok(dragon);
  assert.equal(dragon.action, 'arrive');
  assert.ok(dragon.y > 0);
  assert.ok(Math.abs(dragon.x) > 1);
  step(b, 3.2);
  assert.equal(dragon.y, 0);
  const start = { ...dragon };
  step(b, 2);
  assert.ok(distance(start, dragon) > 1);
  const seen = new Set<string>();
  for (let i = 0; i < 60 * 27 && b.phase === 'battle'; i++) {
    b.tick(1 / 60, { rotate: 0, charge: false, decree: false });
    if (dragon.action) seen.add(dragon.action);
  }
  assert.ok(seen.has('breath') && seen.has('rake') && seen.has('tail'));
  assert.ok(b.stats.bossDamage > 0);
  assert.ok(b.king.hp < 160 || b.stats.wallDamage > 0);
});
test('Royal Decree interrupts a warned breath once, while a committed breath remains active', () => {
  const make = () => {
    const s = C.createCampaign();
    s.encounter = 1;
    const b = new Battle(s);
    b.start();
    b.spawned = encounters[1].budget;
    step(b, 18.9);
    const d = b.enemies.find((e) => e.role === 'dragon')!;
    d.x = 0;
    d.z = 13;
    d.y = 0;
    d.action = 'breath';
    d.actionTime = 0.6;
    b.bossResolve = 90;
    b.power = 100;
    return b;
  };
  const b = make();
  b.tick(1 / 60, { rotate: 0, charge: false, decree: true });
  assert.equal(b.bossInterrupts, 1);
  assert.equal(b.enemies.find((e) => e.role === 'dragon')!.action, 'stagger');
  assert.equal(b.power, 0);
  assert.equal(b.dangers.filter((t) => t.kind !== 'hex').length, 0);
  const committed = make();
  committed.enemies.find((e) => e.role === 'dragon')!.actionTime = 2.3;
  committed.tick(1 / 60, { rotate: 0, charge: false, decree: true });
  assert.equal(committed.bossInterrupts, 0);
});
test('defeat keeps the original checkpoint; victory grants a single reward and persists wounds', () => {
  const lost = quiet(),
    checkpoint = structuredClone(lost.checkpoint);
  lost.king.hp = 0;
  lost.tick(0.02);
  assert.equal(lost.phase, 'lost');
  assert.deepEqual(lost.checkpoint, checkpoint);
  const won = quiet();
  won.spawned = encounters[0].budget;
  won.knights[0].hp = 40;
  won.tick(0.02);
  assert.equal(won.phase, 'won');
  assert.equal(won.state.gold, 650 + encounters[0].reward);
  assert.equal(won.state.knights[0].hp, 55);
  const state = structuredClone(won.state);
  step(won, 10);
  assert.deepEqual(won.state, state);
  assert.deepEqual(C.decodeCampaign(JSON.stringify(won.state)), won.state);
});
