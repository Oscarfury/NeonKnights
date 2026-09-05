import test from 'node:test';
import assert from 'node:assert/strict';
import {
  makeDanger,
  resolveDanger,
  insideDanger,
  type DangerTarget,
} from '../src/next/combat/Hazards';
import { createTraining, neutralInput, stepTraining } from '../src/next/world/Training';

const victim = (x = 0, z = 0): DangerTarget => ({
  id: 'knight',
  x,
  y: 0,
  z,
  previous: { x, y: 0, z },
  team: 'company',
  immune: false,
  alive: true,
});
test('committed impact sweeps actor travel and respects team, height and one-hit limits', () => {
  const h = makeDanger(1, 'impact', { x: 0, y: 0, z: 0 });
  h.age = 1.5;
  const a = victim(4);
  a.previous.x = -4;
  assert.equal(resolveDanger(h, [a], 0.06)[0].damage, 22);
  assert.equal(resolveDanger(h, [a], 0.01).length, 0);
  const masked = makeDanger(2, 'impact', { x: 0, y: 0, z: 0 });
  masked.targets = ['commander'];
  masked.age = 1.49;
  assert.equal(resolveDanger(masked, [victim()], 0.02).length, 0);
  const high = makeDanger(3, 'impact', { x: 0, y: 1.8, z: 0 });
  high.age = 1.49;
  assert.equal(resolveDanger(high, [victim()], 0.02).length, 0);
});
test('sweeping ray crosses a target between frames but leaves the rear safe', () => {
  const h = makeDanger(1, 'sweep', { x: 0, y: 0, z: 0 });
  const a = victim(0, 4),
    rear = victim(0, -4);
  rear.id = 'rear';
  h.age = h.warning;
  assert.equal(insideDanger(h, a), false);
  const hits = resolveDanger(h, [a, rear], h.active);
  assert.deepEqual(
    hits.map((v) => v.target),
    ['knight'],
  );
});
test('lingering fire uses six half-second pulses at different simulation rates', () => {
  for (const dt of [1 / 30, 1 / 60, 1 / 144]) {
    const h = makeDanger(1, 'fire', { x: 0, y: 0, z: 0 });
    let damage = 0;
    while (h.age < 5)
      damage += resolveDanger(h, [victim()], dt).reduce((sum, hit) => sum + hit.damage, 0);
    assert.equal(damage, 36);
  }
});
test('a dodge avoids a contact without making the later fire pulses harmless', () => {
  const h = makeDanger(1, 'fire', { x: 0, y: 0, z: 0 });
  h.age = 1.49;
  const a = victim();
  a.immune = true;
  assert.equal(resolveDanger(h, [a], 0.02)[0].avoided, true);
  a.immune = false;
  assert.equal(resolveDanger(h, [a], 0.2).length, 0);
  assert.equal(resolveDanger(h, [a], 0.4)[0].damage, 6);
});
test('weapon switching takes a stow and equip and cannot release a queued shot', () => {
  const s = createTraining(),
    i = neutralInput();
  i.alternate = true;
  for (let n = 0; n < 30; n++) stepTraining(s, i);
  i.swap = true;
  i.primary = true;
  i.alternate = false;
  stepTraining(s, i);
  i.swap = false;
  assert.equal(s.player.action, 'weapon_stow');
  assert.equal(s.player.weapon, 'stormbow');
  for (let n = 0; n < 36; n++) stepTraining(s, i);
  assert.equal(s.player.weapon, 'sunlance');
  assert.equal(s.player.action, 'weapon_equip');
  assert.equal(s.shots, 0);
  for (let n = 0; n < 50; n++) stepTraining(s, i);
  assert.ok(s.shots > 0);
});
test('dodging cancels an uncommitted bow draw and uses the movement direction', () => {
  const s = createTraining(),
    i = neutralInput();
  i.alternate = true;
  for (let n = 0; n < 30; n++) stepTraining(s, i);
  i.alternate = false;
  i.dodge = true;
  i.x = 1;
  stepTraining(s, i);
  assert.equal(s.dodgeDirection, 'dodge_left'); // Commander faces north.
  i.dodge = false;
  for (let n = 0; n < 90; n++) stepTraining(s, i);
  assert.equal(s.shots, 0);
});
test('assisting requires proximity, uninterrupted time and a field dressing', () => {
  const s = createTraining(),
    i = neutralInput();
  s.order = 'hold';
  s.company[0].hp = 0;
  i.rescue = true;
  for (let n = 0; n < 120; n++) stepTraining(s, i);
  assert.equal(s.rescues, 0);
  s.player.x = s.company[0].x;
  s.player.z = s.company[0].z + 0.7;
  for (let n = 0; n < 60; n++) stepTraining(s, i);
  assert.ok(s.rescueProgress > 0.9);
  i.rescue = false;
  stepTraining(s, i);
  assert.equal(s.rescueProgress, 0);
  i.rescue = true;
  for (let n = 0; n < 115; n++) stepTraining(s, i);
  assert.equal(s.company[0].hp, 35);
  assert.equal(s.company[0].action, 'recover');
  assert.equal(s.rescueCharges, 1);
  assert.equal(s.rescues, 1);
  i.rescue = false;
  i.swap = true;
  i.dodge = true;
  const companion = s.company[0];
  // The rescued actor must finish its recovery instead of immediately resuming
  // formation movement; the commander remains independently controllable.
  const position = [companion.x, companion.z];
  stepTraining(s, i);
  assert.equal(companion.action, 'recover');
  assert.deepEqual([companion.x, companion.z], position);
});
test('a surviving knight rescues the commander, while an exhausted company fails', () => {
  const s = createTraining(),
    i = neutralInput();
  s.player.hp = 0;
  i.primary = true;
  i.x = 1;
  for (let n = 0; n < 120; n++) stepTraining(s, i);
  assert.equal(s.player.x, 0);
  assert.equal(s.shots, 0);
  for (let n = 0; n < 300 && s.player.hp === 0; n++) stepTraining(s, i);
  assert.equal(s.player.hp, 35);
  assert.equal(s.rescues, 1);
  i.swap = true;
  i.dodge = true;
  stepTraining(s, i);
  assert.equal(s.player.action, 'recover');
  s.player.hp = 0;
  s.rescueCharges = 0;
  stepTraining(s, i);
  assert.equal(s.failed, true);
});
test('incoming damage interrupts an assist without spending a dressing', () => {
  const s = createTraining(),
    i = neutralInput();
  s.company[0].hp = 0;
  s.player.x = s.company[0].x;
  s.player.z = s.company[0].z - 1;
  i.rescue = true;
  for (let n = 0; n < 80; n++) stepTraining(s, i);
  assert.ok(s.rescueProgress > 1);
  s.hazards = [{ ...makeDanger(1, 'impact', s.player), age: 1.49 }];
  stepTraining(s, i);
  assert.equal(s.rescueProgress, 0);
  assert.equal(s.rescueCharges, 2);
  assert.equal(s.company[0].hp, 0);
});
test('a short fire tap at the end of a dodge is buffered until the dodge finishes', () => {
  const s = createTraining(),
    i = neutralInput();
  s.player.weapon = 'sunlance';
  i.dodge = true;
  stepTraining(s, i);
  i.dodge = false;
  for (let n = 0; n < 6; n++) stepTraining(s, i);
  i.primary = true;
  stepTraining(s, i);
  i.primary = false;
  assert.equal(s.shots, 0);
  for (let n = 0; n < 45; n++) stepTraining(s, i);
  assert.equal(s.shots, 1);
});
