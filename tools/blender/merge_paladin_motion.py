"""Merge baked motion without decoding/recompressing the unchanged 4K artwork.

Used with export_paladin.py -- --animations-only on memory-constrained machines.
Prunes unused animation buffers, so repeated builds do not grow the GLB.
"""
import json
import struct
from pathlib import Path

root = Path.cwd()
target = root / 'public/assets/v3/paladin.glb'

def read(path):
    data = path.read_bytes()
    assert data[:4] == b'glTF' and struct.unpack_from('<I', data, 8)[0] == len(data)
    length = struct.unpack_from('<I', data, 12)[0]
    return json.loads(data[20:20+length]), data[28+length:]

base, binary = read(target)
motion, baked = read(root / 'art/work/paladin-motion.glb')
names = {n.get('name'): i for i, n in enumerate(base['nodes'])}
node_map = {}
for i, node in enumerate(motion['nodes']):
    name = node.get('name')
    if name in names:
        node_map[i] = names[name]
        # Never attach animation to an incompatible rest hierarchy.
        original = base['nodes'][names[name]]
        for key, default in [('translation', [0, 0, 0]), ('rotation', [0, 0, 0, 1]), ('scale', [1, 1, 1])]:
            assert all(abs(a-b) < .0001 for a,b in zip(node.get(key, default), original.get(key, default))), (name, key)
view_offset, accessor_offset = len(base['bufferViews']), len(base['accessors'])
for view in motion['bufferViews']:
    view['byteOffset'] = view.get('byteOffset', 0) + len(binary)
base['bufferViews'] += motion['bufferViews']
for accessor in motion['accessors']:
    accessor['bufferView'] += view_offset
base['accessors'] += motion['accessors']
base['animations'] = motion['animations']
for clip in base['animations']:
    for sampler in clip['samplers']:
        sampler['input'] += accessor_offset
        sampler['output'] += accessor_offset
    for channel in clip['channels']:
        channel['target']['node'] = node_map[channel['target']['node']]
binary += baked

# Collect every live accessor reference before discarding the superseded clips.
refs = []
for mesh in base['meshes']:
    for primitive in mesh['primitives']:
        refs += [(primitive['attributes'], key) for key in primitive['attributes']]
        if 'indices' in primitive: refs.append((primitive, 'indices'))
        for morph in primitive.get('targets', []): refs += [(morph, key) for key in morph]
for skin in base.get('skins', []):
    if 'inverseBindMatrices' in skin: refs.append((skin, 'inverseBindMatrices'))
for clip in base['animations']:
    for sampler in clip['samplers']: refs += [(sampler, 'input'), (sampler, 'output')]
used = sorted({obj[key] for obj, key in refs})
mapping = {old: new for new, old in enumerate(used)}
base['accessors'] = [base['accessors'][index] for index in used]
for obj, key in refs: obj[key] = mapping[obj[key]]
view_refs = [(a, 'bufferView') for a in base['accessors']]
view_refs += [(image, 'bufferView') for image in base.get('images', [])]
used_views = sorted({obj[key] for obj, key in view_refs})
mapping = {old: new for new, old in enumerate(used_views)}
packed = bytearray()
views = []
for index in used_views:
    view = base['bufferViews'][index]
    start = view.get('byteOffset', 0)
    data = binary[start:start+view['byteLength']]
    assert len(data) == view['byteLength']
    view['byteOffset'] = len(packed)
    packed.extend(data)
    packed.extend(b'\0' * (-len(packed) % 4))
    views.append(view)
for obj, key in view_refs: obj[key] = mapping[obj[key]]
base['bufferViews'] = views
base['buffers'] = [{'byteLength': len(packed)}]
encoded = json.dumps(base, separators=(',', ':'), ensure_ascii=False).encode()
encoded += b' ' * (-len(encoded) % 4)
output = struct.pack('<4sII', b'glTF', 2, 28+len(encoded)+len(packed))
output += struct.pack('<I4s', len(encoded), b'JSON') + encoded
output += struct.pack('<I4s', len(packed), b'BIN\0') + packed
target.write_bytes(output)
manifest = json.loads((root / 'art/work/paladin-motion.json').read_text(encoding='utf8'))
(root / 'public/assets/v3/paladin.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf8')
print(f'Merged {len(base["animations"])} clips; {len(output):,} bytes. Run npm run assets:stamp.')
