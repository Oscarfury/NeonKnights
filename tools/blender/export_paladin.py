"""Convert the user-supplied Paladin to a game rig and author reviewable FK clips.

Run on the supplied scene with --disable-autoexec. Source geometry/UVs/paint are
Silver Delivery's. This script supplies runtime rig, clips and weapon geometry.
The unmodified vendor source is never overwritten or included in Git.
"""
import json
import hashlib
import math
from pathlib import Path
import bpy
from mathutils import Matrix, Quaternion, Vector

ROOT = Path.cwd()
OUT = ROOT / 'public/assets/v3'
WORK = ROOT / 'art/work'
OUT.mkdir(parents=True, exist_ok=True)
WORK.mkdir(parents=True, exist_ok=True)
source = bpy.data.objects['rig']
source.animation_data_clear()
source.data.pose_position = 'REST'
bpy.context.view_layer.update()
rest = {b.name: (b.head_local.copy(), b.tail_local.copy(), b.matrix_local.copy()) for b in source.data.bones if b.use_deform}

# A small hierarchy containing only the actual deformation bones. Preserve every
# original rest matrix and vertex weight; remove dependency on Rigify controls.
arm = bpy.data.armatures.new('PaladinDeform')
rig = bpy.data.objects.new('Paladin', arm)
bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
root = arm.edit_bones.new('root')
root.head = (0, 0, 0)
root.tail = (0, 0, .2)
for name, (head, tail, mat) in rest.items():
    b = arm.edit_bones.new(name)
    b.head, b.tail = head, tail
    b.matrix = mat
    b.length = (tail-head).length
for name in rest:
    old = source.data.bones[name]
    parent = old.parent.name if old.parent else 'root'
    if parent not in rest:
        if 'upper_arm' in name or 'shoulder' in name: parent = 'DEF-spine.003'
        elif 'thigh' in name or 'pelvis' in name: parent = 'DEF-spine'
        elif 'breast' in name: parent = 'DEF-spine.003'
        elif 'palm' in name or 'thumb.01' in name: parent = 'DEF-hand.' + name[-1]
        elif 'f_' in name: parent = 'DEF-palm.' + {'index':'01','middle':'02','ring':'03','pinky':'04'}[name.split('_')[1].split('.')[0]] + '.' + name[-1]
        else: parent = 'root'
    arm.edit_bones[name].parent = arm.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')
meshes = []
for o in list(bpy.data.objects):
    if o.name.startswith('model_') and o.name != 'model_sword':
        o.hide_set(False)
        o.hide_viewport = False
        o.hide_render = False
        o.parent = rig
        o.matrix_parent_inverse = Matrix.Identity(4)
        for modifier in o.modifiers:
            if modifier.type == 'ARMATURE': modifier.object = rig
        meshes.append(o)
    elif o != rig:
        bpy.data.objects.remove(o, do_unlink=True)

for action in list(bpy.data.actions): bpy.data.actions.remove(action,do_unlink=True)

# An export-compatible material, using the original painted albedo and normals.
textures = ROOT/'art/source/vendor/paladin/blend/textures'
mat = bpy.data.materials.new('Silver Delivery • painted paladin')
mat.use_nodes = True
nodes, links = mat.node_tree.nodes, mat.node_tree.links
bsdf = nodes.get('Principled BSDF')
bsdf.inputs['Roughness'].default_value = .63
bsdf.inputs['Metallic'].default_value = .24
for suffix, socket, colorspace in [('albedo','Base Color','sRGB'), ('roughness','Roughness','Non-Color'), ('normal_tngt','Normal','Non-Color')]:
    img = bpy.data.images.load(str(textures/f't_paintpoly_paladin_knight_{suffix}.png'), check_existing=False)
    img.colorspace_settings.name = colorspace
    # Retain 4K painted color; a 2K normal is sufficient for this ~2m character.
    size = 4096 if suffix == 'albedo' else 2048
    if img.size[0] != size: img.scale(size, size)
    img.filepath_raw = str(WORK/f'paladin-{suffix}.png')
    img.file_format = 'PNG'
    img.save()
    tex = nodes.new('ShaderNodeTexImage')
    tex.image = img
    if socket == 'Normal':
        normal = nodes.new('ShaderNodeNormalMap')
        links.new(tex.outputs['Color'], normal.inputs['Color'])
        links.new(normal.outputs['Normal'], bsdf.inputs['Normal'])
    else: links.new(tex.outputs['Color'], bsdf.inputs[socket])
for o in meshes:
    o.data.materials.clear()
    o.data.materials.append(mat)
    for polygon in o.data.polygons: polygon.use_smooth = True

def basis_pose(name, head, tail):
    oldhead, oldtail, matrix = rest[name]
    q = (oldtail-oldhead).normalized().rotation_difference((Vector(tail)-Vector(head)).normalized())
    rig.pose.bones[name].matrix = Matrix.Translation(Vector(head)) @ q.to_matrix().to_4x4() @ matrix.to_3x3().to_4x4()
    bpy.context.view_layer.update()

def limb(side, upper, lower, start, hinge, end):
    start, hinge, end = Vector(start), Vector(hinge), Vector(end)
    basis_pose(f'DEF-{upper}.{side}', start, start.lerp(hinge,.5))
    basis_pose(f'DEF-{upper}.{side}.001', start.lerp(hinge,.5), hinge)
    basis_pose(f'DEF-{lower}.{side}', hinge, hinge.lerp(end,.5))
    basis_pose(f'DEF-{lower}.{side}.001', hinge.lerp(end,.5), end)

def solve_ik(start, end, len1, len2, pole):
    start, end, pole = Vector(start), Vector(end), Vector(pole)
    delta = end-start
    dist = max(.001, min(delta.length, len1+len2-.0001))
    axis = delta.normalized()
    along = (len1*len1-len2*len2+dist*dist)/(2*dist)
    up = pole-start
    up = (up-axis*up.dot(axis)).normalized()
    return start+axis*along+up*math.sqrt(max(.0001,len1*len1-along*along))

def pose(t, mode):
    for b in rig.pose.bones:
        b.rotation_mode = 'QUATERNION'
        b.matrix_basis = Matrix.Identity(4)
    bpy.context.view_layer.update()
    gait = mode in ('walk','run','strafe_left','strafe_right','backpedal')
    phase = 2*math.pi*t
    bob = (.014 if gait else .006)*math.sin(phase*2 if gait else phase)
    crouch = .10*math.sin(math.pi*t) if mode == 'dodge' else 0
    hips = Vector((0,0,bob-crouch-(.09 if gait else 0)))
    for name in rest:
        if name.startswith('DEF-spine') or 'shoulder' in name or 'pelvis' in name or 'breast' in name:
            rig.pose.bones[name].matrix = Matrix.Translation(hips) @ rest[name][2]
            bpy.context.view_layer.update()
    bpy.context.view_layer.update()
    for side, sign in [('L',1),('R',-1)]:
        p = phase+(math.pi if side=='R' else 0)
        stride = (.42 if mode=='run' else .21)*math.cos(p) if gait else .01*sign
        lift = (.13 if mode=='run' else .065)*max(0,math.sin(p)) if gait else 0
        if mode=='backpedal': stride *= -1
        ankle = Vector((.15*sign,.112+stride,.085+lift))
        if mode.startswith('strafe'):
            ankle.x += stride*(1 if mode=='strafe_right' else -1)
            ankle.y = .112
        start = rest[f'DEF-thigh.{side}'][0]+hips
        knee = solve_ik(start,ankle,.535,.457,(.15*sign,-1,.55))
        limb(side,'thigh','shin',start,knee,ankle)
        basis_pose(f'DEF-foot.{side}',ankle,ankle+Vector((0,-.110,-.068)))
        basis_pose(f'DEF-toe.{side}',ankle+Vector((0,-.110,-.068)),ankle+Vector((0,-.177,-.068)))
    # Motion is authored around two actual weapon grips, in Blender's -Y forward.
    draw = .25
    if mode=='bow_draw': draw = t
    if mode=='bow_hold': draw = 1
    if mode=='bow_release': draw = max(0,1-max(0,t-.1)*4)
    if mode=='bow_idle': draw = .12
    if mode=='bow_fire': draw = min(1,t/.62) if t < .66 else max(0,1-(t-.66)*12)
    gun = mode.startswith('lance')
    recoil = .09*math.sin(min(1,t/.3)*math.pi) if mode=='lance_fire' else 0
    for side, sign in [('L',1),('R',-1)]:
        shoulder = rest[f'DEF-upper_arm.{side}'][0]+hips
        if gun:
            wrist = Vector((.13,-.47+recoil,1.39)) if side=='L' else Vector((-.13,-.22+recoil,1.29))
        else:
            wrist = Vector((.13-.05*draw,-.46-.09*draw,1.42+.20*draw)) if side=='L' else Vector((.09-.13*draw,-.47+.39*draw,1.43+.25*draw))
        if gait:
            wrist.z -= .19
            wrist.y += .09
        wrist += hips
        elbow = solve_ik(shoulder,wrist,.315,.314,(sign*.68,.14,1.45 if side=='R' else 1.15))
        limb(side,'upper_arm','forearm',shoulder,elbow,wrist)
        basis_pose(f'DEF-hand.{side}',wrist,wrist+Vector((0,-.079,-.014)))
    bpy.context.view_layer.update()
    for bone in rig.pose.bones:
        if bone.name.startswith('DEF-f_'):
            bone.rotation_quaternion = Quaternion((1,0,0), math.radians(48))
        elif bone.name.startswith('DEF-thumb.'):
            bone.rotation_quaternion = Quaternion((1,0,0), math.radians(22))
    if mode=='hit':
        rig.pose.bones['DEF-spine.002'].rotation_quaternion = Quaternion((1,0,0),-.16*math.sin(math.pi*t))
    if mode=='downed':
        rig.pose.bones['root'].rotation_quaternion = Quaternion((1,0,0),-math.pi*.49*t)
        rig.pose.bones['root'].location = (0,.2*t,.05*t)
    bpy.context.view_layer.update()

clips = [('bow_idle',2.4),('bow_draw',.8),('bow_hold',1.4),('bow_release',.32),('bow_fire',1.15),
         ('lance_idle',2.4),('lance_fire',.65),('walk',1),('run',.7),('backpedal',1.1),
         ('strafe_left',1),('strafe_right',1),('dodge',.5),('hit',.4),('downed',1.3)]
rig.animation_data_create()
bpy.context.scene.render.fps = 30
for name, duration in clips:
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    rig.animation_data.action = action
    count = round(duration*30)
    for f in range(count+1):
        bpy.context.scene.frame_set(f)
        pose(f/count,name)
        for b in rig.pose.bones:
            b.keyframe_insert('location',frame=f,group=b.name)
            b.keyframe_insert('rotation_quaternion',frame=f,group=b.name)
            b.keyframe_insert('scale',frame=f,group=b.name)
    for fc in action.fcurves:
        for key in fc.keyframe_points: key.interpolation = 'LINEAR'
rig.animation_data.action = None
for b in rig.pose.bones: b.matrix_basis=Matrix.Identity(4)
bpy.context.scene.frame_set(0)

def material(name,color,metal=.4,rough=.36):
    m=bpy.data.materials.new(name);m.use_nodes=True
    b=m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value=(*color,1)
    b.inputs['Metallic'].default_value=metal;b.inputs['Roughness'].default_value=rough
    return m
gold=material('Weapon • electrum',(.6,.33,.08),.8)
dark=material('Weapon • enamel',(.018,.08,.12),.55)
wood=material('Weapon • heartwood',(.17,.055,.024),.1,.7)
light=material('Weapon • pale silver',(.65,.75,.8),.8)
glow=material('Weapon • storm crystal',(.015,.54,.75),.45)
glow.node_tree.nodes.get('Principled BSDF').inputs['Emission Color'].default_value=(0,.5,.8,1)
glow.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value=1.2

def rod(name,points,radius,mat):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=16
    curve.bevel_depth=radius;curve.bevel_resolution=3
    spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
    for b,p in zip(spline.bezier_points,points): b.co=p;b.handle_left_type='AUTO';b.handle_right_type='AUTO'
    obj=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(obj);obj.data.materials.append(mat)
    return obj
def uvball(name,position,scale,mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,location=position)
    o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(mat)
    return o
def cylinder(name,position,radius,depth,mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=radius,depth=depth,location=position)
    o=bpy.context.object;o.name=name;o.data.materials.append(mat)
    return o
def export_objects(filename,objects,animations=False):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects: o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.export_scene.gltf(filepath=str(OUT/filename),export_format='GLB',use_selection=True,
        export_animations=animations,export_animation_mode='ACTIONS',export_force_sampling=True,
        export_skins=True,export_def_bones=True,export_image_format='JPEG',export_jpeg_quality=92,
        export_extras=True,export_cameras=False,export_lights=False)

rig['asset_author']='Silver Delivery (mesh and textures); Neon Knights (runtime rig and clips)'
rig['source']='User-provided blend.zip / Hand Painted Paladin Knight'
export_objects('paladin.glb',[rig,*meshes],True)

bow=[]
for sign in [-1,1]:
    points=[(0,0,0),(0,-.055,sign*.19),(0,-.105,sign*.36),(0,.02,sign*.55),(0,.13,sign*.66)]
    bow.append(rod('Stormbow • recurved limb',points,.024,wood))
    bow.append(rod('Stormbow • metal spine',[(.02,y,z) for _,y,z in points],.009,gold))
    bow.append(uvball('Stormbow • tip',points[-1],(.033,.033,.075),light))
    for z in [.16,.21,.26]: bow.append(cylinder('Stormbow • ferrule',(0,-.05,sign*z),.031,.026,gold))
bow.append(cylinder('Stormbow • grip',(0,0,0),.035,.17,dark))
bow.append(uvball('Stormbow • focus',(.04,-.025,0),(.034,.035,.075),glow))
export_objects('stormbow.glb',bow)
for o in bow: bpy.data.objects.remove(o,do_unlink=True)

lance=[]
for radius,start,end,matl in [(.065,-.10,.6,dark),(.042,.52,.94,light),(.078,.12,.22,gold),(.08,.45,.5,gold)]:
    o=cylinder('Sunlance • emitter',(0,-(start+end)/2,0),radius,end-start,matl);o.rotation_euler.x=math.pi/2;lance.append(o)
for sign in [-1,1]:
    lance.append(rod('Sunlance • split conductor',[(sign*.06,-.4,0),(sign*.12,-.58,0),(sign*.075,-.84,0)],.018,gold))
    lance.append(uvball('Sunlance • lens',(sign*.06,-.56,0),(.027,.11,.027),glow))
lance.append(rod('Sunlance • stock',[(0,.13,-.06),(0,.04,-.14),(0,-.09,-.14)],.043,wood))
export_objects('sunlance.glb',lance)
for o in lance: bpy.data.objects.remove(o,do_unlink=True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(WORK/'paladin-runtime.blend'))
manifest={'id':'paladin-v3-01','model':'paladin.glb','author':'Silver Delivery','source':'https://www.cgtrader.com/free-3d-models/character/fantasy-character/hand-painted-paladin-knight-rigged-and-game-ready',
    'height':1.98,'forward':'+Z','sockets':{'leftHand':'DEF-hand.L','rightHand':'DEF-hand.R','chest':'DEF-spine.003'},
    'clips':[{ 'name':name,'duration':duration,'loop':name not in ['bow_draw','bow_release','bow_fire','lance_fire','dodge','hit','downed']} for name,duration in clips],
    'events':{'bow_fire':{'release':.66,'recover':.96},'bow_release':{'release':.06,'recover':.9},'lance_fire':{'release':.08,'recover':.9}},
    'status':'Animation review candidate; full art acceptance remains open'}
manifest['revision']=hashlib.sha256(b''.join((OUT/name).read_bytes() for name in ['paladin.glb','stormbow.glb','sunlance.glb','courtyard.glb'] if (OUT/name).exists())).hexdigest()[:12]
(OUT/'paladin.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8')
print('EXPORTED',len(rest)+1,'bones',len(clips),'clips')
