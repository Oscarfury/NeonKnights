import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import type { Assets } from './Assets';
import { spec, isWing, type DefenseKind, type Rank } from '../construction/Catalog';
import type { Defense } from '../construction/DefenseSystem';
import { towerWing } from '../castle/TowerWing';

export class DefenseView {
  readonly root = new Group();
  readonly model: Group;
  readonly coverage: Line;
  private shield?: Mesh;
  private materials = new Set<MeshStandardMaterial>();
  private authoredEmission = new Map<MeshStandardMaterial, number>();
  private origins = new Map<Group['children'][number], Vector3>();
  constructor(
    assets: Assets,
    readonly kind: DefenseKind,
    readonly rank: Rank,
    ghost = false,
    castleModule = false,
  ) {
    this.model =
      isWing(kind) && (castleModule || kind !== 'sanctuary')
        ? towerWing(assets, kind, rank)
        : assets.get(`${kind}-${rank}`).scene.clone(true);
    const clones = new Map<MeshStandardMaterial, MeshStandardMaterial>();
    const generatedMaterials = new Set<MeshStandardMaterial>();
    this.model.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      const original = o.material as MeshStandardMaterial;
      if (o.userData.modularGeometry) generatedMaterials.add(original);
      let material = clones.get(original);
      if (!material) {
        material = original.clone();
        clones.set(original, material);
        this.materials.add(material);
        this.authoredEmission.set(material, material.emissiveIntensity);
      }
      o.material = material;
      material.transparent = ghost;
      material.opacity = ghost ? 0.42 : 1;
      material.depthWrite = !ghost;
      o.castShadow = !ghost;
    });
    this.root.add(this.model);
    generatedMaterials.forEach((m) => m.dispose());
    for (const part of this.model.children) this.origins.set(part, part.position.clone());
    const r = spec(kind, rank),
      half = (r.arc * Math.PI) / 360;
    const points = [new Vector3(0, 0.025, 0)];
    for (let n = 0; n <= 64; n++) {
      const a = -half + (2 * half * n) / 64;
      points.push(new Vector3(Math.sin(a) * r.range, 0.025, Math.cos(a) * r.range));
    }
    points.push(points[0].clone());
    this.coverage = new Line(
      new BufferGeometry().setFromPoints(points),
      new LineBasicMaterial({
        color: kind === 'aegis' ? 0x6bc8c5 : 0xd8b771,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      }),
    );
    this.coverage.visible = false;
    this.root.add(this.coverage);
    if (kind === 'aegis') {
      const vertices: number[] = [];
      for (let n = 0; n < 48; n++) {
        const a = -half + (2 * half * n) / 48,
          b = -half + (2 * half * (n + 1)) / 48;
        const x = Math.sin(a) * r.range,
          z = Math.cos(a) * r.range,
          xx = Math.sin(b) * r.range,
          zz = Math.cos(b) * r.range;
        vertices.push(x, 0.06, z, xx, 0.06, zz, x, 2, z, x, 2, z, xx, 0.06, zz, xx, 2, zz);
      }
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
      geometry.computeVertexNormals();
      this.shield = new Mesh(
        geometry,
        new MeshStandardMaterial({
          color: 0x62cacc,
          emissive: 0x246e79,
          transparent: true,
          opacity: 0.11,
          depthWrite: false,
          side: DoubleSide,
          roughness: 0.35,
        }),
      );
      this.shield.visible = false;
      this.root.add(this.shield);
    }
  }
  neutral(value: boolean) {
    this.materials.forEach(
      (m) => (m.emissiveIntensity = value ? 0 : this.authoredEmission.get(m)!),
    );
  }
  update(b: Defense, inspection = false) {
    this.root.position.set(b.x, b.y, b.z);
    this.root.rotation.y = b.yaw;
    const ready = Math.min(1, b.age / 1.2);
    let index = 0;
    for (const [part, initial] of this.origins) {
      part.position.copy(initial);
      part.position.y += (1 - ready) ** 2 * ((++index % 3) + 1) * 0.35;
    }
    const turret = this.model.getObjectByName('Turret');
    if (turret) turret.rotation.y = b.aimYaw - b.yaw;
    const carriage = this.model.getObjectByName('Carriage');
    if (carriage) carriage.position.z = -Math.sin((Math.PI * b.recoil) / 0.42) * 0.18;
    const winch = this.model.getObjectByName('Winch');
    if (winch && b.reload > 0 && b.hp > 0) winch.rotation.x = b.age * 3.5;
    const bolt = this.model.getObjectByName('LoadedBolt');
    const interval = b.reloadDuration ?? spec(b.kind, b.rank).interval;
    if (bolt) bolt.visible = b.reload < interval * 0.3 && b.hp > 0;
    const cable = this.model.getObjectByName('Bowstring');
    if (cable) cable.scale.z = 0.08 + 0.92 * Math.max(0, 1 - b.reload / interval);
    const core = this.model.getObjectByName('Core');
    if (core && b.hp > 0) core.rotation.z = Math.sin(b.age * 0.5) * 0.14;
    for (const side of ['L', 'R']) {
      const panel = this.model.getObjectByName(`Panel_${side}`);
      if (panel) panel.rotation.y = (side === 'L' ? -1 : 1) * b.flash * 0.6;
    }
    this.model.rotation.z = b.hp <= 0 ? -0.13 : 0;
    this.model.position.y = b.hp <= 0 ? -0.15 : 0;
    if (this.shield) {
      this.shield.visible = !inspection && b.hp > 0 && ready === 1 && (b.charge > 0 || b.flash > 0);
      (this.shield.material as MeshStandardMaterial).opacity =
        0.045 + (0.07 * b.charge) / spec(b.kind, b.rank).capacity + b.flash * 0.75;
    }
  }
  dispose() {
    this.model.traverse((o) => {
      if (o instanceof Mesh && o.userData.modularGeometry) o.geometry.dispose();
    });
    this.materials.forEach((m) => m.dispose());
    this.coverage.geometry.dispose();
    (this.coverage.material as LineBasicMaterial).dispose();
    if (this.shield) {
      this.shield.geometry.dispose();
      (this.shield.material as MeshStandardMaterial).dispose();
    }
    this.root.removeFromParent();
  }
}
