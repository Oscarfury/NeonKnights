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
    grain=rng.random((size,size))*.065
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
    rod('Circular foundation',(0,-.45,0),(0,-.04,0),6.8,dark,base,96)
    for x in range(-6,7):
        for z in range(-6,7):
            if math.hypot(x,z)<6.2:box('Courtyard flagstone',(x,-.015,z),(.97,.08,.97),random.choice(stone),base,.018)
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
    # Quarter sectors share a continuous 5.3 m patrol radius; cardinal platforms sit outside it.
    for side,name in enumerate(['NorthWall','EastWall','SouthWall','WestWall']):
        wall=group(name);middle=math.pi-side*math.pi/2
        for segment in range(16):
            a=middle-math.pi/4+(segment+.5)*math.pi/32
            def P(r,y):return (math.sin(a)*r,y,math.cos(a)*r)
            gate=side in [0,2] and abs(segment-7.5)<1.6
            for row in range(round(height/.4)):
                if gate and row<5:continue
                o=box('Radial dressed masonry',P(5.8,.2+row*.4),(.59,.39,1.5),random.choice(stone),wall,.02);o.rotation_euler.z=a
            o=box('Continuous wall walk',P(5.45,height),(.58,.15,2.30),edge,wall,.02);o.rotation_euler.z=a
            o=box('Crenel sill',P(6.55,height+.12),(.66,.23,.22),edge,wall,.02);o.rotation_euler.z=a
            if segment%2==0:
                o=box('Carved merlon',P(6.55,height+.52),(.39,.85,.34),stone[2],wall,.045);o.rotation_euler.z=a
            if tier>=2 and segment%4==1:
                o=box('Radial buttress',P(6.6,height*.43),(.38,height*.86,.68),edge,wall,.04);o.rotation_euler.z=a
                if tier==3:
                    o=box('Brass buttress crown',P(6.65,height-.3),(.53,.3,.8),gold,wall,.03);o.rotation_euler.z=a
                    o=box('Royal banner',P(6.99,height*.52),(.64,1.25,.025),roof,wall,.01);o.rotation_euler.z=a
        if side in [0,2]:
            sign=-1 if side==0 else 1;door=group('NorthGate' if side==0 else 'SouthGate',parent=wall)
            for x in [-.55,0,.55]:box('Oak gate',(x,.82,sign*6.05),(.52,1.6,.16),wood,door,.025)
            for y in [.35,1.2]:box('Gate ironwork',(0,y,sign*6.17),(1.7,.12,.08),gold,door,.01)
    for i,(x,z) in enumerate([(0,-7.6),(7.6,0),(0,7.6),(-7.6,0)]):
        bastion=group('Bastion_'+str(i));r=1.65+(tier-1)*.12
        if x==0:
            # An open gate arch keeps the company's route underneath the mounted building clear.
            for dx in [-1.35,1.35]:rod('Gatehouse pier',(x+dx,.05,z),(x+dx,height-.12,z),.4,stone[1],bastion,12)
        else:rod('Round bastion',(x,.05,z),(x,height-.12,z),r,stone[1],bastion,32)
        rod('Weapon platform',(x,height-.1,z),(x,height+.08,z),r+.1,edge,bastion,48)
        ring('Platform brass inlay',(x,height+.085,z),1.44,.035,gold,bastion)
        if tier>=2:
            ring('Fortified crown',(x,height-.3,z),r,.10,gold if tier==3 else edge,bastion)
        for n in range(12):
            a=n*math.tau/12
            if math.sin(a)*x+math.cos(a)*z<0:continue
            box('Bastion crenellation',(x+math.sin(a)*r,height+.29,z+math.cos(a)*r),(.25,.43,.25),stone[2],bastion)
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
# A misty highland valley surrounds the readable combat circle.
weathered(rock,93)
water=material('River blue',(.045,.17,.20),.3,.24)
pine=material('Pine canopy',(.025,.11,.085),0,.92)
bark=material('Pine bark',(.09,.055,.035),0,.95)
rod('Valley floor',(0,-1.7,0),(0,-1.2,0),41,earth,vertices=96)
rod('River basin',(0,-1.05,0),(0,-.94,0),35,water,vertices=96)
for n in range(40):
    a=n*math.tau/40;r=random.uniform(27,32);x,z=math.sin(a)*r,math.cos(a)*r
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=xyz((x,-1.0,z)))
    o=bpy.context.object
    for v in o.data.vertices:v.co*=random.uniform(.75,1.15)
    o.scale=(random.uniform(2,3),random.uniform(2,3),random.uniform(.6,1.3));finish(o,'Broken riverbank',rock)

for n in range(68):
    a=random.random()*math.tau;r=random.uniform(36,39);x,z=math.sin(a)*r,math.cos(a)*r
    if n<18:
        # Irregular broken ridgelines, rather than isolated spherical hills.
        r=random.uniform(36,43);x,z=math.sin(a)*r,math.cos(a)*r
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1,location=xyz((x,-4,z)))
        o=bpy.context.object
        for v in o.data.vertices:v.co*=random.uniform(.8,1.16)
        o.scale=(random.uniform(6,9),random.uniform(6,9),random.uniform(4,8));finish(o,'Highland ridge',rock)

    else:
        h=random.uniform(2,4.7)
        rod('Pine trunk',(x,-1.2,z),(x,h*.65,z),.13,bark,vertices=7)
        for layer in range(3):
            bpy.ops.mesh.primitive_cone_add(vertices=9,radius1=h*(.31-layer*.055),radius2=.08,depth=h*.6,location=xyz((x,h*(.32+layer*.19)-.8,z)))
            finish(bpy.context.object,'Highland pine',pine)
for sign in [-1,1]:
    for n in range(15):box('Old causeway',(0,-.1,sign*(24+n*.72)),(2.8,.28,.70),edge,bevel=.025)
    for n in range(6):
        z=sign*(25+n*1.8)
        for x in [-1.45,1.45]:box('Bridge coping',(x,.22,z),(.22,.4,1.65),stone[2],bevel=.03)
for x,z in [(-19,-22),(22,17),(-25,8)]:
    for n in range(5):
        rod('Ruined watch column',(x+n*.62,-.8,z),(x+n*.62,1.1+(n%3)*.43,z),.27,stone[n%4],vertices=8)
batch();bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT/'castle-ground.glb'),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False)
bpy.ops.wm.save_as_mainfile(filepath=str(WORK/'ground.blend'))
print('EXPORTED castle wall tiers and field')
