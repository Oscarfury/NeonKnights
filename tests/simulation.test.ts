import test from 'node:test';
import assert from 'node:assert/strict';
import { ANCHORS, ENEMIES, WEAPONS, weaponStats, type WeaponId } from '../src/game/data/catalog';
import { createRun } from '../src/game/simulation/RunState';
import { step } from '../src/game/simulation/Simulation';
import {
  beginWave,
  bossAt,
  planWave,
  spawnEnemy,
  completeWave,
} from '../src/game/simulation/WaveDirector';
import {
  damageEnemy,
  hurtFortress,
  makeAttack,
  obstructed,
} from '../src/game/simulation/CombatSystem';
import { fireWeapon, updateProjectiles, alternate } from '../src/game/simulation/WeaponSystem';
import {
  buyOffer,
  chooseEvent,
  generateOffers,
  repair,
  reroll,
  upgradePad,
  combinations,
} from '../src/game/simulation/EconomySystem';
import { commandSquad, updateSquad } from '../src/game/simulation/SquadSystem';
import { emptyControls } from '../src/game/simulation/types';
import { decodeCheckpoint } from '../src/game/persistence/storage';

const enemy = (
  run: ReturnType<typeof createRun>,
  kind: keyof typeof ENEMIES = 'squire',
  reward = true,
) => spawnEnemy(run, { time: 0, kind, sector: 1, offset: 0, reward });
test('boss schedule has all three bosses without introduction-branch conflicts', () => {
  for (const [wave, kind] of [
    [5, 'dragon'],
    [10, 'golem'],
    [15, 'king'],
  ] as const) {
    const r = createRun(5);
    r.wave = wave;
    assert.equal(bossAt(wave), kind);
    assert.equal(planWave(r).filter((s) => s.kind === kind).length, 1);
  }
  assert.equal(bossAt(4), null);
});
test('authored encounters and fresh states are deterministic and independent', () => {
  const a = createRun(44),
    b = createRun(44);
  assert.deepEqual(planWave(a), planWave(b));
  a.runes.chain = 3;
  a.projectiles.push({} as never);
  assert.equal(b.runes.chain, undefined);
  assert.equal(b.projectiles.length, 0);
});
test('pause freezes all simulation state including projectiles, status and wave timers', () => {
  const r = createRun(1);
  beginWave(r);
  r.paused = true;
  const before = structuredClone(r);
  const input = emptyControls();
  input.fire = true;
  input.alt = true;
  input.slow = true;
  input.command = true;
  for (let i = 0; i < 120; i++) step(r, input);
  assert.deepEqual(r, before);
});
test('time slow preserves player attack cadence, drains real time, and cannot flicker on empty', () => {
  const r = createRun();
  beginWave(r);
  r.spawns = [{ time: 999, kind: 'squire', sector: 0, offset: 0, reward: true }];
  const input = emptyControls();
  input.slow = true;
  for (let i = 0; i < 60; i++) step(r, input);
  assert.ok(Math.abs(r.energy - 60) < 0.01);
  assert.ok(Math.abs(r.waveTime - 0.35) < 0.001);
  for (let i = 0; i < 600; i++) step(r, input);
  assert.equal(r.slow, false);
  assert.equal(r.slowLocked, true);
  input.slow = false;
  step(r, input);
  assert.equal(r.slowLocked, false);
});
test('phase momentum has a two-second shared cooldown', () => {
  const r = createRun();
  beginWave(r);
  r.runes.momentum = 1;
  const input = emptyControls();
  input.sector = 0;
  step(r, input);
  r.momentum = 0;
  input.sector = 3;
  step(r, input);
  assert.equal(r.momentum, 0);
  assert.ok(r.momentumCooldown > 1.9);
});
test('fortress line of sight blocks cross-castle shots and permits outward fire', () => {
  assert.equal(obstructed(ANCHORS[1], { x: 1100, y: 420 }), false);
  assert.equal(obstructed(ANCHORS[1], { x: 100, y: 420 }), true);
});
for (const id of ['stormbow', 'sunlance'] as WeaponId[])
  test(`${id} charged attacks deal greater damage using the selected weapon`, () => {
    const hit = (charge: number) => {
      const r = createRun(2, id);
      beginWave(r);
      const e = enemy(r, 'ram');
      e.x = 930;
      e.y = 420;
      r.aim = { x: 930, y: 420 };
      fireWeapon(r, charge);
      for (let i = 0; i < 30; i++) updateProjectiles(r, 1 / 60);
      return e.maxHp - e.hp;
    };
    assert.ok(hit(1) > hit(0) * 2);
  });
for (const id of Object.keys(WEAPONS) as WeaponId[])
  test(`ballista keeps bolt ownership with ${id} and time slow`, () => {
    const r = createRun(2, id);
    beginWave(r);
    r.slow = true;
    r.runes.chain = 3;
    r.pads[1] = { kind: 'ballista', rank: 1, cooldown: 0, built: 1 };
    enemy(r);
    updateSquad(r, 1 / 60);
    assert.equal(r.projectiles.length, 1);
    assert.equal(r.projectiles[0].attack.weapon, 'bolt');
    assert.equal(r.projectiles[0].attack.source, 'structure');
    assert.equal(r.projectiles[0].attack.damage, 26);
    assert.equal(r.projectiles[0].attack.chain, 0);
  });
test('one lethal hit awards exactly once; summoned units do not fund gold or souls', () => {
  const r = createRun();
  r.pads[0] = { kind: 'ossuary', rank: 1, cooldown: 0, built: 1 };
  const e = enemy(r);
  const a = makeAttack(r, 'player', 1000);
  damageEnemy(r, e, a, r.player);
  damageEnemy(r, e, makeAttack(r, 'player', 1000), r.player);
  assert.equal(r.gold, 84);
  assert.equal(r.kills, 1);
  assert.equal(r.souls, 1);
  damageEnemy(r, enemy(r, 'squire', false), makeAttack(r, 'player', 1000), r.player);
  assert.equal(r.gold, 84);
  assert.equal(r.souls, 1);
});
test('chain attacks share a finite hit set and cannot loop back into a target', () => {
  const r = createRun();
  r.runes.chain = 3;
  const es = Array.from({ length: 6 }, (_, i) => {
    const e = enemy(r, 'ram');
    e.x = 900 + i * 30;
    return e;
  });
  const a = makeAttack(r, 'player', 100);
  damageEnemy(r, es[0], a, r.player);
  assert.equal(a.hit.length, 4);
  assert.equal(new Set(a.hit).size, 4);
  assert.equal(es[4].hp, es[4].maxHp);
});
test('score combo does not multiply gold and treasury benefit is capped per wave', () => {
  const r = createRun();
  r.combo = 10;
  r.pads[0] = { kind: 'treasury', rank: 1, cooldown: 0, built: 1 };
  for (let i = 0; i < 50; i++) damageEnemy(r, enemy(r), makeAttack(r, 'player', 1000), r.player);
  assert.equal(r.ledger.treasury, 15);
  assert.equal(r.gold, 80 + 200 + 15);
});
test('poison stack cap and expiry are enforced', () => {
  const r = createRun();
  beginWave(r);
  r.runes.venom = 1;
  const e = enemy(r, 'ram');
  for (let i = 0; i < 9; i++) damageEnemy(r, e, makeAttack(r, 'player', 1), r.player);
  assert.equal(e.poison, 5);
  const input = emptyControls();
  for (let i = 0; i < 190; i++) step(r, input);
  assert.equal(e.poison, 0);
  assert.equal(e.poisonTime, 0);
});
test('owned weapon remains eligible through rank III; purchasing leaves other offers stable', () => {
  const r = createRun();
  r.phase = 'shop';
  r.gold = 1000;
  generateOffers(r);
  const before = r.offers.map((o) => o.id);
  assert.equal(buyOffer(r, r.offers[0].id, 0), true);
  assert.equal(r.rank, 2);
  assert.deepEqual(
    r.offers.map((o) => o.id),
    before,
  );
  assert.equal(buyOffer(r, r.offers[0].id, 0), false);
  r.wave++;
  generateOffers(r);
  assert.equal(r.offers[0].kind, 'weapon');
  buyOffer(r, r.offers[0].id, 0);
  assert.equal(r.rank, 3);
  generateOffers(r);
  assert.notEqual(r.offers[0].kind, 'weapon');
});
test('rune caps, slot limits, stable reroll cost and repair service are enforced', () => {
  const r = createRun();
  r.phase = 'shop';
  r.gold = 500;
  r.runes = { chain: 3 };
  generateOffers(r);
  assert.equal(r.offers[2].kind, 'order');
  const hp = r.hp;
  assert.equal(repair(r), false);
  r.hp -= 10;
  assert.equal(repair(r), true);
  assert.equal(r.hp, hp);
  const gold = r.gold;
  assert.equal(reroll(r), true);
  assert.equal(reroll(r), true);
  assert.equal(reroll(r), false);
  assert.equal(r.gold, gold - 45);
});
test('rapid mechanism displayed interval is the firing cooldown', () => {
  const r = createRun();
  beginWave(r);
  r.runes.rapid = 2;
  fireWeapon(r);
  assert.equal(r.fireCooldown, weaponStats(r.weapon, r.rank, 2).interval);
});
test('Cinder overheat and vent create a finite heat cycle', () => {
  const r = createRun(1, 'cinder');
  beginWave(r);
  r.heat = 100;
  r.overheated = true;
  assert.equal(fireWeapon(r), false);
  alternate(r);
  assert.equal(r.overheated, false);
  assert.equal(r.heat, 35);
  assert.equal(r.altCooldown, 3);
});
test('Chakram can hit on its return and Starfall detonates its own active volley', () => {
  const r = createRun(1, 'chakram');
  beginWave(r);
  fireWeapon(r);
  r.projectiles[0].attack.hit.push(999);
  alternate(r);
  assert.equal(r.projectiles[0].returning, true);
  assert.deepEqual(r.projectiles[0].attack.hit, []);
  const s = createRun(1, 'starfall');
  beginWave(s);
  fireWeapon(s);
  assert.equal(s.marks.length, 1);
  alternate(s);
  updateProjectiles(s, 1 / 60);
  assert.equal(s.marks.length, 0);
});
test('commands and spectral companions obey a six-unit capacity', () => {
  const r = createRun();
  beginWave(r);
  r.orderRank = 3;
  r.souls = 6;
  r.pads[0] = { kind: 'ossuary', rank: 1, cooldown: 0, built: 1 };
  for (let i = 0; i < 10; i++) {
    r.commandCooldown = 0;
    commandSquad(r);
  }
  assert.equal(r.knights.length, 6);
});
test('boss weakness interruption and Golem arm removal disable the relevant attack', () => {
  const r = createRun();
  beginWave(r);
  const e = enemy(r, 'golem');
  r.aim = { x: e.x - 48, y: e.y };
  damageEnemy(r, e, makeAttack(r, 'player', 1000), r.player);
  assert.equal(e.limbs[0], 0);
  assert.ok(e.exposed > 0);
  const d = enemy(r, 'dragon');
  r.aim = { x: d.x, y: d.y };
  d.windup = 2;
  damageEnemy(r, d, makeAttack(r, 'player', 100), r.player);
  assert.equal(d.windup, 0);
  assert.ok(d.exposed > 0);
});
test('defeat is final within a tick and completion does not overwrite it', () => {
  const r = createRun();
  beginWave(r);
  r.hp = 1;
  hurtFortress(r, 100, 'Lancer', 1);
  assert.equal(r.phase, 'defeat');
  completeWave(r);
  assert.equal(r.phase, 'defeat');
});
test('act events and final victory transition have real outcomes', () => {
  const r = createRun();
  beginWave(r);
  r.wave = 5;
  completeWave(r);
  assert.equal(r.phase, 'event');
  assert.equal(r.wave, 6);
  const gold = r.gold;
  chooseEvent(r, 'vault');
  assert.equal(r.gold, gold + 100);
  assert.equal(r.phase, 'shop');
  beginWave(r);
  r.wave = 15;
  completeWave(r);
  assert.equal(r.phase, 'victory');
});
test('checkpoint decoding rejects invalid and corrupt data and resets live entities', () => {
  const r = createRun();
  r.phase = 'shop';
  generateOffers(r);
  assert.equal(decodeCheckpoint(null), null);
  assert.equal(decodeCheckpoint({ ...r, version: 1 }), null);
  assert.equal(
    decodeCheckpoint({ ...r, pads: [{ kind: 'not-real', rank: 1 }, null, null, null] }),
    null,
  );
  assert.equal(decodeCheckpoint({ ...r, runes: { chain: 999 } }), null);
  assert.equal(decodeCheckpoint({ ...r, hp: NaN }), null);
  const restored = decodeCheckpoint(r)!;
  assert.ok(restored);
  assert.equal(restored.phase, 'shop');
  assert.equal(restored.projectiles.length, 0);
  assert.equal(restored.fireCooldown, 0);
  assert.deepEqual(restored.offers, r.offers);
});
test('structures cannot overwrite occupied pads and upgrades have an enforced rank cap', () => {
  const r = createRun();
  r.phase = 'shop';
  r.gold = 999;
  r.pads[0] = { kind: 'aegis', rank: 3, cooldown: 0, built: 1 };
  r.offers = [{ id: 'test', kind: 'structure', key: 'tesla', bought: false }];
  assert.equal(buyOffer(r, 'test', 0), false);
  assert.equal(upgradePad(r, 0), false);
  assert.equal(buyOffer(r, 'test', 1), true);
});
test('named combinations are tied to actual build prerequisites', () => {
  const r = createRun();
  r.runes.chain = 1;
  r.pads[0] = { kind: 'chapel', rank: 1, cooldown: 0, built: 1 };
  r.pads[1] = { kind: 'treasury', rank: 1, cooldown: 0, built: 1 };
  assert.deepEqual(combinations(r), ['storm', 'angel', 'midas']);
});
test('boss capstones alter weapon behavior with bounded attacks', () => {
  const bow = createRun();
  beginWave(bow);
  bow.capstone = true;
  fireWeapon(bow, 1);
  assert.equal(bow.projectiles[0].attack.chain, 3);
  const stars = createRun(1, 'starfall');
  beginWave(stars);
  stars.capstone = true;
  fireWeapon(stars);
  assert.equal(stars.marks.length, 2);
  const fire = createRun(1, 'cinder');
  beginWave(fire);
  fire.capstone = true;
  alternate(fire);
  assert.equal(fire.altCooldown, 1.5);
});
test('full build pads cannot generate an unusable construction offer', () => {
  const r = createRun();
  r.phase = 'shop';
  r.pads = r.pads.map(() => ({ kind: 'aegis', rank: 1, cooldown: 0, built: 1 }));
  generateOffers(r);
  assert.equal(
    r.offers.some((o) => o.kind === 'structure'),
    false,
  );
});
