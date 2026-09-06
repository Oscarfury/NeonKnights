import {
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  Vector3,
} from 'three';
import { wallSpec } from './Catalog';
import type { Battle } from './Battle';

/** One clear wall shield and one batched projectile trail draw. */
export class RoyalEffects {
  readonly root = new Group();
  private panelGeometry = new CylinderGeometry(
    6.86,
    6.86,
    1,
    32,
    1,
    true,
    -Math.PI / 4,
    Math.PI / 2,
  );
  private guardMaterial = new MeshBasicMaterial({
    color: 0x82eaff,
    transparent: true,
    opacity: 0.28,
    side: DoubleSide,
    depthWrite: false,
  });
  private threatMaterial = new MeshBasicMaterial({
    color: 0xffad54,
    transparent: true,
    opacity: 0.14,
    side: DoubleSide,
    depthWrite: false,
  });
  private guard = new Mesh(this.panelGeometry, this.guardMaterial);
  private threat = new Mesh(this.panelGeometry, this.threatMaterial);
  private trailGeometry = new CylinderGeometry(0.06, 0.015, 1, 5);
  private trailMaterial = new MeshBasicMaterial({
    color: 0xffdd8a,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
  });
  private trails = new InstancedMesh(this.trailGeometry, this.trailMaterial, 64);
  private matrix = new Matrix4();
  private p = new Vector3();
  private v = new Vector3();
  private scale = new Vector3();
  private up = new Vector3(0, 1, 0);
  private q = new Quaternion();
  constructor() {
    this.root.add(this.guard, this.threat, this.trails);
    this.trails.frustumCulled = false;
  }
  update(b: Battle) {
    const h = wallSpec(b.state.wallTier).height + 0.5;
    const danger = b.dangers.find((t) => t.wall !== undefined);
    this.guard.visible = b.guardTime > 0;
    this.threat.visible = !!danger && b.guardTime <= 0;
    for (const [mesh, side] of [
      [this.guard, b.guardSide],
      [this.threat, danger?.wall || 0],
    ] as const) {
      mesh.rotation.y = Math.PI - (side * Math.PI) / 2;
      mesh.position.y = h / 2;
      mesh.scale.y = h;
    }
    this.guardMaterial.opacity = b.guardAge < 0.4 ? 0.36 : 0.2;
    this.threatMaterial.opacity = danger
      ? 0.1 + 0.08 * Math.min(1, danger.age / danger.windup)
      : 0.1;
    let count = 0;
    for (const bolt of b.bolts) {
      if (!bolt.royal) continue;
      this.v.set(bolt.vx, bolt.vy, bolt.vz).normalize();
      this.q.setFromUnitVectors(this.up, this.v);
      for (let i = 0; i < 3 && count < 64; i++) {
        this.p.set(
          bolt.x - this.v.x * i * 0.3,
          bolt.y - this.v.y * i * 0.3,
          bolt.z - this.v.z * i * 0.3,
        );
        const width = (bolt.ignoreShield ? 1.7 : 0.9) * (1 - i * 0.25);
        this.scale.set(width, 0.5, width);
        this.matrix.compose(this.p, this.q, this.scale);
        this.trails.setMatrixAt(count++, this.matrix);
      }
    }
    this.trails.count = count;
    this.trails.instanceMatrix.needsUpdate = true;
  }
  dispose() {
    this.root.removeFromParent();
    this.trails.dispose();
    this.panelGeometry.dispose();
    this.trailGeometry.dispose();
    this.guardMaterial.dispose();
    this.threatMaterial.dispose();
    this.trailMaterial.dispose();
  }
}
