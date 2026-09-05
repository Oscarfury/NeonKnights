import bpy, json
from pathlib import Path
from mathutils import Vector
bpy.ops.import_scene.gltf(filepath=str(Path('art/source/vendor/styloo/dragonexport.glb').resolve()))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
mesh=next(o for o in bpy.context.scene.objects if o.type=='MESH')
print('RIG',rig.name,'mesh',mesh.name,'dim',list(mesh.dimensions),'transform',list(rig.location),list(rig.scale))
rows=[]
for b in rig.data.bones:
    if any(w in b.name for w in ['spine','neck','head','Wing','tail','thigh','shin','foot','beak','upper_arm','forearm']):
        rows.append({'name':b.name,'head':list(rig.matrix_world@b.head_local),'tail':list(rig.matrix_world@b.tail_local)})
Path('output/dragon-bones.json').write_text(json.dumps(rows,indent=2))
verts=[mesh.matrix_world@Vector(c) for c in mesh.bound_box];lo=Vector(tuple(min(v[i] for v in verts) for i in range(3)));hi=Vector(tuple(max(v[i] for v in verts) for i in range(3)))
print('BOUNDS',list(lo),list(hi))
scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE_NEXT';scene.render.resolution_x=900;scene.render.resolution_y=800;scene.render.resolution_percentage=100
world=bpy.data.worlds.new('Inspection');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.25,.29,.33,1)
center=(lo+hi)/2;size=max(hi-lo)
bpy.ops.object.camera_add(location=center+Vector((size*.85,-size*1.15,size*.55)));camera=bpy.context.object;camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=size*1.12;scene.camera=camera
for off,power in [((1,-1,2),1800),((-1,0,1),1100)]:
    bpy.ops.object.light_add(type='AREA',location=center+Vector(off)*size*.5);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size*.7;o.rotation_euler=(center-o.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(Path('output/dragon-rest.png').resolve());bpy.ops.render.render(write_still=True)
