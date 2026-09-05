"""Read-only inspection of the supplied paladin scene; never runs embedded scripts."""
import json
from pathlib import Path
import bpy

report = {
    'objects': [],
    'actions': [{'name': a.name, 'frames': list(a.frame_range)} for a in bpy.data.actions],
    'images': [{'name': i.name, 'path': i.filepath, 'size': list(i.size)} for i in bpy.data.images],
    'texts': [t.name for t in bpy.data.texts],
}
for o in bpy.data.objects:
    item = {'name': o.name, 'type': o.type, 'location': list(o.location), 'scale': list(o.scale), 'rotation': list(o.rotation_euler)}
    if o.type == 'MESH':
        item.update(vertices=len(o.data.vertices), polygons=len(o.data.polygons),
                    materials=[m.name for m in o.data.materials if m],
                    groups=[g.name for g in o.vertex_groups],
                    modifiers=[{'name': m.name, 'type': m.type} for m in o.modifiers],
                    bounds=[list(v) for v in o.bound_box])
    if o.type == 'ARMATURE':
        item['bones'] = [{'name': b.name, 'parent': b.parent.name if b.parent else None,
                          'head': list(b.head_local), 'tail': list(b.tail_local),
                          'deform': b.use_deform, 'matrix': [list(row) for row in b.matrix_local]} for b in o.data.bones]
        item['constraints'] = [{'bone': b.name, 'constraints': [c.type for c in b.constraints]} for b in o.pose.bones if b.constraints]
    report['objects'].append(item)
out = Path('output/art-review')
out.mkdir(parents=True, exist_ok=True)
(out / 'paladin-source.json').write_text(json.dumps(report, indent=2), encoding='utf8')
print(json.dumps({'objects': [(o['name'], o['type'],len(o.get('bones',[]))) for o in report['objects']], 'actions':report['actions'], 'images':report['images'], 'texts':report['texts']},indent=2))
