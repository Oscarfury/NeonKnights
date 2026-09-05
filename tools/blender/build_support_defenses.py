"""Authored rank silhouettes for the Storm Spire and Dawn Sanctuary."""
import bpy, math, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from forge import *
out=Path('public/assets/v3').resolve()
work=Path('art/work/support-defenses').resolve();work.mkdir(parents=True,exist_ok=True)
for kind in ['spire','sanctuary']:
    for rank in [1,2,3]:
        bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
        stone=material('Carved blue limestone',(.21,.28,.31),.05,.78)
        light=material('Ivory carving',(.60,.57,.44),.04,.7)
        slate=material('Royal blue enamel',(.027,.075,.11),.28,.42)
        gold=material('Aged brass',(.53,.32,.09),.74,.37)
        glow=material('Storm crystal' if kind=='spire' else 'Dawn light',(.09,.53,.68) if kind=='spire' else (.44,.80,.46),.16,.28,1.8)
        base=group('Foundation');turret=group('Turret');core=group('Core',parent=turret)
        h=1.05+(rank-1)*.5
        for n in range(3):rod('Octagonal plinth',(0,n*.12,0),(0,n*.12+.11,0),1.12-n*.10,stone,base,8)
        if kind=='spire':
            rod('Engraved obelisk',(0,.34,0),(0,h,0),.34,slate,base,6)
            for n in range(6):
                a=n*math.tau/6
                rod('Gilded fluting',(math.sin(a)*.35,.36,math.cos(a)*.35),(math.sin(a)*.35,h,math.cos(a)*.35),.027,gold,base,6)
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=xyz((0,h+.34,0)))
            o=bpy.context.object;o.scale=(.29,.29,.59);finish(o,'Faceted storm heart',glow,core)
            for i in range(rank+1):
                a=i*math.tau/(rank+1);x,z=math.sin(a)*.75,math.cos(a)*.75
                rod('Conductor column',(x,.35,z),(x,h+.22,z),.075,gold,turret,8)
                curve('Inward conductor',[(x,h+.2,z),(x*.9,h+.6,z*.9),(x*.4,h+.72,z*.4)],.055,gold,turret)
            for n in range(rank):ring('Storm orbit',(0,h+n*.23,0),.54+n*.13,.028,gold,core)
        else:
            rod('Healing font',(0,.34,0),(0,.83,0),.42,light,base,12)
            ring('Font rim',(0,.84,0),.47,.075,gold,base)
            sphere('Living flame',(0,1.1,0),(.19,.38,.19),glow,core,16)
            for side in [-1,1]:
                x=side*.69;rod('Chapel column',(x,.3,0),(x,h+.65,0),.13,light,base,12)
                ring('Column capital',(x,h+.6,0),.19,.055,gold,base)
            curve('Pointed chapel arch',[(-.69,h+.6,0),(-.45,h+1.0,0),(0,h+1.35,0),(.45,h+1.0,0),(.69,h+.6,0)],.14,light,base)
            rod('Sun cross',(0,h+1.15,0),(0,h+1.7,0),.043,gold,base)
            rod('Sun arms',(-.17,h+1.49,0),(.17,h+1.49,0),.043,gold,base)
            if rank>=2:
                for side in [-1,1]:
                    box('Side chapel',(side*.86,.7,-.45),(.43,.7,.6),stone,base,.06)
                    sheet('Chapel roof',[(side*.86-.3,1.08,-.82),(side*.86+.3,1.08,-.82),(side*.86,1.43,-.52),(side*.86-.3,1.08,-.23),(side*.86+.3,1.08,-.23)],[(0,1,2),(0,2,3),(1,4,2),(3,2,4)],slate,base)
            if rank==3:
                ring('Radiant rose window',(0,h+.67,.03),.35,.06,gold,base,axis='z')
                for n in range(8):
                    a=n*math.tau/8;rod('Rose tracery',(0,h+.67,.03),(math.sin(a)*.32,h+.67+math.cos(a)*.32,.03),.02,gold,base)
        batch();bpy.ops.object.select_all(action='SELECT')
        bpy.ops.export_scene.gltf(filepath=str(out/f'{kind}-{rank}.glb'),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False)
        bpy.ops.wm.save_as_mainfile(filepath=str(work/f'{kind}-{rank}.blend'))
print('EXPORTED six support defense ranks')
