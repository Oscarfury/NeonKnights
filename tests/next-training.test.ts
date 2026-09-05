import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTraining,
  groundHeight,
  issueOrder,
  moveActor,
  neutralInput,
  segmentSphere,
  stepTraining,
} from '../src/next/world/Training';

test('courtyard movement preserves both axes, blocks balcony walls, and ascends the ramp', () => {
  const p = { x: 0, y: 0, z: 0 };
  moveActor(p, 0.1, 0.1);
  assert.equal(p.x, 0.1);
  assert.equal(p.z, 0.1);
  const wall = { x: 7, y: 0, z: 3.1 };
  moveActor(wall, 0, -0.2);
  assert.equal(wall.z, 3.1);
  const ramp = { x: 1.9, y: 0, z: 0 };
  for (let i = 0; i < 90; i++) moveActor(ramp, 0.06, 0);
  assert.ok(ramp.x > 7);
  assert.equal(ramp.y, 1.8);
  assert.equal(groundHeight(4, 0), 0.9);
});
test('a fast arrow cannot tunnel through a target between simulation steps', () => {
  assert.equal(
    segmentSphere({ x: 0, y: 1, z: 3 }, { x: 0, y: 1, z: -3 }, { x: 0, y: 1, z: 0 }, 0.3),
    true,
  );
  assert.equal(
    segmentSphere({ x: 2, y: 1, z: 3 }, { x: 2, y: 1, z: -3 }, { x: 0, y: 1, z: 0 }, 0.3),
    false,
  );
});
test('bow damage follows the release moment, then a travelling projectile', () => {
  const s = createTraining(),
    i = neutralInput();
  i.primary = true;
  for (let n = 0; n < 40; n++) stepTraining(s, i);
  assert.equal(s.shots, 0);
  assert.equal(s.hits, 0);
  for (let n = 0; n < 10; n++) stepTraining(s, i);
  assert.equal(s.shots, 1);
  assert.equal(s.hits, 0);
  for (let n = 0; n < 38; n++) stepTraining(s, i);
  assert.ok(s.hits > 0);
});
test('a ward resolves once, hurts stationary actors, and can be dodged', () => {
  const s = createTraining();
  s.hazards = [{ id: 1, x: 0, z: 5, radius: 2.15, age: 0, hit: [] }];
  for (let n = 0; n < 130; n++) stepTraining(s, neutralInput());
  assert.equal(s.player.hp, 78);
  assert.equal(s.damage, 22);
  const d = createTraining();
  d.hazards = [{ id: 1, x: 0, z: 5, radius: 2.15, age: 1.48, hit: [] }];
  const i = neutralInput();
  i.dodge = true;
  stepTraining(d, i);
  i.dodge = false;
  stepTraining(d, i);
  assert.equal(d.player.hp, 100);
  assert.equal(d.dodged, 1);
  assert.equal(d.dodgeCharges, 1);
});
test('pausing freezes combat and a company outlives the old summon duration', () => {
  const s = createTraining();
  s.paused = true;
  for (let n = 0; n < 900; n++) stepTraining(s, neutralInput());
  assert.equal(s.time, 0);
  s.paused = false;
  for (let n = 0; n < 900; n++) stepTraining(s, neutralInput());
  assert.equal(s.company.length, 2);
  assert.ok(Math.hypot(s.company[0].x - s.company[1].x, s.company[0].z - s.company[1].z) > 1);
});
test('empty focus locks slow time until released and recharged', () => {
  const s = createTraining(),
    i = neutralInput();
  s.focus = 0.1;
  i.slow = true;
  stepTraining(s, i);
  assert.equal(s.slowLocked, true);
  for (let n = 0; n < 150; n++) stepTraining(s, i);
  assert.equal(s.lastDelta, 1 / 60);
  i.slow = false;
  stepTraining(s, i);
  assert.equal(s.slowLocked, false);
  i.slow = true;
  stepTraining(s, i);
  assert.equal(s.lastDelta, 0.3 / 60);
});
test('formation orders route companions onto and off the balcony', () => {
  const s = createTraining();
  issueOrder(s, { x: 8, y: 1.8, z: 0 });
  for (let n = 0; n < 1500; n++) stepTraining(s, neutralInput());
  for (const a of s.company) {
    assert.equal(a.y, 1.8);
    assert.ok(a.x > 6);
  }
  issueOrder(s, { x: -3, y: 0, z: 4 });
  for (let n = 0; n < 1500; n++) stepTraining(s, neutralInput());
  for (const a of s.company) {
    assert.equal(a.y, 0);
    assert.ok(a.x < 0);
  }
});
test('ward damage is resolved on the marked elevation', () => {
  const s = createTraining();
  s.player.x = 8;
  s.player.z = 0;
  s.player.y = 1.8;
  s.hazards = [{ id: 1, x: 8, y: 0, z: 0, radius: 2, age: 1.49, hit: [] }];
  stepTraining(s, neutralInput());
  assert.equal(s.player.hp, 100);
  s.hazards = [{ id: 2, x: 8, y: 1.8, z: 0, radius: 2, age: 1.49, hit: [] }];
  stepTraining(s, neutralInput());
  assert.equal(s.player.hp, 78);
});
