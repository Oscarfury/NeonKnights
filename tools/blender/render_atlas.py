"""Render the existing original knight into an eight-direction runtime atlas.
Run Blender --background --python-exit-code 1 --python tools/blender/render_atlas.py.
Frames per direction: idle, walk A, walk B, anticipate, strike, recovery.
The source model and object pivot action remain editable in the saved source.
"""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector

base = Path(__file__).resolve().parents[2]
bpy.ops.wm.open_mainfile(filepath=str(base / 'docs/assets/knight-puppet/aegis-knight.blend'))
scene = bpy.context.scene
for obj in list(bpy.data.objects):
    if obj.name.startswith(('Presentation plinth', 'Plinth rune', 'Stage floor')):
        bpy.data.objects.remove(obj, do_unlink=True)
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.film_transparent = True
scene.render.resolution_x = 128
scene.render.resolution_y = 128
scene.render.resolution_percentage = 100
scene.render.image_settings.color_mode = 'RGBA'
scene.camera.location = (0, -7, 4.8)
scene.camera.rotation_euler = (Vector((0, 0, 1.28)) - scene.camera.location).to_track_quat('-Z', 'Y').to_euler()
scene.camera.data.ortho_scale = 3.7
root = bpy.data.objects['KNIGHT_ROOT']
original = {o.name:o.location.copy() for o in bpy.data.objects if o.parent}
out = base / 'public/assets'
out.mkdir(parents=True, exist_ok=True)
width, height = 768, 1024
pixels = [0.0] * (width * height * 4)
temp = base / 'output/atlas-frame.png'
temp.parent.mkdir(parents=True, exist_ok=True)
for direction in range(8):
    root.rotation_euler.z = direction * math.pi / 4
    for frame, source in enumerate([1, 1, 1, 9, 12, 19]):
        scene.frame_set(source)
        for name, location in original.items():
            bpy.data.objects[name].location = location
        root.location.z = 0
        if frame in (1, 2):
            sign = 1 if frame == 1 else -1
            root.location.z = .035
            for name, location in original.items():
                if any(part in name for part in ('sabaton', 'shin plate', 'knee', 'thigh')):
                    bpy.data.objects[name].location.y += (.11 if name.startswith('L') else -.11) * sign
        scene.render.filepath = str(temp)
        bpy.ops.render.render(write_still=True)
        rendered = bpy.data.images.load(str(temp), check_existing=False)
        data = list(rendered.pixels)
        for y in range(128):
            target = (((7-direction)*128+y)*width+frame*128)*4
            pixels[target:target+512] = data[y*512:(y+1)*512]
        bpy.data.images.remove(rendered)
atlas = bpy.data.images.new('Knight eight-direction atlas', width=width, height=height, alpha=True)
atlas.pixels.foreach_set(pixels)
atlas.filepath_raw = str(out / 'knight-atlas.png')
atlas.file_format = 'PNG'
atlas.save()
(out / 'knight-atlas.json').write_text(json.dumps({'frameWidth':128,'frameHeight':128,'columns':6,'directions':8,'clips':{'idle':[0],'walk':[1,2],'attack':[3,4,5]},'pivot':[.5,.83],'hitFrame':4,'source':'tools/blender/render_atlas.py'}, indent=2))
print('NEON_ATLAS_OK')
