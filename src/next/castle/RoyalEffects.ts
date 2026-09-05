import {
  AdditiveBlending,
  Color,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import type { Battle } from './Battle';

export class RoyalEffects {
  readonly root = new Group();
  private charge = new Group();
  private ringGeometry = new TorusGeometry(1, 0.025, 5, 64);
  private moteGeometry = new SphereGeometry(0.07, 6, 4);
  private streakGeometry = new CylinderGeometry(0.065, 0.015, 1, 7);
  private energy = new MeshBasicMaterial({
    color: 0x81e9ff,
    blending: AdditiveBlending,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  private light = new MeshBasicMaterial({
    color: 0xffe8a4,
    blending: AdditiveBlending,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  private rings = [
    new Mesh(this.ringGeometry, this.energy),
    new Mesh(this.ringGeometry, this.light),
    new Mesh(this.ringGeometry, this.energy),
  ];
  private motes = new InstancedMesh(this.moteGeometry, this.energy, 40);
  private trails = new InstancedMesh(this.streakGeometry, this.energy, 48);
  private matrix = new Matrix4();
  private transform = new Group();
  constructor() {
    this.charge.add(...this.rings, this.motes);
    this.root.add(this.charge, this.trails);
    this.motes.frustumCulled = this.trails.frustumCulled = false;
  }
  update(b: Battle) {
    const q = b.charge,
      t = b.time;
    this.charge.visible = q > 0.02 && b.phase === 'battle';
    this.charge.position.set(b.king.x, b.king.y + 0.12, b.king.z);
    this.energy.color.copy(new Color(b.state.weapon === 'stormbow' ? 0x81e9ff : 0xffcf74));
    this.rings.forEach((ring, i) => {
      ring.rotation.set(-Math.PI / 2, i === 1 ? Math.sin(t * 3) * 0.35 : 0, t * (i % 2 ? -2 : 2));
      ring.position.y = i * 0.42 * q;
      ring.scale.setScalar(0.65 + q * (0.55 + i * 0.2));
    });
    for (let i = 0; i < 40; i++) {
      const u = (i / 40 + t * 0.8) % 1,
        a = i * 2.399 + t * 4,
        r = (1 - u) * (0.8 + q);
      this.matrix.makeScale(0.4 + q, 0.4 + q, 0.4 + q);
      this.matrix.setPosition(Math.sin(a) * r, u * 2.1, Math.cos(a) * r);
      this.motes.setMatrixAt(i, this.matrix);
    }
    this.motes.instanceMatrix.needsUpdate = true;
    let index = 0;
    for (const bolt of b.bolts.filter((p) => p.royal && p.ignoreShield)) {
      const v = new Vector3(bolt.vx, bolt.vy, bolt.vz).normalize();
      for (let n = 0; n < 8 && index < 48; n++) {
        const mesh = this.transform;
        mesh.position.set(
          bolt.x - v.x * n * 0.35,
          bolt.y - v.y * n * 0.35,
          bolt.z - v.z * n * 0.35,
        );
        mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), v);
        mesh.scale.set((1 - n / 9) * 2.6, 0.65, (1 - n / 9) * 2.6);
        mesh.updateMatrix();
        this.trails.setMatrixAt(index++, mesh.matrix);
      }
    }
    this.trails.count = index;
    this.trails.instanceMatrix.needsUpdate = true;
  }
  dispose() {
    this.root.removeFromParent();
    this.motes.dispose();
    this.trails.dispose();
    this.ringGeometry.dispose();
    this.moteGeometry.dispose();
    this.streakGeometry.dispose();
    this.energy.dispose();
    this.light.dispose();
  }
}
