import { Group, SkinnedMesh, type BufferGeometry } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Merge only compatible skin parts; keep the rig, bind space and authored vertex data intact. */
export function batchCharacter(root: Group) {
  root.updateMatrixWorld(true);
  const meshes: SkinnedMesh[] = [];
  root.traverse((o) => {
    if (o instanceof SkinnedMesh && !o.morphTargetInfluences?.length) meshes.push(o);
  });
  const used = new Set<SkinnedMesh>(),
    retired = new Set<BufferGeometry>();
  for (const first of meshes) {
    if (used.has(first)) continue;
    const group = meshes.filter(
      (m) =>
        !used.has(m) &&
        m.material === first.material &&
        m.parent === first.parent &&
        m.matrix.equals(first.matrix) &&
        m.bindMatrix.equals(first.bindMatrix) &&
        m.skeleton.bones.length === first.skeleton.bones.length &&
        m.skeleton.bones.every(
          (bone, i) =>
            bone === first.skeleton.bones[i] &&
            m.skeleton.boneInverses[i].equals(first.skeleton.boneInverses[i]),
        ),
    );
    if (group.length < 2) continue;
    const geometry = mergeGeometries(group.map((m) => m.geometry));
    if (!geometry) continue;
    const merged = new SkinnedMesh(geometry, first.material);
    merged.name = 'Batched character body';
    merged.position.copy(first.position);
    merged.quaternion.copy(first.quaternion);
    merged.scale.copy(first.scale);
    merged.bind(first.skeleton, first.bindMatrix);
    merged.bindMode = first.bindMode;
    merged.castShadow = first.castShadow;
    merged.receiveShadow = first.receiveShadow;
    first.parent!.add(merged);
    group.forEach((m) => {
      used.add(m);
      retired.add(m.geometry);
      m.removeFromParent();
    });
  }
  // A source geometry can be shared by other, incompatible parts.
  root.traverse((o) => {
    if (o instanceof SkinnedMesh) retired.delete(o.geometry);
  });
  retired.forEach((g) => g.dispose());
  return used.size;
}
