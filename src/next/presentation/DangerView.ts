import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshBasicMaterial,
  InstancedMesh,
  Object3D,
  Shape,
  ShapeGeometry,
} from 'three';
import { dangerOutline, dangerPhase, type Danger, type Position } from '../combat/Hazards';

export class DangerView {
  readonly root = new Group();
  private fill = new Mesh(
    new BufferGeometry(),
    new MeshBasicMaterial({
      color: 0xed774d,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      side: DoubleSide,
    }),
  );
  private boundary = new LineLoop(
    new BufferGeometry(),
    new LineBasicMaterial({ color: 0xffca91, transparent: true, opacity: 0.9, depthWrite: false }),
  );
  private activeEdge = new LineLoop(
    new BufferGeometry(),
    new LineBasicMaterial({ color: 0xffe6b5, transparent: true, opacity: 1, depthWrite: false }),
  );
  private flames?: InstancedMesh;
  private flamePose = new Object3D();
  constructor(hazard: Danger) {
    this.root.add(this.fill, this.boundary, this.activeEdge);
    this.root.position.y = 0.035;
    this.write(this.boundary.geometry, dangerOutline(hazard, hazard.age, true));
    if (hazard.cadence) {
      const lick = new Shape();
      lick.moveTo(-0.16, 0);
      lick.quadraticCurveTo(-0.23, 0.3, 0.06, 0.7);
      lick.quadraticCurveTo(-0.04, 0.38, 0.17, 0.26);
      lick.quadraticCurveTo(0.24, 0.08, -0.16, 0);
      this.flames = new InstancedMesh(
        new ShapeGeometry(lick, 6),
        new MeshBasicMaterial({
          color: 0xffbd67,
          transparent: true,
          opacity: 0.8,
          side: DoubleSide,
          depthWrite: false,
        }),
        18,
      );
      this.flames.frustumCulled = false;
      this.root.add(this.flames);
    }
    this.update(hazard);
  }
  private write(geometry: BufferGeometry, points: Position[], fill = false) {
    const values: number[] = [];
    const vertex = (p: Position) => values.push(p.x, p.y, p.z);
    if (fill)
      for (let n = 1; n < points.length - 1; n++) {
        vertex(points[0]);
        vertex(points[n]);
        vertex(points[n + 1]);
      }
    else for (const p of points) vertex(p);
    const current = geometry.getAttribute('position');
    if (current?.array.length === values.length) {
      (current.array as Float32Array).set(values);
      current.needsUpdate = true;
    } else geometry.setAttribute('position', new BufferAttribute(new Float32Array(values), 3));
    geometry.computeBoundingSphere();
  }
  update(h: Danger) {
    const phase = dangerPhase(h);
    const active = phase === 'active';
    const footprint = dangerOutline(h, h.age, phase === 'warning');
    this.write(this.fill.geometry, footprint, true);
    this.write(this.activeEdge.geometry, footprint);
    this.activeEdge.visible = active;
    const fade =
      phase === 'recovery' ? Math.max(0, 1 - (h.age - h.warning - h.active) / h.recovery) : 1;
    this.fill.material.opacity = (active ? (h.cadence ? 0.38 : 0.5) : 0.12) * fade;
    this.fill.material.color.setHex(
      h.cadence ? 0xee6636 : h.shape.kind === 'sweep' ? 0xffb95b : 0xe77b69,
    );
    this.boundary.material.opacity = (active ? 0.28 : 0.85) * fade;
    this.root.position.y =
      active && h.shape.kind === 'circle' && !h.cadence
        ? 0.035 + 0.3 * Math.sin((Math.PI * (h.age - h.warning)) / h.active)
        : 0.035;
    if (this.flames) {
      this.flames.visible = active;
      for (let n = 0; n < this.flames.count; n++) {
        const angle = n * 2.399963;
        const radius = Math.sqrt((n + 0.5) / this.flames.count) * (h.shape.radius - 0.35);
        this.flamePose.position.set(
          h.x + Math.cos(angle) * radius,
          h.y + 0.06,
          h.z + Math.sin(angle) * radius,
        );
        this.flamePose.rotation.y = angle + Math.sin(h.age * 3 + n) * 0.35;
        this.flamePose.scale.set(1, 0.5 + 0.7 * Math.abs(Math.sin(h.age * 5 + n * 1.7)), 1);
        this.flamePose.updateMatrix();
        this.flames.setMatrixAt(n, this.flamePose.matrix);
      }
      this.flames.instanceMatrix.needsUpdate = true;
    }
  }
  dispose() {
    if (this.flames) {
      this.flames.geometry.dispose();
      (this.flames.material as MeshBasicMaterial).dispose();
      this.flames.dispose();
    }
    for (const object of [this.fill, this.boundary, this.activeEdge]) {
      object.geometry.dispose();
      object.material.dispose();
    }
    this.root.removeFromParent();
  }
}
