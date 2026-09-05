"""Three complete castle silhouettes, continuous battlements and mounted-defense bastions."""
import sys,math,random
from pathlib import Path
import bpy
import numpy as np
sys.path.insert(0,str(Path(__file__).parent))
from forge import *
random.seed(82)
OUT=Path('public/assets/v3').resolve();WORK=Path('art/work/castle').resolve();WORK.mkdir(parents=True,exist_ok=True)

def weathered(mat,seed,terrain=False):
    # Packed painted surface variation, exported with the mesh UVs. No runtime noise shader.
    size=1024 if terrain else 256;rng=np.random.default_rng(seed)
    yy,xx=np.mgrid[0:size,0:size]/size
    grain=rng.random((size,size))*.14
    cloud=(np.sin(xx*19+np.sin(yy*17)*2)+np.sin(yy*41+xx*7)+np.sin(xx*113+yy*97)*.25)/5
    pigment=np.clip(.83+cloud*.35+grain,.55,1.12)
    base=np.array(mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value[:3])**(1/2.2)
    rgb=base[None,None,:]*pigment[:,:,None]
    pits=rng.random((size,size))>.986;rgb[pits]*=.63
    if terrain:
        patches=np.clip((np.sin(xx*23+yy*4)+np.sin(yy*31-xx*8))*.3,0,1)
        rgb*=1+patches[:,:,None]*np.array([.12,-.025,-.12])[None,None,:]
    image=bpy.data.images.new(mat.name+' weathering',size,size);pixels=np.ones((size,size,4),dtype=np.float32);pixels[:,:,:3]=np.clip(rgb,0,1);image.pixels.foreach_set(pixels.ravel());image.pack()
    node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=image;mat.node_tree.links.new(node.outputs['Color'],mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'])

def make_materials():
    global stone,edge,dark,gold,roof,wood,glass
    stone=[material('Weathered castle stone '+str(n),(.12+n*.018,.17+n*.020,.185+n*.02)) for n in range(4)]
    edge=material('Carved limestone',(.49,.48,.39));dark=material('Masonry recess',(.035,.055,.065))
    gold=material('Royal brass',(.47,.28,.08),.72,.42);roof=material('Blue slate',(.029,.085,.115),.12,.75)
    wood=material('Gate oak',(.13,.053,.023));glass=material('Amber windows',(.8,.37,.055),.1,.42,.5)
    for i,mat in enumerate([*stone,edge,roof,wood]):weathered(mat,41+i)

def window(x,y,z,w,h,parent):
    box('Recessed lancet',(x,y,z),(w,h,.055),dark,parent,.08)
    for offset in [-.22,.22]:box('Window mullion',(x+offset*w,y,z+.045),(.035,h,.035),edge,parent,.01)
    box('Window light',(x,y,z+.035),(w*.66,h*.76,.025),glass,parent,.06)
    rod('Window crossbar',(x-w*.5,y,z+.06),(x+w*.5,y,z+.06),.02,gold,parent)

for tier in ([] if '--ground-only' in sys.argv else [1,2,3]):
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);make_materials()
    height=[2.2,3.2,4.2][tier-1]
    base=group('CastleBase')
    box('Castle plinth',(0,-.22,0),(13.9,.5,13.9),dark,base,.20)
    for x in range(-6,7):
        for z in range(-6,7):box('Courtyard flagstone',(x,-.015,z),(.97,.08,.97),random.choice(stone),base,.018)
    keep=group('RoyalKeep')
    keepH=3.6+tier*.65
    box('Keep foundation',(0,.4,0),(4.6,.8,4.6),dark,keep,.12)
    box('Great hall',(0,keepH*.5,0),(3.8,keepH,3.6),stone[2],keep,.13)
    for y in [1.1,keepH-.25]:box('Keep string course',(0,y,0),(4.05,.16,3.85),edge,keep,.025)
    for sign in [-1,1]:
        window(sign*1.0,keepH*.62,1.83,.47,1.25,keep)
        box('Keep buttress',(sign*1.72,keepH*.45,1.97),(.34,keepH*.9,.45),edge,keep,.055)
    box('Keep doorway',(0,.95,1.85),(.85,1.9,.06),dark,keep,.16)
    for x in [-1,1]:box('Door jamb',(x*.53,1.1,1.9),(.13,2.2,.24),edge,keep,.025)
    # Stepped hip roof and visible slate courses, rather than a flat roof box.
    for n in range(9):
        t=n/9;box('Slate roof course',(0,keepH+.13+n*.14,0),(4.5*(1-t*.84),.18,4.3*(1-t*.84)),roof,keep,.04)
    rod('Royal standard pole',(0,keepH+1.2,0),(0,keepH+2.9,0),.035,gold,keep)
    sheet('Royal standard',[(0,keepH+2.85,0),(1.25,keepH+2.78,0),(.95,keepH+2.1,0),(0,keepH+2.17,0)],[(0,1,2,3)],roof,keep,.025)
    rod('Standard charge',(.2,keepH+2.5,.04),(.88,keepH+2.5,.04),.035,gold,keep)
    if tier>=2:
        for sign in [-1,1]:
            rod('Keep corner turret',(sign*1.68,0,-1.55),(sign*1.68,keepH+.65,-1.55),.65,stone[1],keep,16)
            for n in range(6):
                a=n*math.tau/6;box('Keep merlon',(sign*1.68+math.sin(a)*.53,keepH+.78,-1.55+math.cos(a)*.53),(.29,.4,.29),edge,keep)
    # Four independently named walls permit damage and destruction feedback.
    for side,name in enumerate(['NorthWall','EastWall','SouthWall','WestWall']):
        wall=group(name);yaw=side*math.pi/2
        def P(x,y,z):return (x*math.cos(yaw)+z*math.sin(yaw),y,-x*math.sin(yaw)+z*math.cos(yaw))
        for x in range(-5,6):
            for row in range(round(height/.4)):
                # Door openings at north and south connect the courtyard to the field.
                if side in [0,2] and abs(x)<=1 and row<5:continue
                b=box('Dressed wall block',P(x,.2+row*.4,-5.2),(.98,.39,1.75),random.choice(stone),wall,.024);b.rotation_euler.z=-yaw
        for x in range(-5,6):
            b=box('Battlement paving',P(x,height,-5.05),(.98,.15,2.3),edge,wall,.02);b.rotation_euler.z=-yaw
            if x%2==0:
                b=box('Outer merlon',P(x,height+.52,-6.13),(.68,.92,.34),stone[2],wall,.055);b.rotation_euler.z=-yaw
            else:
                b=box('Crenel sill',P(x,height+.20,-6.13),(1,.27,.34),edge,wall,.025);b.rotation_euler.z=-yaw
        if side in [0,2]:
            door=group('NorthGate' if side==0 else 'SouthGate',parent=wall)
            for x in [-.75,0,.75]:
                b=box('Oak gate leaf',P(x,.82,-5.55),(.71,1.6,.16),wood,door,.025);b.rotation_euler.z=-yaw
            for y in [.4,1.16]:
                b=box('Gate crossband',P(0,y,-5.67),(2.32,.12,.13),gold,door,.014);b.rotation_euler.z=-yaw
        if tier>=2:
            for x in [-4,-2,2,4]:
                b=box('Wall buttress',P(x,height*.45,-6.05),(.52,height*.9,.62),edge,wall,.05);b.rotation_euler.z=-yaw
                if tier==3:
                    b=box('Buttress crown',P(x,height-.23,-6.23),(.82,.40,1.04),gold,wall,.05);b.rotation_euler.z=-yaw
        if tier==3:
            for x in [-3.5,3.5]:
                b=box('Royal hanging banner',P(x,height*.48,-6.5),(1.05,1.6,.035),roof,wall,.01);b.rotation_euler.z=-yaw
                rod('Wall banner charge',P(x,height*.35,-6.54),P(x,height*.67,-6.54),.045,gold,wall)
    for i,(x,z) in enumerate([(-5.8,-5.8),(5.8,-5.8),(-5.8,5.8),(5.8,5.8)]):
        bastion=group('Bastion_'+str(i));r=1.9 if tier==1 else 2.05 if tier==2 else 2.2
        rod('Bastion foundation',(x,.05,z),(x,height-.13,z),r,stone[1],bastion,16)
        for y in [.25,height-.25]:ring('Bastion dressed course',(x,y,z),r,.13,edge,bastion)
        rod('Weapon platform',(x,height-.05,z),(x,height+.08,z),r+.10,edge,bastion,32)
        # Open platforms keep the actual purchased mechanism visible above the wall.
        for n in range(8):
            a=n*math.tau/8
            if math.sin(a)*x+math.cos(a)*z<0:continue
            box('Bastion teeth',(x+math.sin(a)*r,height+.3,z+math.cos(a)*r),(.35,.47,.35),stone[2],bastion)
        if tier>=2:
            for n in range(8):
                a=n*math.tau/8;rod('Bastion buttress',(x+math.sin(a)*(r+.16),.1,z+math.cos(a)*(r+.16)),(x+math.sin(a)*r,height-.45,z+math.cos(a)*r),.13,gold if tier==3 else edge,bastion)
    batch();bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=str(OUT/f'castle-{tier}.glb'),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False)
    bpy.ops.wm.save_as_mainfile(filepath=str(WORK/f'castle-{tier}.blend'))

bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);make_materials()
earth=material('Heather earth',(.08,.105,.083),0,.95);grass=material('Heather',(.16,.22,.13),0,1);rock=material('Outer rock',(.095,.12,.12),0,.93)
weathered(earth,127,True)
rod('Battlefield foundation',(0,-.55,0),(0,-.031,0),25,earth,vertices=96)
for n in range(180):
    a=random.random()*math.tau;r=random.uniform(9.4,24);x,z=math.sin(a)*r,math.cos(a)*r
    if n<65:
        sphere('Field boulder',(x,-.1,z),(random.uniform(.12,.48),random.uniform(.12,.4),random.uniform(.15,.55)),rock,segments=12)
    else:
        for s in [-1,1]:sheet('Heather blades',[(x-.08,-.27,z),(x+s*.05,random.uniform(.05,.25),z+.02),(x+.08,-.27,z)],[(0,1,2)],grass,None,.003)
for n in range(80):
    a=n*math.tau/80;rod('Outer waystone',(math.sin(a)*23,-.29,math.cos(a)*23),(math.sin(a)*23,.12,math.cos(a)*23),.10,edge,vertices=6)
batch();bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT/'castle-ground.glb'),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False)
bpy.ops.wm.save_as_mainfile(filepath=str(WORK/'ground.blend'))
print('EXPORTED castle wall tiers and field')
