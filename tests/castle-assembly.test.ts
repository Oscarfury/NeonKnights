import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { Assets } from '../src/next/presentation/Assets';
import { DefenseView } from '../src/next/presentation/DefenseView';
import { CastleAssembly } from '../src/next/castle/CastleAssembly';
import { Battle } from '../src/next/castle/Battle';
import * as C from '../src/next/castle/Campaign';

function fixture() {
  const castle = new Group(),
    chapel = new Group();
  const material = new MeshStandardMaterial({ color: 0x79918d });
  material.name = 'Weathered castle stone 2';
  castle.add(new Mesh(new BoxGeometry(1, 1, 1), material));
  chapel.add(new Mesh(new BoxGeometry(1, 1.2, 1), material));
  return {
    assets: {
      get: (name: string) => ({ scene: name.startsWith('castle') ? castle : chapel }),
    } as Assets,
    material,
    chapel,
  };
}

test('purchased wings create the shared tower; salvage removes the keep back to foundations', () => {
  const { assets } = fixture(),
    s = C.createCampaign();
  s.gold = 5000;
  const empty = new CastleAssembly(s, assets);
  assert.ok(new Box3().setFromObject(empty.root).max.y < 0.2);
  empty.dispose();
  C.build(s, 'tavern', 'inner-sw');
  const first = new CastleAssembly(s, assets),
    initialHeight = new Box3().setFromObject(first.root).max.y;
  assert.ok(initialHeight > 2);
  first.dispose();
  C.build(s, 'sanctuary', 'inner-se');
  s.encounter = 5;
  C.build(s, 'forge', 'inner-ne');
  C.build(s, 'war-room', 'inner-nw');
  const full = new CastleAssembly(s, assets);
  assert.equal(full.summary.connections, 4);
  assert.ok(new Box3().setFromObject(full.root).max.y > initialHeight);
  full.dispose();
  for (const b of [...s.buildings]) C.salvage(s, b.id);
  const cleared = new CastleAssembly(s, assets);
  assert.ok(new Box3().setFromObject(cleared.root).max.y < 0.2);
  cleared.dispose();
});

test('all three wing ranks add height without spreading into the patrol; disposal owns only generated geometry', () => {
  const { assets, material, chapel } = fixture();
  let sourceDisposed = 0;
  material.addEventListener('dispose', () => sourceDisposed++);
  (chapel.children[0] as Mesh).geometry.addEventListener('dispose', () => sourceDisposed++);
  for (const kind of ['tavern', 'sanctuary', 'forge', 'war-room'] as const) {
    let previousHeight = 0;
    for (const rank of [1, 2, 3] as const) {
      const view = new DefenseView(assets, kind, rank, false, true);
      const bounds = new Box3().setFromObject(view.model);
      assert.ok(bounds.max.y > previousHeight + 0.7);
      previousHeight = bounds.max.y;
      assert.ok(bounds.max.x < 1.6 && bounds.min.x > -1.6);
      assert.ok(bounds.max.z < 2 && bounds.min.z > -1.6);
      let generated = 0,
        disposed = 0;
      view.model.traverse((o) => {
        if (o instanceof Mesh && o.userData.modularGeometry) {
          generated++;
          o.geometry.addEventListener('dispose', () => disposed++);
        }
      });
      assert.ok(generated > 0);
      view.dispose();
      assert.equal(disposed, generated);
      assert.equal(sourceDisposed, 0);
    }
  }
});

test('a complete rank-three tower leaves both company deployment routes and the royal patrol open', () => {
  const { assets } = fixture(),
    s = C.createCampaign();
  s.gold = 10000;
  C.build(s, 'tavern', 'inner-sw', 3);
  for (const site of ['inner-nw', 'inner-ne', 'inner-se'] as const)
    C.build(s, 'sanctuary', site, 3);
  C.recruit(s, 'elin');
  C.recruit(s, 'corvin');
  C.upgradeWalls(s);
  C.upgradeWalls(s);
  const b = new Battle(s),
    boxes: Box3[] = [];
  const views = b.defenses.map((d) => {
    const v = new DefenseView(assets, d.kind, d.rank, false, true);
    v.update(d);
    boxes.push(new Box3().setFromObject(v.model));
    return v;
  });
  b.start();
  b.spawnTimer = 9999;
  for (let i = 0; i < 600; i++) {
    b.tick(1 / 60);
    for (const actor of [b.king, ...b.knights])
      for (const box of boxes)
        assert.ok(
          actor.x < box.min.x || actor.x > box.max.x || actor.z < box.min.z || actor.z > box.max.z,
          `${actor.name} entered a tower wing`,
        );
  }
  assert.ok(b.knights.every((k) => k.deployed && Math.hypot(k.x, k.z) > 8));
  views.forEach((v) => v.dispose());
});
