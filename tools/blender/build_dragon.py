"""Author the Prism Dragon: continuous lofted hide, plated scales and a deform skeleton.
All action motion is exported as skeletal clips; the game supplies travel and hit timing.
"""
import bpy,math,sys,json
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from forge import *
OUT=Path('public/assets/v3').resolve();WORK=Path('art/work/dragon').resolve();WORK.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
hide=material('Obsidian teal hide',(.038,.15,.16),.24,.55)
plate=material('Iridescent scale plates',(.075,.29,.29),.5,.37)
belly=material('Weathered throat ivory',(.36,.40,.31),.2,.65)
horn=material('Old horn',(.40,.31,.19),.2,.52)
membrane=material('Wine wing membrane',(.16,.055,.11),.1,.7)
crystal=material('Prismatic growth',(.20,.56,.62),.6,.28,.35)
eye=material('Amber iris',(.92,.46,.035),.3,.25,1.4)
black=material('Eye socket and mouth',(.009,.018,.019),0,.65)
bones={}
def bone(name,a,b,parent=None):bones[name]=(a,b,parent)
bone('root',(0,0,0),(0,1,0))
bone('spine',(0,1.9,-1.2),(0,2.2,1),'root')
bone('neck',(0,2.2,1),(0,2.9,2.1),'spine')
bone('head',(0,2.9,2.1),(0,3.1,3.35),'neck')
bone('jaw',(0,2.75,2.5),(0,2.75,3.65),'head')
for i in range(4):bone('tail'+str(i),(0,1.8-i*.3,-1.2-i*1.2),(0,1.5-i*.3,-2.4-i*1.2),'spine' if i==0 else 'tail'+str(i-1))
for s in [-1,1]:
    tag='L' if s<0 else 'R'
    for label,z in [('fore',.8),('hind',-1.0)]:
        bone(label+tag,(s*.65,1.9,z),(s*1.1,.85,z-.25),'spine')
        bone(label+'foot'+tag,(s*1.1,.85,z-.25),(s*1.2,.12,z+.55),label+tag)
    bone('wing'+tag,(s*.6,2.35,.65),(s*2.1,3.45,-.15),'spine')
    bone('wingtip'+tag,(s*2.1,3.45,-.15),(s*4.9,3.2,-1.75),'wing'+tag)

def weighted(o,names):
    # Smooth weights on contiguous hide; sockets and scale plates follow the same nearby bones.
    bpy.context.view_layer.update()
    for name in names:o.vertex_groups.new(name=name)
    for v in o.data.vertices:
        p=o.matrix_world@v.co;ds=[]
        for name in names:
            a,b,_=bones[name];a,b=Vector(xyz(a)),Vector(xyz(b));d=b-a;t=max(0,min(1,(p-a).dot(d)/d.length_squared));ds.append(((p-a-d*t).length,name))
        ds.sort();pair=ds[:2];weights=[1/(d+.08)**4 for d,_ in pair];total=sum(weights)
        for (_,name),w in zip(pair,weights):o.vertex_groups[name].add([v.index],w/total,'REPLACE')
    return o
def loft(name,sections,mat,names,n=24):
    verts=[];faces=[]
    for x,y,z,rx,ry in sections:
        for j in range(n):a=j*math.tau/n;verts.append((x+math.cos(a)*rx,y+math.sin(a)*ry,z))
    for i in range(len(sections)-1):
        for j in range(n):faces.append((i*n+j,i*n+(j+1)%n,(i+1)*n+(j+1)%n,(i+1)*n+j))
    faces.extend([tuple(range(n-1,-1,-1)),tuple((len(sections)-1)*n+j for j in range(n))])
    return weighted(sheet(name,verts,faces,mat,None,0,True),names)
body=[(0,1.9,-1.7,.25,.25),(0,1.9,-1.3,.65,.62),(0,2,-.7,.93,.91),(0,2,.1,1.05,.94),(0,2.1,.8,.86,.85),(0,2.35,1.3,.55,.62),(0,2.7,1.8,.4,.48),(0,2.97,2.35,.43,.46),(0,3.05,2.75,.53,.44),(0,3,3.2,.37,.27),(0,2.94,3.75,.23,.16)]
loft('Continuous torso neck and skull',body,hide,['spine','neck','head'],32)
tail=[(0,1.9,-1.3,.58,.54),(0,1.7,-2,.44,.4),(0,1.5,-2.8,.34,.3),(0,1.25,-3.6,.24,.23),(0,1,-4.5,.16,.16),(0,.7,-5.3,.08,.09),(0,.58,-6,.02,.025)]
loft('Tapered articulated tail',tail,hide,['tail0','tail1','tail2','tail3'],20)
loft('Lower jaw',[(0,2.73,2.6,.4,.15),(0,2.72,3.1,.36,.11),(0,2.72,3.7,.24,.09)],belly,['jaw'],16)
loft('Mouth seam',[(0,2.78,2.8,.40,.027),(0,2.79,3.7,.235,.025)],black,['jaw'],12)
for s in [-1,1]:
    tag='L' if s<0 else 'R'
    for label,z in [('fore',.8),('hind',-1.0)]:
        weighted(sphere('Powerful haunch',(s*.8,1.7,z),(.48,.63,.49),hide),[label+tag,'spine'])
        weighted(rod('Lower limb',(s*.96,1.55,z),(s*1.13,.54,z-.21),.25,hide),[label+tag,label+'foot'+tag])
        weighted(sphere('Planted foot',(s*1.2,.25,z+.25),(.29,.21,.6),plate),[label+'foot'+tag])
        for toe in [-1,0,1]:
            x=s*1.2+toe*.20
            weighted(curve('Curved ivory talon',[(x,.29,z+.43),(x,.22,z+.69),(x,.1,z+.89)],.045,horn),[label+'foot'+tag])
    weighted(sphere('Deep eye socket',(s*.43,3.23,2.87),(.15,.15,.23),black),['head'])
    weighted(sphere('Amber eye',(s*.51,3.24,2.93),(.065,.082,.12),eye),['head'])
    weighted(sphere('Slit pupil',(s*.56,3.24,2.96),(.014,.059,.022),black),['head'])
    for z in [2.50,2.9]:
        weighted(curve('Swept crown horn',[(s*.35,3.36,z),(s*.7,3.7,z-.4),(s*.78,3.88,z-.9)],.09,horn),['head'])
    weighted(curve('Cheek blade',[(s*.47,2.94,2.6),(s*.75,2.85,2.25),(s*.65,2.76,1.98)],.072,horn),['head'])
    for z in [3.05,3.28,3.51]:
        weighted(rod('Ivory fang',(s*(.35-(z-3.05)*.20),2.85,z),(s*(.33-(z-3.05)*.20),2.64,z+.04),.025,horn),['head'])
    # Ribbed bat wing: shaped membrane follows upper and outer wing bones with smooth weights.
    shoulder=(s*.6,2.35,.65);elbow=(s*2.1,3.45,-.15);tip=(s*5.1,3.2,-1.75)
    fingers=[tip,(s*4.45,2.55,-3.05),(s*3.2,2.1,-3.4),(s*1.55,1.9,-2.7),(s*.55,1.9,-1.15)]
    weighted(curve('Wing leading spar',[shoulder,elbow,tip],.11,hide),['wing'+tag,'wingtip'+tag])
    for i,end in enumerate(fingers):
        weighted(curve('Wing finger '+str(i),[elbow,((elbow[0]+end[0])*.5,(elbow[1]+end[1])*.5+.05,(elbow[2]+end[2])*.5),end],.052,plate),['wing'+tag,'wingtip'+tag])
    vertices=[];faces=[]
    for panel in range(len(fingers)-1):
        a,b=fingers[panel],fingers[panel+1];base=len(vertices);steps=10
        for row in range(steps+1):
            u=row/steps
            for col in range(steps+1):
                v=col/steps;edge=[a[k]*(1-v)+b[k]*v for k in range(3)];scoop=.28*math.sin(math.pi*v)
                vertices.append((elbow[0]+(edge[0]-elbow[0])*u,elbow[1]+(edge[1]-elbow[1])*u-.16*math.sin(math.pi*u)*math.sin(math.pi*v),elbow[2]+(edge[2]-elbow[2])*u+scoop*u*u))
        for row in range(steps):
            for col in range(steps):i=base+row*(steps+1)+col;faces.append((i,i+1,i+steps+2,i+steps+1))
    weighted(sheet('Scalloped wing membranes',vertices,faces,membrane,None,.015,True),['wing'+tag,'wingtip'+tag])
    weighted(curve('Wing hook',[elbow,(s*2.35,3.9,-.35),(s*2.4,3.95,-.7)],.065,horn),['wing'+tag])
# Overlapping diamond scales built as one mesh, not a collection of primitive bodies.
verts=[];faces=[]
for row in range(38):
    t=row/37*(len(body)-2)+.2;i=min(len(body)-2,int(t));f=t-i
    x,y,z,rx,ry=[body[i][k]*(1-f)+body[i+1][k]*f for k in range(5)]
    for col in range(18):
        a=(col+(row%2)*.5)*math.tau/18
        if math.sin(a)<-.55:continue
        p=(math.cos(a)*(rx+.025),y+math.sin(a)*(ry+.025),z);base=len(verts);w=.11 if z<1.5 else .075
        verts.extend([(p[0]-w,p[1],p[2]),(p[0],p[1]+.043,p[2]+.13),(p[0]+w,p[1],p[2]),(p[0],p[1]-.01,p[2]-.10)]);faces.extend([(base,base+1,base+2),(base,base+2,base+3)])
weighted(sheet('Overlapping sculpted scales',verts,faces,plate,None,.012),['spine','neck','head'])
for i in range(17):
    z=2.2-i*.42;y=3.35 if z>1.3 else 3.05 if z>-.8 else max(.8,2.65+(z+1)*.35)
    n='head' if z>2 else 'neck' if z>1 else 'spine' if z>-1.4 else 'tail'+str(min(3,int((-z-1.4)/1.2)))
    weighted(sheet('Dorsal crystal',[(0,y,z+.12),(-.13,y,z-.13),(.13,y,z-.13),(0,y+.58,z-.25)],[(0,1,3),(1,2,3),(2,0,3),(0,2,1)],crystal,None,0),[n])
for i in range(12):
    z=-.7+i*.30;y=1.16+max(0,z-.6)*.95
    weighted(sphere('Articulated throat scute',(0,y,z),(.62 if z<1 else .32,.07,.20),belly,segments=16),['spine','neck'])

# Assemble a single multi-material skinned mesh; every visible piece has deform weights.
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join();mesh=bpy.context.object;mesh.name='PrismDragon_Hide_Plates_Wings'
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
data=bpy.data.armatures.new('Prism Dragon deform rig');rig=bpy.data.objects.new('PrismDragon',data);bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig;mesh.select_set(False);rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for name,(a,b,parent) in bones.items():
    eb=data.edit_bones.new(name);eb.head=xyz(a);eb.tail=xyz(b)
    if parent:eb.parent=data.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT');mesh.parent=rig;mod=mesh.modifiers.new('Skeletal deformation','ARMATURE');mod.object=rig
clips={'idle':2.4,'walk':1.2,'arrive':3,'breath':4,'rake':4,'tail':4,'stagger':2.2,'death':3}
rig.animation_data_create();bpy.context.scene.render.fps=30
for name,duration in clips.items():
    action=bpy.data.actions.new(name);rig.animation_data.action=action
    frames=round(duration*30)
    for f in range(frames+1):
        t=f/30;p=t/duration
        for b in rig.pose.bones:b.rotation_mode='XYZ';b.rotation_euler=(0,0,0);b.location=(0,0,0)
        rig.pose.bones['spine'].rotation_euler.x=.018*math.sin(t*math.tau/2.4)
        for s in [-1,1]:
            tag='L' if s<0 else 'R';wing=rig.pose.bones['wing'+tag];outer=rig.pose.bones['wingtip'+tag]
            wing.rotation_euler.y=s*(.14+.04*math.sin(t*2));outer.rotation_euler.y=s*.12
            if name=='arrive':wing.rotation_euler.y=s*(.25+math.sin(t*8)*.5)*(1-p);outer.rotation_euler.y=s*math.sin(t*8-.5)*.3*(1-p)
            if name=='walk':
                for i,label in enumerate(['fore','hind']):rig.pose.bones[label+tag].rotation_euler.x=.20*math.sin(t*math.tau/1.2+s+i*math.pi);rig.pose.bones[label+'foot'+tag].rotation_euler.x=-.22*max(0,math.sin(t*math.tau/1.2+s+i*math.pi))
            if name=='rake' and s>0:rig.pose.bones['foreR'].rotation_euler.x=-.9*math.sin(min(1,t/2)*math.pi);rig.pose.bones['forefootR'].rotation_euler.z=.35*math.sin(min(1,t/2)*math.pi)
        if name=='breath':
            hold=min(1,t/1.4) if t<2.2 else max(0,1-(t-3.1)/.9)
            rig.pose.bones['neck'].rotation_euler.x=-.20*hold;rig.pose.bones['head'].rotation_euler.x=.32*hold;rig.pose.bones['jaw'].rotation_euler.x=.55*hold
        for i in range(4):rig.pose.bones['tail'+str(i)].rotation_euler.z=(.11 if name!='tail' else .52)*math.sin(t*(1.2 if name!='tail' else 2.5)-i*.45)
        if name=='stagger':rig.pose.bones['neck'].rotation_euler.z=.18*math.sin(t*10)*(1-p);rig.pose.bones['spine'].rotation_euler.x=-.15*math.sin(math.pi*p)
        if name=='death':rig.pose.bones['spine'].rotation_euler.z=min(1,p*2)*1.05;rig.pose.bones['root'].location.z=-min(1,p*2)*.9;rig.pose.bones['jaw'].rotation_euler.x=.35
        for b in rig.pose.bones:b.keyframe_insert('rotation_euler',frame=f);b.keyframe_insert('location',frame=f)
    track=rig.animation_data.nla_tracks.new();track.name=name;track.strips.new(name,0,action);track.mute=True
rig.animation_data.action=None
for b in rig.pose.bones:b.rotation_euler=(0,0,0);b.location=(0,0,0)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT/'prism-dragon.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_skins=True,export_cameras=False,export_lights=False)
bpy.ops.wm.save_as_mainfile(filepath=str(WORK/'prism-dragon.blend'))
(WORK/'clips.json').write_text(json.dumps(clips,indent=2))
print('EXPORTED',len(bones),'bones',len(mesh.data.vertices),'vertices',len(clips),'clips')
