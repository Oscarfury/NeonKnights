import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
  type BufferGeometry,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Small architectural kit, batched by the castle's existing painted material palette. */
export class Masonry {
  readonly materials: Record<
    'stone' | 'trim' | 'roof' | 'wood' | 'gold' | 'light' | 'dark',
    MeshStandardMaterial
  >;
  private batches = new Map<MeshStandardMaterial, BufferGeometry[]>();
  constructor(source?: Group) {
    const originals: MeshStandardMaterial[] = [];
    source?.traverse((o) => {
      if (o instanceof Mesh && o.material instanceof MeshStandardMaterial)
        originals.push(o.material);
    });
    const material = (pattern: RegExp, color: number) => {
      const original = originals.find((m) => pattern.test(m.name.replace(/_/g, ' ')));
      const m = original?.clone() || new MeshStandardMaterial({ color, roughness: 0.86 });
      m.transparent = false;
      m.opacity = 1;
      m.depthWrite = true;
      return m;
    };
    this.materials = {
      stone: material(/Weathered castle stone 2/i, 0x667b7e),
      trim: material(/Carved limestone/i, 0xbbb59b),
      roof: material(/Blue slate/i, 0x254b5b),
      wood: material(/Gate oak/i, 0x5b3d2a),
      gold: material(/Royal brass/i, 0xc09c52),
      dark: new MeshStandardMaterial({ color: 0x18262d, roughness: 0.94 }),
      light: new MeshStandardMaterial({
        color: 0xffd08b,
        emissive: 0xffad4e,
        emissiveIntensity: 0.5,
        roughness: 0.55,
      }),
    };
  }
  add(g: BufferGeometry, p: number[], mat: keyof Masonry['materials'], yaw = 0, roll = 0) {
    const rotation = new Quaternion()
      .setFromAxisAngle(new Vector3(0, 1, 0), yaw)
      .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), roll));
    g.applyMatrix4(
      new Matrix4().compose(
        new Vector3(...(p as [number, number, number])),
        rotation,
        new Vector3(1, 1, 1),
      ),
    );
    const material = this.materials[mat],
      batch = this.batches.get(material) || [];
    batch.push(g);
    this.batches.set(material, batch);
  }
  box(size: number[], p: number[], mat: keyof Masonry['materials'], yaw = 0, roll = 0) {
    this.add(new BoxGeometry(...(size as [number, number, number])), p, mat, yaw, roll);
  }
  cylinder(
    radius: number,
    height: number,
    p: number[],
    mat: keyof Masonry['materials'],
    sides = 12,
  ) {
    this.add(new CylinderGeometry(radius, radius, height, sides), p, mat);
  }
  roof(radius: number, height: number, p: number[], sides = 4) {
    this.add(new ConeGeometry(radius, height, sides), p, 'roof', sides === 4 ? Math.PI / 4 : 0);
  }
  window(x: number, y: number, z: number, yaw = 0) {
    this.box([0.34, 0.69, 0.06], [x, y, z], 'dark', yaw);
    this.box([0.22, 0.52, 0.075], [x, y, z], 'light', yaw);
    this.box([0.045, 0.59, 0.09], [x, y, z], 'trim', yaw);
  }
  finish(name: string) {
    const root = new Group();
    root.name = name;
    for (const [material, geometries] of this.batches) {
      const geometry = mergeGeometries(geometries, false)!;
      geometries.forEach((g) => g.dispose());
      const mesh = new Mesh(geometry, material);
      mesh.name = `${name} ${Object.entries(this.materials).find(([, m]) => m === material)![0]}`;
      mesh.userData.modularGeometry = true;
      mesh.castShadow = mesh.receiveShadow = true;
      root.add(mesh);
    }
    // Dispose unused palette entries as well as keeping ownership of the used ones explicit.
    Object.values(this.materials)
      .filter((m) => !this.batches.has(m))
      .forEach((m) => m.dispose());
    return root;
  }
}

export function disposeMasonry(root: Group) {
  const materials = new Set<MeshStandardMaterial>();
  root.traverse((o) => {
    if (o instanceof Mesh) {
      if (o.userData.modularGeometry) o.geometry.dispose();
      if (o.material instanceof MeshStandardMaterial) materials.add(o.material);
    }
  });
  materials.forEach((m) => m.dispose());
  root.removeFromParent();
}
