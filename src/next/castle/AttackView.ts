import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  ConeGeometry,
  IcosahedronGeometry,
  MeshStandardMaterial,
  Vector3,
  Quaternion,
} from 'three';
import { inTelegraph, type Telegraph } from './Battle';
import { mounts } from './Catalog';

/** A single footprint draped over the ground and battlements, using combat's hit test. */
export class AttackView {
  readonly root = new Group();
  private boulder?: Mesh;
  private fill: Mesh;
  private edge: Mesh;
  private countdown: Mesh;
  private particles: InstancedMesh;
  private matrix = new Matrix4();
  private origin = new Vector3();
  private direction = new Vector3();
  private rotation = new Quaternion();
  private up = new Vector3(0, 1, 0);
  private edgeCount: number;
  constructor(
    readonly attack: Telegraph,
    readonly height: number,
  ) {
    const t = attack,
      vertices: number[] = [],
      outline: number[] = [];
    const surface = (x: number, z: number) => {
      const r = Math.hypot(x, z);
      return (r >= 4.3 && r <= 6.85) ||
        mounts.some((m) => !m.inner && Math.hypot(x - m.x, z - m.z) <= 1.8)
        ? height + 0.15
        : 0.09;
    };
    const point = (x: number, z: number) => [x, surface(x, z), z];
    const radius = t.kind === 'hex' ? t.radius : t.length;
    const step = 0.38;
    // A clipped grid avoids a second floating cone above the entire battlefield.
    for (let x = t.x - radius; x < t.x + radius; x += step)
      for (let z = t.z - radius; z < t.z + radius; z += step) {
        const a = { x, y: 0, z },
          b = { x: x + step, y: 0, z },
          c = { x, y: 0, z: z + step },
          d = { x: x + step, y: 0, z: z + step };
        for (const tri of [
          [a, b, c],
          [b, d, c],
        ]) {
          const center = {
            x: (tri[0].x + tri[1].x + tri[2].x) / 3,
            y: 0,
            z: (tri[0].z + tri[1].z + tri[2].z) / 3,
          };
          if (inTelegraph(t, center)) for (const p of tri) vertices.push(...point(p.x, p.z));
        }
      }
    const path: number[][] = [];
    const polar = (angle: number, r: number) => [
      t.x + Math.sin(angle) * r,
      t.z + Math.cos(angle) * r,
    ];
    if (t.kind === 'rake' && t.width) {
      for (const [r, side] of [
        [t.radius, -1],
        [t.length, -1],
        [t.length, 1],
        [t.radius, 1],
      ])
        path.push([
          t.x + Math.sin(t.yaw) * r + (Math.cos(t.yaw) * side * t.width) / 2,
          t.z + Math.cos(t.yaw) * r - (Math.sin(t.yaw) * side * t.width) / 2,
        ]);
    } else if (t.kind === 'hex') {
      for (let i = 0; i < 80; i++) path.push(polar((i * Math.PI * 2) / 80, t.radius));
    } else {
      for (let i = 0; i <= 64; i++)
        path.push(polar(t.yaw - t.arc / 2 + (i * t.arc) / 64, t.length));
      for (let i = 64; i >= 0; i--)
        path.push(polar(t.yaw - t.arc / 2 + (i * t.arc) / 64, t.radius));
    }
    path.push(path[0]);
    for (let i = 1; i < path.length; i++) {
      const [x, z] = path[i - 1],
        [xx, zz] = path[i];
      const length = Math.hypot(xx - x, zz - z),
        n = Math.max(1, Math.ceil(length / step));
      const nx = (-(zz - z) / (length || 1)) * 0.055,
        nz = ((xx - x) / (length || 1)) * 0.055;
      for (let j = 0; j < n; j++) {
        const ax = x + ((xx - x) * j) / n,
          az = z + ((zz - z) * j) / n;
        const bx = x + ((xx - x) * (j + 1)) / n,
          bz = z + ((zz - z) * (j + 1)) / n;
        const a = point(ax + nx, az + nz),
          b = point(ax - nx, az - nz),
          c = point(bx + nx, bz + nz),
          d = point(bx - nx, bz - nz);
        outline.push(...a, ...b, ...c, ...b, ...d, ...c);
      }
    }
    const make = (v: number[], color: number, opacity: number) => {
      const g = new BufferGeometry();
      g.setAttribute('position', new Float32BufferAttribute(v, 3));
      const mesh = new Mesh(
        g,
        new MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
          depthWrite: false,
          side: DoubleSide,
        }),
      );
      mesh.renderOrder = 4;
      this.root.add(mesh);
      return mesh;
    };
    this.fill = make(vertices, 0xffad4f, 0.12);
    this.edge = make(outline, 0xffb454, 0.6);
    this.countdown = make(outline, 0xffedc3, 1);
    this.countdown.position.y = 0.02;
    this.countdown.renderOrder = 5;
    this.edgeCount = outline.length / 3;
    this.particles = new InstancedMesh(
      new ConeGeometry(0.18, 0.95, 5),
      new MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      }),
      48,
    );
    this.particles.frustumCulled = false;
    for (let i = 0; i < 48; i++)
      this.particles.setColorAt(
        i,
        new Color(
          (t.kind === 'rake' ? [0xddffff, 0x8acfdc, 0xb7e3df] : [0xffec9e, 0xff7339, 0xffb63f])[
            i % 3
          ],
        ),
      );
    this.root.add(this.particles);
    if (t.launch) {
      this.boulder = new Mesh(
        new IcosahedronGeometry(0.7, 1),
        new MeshStandardMaterial({ color: 0x69706c, roughness: 0.9 }),
      );
      this.boulder.castShadow = true;
      this.root.add(this.boulder);
    }
    if (t.style === 'stone') (this.particles.material as MeshBasicMaterial).color.setHex(0x8a8272);
    if (t.style === 'crown') (this.particles.material as MeshBasicMaterial).color.setHex(0xba91dd);
  }
  update() {
    const t = this.attack,
      active = t.age >= t.windup,
      progress = Math.min(1, t.age / t.windup);
    this.root.visible = t.age >= 0;
    if (this.boulder && t.launch) {
      const travel = Math.max(0, Math.min(1, (t.age - t.windup + 1) / 1));
      this.boulder.visible = t.age >= t.windup - 1 && t.age < t.windup + 0.1;
      this.boulder.position.set(
        t.launch.x + (t.x - t.launch.x) * travel,
        t.launch.y + (this.height - t.launch.y) * travel + Math.sin(travel * Math.PI) * 5,
        t.launch.z + (t.z - t.launch.z) * travel,
      );
      this.boulder.rotation.set(travel * 3, travel * 2, 0);
    }
    const fill = this.fill.material as MeshBasicMaterial,
      edge = this.edge.material as MeshBasicMaterial;
    fill.color.setHex(active ? 0xff5838 : 0xffb454);
    fill.opacity = active ? 0.3 : 0.14 + progress * 0.12;
    edge.color.setHex(active ? 0xff7851 : 0xffb454);
    edge.opacity = active ? 1 : 0.55;
    this.countdown.visible = !active;
    this.countdown.geometry.setDrawRange(0, Math.floor((this.edgeCount * progress) / 6) * 6);
    this.particles.visible = active;
    if (!active) return;
    const u = Math.min(1, (t.age - t.windup) / t.duration);
    for (let i = 0; i < 48; i++) {
      let angle = t.yaw,
        r = t.length,
        y = 0.4,
        lateral = 0,
        size = 0.7;
      if (t.kind === 'breath') {
        const travel = ((t.age - t.windup) * 2.6 + i / 48) % 1;
        r = 2.4 + travel * (t.length - 2.4);
        angle += Math.sin(i * 17) * t.arc * 0.44;
        y = 2.5 * (1 - travel) + (this.height + 0.7) * travel * ((i * 0.618) % 1);
        size = 0.5 + travel * 1.9;
      } else if (t.kind === 'rake') {
        r = t.radius + (t.length - t.radius) * Math.min(1, u * 1.8 + (i % 16) / 80);
        lateral = (Math.floor(i / 16) - 1) * (t.width || 3.4) * 0.35;
        y =
          Math.hypot(t.x + Math.sin(angle) * r, t.z + Math.cos(angle) * r) < 8.5
            ? this.height + 0.5
            : 0.5;
        size = 0.65;
      } else {
        r = t.kind === 'hex' ? t.radius * u : t.length * (0.6 + (i % 4) * 0.13);
        angle =
          t.kind === 'hex'
            ? (i * Math.PI * 2) / 48
            : t.yaw - t.arc / 2 + t.arc * u + (i / 48 - 1) * 0.3;
        size = 0.65 + Math.sin(u * Math.PI) * 0.7;
      }
      this.origin.set(
        t.x + Math.sin(angle) * r + Math.cos(angle) * lateral,
        y,
        t.z + Math.cos(angle) * r - Math.sin(angle) * lateral,
      );
      this.direction
        .set(Math.sin(angle), t.kind === 'breath' ? 0.18 : 0, Math.cos(angle))
        .normalize();
      this.rotation.setFromUnitVectors(this.up, this.direction);
      this.matrix.compose(
        this.origin,
        this.rotation,
        this.direction.set(size, size * (t.kind === 'breath' ? 2.4 : 1.6), size),
      );
      this.particles.setMatrixAt(i, this.matrix);
    }
    this.particles.instanceMatrix.needsUpdate = true;
  }
  dispose() {
    this.root.traverse((o) => {
      if (o instanceof Mesh) {
        o.geometry.dispose();
        (o.material as MeshBasicMaterial).dispose();
      }
    });
    this.particles.dispose();
    this.root.removeFromParent();
  }
}
