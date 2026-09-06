import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Bone,
  BufferGeometry,
  Float32BufferAttribute,
  Uint16BufferAttribute,
  Group,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
  Vector3,
} from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { batchCharacter } from '../src/next/presentation/BatchCharacter';

test('compatible body parts become one draw while animation binding and instance independence survive', () => {
  const root = new Group(),
    bone = new Bone();
  root.add(bone);
  const skeleton = new Skeleton([bone]),
    material = new MeshStandardMaterial(),
    parts: SkinnedMesh[] = [];
  for (const x of [0, 2]) {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      'position',
      new Float32BufferAttribute([x, 0, 0, x + 1, 0, 0, x, 1, 0], 3),
    );
    geometry.setAttribute('skinIndex', new Uint16BufferAttribute(new Array(12).fill(0), 4));
    geometry.setAttribute(
      'skinWeight',
      new Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], 4),
    );
    const mesh = new SkinnedMesh(geometry, material);
    root.add(mesh);
    mesh.bind(skeleton);
    parts.push(mesh);
  }
  bone.position.y = 3;
  root.updateMatrixWorld(true);
  skeleton.update();
  const points = parts.flatMap((m) =>
    [0, 1, 2].map((i) => m.getVertexPosition(i, new Vector3()).toArray()),
  );
  assert.equal(batchCharacter(root), 2);
  const merged = root.children.find((o) => o instanceof SkinnedMesh) as SkinnedMesh;
  root.updateMatrixWorld(true);
  merged.skeleton.update();
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5].map((i) => merged.getVertexPosition(i, new Vector3()).toArray()),
    points,
  );
  const other = clone(root),
    copy = other.children.find((o) => o instanceof SkinnedMesh) as SkinnedMesh;
  assert.notEqual(copy.skeleton.bones[0], bone);
  copy.skeleton.bones[0].position.y = 6;
  other.updateMatrixWorld(true);
  copy.skeleton.update();
  assert.equal(bone.position.y, 3);
  assert.equal(copy.getVertexPosition(0, new Vector3()).y, 6);
});
