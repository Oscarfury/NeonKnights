import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { actionTiming } from '../src/next/combat/Actions';
import { assetIds } from '../src/next/construction/Catalog';

interface Accessor {
  bufferView: number;
  byteOffset?: number;
  componentType: number;
  count: number;
  type: string;
  sparse?: unknown;
}
interface Gltf {
  asset: { version: string };
  buffers: { byteLength: number; uri?: string }[];
  bufferViews: { byteOffset?: number; byteLength: number; byteStride?: number }[];
  accessors: Accessor[];
  images?: { uri?: string; bufferView?: number }[];
  nodes: { name?: string; mesh?: number; skin?: number }[];
  skins?: { joints: number[] }[];
  meshes: { primitives: { attributes: Record<string, number>; indices?: number }[] }[];
  animations?: {
    name: string;
    samplers: { input: number; output: number }[];
    channels: { target: { node: number; path: string }; sampler: number }[];
  }[];
}
const root = 'public/assets/v3/';
const manifest = JSON.parse(readFileSync(root + 'paladin.json', 'utf8'));
const reports = [];
for (const [name, timing] of Object.entries(actionTiming)) {
  const clip = manifest.clips.find((clip: { name: string }) => clip.name === name);
  assert.ok(clip, `Simulation action ${name} has no exported clip`);
  assert.ok(
    Math.abs(clip.duration - timing.duration) < 0.025,
    `${name}: simulation and clip disagree`,
  );
  if (timing.release !== undefined)
    assert.equal(manifest.events[name]?.release, timing.release, `${name}: release mismatch`);
}
const revision = createHash('sha256');
for (const name of assetIds) {
  const data = readFileSync(root + name + '.glb');
  revision.update(data);
  assert.equal(data.toString('utf8', 0, 4), 'glTF');
  assert.equal(data.readUInt32LE(4), 2);
  assert.equal(data.readUInt32LE(8), data.length);
  const jsonLength = data.readUInt32LE(12);
  const gltf = JSON.parse(data.toString('utf8', 20, 20 + jsonLength)) as Gltf;
  const binOffset = 20 + jsonLength + 8;
  const bin = data.subarray(binOffset);
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  assert.equal(gltf.asset.version, '2.0');
  assert.equal(gltf.buffers.length, 1);
  assert.ok(!gltf.buffers[0].uri);
  assert.ok(gltf.buffers[0].byteLength <= bin.length);
  for (const image of gltf.images || [])
    assert.ok(image.bufferView !== undefined && !image.uri, 'Runtime images must be embedded');
  const accessor = (index: number) => {
    const a = gltf.accessors[index],
      b = gltf.bufferViews[a.bufferView];
    assert.ok(a && !a.sparse);
    assert.ok(b);
    const width = ({ SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 } as Record<string, number>)[
      a.type
    ];
    assert.ok(width);
    const bytes = (
      { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 } as Record<number, number>
    )[a.componentType];
    assert.ok(bytes);
    const stride = b.byteStride || width * bytes,
      base = (b.byteOffset || 0) + (a.byteOffset || 0);
    assert.ok(base + Math.max(0, a.count - 1) * stride + width * bytes <= bin.length);
    const result: number[] = [];
    for (let row = 0; row < a.count; row++)
      for (let col = 0; col < width; col++) {
        const offset = base + row * stride + col * bytes;
        const value =
          a.componentType === 5126
            ? view.getFloat32(offset, true)
            : a.componentType === 5125
              ? view.getUint32(offset, true)
              : a.componentType === 5123
                ? view.getUint16(offset, true)
                : a.componentType === 5122
                  ? view.getInt16(offset, true)
                  : a.componentType === 5121
                    ? view.getUint8(offset)
                    : view.getInt8(offset);
        assert.ok(Number.isFinite(value), `${name}: invalid accessor value`);
        result.push(value);
      }
    return result;
  };
  let triangles = 0,
    vertices = 0;
  for (const mesh of gltf.meshes)
    for (const p of mesh.primitives) {
      const position = gltf.accessors[p.attributes.POSITION];
      vertices += position.count;
      triangles += (p.indices !== undefined ? gltf.accessors[p.indices].count : position.count) / 3;
      accessor(p.attributes.POSITION);
    }
  if (name.startsWith('ballista-') || name.startsWith('aegis-')) {
    for (const part of name.startsWith('ballista')
      ? ['Turret', 'Carriage', 'Winch', 'LoadedBolt', 'Bowstring']
      : ['Turret', 'Core'])
      assert.ok(
        gltf.nodes.some((node) => node.name === part),
        `${name}: missing mechanical pivot ${part}`,
      );
    if (name.startsWith('aegis') && !name.endsWith('-1'))
      for (const part of ['Panel_L', 'Panel_R'])
        assert.ok(
          gltf.nodes.some((node) => node.name === part),
          `${name}: missing ${part}`,
        );
  }
  if (name === 'paladin') {
    assert.equal(gltf.skins?.length, 1);
    const skin = gltf.skins![0];
    assert.ok(skin.joints.length >= 60);
    for (const node of gltf.nodes.filter((n) => n.mesh !== undefined && n.skin !== undefined))
      for (const p of gltf.meshes[node.mesh!].primitives) {
        const joints = accessor(p.attributes.JOINTS_0),
          weights = accessor(p.attributes.WEIGHTS_0);
        for (const joint of joints) assert.ok(joint >= 0 && joint < skin.joints.length);
        for (let i = 0; i < weights.length; i += 4)
          assert.ok(
            Math.abs(weights.slice(i, i + 4).reduce((a, b) => a + b, 0) - 1) < 0.002,
            'Unnormalized skin weights',
          );
      }
    for (const socket of Object.values(manifest.sockets))
      assert.ok(
        gltf.nodes.some((n) => n.name === socket),
        `Missing socket ${socket}`,
      );
    assert.equal(gltf.animations?.length, manifest.clips.length);
    for (const expected of manifest.clips) {
      const clip = gltf.animations!.find((a) => a.name === expected.name);
      assert.ok(clip, `Missing ${expected.name}`);
      const duration = Math.max(...clip.samplers.map((s) => Math.max(...accessor(s.input))));
      assert.ok(
        Math.abs(duration - expected.duration) < 0.025,
        `${expected.name}: duration mismatch`,
      );
      let changing = 0;
      for (const sampler of clip.samplers) {
        const values = accessor(sampler.output);
        if (new Set(values.map((v) => v.toFixed(5))).size > 4) changing++;
      }
      assert.ok(changing > 0, `${expected.name} is only a rest pose`);
    }
    for (const moments of Object.values(manifest.events) as { release: number; recover: number }[])
      assert.ok(moments.release >= 0 && moments.release < moments.recover && moments.recover <= 1);
  }
  const hash = createHash('sha256').update(data).digest('hex');
  reports.push({
    name,
    bytes: data.length,
    vertices,
    triangles,
    skins: gltf.skins?.length || 0,
    clips: gltf.animations?.length || 0,
    sha256: hash,
  });
}
const assetRevision = revision.digest('hex').slice(0, 12);
if (process.argv.includes('--stamp')) {
  manifest.revision = assetRevision;
  writeFileSync(root + 'paladin.json', JSON.stringify(manifest, null, 2) + '\n');
} else assert.equal(manifest.revision, assetRevision, 'Assets changed: run npm run assets:stamp');
console.log(JSON.stringify({ revision: assetRevision, assets: reports }, null, 2));
