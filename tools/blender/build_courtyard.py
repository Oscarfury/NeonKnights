"""Author the first 3D training courtyard. Blender Z-up exports to glTF Y-up."""
import math
import random
from pathlib import Path
import bpy

random.seed(28)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
out=Path('public/assets/v3').resolve();out.mkdir(parents=True,exist_ok=True)
def material(name,color,metal=0,rough=.8,emission=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    if emission: p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
    return m
stone=[material('Basalt '+str(i),(.11+i*.014,.16+i*.017,.18+i*.018)) for i in range(4)]
edge=material('Dressed limestone',(.34,.37,.34));dark=material('Recessed masonry',(.038,.057,.071))
gold=material('Weathered brass',(.39,.25,.08),.75,.43);wood=material('Oak',(.13,.059,.025))
teal=material('Aegis glass',(.014,.4,.43),.4,.25,1.5);cloth=material('Midnight banners',(.027,.081,.13),0,.95)
def box(name,p,s,mat,bevel=.035):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
    if bevel:
        b=o.modifiers.new('Dressed edges','BEVEL');b.width=bevel;b.segments=2;bpy.ops.object.modifier_apply(modifier=b.name)
    return o
def cylinder(name,p,r,d,mat,vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=d,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.data.materials.append(mat);return o
def wedge(name,mat):
    # The simulation uses this same 2..6 slope and ±1.3 width.
    coords=[(2,-1.3,0),(2,1.3,0),(6,-1.3,0),(6,1.3,0),(6,-1.3,1.8),(6,1.3,1.8)]
    faces=[(0,1,3,2),(0,2,4),(1,5,3),(2,3,5,4),(0,4,5,1)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(coords,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.data.materials.append(mat)

box('Floating foundation',(0,-.64,0),(22.8,1.1,20.8),dark,.22)
for x in range(-10,11):
    for z in range(-9,10):
        box('Courtyard paving',(x,-.07,z),(.982,.14,.982),random.choice(stone),.025)
for x in [-11,11]:
    box('Foundation cornice',(x,-.14,0),(.28,.24,20.5),edge)
for z in [-10,10]:box('Foundation cornice',(0,-.14,z),(22.5,.24,.28),edge)
# Back and side walls are composed of individually dressed courses.
for row in range(3):
    for x in range(-10,11):
        box('North wall block',(x,.25+row*.5,-9.8),(.96,.48,.75),random.choice(stone))
    for x in [-10.8,10.8]:
        for z in range(-9,8):box('Side wall block',(x,.25+row*.5,z),(.75,.48,.96),random.choice(stone))
for x in range(-10,11):
    box('North coping',(x,1.56,-9.8),(1,.18,.92),edge)
    if x%2==0:box('North merlon',(x,1.95,-9.8),(.8,.7,.82),random.choice(stone))
for x in [-10.8,10.8]:
    for z in range(-9,8):
        box('Wall coping',(x,1.56,z),(.92,.18,1),edge)
        if z%2==0:box('Side merlon',(x,1.95,z),(.82,.7,.8),random.choice(stone))
for x in [-9.9,9.9]:
    for z in [-9,8.3]:
        cylinder('Bastion footing',(x,.2,z),1.08,.4,dark)
        cylinder('Bastion drum',(x,1.3,z),.82,2.4,stone[2],16)
        cylinder('Bastion cornice',(x,2.45,z),.95,.22,edge)
        for j in range(8):
            a=j*math.tau/8;box('Bastion tooth',(x+math.cos(a)*.75,2.8,z+math.sin(a)*.75),(.38,.55,.4),stone[2])
        cylinder('Lantern stem',(x,3.2,z),.045,1.3,gold,12)
        cylinder('Lantern housing',(x,3.5,z),.19,.45,gold,12)
        cylinder('Lantern glass',(x,3.5,z),.17,.31,teal,12)
# East firing balcony and a traversable continuous ramp.
box('East balcony',(8,.86,0),(4,1.72,6),stone[1],.045)
for x in [6.5,7.5,8.5,9.5]:
    for z in [-2.5,-1.5,-.5,.5,1.5,2.5]:box('Balcony paving',(x,1.76,z),(.985,.08,.985),edge,.018)
wedge('Balcony ramp',stone[2])
for z in [-1.37,1.37]:
    o=box('Ramp edge',(4,.96,z),(4.4,.14,.12),gold,.015);o.rotation_euler.y=-math.atan(1.8/4)
for z in [-3,3]:box('Balcony parapet',(8,2.08,z),(4,.56,.20),stone[3])
# Embedded range marks and boundary inlay.
for z in [-4,0,4]:
    for x in [-4,-2,0,2,4]:box('Range inlay',(x,.006,z),(.55,.015,.025),gold,.004)
for x in [-5.2,5.2]:box('Range border',(x,.005,-1.6),(.025,.012,12),gold,.002)
# Gate frame and pennants at the court entrance.
for x in [-2.2,2.2]:
    box('Gate pier',(x,1.35,9.2),(.8,2.7,.8),stone[2])
    box('Gate capital',(x,2.76,9.2),(1,.18,1),edge)
box('Gate lintel',(0,3.08,9.2),(5.3,.5,.85),edge,.1)
for x in [-5.8,5.8]:
    cylinder('Banner pole',(x,1.8,-8.8),.045,3.6,gold,12)
    box('Company banner',(x+.4,2.65,-8.8),(.73,1.12,.045),cloth,.01)
    box('Banner trim',(x+.4,2.13,-8.83),(.7,.045,.01),gold,.002)
    box('Banner charge',(x+.4,2.68,-8.84),(.11,.58,.015),gold,.002)
    box('Banner cross',(x+.4,2.8,-8.84),(.40,.1,.015),gold,.002)
# A physical emitter for each hazard drill; its glass brightens in runtime.
for x,z in [(-6,-3),(0,-3),(3,4)]:
    cylinder('Trial pedestal',(x,.12,z),.65,.24,dark)
    cylinder('Trial plate',(x,.25,z),.49,.08,gold)
    cylinder('Trial lens',(x,.3,z),.30,.06,teal)

# Batch static geometry by material to keep a detailed court inexpensive.
for mat in bpy.data.materials:
    objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and len(o.data.materials)==1 and o.data.materials[0]==mat]
    if not objects:continue
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects[0].name='Courtyard • '+mat.name
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(out/'courtyard.glb'),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False)
work=Path('art/work').resolve();work.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(work/'courtyard.blend'))
