import { LoadingManager, Mesh, PropertyBinding, Texture, type Material } from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';

export interface AssetManifest {
  id: string;
  revision?: string;
  model: string;
  sockets: Record<string, string>;
  clips: { name: string; duration: number; loop: boolean }[];
  events: Record<string, { release: number; recover: number }>;
}

export class Assets {
  readonly models = new Map<string, GLTF>();
  manifest!: AssetManifest;
  async load(progress: (message: string) => void) {
    const base = `${import.meta.env.BASE_URL}assets/v3/`;
    const response = await fetch(`${base}paladin.json`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Asset manifest unavailable (${response.status}).`);
    this.manifest = await response.json();
    const manager = new LoadingManager();
    manager.onProgress = (_, count, total) =>
      progress(`Preparing the armory · ${count} / ${total}`);
    const loader = new GLTFLoader(manager);
    // Await all requests before disposal on failure: no late model can leak.
    const results = await Promise.allSettled(
      ['paladin', 'stormbow', 'sunlance', 'courtyard'].map(async (name) => {
        this.models.set(
          name,
          await loader.loadAsync(
            `${base}${name}.glb?v=${this.manifest.revision || this.manifest.id}`,
          ),
        );
      }),
    );
    const failure = results.find((r) => r.status === 'rejected');
    if (failure?.status === 'rejected') throw failure.reason;
    const hero = this.get('paladin');
    for (const clip of this.manifest.clips) {
      if (!hero.animations.some((a) => a.name === clip.name))
        throw new Error(`Missing animation: ${clip.name}`);
    }
    for (const bone of Object.values(this.manifest.sockets)) {
      if (!hero.scene.getObjectByName(PropertyBinding.sanitizeNodeName(bone)))
        throw new Error(`Missing attachment: ${bone}`);
    }
    for (const gltf of this.models.values()) {
      gltf.scene.traverse((object) => {
        if (object instanceof Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
    }
  }
  get(name: string) {
    const value = this.models.get(name);
    if (!value) throw new Error(`Model ${name} has not loaded.`);
    return value;
  }
  dispose() {
    const geometries = new Set<Mesh['geometry']>();
    const materials = new Set<Material>();
    const textures = new Set<Texture>();
    for (const model of this.models.values())
      model.scene.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material]) {
          materials.add(material);
          for (const value of Object.values(material))
            if (value instanceof Texture) textures.add(value);
        }
      });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => {
      (t.source.data as { close?: () => void } | undefined)?.close?.();
      t.dispose();
    });
    this.models.clear();
  }
}
