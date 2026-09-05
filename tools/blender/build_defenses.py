"""Author six mechanical defense models with preserved operating pivots.

Blender 4.3, factory startup. Game coordinates are X/right, Y/up, Z/forward.
Static details batch by material within each mechanical part, never across pivots.
"""
import math
import random
from pathlib import Path
import bpy
from mathutils import Vector, Matrix

OUT=Path('public/assets/v3').resolve(); WORK=Path('art/work/defenses').resolve()
OUT.mkdir(parents=True,exist_ok=True);WORK.mkdir(parents=True,exist_ok=True)
random.seed(73)
def xyz(p):return (p[0],-p[2],p[1])
def material(name,color,metal=0,rough=.6,emission=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
    return m
def group(name,p=(0,0,0),parent=None):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=xyz(p)
    bpy.context.view_layer.update()
    if parent:o.parent=parent;o.matrix_parent_inverse=parent.matrix_world.inverted()
    return o
def finish(o,name,mat,parent):
    o.name=name;o.data.materials.append(mat)
    if parent:
        bpy.context.view_layer.update();o.parent=parent;o.matrix_parent_inverse=parent.matrix_world.inverted()
    return o
def box(name,p,s,mat,parent=None,bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(p));o=bpy.context.object;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        m=o.modifiers.new('Worked edges','BEVEL');m.width=bevel;m.segments=2;bpy.ops.object.modifier_apply(modifier=m.name)
    return finish(o,name,mat,parent)
def rod(name,a,b,r,mat,parent=None,vertices=12):
    a,b=Vector(xyz(a)),Vector(xyz(b));delta=b-a
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=delta.length,location=(a+b)/2)
    o=bpy.context.object;o.rotation_euler=delta.to_track_quat('Z','Y').to_euler()
    return finish(o,name,mat,parent)
def ring(name,p,r,minor,mat,parent=None,axis='y'):
    bpy.ops.mesh.primitive_torus_add(major_segments=32,minor_segments=8,location=xyz(p),major_radius=r,minor_radius=minor)
    o=bpy.context.object
    if axis=='z':o.rotation_euler.x=math.pi/2
    if axis=='x':o.rotation_euler.y=math.pi/2
    return finish(o,name,mat,parent)
def ball(name,p,s,mat,parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,location=xyz(p));o=bpy.context.object;o.scale=(s[0],s[2],s[1]);return finish(o,name,mat,parent)
def curve(name,points,r,mat,parent=None):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=10;c.bevel_depth=r;c.bevel_resolution=2
    s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
    for b,p in zip(s.bezier_points,points):b.co=xyz(p);b.handle_left_type='AUTO';b.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);finish(o,name,mat,parent)
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');return bpy.context.object
def plate(name,p,w,h,mat,parent=None):
    # A formed shield plate, with a raised central ridge and shaped lower edge.
    x,y,z=p;v=[(-w/2,h/2,0),(w/2,h/2,0),(w/2,-h*.2,0),(0,-h/2,.08),(-w/2,-h*.2,0),(0,h*.15,.12)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata([xyz((x+a,y+b,z+c)) for a,b,c in v],[],[(5,1,0),(5,2,1),(5,3,2),(5,4,3),(5,0,4)])
    mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o)
    finish(o,name,mat,parent);solid=o.modifiers.new('Forged thickness','SOLIDIFY');solid.thickness=.035
    bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=solid.name)
    # Rolled edges, inset enamel and embossed crests remain legible without glow.
    for i in range(5):
        a,b=v[i],v[(i+1)%5]
        rod('Rolled plate border',(x+a[0],y+a[1],z+a[2]+.018),(x+b[0],y+b[1],z+b[2]+.018),.023,brass,parent)
        ball('Plate rivet',(x+a[0]*.84,y+a[1]*.82,z+a[2]+.046),(.023,.023,.023),silver,parent)
    inset=[xyz((x+a*.70,y+b*.69,z+c+.065)) for a,b,c in v]
    detail=bpy.data.meshes.new('Inset enamel');detail.from_pydata(inset,[],[(5,1,0),(5,2,1),(5,3,2),(5,4,3),(5,0,4)])
    detail.update();face=bpy.data.objects.new('Inset enamel',detail);bpy.context.collection.objects.link(face);finish(face,'Inset enamel',iron,parent)
    for side in [-1,1]:
        rod('Embossed chevron',(x,y+h*.19,z+.215),(x+side*w*.17,y-h*.04,z+.215),.019,brass,parent)
        rod('Rear reinforcement',(x-w*.34,y+side*h*.25,z-.055),(x+w*.34,y+side*h*.25,z-.055),.025,brass,parent)
    rod('Company crest spine',(x,y+h*.26,z+.215),(x,y-h*.21,z+.215),.016,silver,parent)
    return o
def gear(p,r,mat,parent):
    ring('Winch rim',p,r,.035,mat,parent,'x')
    x,y,z=p
    for n in range(12):
        a=n*math.tau/12
        rod('Winch spoke',(x,y,z),(x,y+math.cos(a)*r,z+math.sin(a)*r),.014,mat,parent)
        o=box('Cut gear tooth',(x,y+math.cos(a)*r,z+math.sin(a)*r),(.08,.07,.08),mat,parent,.008);o.rotation_euler.x=a
    rod('Crank spindle',(x-.14,y,z),(x+.14,y,z),.05,mat,parent)
    rod('Hand crank',(x+.15,y,z),(x+.15,y+r*.8,z),.032,mat,parent)
    rod('Crank grip',(x+.15,y+r*.8,z),(x+.32,y+r*.8,z),.037,wood,parent)
def bolt(p,length,parent):
    x,y,z=p;rod('Bolt shaft',(x,y,z),(x,y,z+length),.025,wood,parent)
    bpy.ops.mesh.primitive_cone_add(vertices=4,radius1=.082,radius2=0,depth=.23,location=xyz((x,y,z+length)))
    o=bpy.context.object;o.rotation_euler.x=math.pi/2;finish(o,'Forged bolt head',silver,parent)
    for sign in [-1,1]:box('Bolt fletching',(x+sign*.04,y,z+.06),(.065,.025,.2),ivory,parent,.003)
def batch_and_export(family,rank):
    # Joining only siblings retains Turret, Carriage, Winch and shield hinges.
    groups={}
    for o in list(bpy.context.scene.objects):
        if o.type=='MESH':groups.setdefault((o.parent,o.data.materials[0]),[]).append(o)
    for (parent,mat),objects in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects[0].name=f'{parent.name if parent else "Base"} - {mat.name}'
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=str(OUT/f'{family}-{rank}.glb'),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False)
    bpy.ops.wm.save_as_mainfile(filepath=str(WORK/f'{family}-{rank}.blend'))

for family in ['ballista','aegis']:
 for rank in [1,2,3]:
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    for m in list(bpy.data.materials):
        if m.users==0:bpy.data.materials.remove(m)
    wood=material('Oiled walnut',(.20,.072,.028),0,.8)
    grain=material('Cut heartwood',(.39,.20,.072),0,.83)
    iron=material('Blue tempered steel',(.047,.086,.12),.65,.38)
    brass=material('Brushed electrum',(.56,.32,.085),.8,.34)
    silver=material('Edge steel',(.49,.60,.63),.8,.27)
    rope=material('Hemp windings',(.48,.39,.23),0,.95)
    ivory=material('Royal ivory enamel',(.70,.73,.63),.2,.48)
    stone=material('Carved dark stone',(.08,.12,.15),.1,.82)
    crystal=material('Aegis crystal',(.016,.35,.43),.45,.24,1.2)
    scale=1 if rank==1 else 1.12 if rank==2 else 1.28
    if family=='ballista':
        y=.95 if rank==1 else 1.30 if rank==2 else 1.65
        # Carriage becomes an armored slewing platform, then a braced siege base.
        for x in [-.52,.52]:
            box('Carriage timber',(x,.32,0),(.22,.28,1.9*scale),wood)
            for z in [-.65,.65]:
                ring('Iron wheel tyre',(x*1.45,.35,z),.28,.045,iron,axis='x')
                for n in range(8):
                    a=n*math.tau/8;rod('Wheel spoke',(x*1.45,.35,z),(x*1.45,.35+math.sin(a)*.25,z+math.cos(a)*.25),.025,wood)
            for offset in [-.06,.06]:curve('Timber grain',[(x+offset,.468,-.8),(x+offset+.015,.47,-.3),(x+offset-.01,.47,.3),(x+offset,.468,.8)],.005,grain)
        for z in [-.62,.62]:rod('Carriage crossmember',(-.7,.32,z),(.7,.32,z),.095,iron)
        rod('Elevation post',(0,.25,0),(0,y-.12,0),.22 if rank>1 else .15,iron)
        if rank>=2:
            ring('Slewing race',(0,.62,0),.71,.07,brass)
            for n in range(12):
                a=n*math.tau/12;ball('Turntable rivet',(math.sin(a)*.7,.65,math.cos(a)*.7),(.035,.035,.035),silver)
            for sign in [-1,1]:plate('Carriage armor',(sign*.52,.62,.64),.62,.66,ivory)
        if rank==3:
            for x in [-1,1]:
                for z in [-1,1]:
                    rod('Siege outrigger',(x*.42,.72,z*.36),(x*1.02,.19,z*1.12),.09,iron)
                    box('Bracing foot',(x*1.02,.13,z*1.12),(.44,.18,.48),brass)
                    rod('Recoil jack',(x*.87,.2,z*.92),(x*.87,.67,z*.92),.047,silver)
            for x in [-.42,.42]:rod('Elevated A-frame',(x,.45,-.62),(0,y-.06,.1),.075,wood)
        turret=group('Turret');carriage=group('Carriage',parent=turret)
        box('Bolt rail',(0,y,0),(.26,.16,2.15*scale),wood,carriage)
        for x in [-.105,.105]:box('Rail runner',(x,y+.09,.05),(.025,.035,2.12*scale),brass,carriage,.005)
        span=1.05*scale
        bowstring=group('Bowstring',(0,y+.1,.03),carriage)
        for sign in [-1,1]:
            points=[(0,y,.53),(sign*.38,y+.015,.57),(sign*.77*scale,y+.04,.36),(sign*span,y+.11,.03)]
            curve('Laminated bow limb',points,.072 if rank<3 else .1,wood,carriage)
            curve('Limb steel facing',[(x,yy+.04,z+.02) for x,yy,z in points],.026,brass,carriage)
            rod('Tension cable',(sign*span,y+.11,.03),(0,y+.1,-.62),.018,rope,bowstring)
            for z in [-.42,-.25,-.08]:ring('Torsion winding',(sign*.28,y,z),.12,.017,rope,carriage)
        loaded=group('LoadedBolt',parent=carriage)
        bolt((0,y+.13,-.66),1.6*scale,loaded)
        winch=group('Winch',(.47,y-.08,-.67),turret);gear((.47,y-.08,-.67),.23 if rank<3 else .34,brass,winch)
        if rank>=2:
            for x in [-.50,-.38,-.26]:bolt((x,y-.31,-.65),1.3,turret)
            box('Ammunition cradle',(-.39,y-.4,-.1),(.5,.1,1.4),iron,turret)
            rod('Loading lever',(.4,y-.1,.2),(.8,y+.3,.25),.032,brass,turret)
        if rank==3:
            for x in [-.43,.43]:plate('Siege mantlet',(x,y-.03,-.94),.74,1.06,ivory,turret)
            ring('Royal seal',(0,y-.1,-.98),.13,.025,brass,turret,'z')
    else:
        height=1.3 if rank==1 else 1.7 if rank==2 else 2.12
        rod('Hexagonal foundation',(0,.04,0),(0,.2,0),.72 if rank<3 else 1.05,stone,vertices=6)
        ring('Foundation inlay',(0,.21,0),.6 if rank<3 else .91,.025,brass)
        rod('Insulated pedestal',(0,.18,0),(0,height-.25,0),.16,iron)
        for y in [.4,.55,.7]:ring('Ceramic insulator',(0,y,0),.21,.045,ivory)
        for n in range(3 if rank<3 else 6):
            a=n*math.tau/(3 if rank<3 else 6)
            r=.57 if rank<3 else .85
            rod('Grounding strut',(math.sin(a)*r,.23,math.cos(a)*r),(0,height-.25,0),.055,brass)
            ball('Grounding bolt',(math.sin(a)*r,.23,math.cos(a)*r),(.06,.035,.06),silver)
        turret=group('Turret');core=group('Core',(0,height,0),turret)
        radius=.42 if rank==1 else .55 if rank==2 else .72
        ring('Focus housing',(0,height,0),radius,.075,iron,core,'z')
        ring('Electrum lens mount',(0,height,.06),radius*.84,.03,brass,core,'z')
        ball('Lens',(0,height,.065),(radius*.72,radius*.72,.14),crystal,core)
        for n in range(8):
            a=n*math.tau/8;x=math.sin(a)*radius;yy=height+math.cos(a)*radius
            rod('Radial conductor',(x,yy,.04),(x*.72,height+(yy-height)*.72,.19),.035,brass,core)
        if rank>=2:
            for sign in [-1,1]:
                hinge=group('Panel_L' if sign<0 else 'Panel_R',(sign*.47,height,0),turret)
                plate('Hinged protection plate',(sign*(.63 if rank==2 else .86),height-.07,-.03),.50 if rank==2 else .76,1.1 if rank==2 else 1.48,ivory,hinge)
                rod('Panel gilding',(sign*.72,height-.4,.02),(sign*.72,height+.43,.02),.022,brass,hinge)
                for y in [-.27,.27]:ball('Hinge pin',(sign*.47,height+y,0),(.06,.055,.07),brass,hinge)
            box('Charge housing',(0,height-.22,-.45),(.55,.7,.44),iron,turret)
            for x in [-.15,0,.15]:rod('Charge cartridge',(x,height-.43,-.7),(x,height+.05,-.7),.055,crystal,turret)
        if rank==3:
            for sign in [-1,1]:
                curve('Return conductor',[(sign*.3,height-.5,-.2),(sign*1.1,height-.1,-.15),(sign*1.24,height+.36,.1)],.045,brass,turret)
                ball('Return prism',(sign*1.24,height+.36,.1),(.09,.19,.12),crystal,turret)
            plate('Lower protection plate',(0,.79,.38),.95,.75,ivory,turret)
            ring('Lower seal',(0,.84,.46),.14,.024,brass,turret,'z')
    batch_and_export(family,rank)
print('EXPORTED six defense ranks with mechanical pivots')
