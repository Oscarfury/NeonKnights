import bpy, math
from pathlib import Path
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for i,path in enumerate(sorted(Path('art/source/vendor/styloo/plants').glob('*.glb'))):
    before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(path.resolve()));objects=set(bpy.data.objects)-before
    meshes=[o for o in objects if o.type=='MESH'];points=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
    lo=Vector(tuple(min(p[a] for p in points) for a in range(3)));hi=Vector(tuple(max(p[a] for p in points) for a in range(3)));size=max(hi-lo)
    root=bpy.data.objects.new(path.stem,None);bpy.context.collection.objects.link(root)
    for o in objects:
        if not o.parent:o.parent=root
    scale=2/max(.01,size);root.scale=(scale,)*3;root.location=((i%7)*3-(lo.x+hi.x)*.5*scale,(i//7)*4, -lo.z*scale)
    bpy.ops.object.text_add(location=((i%7)*3,(i//7)*4-1.4,.05));o=bpy.context.object;o.data.body=str(i);o.data.size=.35;o.rotation_euler=(math.pi/2,0,0)
image=bpy.data.images.load(str(Path('art/source/vendor/styloo/plants/texturesplants.png').resolve()))
material=bpy.data.materials.new('Painted foliage');material.use_nodes=True
shader=material.node_tree.nodes.get('Principled BSDF');tex=material.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image
material.node_tree.links.new(tex.outputs['Color'],shader.inputs['Base Color']);material.node_tree.links.new(tex.outputs['Alpha'],shader.inputs['Alpha'])
shader.inputs['Roughness'].default_value=1
for o in bpy.context.scene.objects:
    if o.type=='MESH':o.data.materials.clear();o.data.materials.append(material)
scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE_NEXT';scene.render.resolution_x=1300;scene.render.resolution_y=780;scene.render.resolution_percentage=100
scene.world.color=(.5,.5,.5)
center=Vector((9,4,0));bpy.ops.object.camera_add(location=(9,-12,20));camera=bpy.context.object;camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=23;scene.camera=camera
bpy.ops.object.light_add(type='AREA',location=(9,-2,14));o=bpy.context.object;o.data.energy=2500;o.data.size=20
scene.render.filepath=str(Path('output/foliage-sheet.png').resolve());bpy.ops.render.render(write_still=True)
