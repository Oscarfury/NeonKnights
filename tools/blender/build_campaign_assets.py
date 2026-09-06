"""Campaign mechanisms, equipment and articulated stone automaton. Blender 4.3."""
import sys, math, random
from pathlib import Path
import bpy
from mathutils import Vector, Matrix
sys.path.insert(0,str(Path(__file__).parent))
from forge import *
OUT=Path('public/assets/v3').resolve()
def reset():
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def palette():
 return [material('Carved limestone',(.43,.47,.43),.15,.78),material('Antique brass',(.49,.29,.09),.7,.4),material('Blue iron',(.055,.085,.10),.65,.5),material('Runic glass',(.055,.44,.42),.25,.35,.4),material('Bound heartwood',(.18,.072,.029),0,.86),material('Royal damask',(.16,.024,.06),0,.9)]
def export(name, animated=False):
 # Each material gets an embedded painted value study; all new surfaces have UVs.
 random.seed(125)
 for mat in {m for o in bpy.context.scene.objects if o.type=='MESH' for m in o.data.materials}:
  p=mat.node_tree.nodes.get('Principled BSDF');color=p.inputs['Base Color'].default_value[:3]
  tex=bpy.data.images.new(mat.name+' brushwork',width=64,height=64)
  pixels=[]
  for y in range(64):
   for x in range(64):
    v=.87+.1*math.sin(x*.18)*math.sin(y*.23)+random.random()*.13
    pixels.extend([min(1,c*v) for c in color]+[1])
  tex.pixels=pixels;tex.pack()
  node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=tex
  mat.node_tree.links.new(node.outputs['Color'],p.inputs['Base Color'])
 for o in list(bpy.context.scene.objects):
  if o.type!='MESH':continue
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
  bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(island_margin=.02);bpy.ops.object.mode_set(mode='OBJECT')
 if not animated:batch()
 bpy.ops.object.select_all(action='SELECT')
 bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',use_selection=True,export_animations=animated,export_animation_mode='NLA_TRACKS',export_cameras=False,export_lights=False)
 print('CAMPAIGN EXPORTED',name,flush=True)
def barrel(parent,p,r=.3,length=.9):
 x,y,z=p
 for n in range(12):
  a=n*math.tau/12
  rod('Oak stave',(x+math.sin(a)*r,y-length/2,z+math.cos(a)*r),(x+math.sin(a)*r,y+length/2,z+math.cos(a)*r),r*.27,wood,parent)
 for h in [-.39,0,.39]:ring('Riveted hoop',(x,y+length*h,z),r+.035,.025,iron,parent)
 rod('Barrel lid',(x,y+length/2-.025,z),(x,y+length/2,z),r,wood,parent)
def wheel(parent,p,r):
 x,y,z=p;ring('Iron tire',p,r,.065,iron,parent,'x');ring('Oak felloe',p,r-.07,.07,wood,parent,'x')
 for n in range(10):
  a=n*math.tau/10;rod('Wheel spoke',p,(x,y+math.sin(a)*(r-.09),z+math.cos(a)*(r-.09)),.035,wood,parent)
 rod('Axle cap',(x-.1,y,z),(x+.1,y,z),.11,brass,parent)
for rank in [1,2,3]:
 reset();stone,brass,iron,glass,wood,cloth=palette();root=group('Mortar');turret=group('Turret',parent=root);carriage=group('Carriage',parent=turret)
 for side in [-1,1]:
  box('Carriage runner',(side*.62,.23,0),(.21,.34,1.65),wood,turret)
  rod('Elevation cheek',(side*.46,.35,-.4),(side*.46,.96,.05),.12,iron,turret)
  wheel(turret,(side*.82,.39,-.22),.37)
  box('Recoil shoe',(side*.63,.13,-.85),(.46,.15,.55),iron,turret)
 a=Vector((0,.65,-.48));b=Vector((0,1.5+rank*.12,.46));axis=(b-a).normalized()
 # Hollow bronze bore with a rolled muzzle, actual visible inner wall.
 u=Vector((1,0,0));v=axis.cross(u).normalized();pts=[]
 radius=.29+rank*.035
 for distance,r in [(0,radius*.9),((b-a).length,radius),((b-a).length,radius-.085),(0,radius-.085)]:
  for n in range(32):pts.append(tuple(a+axis*distance+(u*math.cos(n*math.tau/32)+v*math.sin(n*math.tau/32))*r))
 faces=[]
 for row in range(4):
  for n in range(32):faces.append((row*32+n,row*32+(n+1)%32,((row+1)%4)*32+(n+1)%32,((row+1)%4)*32+n))
 sheet('Cast bombard barrel',pts,faces,brass,carriage,0,True)
 sphere('Breech',(0,.64,-.49),(.34,.27,.31),iron,carriage)
 for n in range(6):
  a1=n*math.tau/6;rod('Barrel rib',(math.cos(a1)*radius,.67+math.sin(a1)*radius,-.42),(math.cos(a1)*radius,1.3+rank*.12+math.sin(a1)*radius,.36),.018,iron,carriage)
 winch=group('Winch',(.58,.66,-.4),turret);wheel(winch,(.58,.66,-.4),.18)
 if rank>=2:
  for side in [-1,1]:
   sheet('Curved recoil shield',[(side*.42,.4,.3),(side*.83,.5,.46),(side*.76,1.05,.55),(side*.42,1.17,.36)],[(0,1,2,3)],iron,turret,.06)
   for n in range(4):sphere('Shield rivet',(side*.76,.56+n*.12,.5),(.025,.025,.025),brass,turret)
 if rank==3:
  for side in [-1,1]:
   rod('Hydraulic brace',(side*.9,.2,-.65),(side*.6,.9,-.1),.075,brass,turret)
   for n in range(3):sphere('Ready shell',(side*.98,.45,-.42+n*.34),(.16,.18,.16),iron,turret)
  box('Shell rack',(0,.32,-.9),(1.8,.12,.3),brass,turret)
 export('mortar-'+str(rank))
reset();stone,brass,iron,glass,wood,cloth=palette();root=group('IronRam');beam=group('RamHead',(0,1,0),root)
for side in [-1,1]:
 for z in [-.9,.9]:
  wheel(root,(side*.84,.48,z),.46)
  rod('A frame strut',(side*.68,.4,z),(side*.5,2.0,z),.1,wood,root)
 rod('Chassis beam',(side*.66,.42,-1.3),(side*.66,.42,1.3),.12,iron,root)
 for z in [-.65,.65]:curve('Suspension chain',[(side*.15,1.05,z),(side*.28,1.9,z),(side*.44,1.92,z)],.022,iron,root)
for side in [-1,1]:
 sheet('Overlapping armored roof',[(0,2.3,-1.45),(0,2.3,1.35),(side*1.1,1.8,1.35),(side*1.1,1.8,-1.45)],[(0,1,2,3)],iron,root,.09)
 for z in [-1.2,-.6,0,.6,1.2]:rod('Roof rib',(0,2.35,z),(side*1.12,1.84,z),.035,brass,root)
rod('Battering oak',(0,1,-1.5),(0,1,1.6),.27,wood,beam,20)
for z in [-1.2,-.4,.4,1.2]:ring('Beam binding',(0,1,z),.28,.045,iron,beam,'z')
sphere('Forged ram skull',(0,1,1.65),(.36,.36,.43),iron,beam)
for side in [-1,1]:
 curve('Ram horn',[(side*.2,1.2,1.65),(side*.51,1.34,1.53),(side*.58,1.03,1.6),(side*.38,.87,1.82)],.07,brass,beam)
 sphere('Ram eye',(side*.23,1.13,1.96),(.044,.042,.026),glass,beam)
export('iron-ram')
reset();stone,brass,iron,glass,wood,cloth=palette()
g=group('LancerSpear');rod('Spear haft',(0,-.8,0),(0,1.35,0),.032,wood,g)
for y in [-.6,0,.6,1.2]:ring('Grip collar',(0,y,0),.043,.012,brass,g)
sheet('Leaf spearhead',[(0,1.9,0),(-.105,1.45,0),(0,1.3,.035),(.105,1.45,0)],[(0,1,2),(0,2,3)],stone,g,.025)
g=group('SapperPack');barrel(g,(0,-.18,-.1),.23,.63);curve('Burning fuse',[(0,.17,-.1),(.16,.31,-.1),(.24,.26,-.1)],.017,wood,g);sphere('Fuse coal',(.24,.26,-.1),(.027,.027,.027),brass,g)
g=group('HollowCrown');ring('Broken iron circlet',(0,.03,0),.18,.035,iron,g)
for n in range(9):
 a=n*math.tau/9;rod('Crown tine',(math.sin(a)*.18,.03,math.cos(a)*.18),(math.sin(a)*.26,.26+(n%3)*.05,math.cos(a)*.26),.025,brass,g)
g=group('HollowBlade');rod('Longbound grip',(0,-.25,0),(0,.17,0),.045,wood,g);rod('Broken crossguard',(-.28,.2,0),(.28,.2,0),.04,brass,g)
sheet('Executioner blade',[(-.09,.2,0),(.09,.2,0),(.15,1.18,0),(.06,1.47,0),(-.1,1.24,0)],[(0,1,2,3,4)],iron,g,.055)
rod('Blade inlay',(0,.27,.034),(0,1.17,.034),.015,brass,g)
g=group('DawnStaff');rod('Ivory staff',(0,-.8,0),(0,1,0),.04,stone,g);ring('Dawn halo',(0,1.12,0),.22,.035,brass,g,'z');sphere('Dawn crystal',(0,1.12,0),(.075,.14,.06),glass,g)
export('campaign-kit')

# Stone Procession Golem: individually sculpted armor shells on a mechanical skeleton.
reset();stone,brass,iron,glass,wood,cloth=palette();root=group('GolemRoot');body=group('Body',(0,2.45,0),root);head=group('Head',(0,3.48,0),body)
pivots=[root,body,head]
def shell(name,p,s,parent):
 o=sphere(name,p,s,stone,parent,segments=16)
 # Broad chisel facets preserve rounded volume without a plastic surface.
 for face in o.data.polygons:face.use_smooth=False
 return o
shell('Ribbed breastplate',(0,2.7,0),(.86,.88,.53),body)
shell('Pelvic casing',(0,1.9,0),(.65,.34,.43),body)
for y in [2.12,2.3,2.48]:ring('Articulated waist band',(0,y,0),.52,.065,iron,body)
for side in [-1,1]:
 curve('Chest brass rib',[(side*.64,3.05,.28),(side*.51,2.85,.49),(side*.13,2.57,.55)],.044,brass,body)
 for y in [2.72,2.9,3.06]:sphere('Breastplate rivet',(side*.58,y,.4),(.045,.045,.045),brass,body)
ring('Heart socket',(0,2.89,.53),.19,.052,brass,body,'z');sphere('Sealed heart',(0,2.89,.56),(.125,.16,.055),glass,body)
shell('Procession mask',(0,3.53,.035),(.43,.5,.39),head)
for side in [-1,1]:
 rod('Mask brow',(side*.045,3.68,.4),(side*.33,3.66,.29),.055,brass,head)
 sphere('Carved eye',(side*.16,3.57,.38),(.095,.027,.024),glass,head)
 rod('Cheek inlay',(side*.31,3.5,.32),(side*.24,3.28,.31),.03,brass,head)
for n in range(5):rod('Face grille',((n-2)*.064,3.38,.405),((n-2)*.057,3.27,.34),.017,iron,head)
ring('Crown rim',(0,3.91,0),.34,.054,brass,head)
for n in range(8):
 a=n*math.tau/8;shell('Crown merlon',(math.sin(a)*.32,4.02,math.cos(a)*.32),(.085,.17,.085),head)
for side,label in [(-1,'L'),(1,'R')]:
 hip=group('Hip_'+label,(side*.43,1.8,0),root);knee=group('Knee_'+label,(side*.48,.95,.035),hip);pivots += [hip,knee]
 sphere('Hip bearing',(side*.43,1.75,0),(.29,.29,.29),iron,hip)
 shell('Fluted thigh',(side*.45,1.43,0),(.32,.45,.32),hip)
 sphere('Knee hinge',(side*.48,.93,.035),(.28,.24,.28),brass,knee)
 shell('Greave',(side*.49,.58,.035),(.30,.4,.32),knee)
 shell('Splayed stone foot',(side*.5,.17,.22),(.38,.17,.57),knee)
 for n in [-1,0,1]:rod('Toe seam',(side*.5+n*.14,.28,.38),(side*.5+n*.14,.16,.73),.015,iron,knee)
 shoulder=group('Shoulder_'+label,(side*.91,3.03,0),body);elbow=group('Elbow_'+label,(side*1.17,2.28,0),shoulder);hand=group('Hand_'+label,(side*1.23,1.62,.08),elbow);pivots += [shoulder,elbow,hand]
 sphere('Shoulder axle',(side*.87,3.02,0),(.32,.32,.32),brass,shoulder)
 shell('Overlapping pauldron',(side*1.03,3.08,0),(.5,.4,.53),shoulder)
 shell('Upper arm sleeve',(side*1.12,2.64,0),(.32,.39,.33),shoulder)
 rod('Exposed arm piston',(side*1.36,2.68,-.15),(side*1.4,2.2,-.13),.075,iron,elbow)
 sphere('Elbow bearing',(side*1.17,2.28,0),(.26,.26,.26),brass,elbow)
 shell('Carved forearm',(side*1.22,1.99,.035),(.39,.42,.39),elbow)
 shell('Stone palm',(side*1.23,1.59,.08),(.31,.24,.27),hand)
 for n in range(4):
  x=side*1.23+(n-1.5)*.14
  shell('Articulated finger',(x,1.4,.21),(.064,.19,.083),hand);sphere('Knuckle joint',(x,1.54,.27),(.07,.07,.07),brass,hand)
 shell('Opposed thumb',(side*1.55,1.52,.1),(.09,.17,.09),hand)
 # Engraved diagonal tooling is visible at the boss camera distance.
 for y in [1.8,1.99,2.17]:rod('Forearm inlay',(side*1.05,y,.39),(side*1.35,y+.1,.32),.023,brass,elbow)
bpy.context.view_layer.update()
heads={p.name:p.matrix_world.translation.copy() for p in pivots}
parents={p.name:p.parent.name if p.parent in pivots else None for p in pivots}
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
owners={o:o.parent.name for o in meshes}
for o in meshes:
 m=o.matrix_world.copy();o.parent=None;o.matrix_world=m
bpy.ops.object.select_all(action='DESELECT')
arm=bpy.data.armatures.new('Procession skeleton');rig=bpy.data.objects.new('ProcessionRig',arm);bpy.context.collection.objects.link(rig);rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode='EDIT')
for p in pivots:
 b=arm.edit_bones.new(p.name);b.head=heads[p.name];b.tail=b.head+Vector((0,0,.2))
 if parents[p.name]:b.parent=arm.edit_bones[parents[p.name]]
bpy.ops.object.mode_set(mode='OBJECT')
for o in meshes:
 vg=o.vertex_groups.new(name=owners[o]);vg.add(list(range(len(o.data.vertices))),1,'REPLACE')
 mod=o.modifiers.new('Rigid stone joint','ARMATURE');mod.object=rig;o.parent=rig
for p in reversed(pivots):bpy.data.objects.remove(p,do_unlink=True)
# Join by arm identity while keeping the breakable throwing limb separate.
for name,subset in [('ThrowingArm',[o for o in meshes if owners[o] in ['Elbow_L','Hand_L']]),('GolemArmor',[o for o in meshes if owners[o] not in ['Elbow_L','Hand_L']])]:
 bpy.ops.object.select_all(action='DESELECT')
 for o in subset:o.select_set(True)
 bpy.context.view_layer.objects.active=subset[0];bpy.ops.object.join();subset[0].name=name
rig.animation_data_create()
for clip,duration in [('idle',2.4),('walk',1.4),('arrive',2.5),('stagger',2.2),('death',2.8),('stomp',2.3),('fist',3.6),('quarry',3.6),('shoulder',3.6)]:
 action=bpy.data.actions.new(clip);rig.animation_data.action=action
 for frame in range(int(duration*30)+1):
  t=frame/30;u=t/duration
  for b in rig.pose.bones:b.rotation_mode='XYZ';b.rotation_euler=(0,0,0);b.location=(0,0,0)
  rig.pose.bones['Body'].rotation_euler.x=.025*math.sin(t*math.tau/2.4)
  if clip=='walk':
   for side,sign in [('L',1),('R',-1)]:
    swing=math.sin(u*math.tau)*sign
    rig.pose.bones['Hip_'+side].rotation_euler.x=swing*.32;rig.pose.bones['Knee_'+side].rotation_euler.x=max(0,-swing)*.3;rig.pose.bones['Shoulder_'+side].rotation_euler.x=-swing*.22
  elif clip in ['fist','quarry','shoulder']:
   release=2 if clip=='fist' else 2.4
   wind=min(1,t/release);hit=max(0,min(1,(t-release)/.18));recover=max(0,min(1,(t-release-.35)/.8))
   armname='Shoulder_L' if clip=='quarry' else 'Shoulder_R'
   rig.pose.bones[armname].rotation_euler.x=(-1.6*wind+2.7*hit)*(1-recover)
   rig.pose.bones['Elbow_L' if clip=='quarry' else 'Elbow_R'].rotation_euler.x=-.6*wind*(1-hit)
   rig.pose.bones['Body'].rotation_euler.x=.18*hit*(1-recover)
  elif clip=='stomp':
   k=min(1,t/.9)*(1-min(1,max(0,(t-1.05)/.1)))
   rig.pose.bones['Hip_R'].rotation_euler.x=-.75*k;rig.pose.bones['Knee_R'].rotation_euler.x=.6*k
  elif clip in ['stagger','arrive','death']:
   bend=(1-u) if clip=='arrive' else min(1,u*4)*(1-u) if clip=='stagger' else min(1,u*1.6)
   rig.pose.bones['Body'].rotation_euler.x=.65*bend
   rig.pose.bones['GolemRoot'].location.z=-.8*bend
   for side in ['L','R']:rig.pose.bones['Knee_'+side].rotation_euler.x=.75*bend
  for b in rig.pose.bones:
   b.keyframe_insert('rotation_euler',frame=frame);b.keyframe_insert('location',frame=frame)
 rig.animation_data.action=None;track=rig.animation_data.nla_tracks.new();track.name=clip;track.strips.new(clip,0,action)
for b in rig.pose.bones:b.rotation_euler=(0,0,0);b.location=(0,0,0)
export('procession-golem',True)
