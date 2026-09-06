import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import type { Battle } from './Battle';
import { wallSpec } from './Catalog';

export class WallDamage {
  revision = 0;
  readonly root = new Group();
  private sectors: {
    meshes: { mesh: Mesh; rest: Float32Array; world: Matrix4; inverse: Matrix4 }[];
    materials: MeshStandardMaterial[];
    cracks: LineSegments;
    level: number;
  }[] = [];
  private rubble = new InstancedMesh(
    new BoxGeometry(0.23, 0.19, 0.3),
    new MeshStandardMaterial({ color: 0x827e6c, roughness: 1 }),
    144,
  );
  private matrix = new Matrix4();
  private point = new Vector3();
  private colors = new Map<MeshStandardMaterial, Color>();
  constructor(
    castle: Group,
    readonly height: number,
  ) {
    castle.updateMatrixWorld(true);
    for (const [side, name] of ['NorthWall', 'EastWall', 'SouthWall', 'WestWall'].entries()) {
      const meshes: (typeof this.sectors)[number]['meshes'] = [],
        materials: MeshStandardMaterial[] = [];
      const copies = new Map<MeshStandardMaterial, MeshStandardMaterial>();
      castle.getObjectByName(name)?.traverse((o) => {
        if (!(o instanceof Mesh)) return;
        o.geometry = o.geometry.clone();
        const original = o.material as MeshStandardMaterial;
        let mat = copies.get(original);
        if (!mat) {
          mat = original.clone();
          copies.set(original, mat);
          materials.push(mat);
          this.colors.set(mat, mat.color.clone());
        }
        o.material = mat;
        meshes.push({
          mesh: o,
          rest: new Float32Array(o.geometry.getAttribute('position').array),
          world: o.matrixWorld.clone(),
          inverse: o.matrixWorld.clone().invert(),
        });
      });
      const vertices: number[] = [],
        middle = Math.PI - (side * Math.PI) / 2;
      for (let crack = 0; crack < 5; crack++) {
        const angle = middle + (crack - 2) * 0.25;
        for (let n = 0; n < 5; n++) {
          for (const step of [n, n + 1]) {
            const a = angle + Math.sin(step * 5 + crack) * 0.021;
            vertices.push(Math.sin(a) * 6.565, height * (0.95 - step * 0.125), Math.cos(a) * 6.565);
          }
        }
      }
      const cracks = new LineSegments(
        new BufferGeometry().setAttribute(
          'position',
          new BufferAttribute(new Float32Array(vertices), 3),
        ),
        new LineBasicMaterial({ color: 0x1b1714, transparent: true, opacity: 0.8 }),
      );
      this.root.add(cracks);
      this.sectors.push({ meshes, materials, cracks, level: -1 });
    }
    this.rubble.castShadow = true;
    this.rubble.frustumCulled = false;
    this.root.add(this.rubble);
  }
  update(b: Battle, revealCourtyard = false) {
    let count = 0;
    const max = wallSpec(b.state.wallTier).hp;
    for (const [side, sector] of this.sectors.entries()) {
      const damage = 1 - b.state.walls[side] / max,
        level = Math.floor(damage * 20),
        middle = Math.PI - (side * Math.PI) / 2;
      sector.cracks.visible = damage > 0.12;
      sector.cracks.geometry.setDrawRange(0, Math.floor(damage * 5) * 10);
      if (level !== sector.level) {
        this.revision++;
        sector.level = level;
        for (const { mesh, rest, world, inverse } of sector.meshes) {
          const p = mesh.geometry.getAttribute('position');
          for (let i = 0; i < p.count; i++) {
            this.point.fromArray(rest, i * 3).applyMatrix4(world);
            const r = Math.hypot(this.point.x, this.point.z),
              angle = Math.atan2(this.point.x, this.point.z);
            // Preserve the inner walkway. Break and sink the outer masonry in irregular notches.
            const notch = Math.max(0, Math.sin(angle * 17 + side * 3) * 0.7 + 0.3);
            if (r > 6.05 && this.point.y > this.height * 0.35) {
              const loss = Math.max(0, damage - 0.12) * notch;
              this.point.y -= loss * Math.max(0, this.point.y - this.height * 0.3) * 0.9;
              this.point.x += Math.sin(angle) * loss * 0.18;
              this.point.z += Math.cos(angle) * loss * 0.18;
            }
            this.point.applyMatrix4(inverse);
            p.setXYZ(i, this.point.x, this.point.y, this.point.z);
          }
          p.needsUpdate = true;
          mesh.geometry.computeVertexNormals();
          mesh.geometry.computeBoundingSphere();
        }
      }
      for (const mat of sector.materials) {
        mat.transparent = revealCourtyard;
        mat.opacity = revealCourtyard ? (side === 2 ? 0.18 : side === 0 ? 0.8 : 0.4) : 1;
        mat.depthWrite = !revealCourtyard;
        mat.color.copy(this.colors.get(mat)!).multiplyScalar(1 - damage * 0.37);
        mat.emissive.setHex(0xff9b50);
        mat.emissiveIntensity = b.wallImpacts[side] * 0.6;
      }
      for (let n = 0; n < Math.floor(damage * 18); n++) {
        const angle = middle + Math.sin(n * 31 + side) * 0.7,
          r = 6.95 + ((n * 0.618) % 1) * 0.85;
        this.matrix.makeRotationY(n * 7).scale(this.point.set(0.8 + (n % 3), 0.7 + (n % 2), 1.1));
        this.matrix.setPosition(Math.sin(angle) * r, 0.12, Math.cos(angle) * r);
        this.rubble.setMatrixAt(count++, this.matrix);
      }
    }
    for (const e of b.effects.filter((e) => e.kind === 'wall').slice(-8)) {
      for (let i = 0; i < 8 && count < 144; i++) {
        const age = e.age,
          angle = e.id + i * 2.4,
          speed = 0.6 + i * 0.18;
        const y = Math.max(0.12, e.y + age * (1.2 + i * 0.2) - age * age * 5);
        this.matrix
          .makeRotationY(angle + age * 4)
          .multiply(new Matrix4().makeRotationX(age * 5))
          .scale(this.point.setScalar(Math.max(0.15, 1 - age * 0.5)));
        this.matrix.setPosition(
          e.x + Math.sin(angle) * age * speed,
          y,
          e.z + Math.cos(angle) * age * speed,
        );
        this.rubble.setMatrixAt(count++, this.matrix);
      }
    }
    this.rubble.count = count;
    this.rubble.instanceMatrix.needsUpdate = true;
  }
  dispose() {
    for (const sector of this.sectors) {
      sector.meshes.forEach(({ mesh }) => mesh.geometry.dispose());
      sector.materials.forEach((m) => m.dispose());
      sector.cracks.geometry.dispose();
      (sector.cracks.material as LineBasicMaterial).dispose();
    }
    this.rubble.geometry.dispose();
    (this.rubble.material as MeshStandardMaterial).dispose();
    this.rubble.dispose();
    this.root.removeFromParent();
  }
}
