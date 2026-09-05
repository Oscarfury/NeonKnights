"""Role silhouettes and visibly equipped items built for the shared paladin rig."""
import sys,math
from pathlib import Path
import bpy
sys.path.insert(0,str(Path(__file__).parent))
from forge import *
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
steel=material('Tempered edge',(.40,.50,.55),.8,.3);iron=material('Forged blue steel',(.033,.07,.10),.7,.42)
gold=material('Engraved electrum',(.55,.34,.10),.75,.36);leather=material('Oxblood leather',(.17,.045,.023),0,.85)
ivory=material('Ivory enamel',(.66,.70,.64),.22,.48);cloth=material('Burgundy cloth',(.19,.019,.034),0,.92)
violet=material('Black violet cloth',(.06,.022,.11),0,.9);teal=material('Storm glass',(.025,.34,.42),.3,.3,.7)
wood=material('Heartwood',(.20,.085,.025),0,.85)

def shield(name,w,h):
    g=group(name);pts=[(-w/2,h*.46,0),(w/2,h*.46,0),(w*.46,-h*.16,0),(0,-h*.55,.09),(-w*.46,-h*.16,0),(0,h*.05,.16)]
    faces=[(5,1,0),(5,2,1),(5,3,2),(5,4,3),(5,0,4)]
    sheet('Forged shield',pts,faces,iron,g,.055)
    for i in range(5):
        a,b=pts[i],pts[(i+1)%5];rod('Rolled gilding',(a[0],a[1],a[2]+.035),(b[0],b[1],b[2]+.035),.025,gold,g)
        sphere('Shield rivet',(a[0]*.84,a[1]*.84,a[2]+.07),(.023,.023,.023),steel,g)
    for sign in [-1,1]:
        sheet('Enamel quarter',[(sign*.04,h*.37,.065),(sign*w*.37,h*.36,.04),(sign*w*.32,-h*.11,.10),(sign*.045,-h*.32,.145)],[(3,2,1,0)],ivory,g,.015)
        curve('Leather arm strap',[(sign*w*.26,.07,-.045),(sign*w*.20,.09,-.17),(sign*w*.06,.07,-.05)],.027,leather,g)
    rod('Crest stem',(0,-h*.25,.19),(0,h*.30,.19),.026,gold,g)
    for sign in [-1,1]:rod('Crest branch',(0,h*.2,.19),(sign*w*.2,0,.18),.025,gold,g)
    return g
shield('WardenShield',.66,1.04);shield('BulwarkShield',.94,1.54)
g=group('WardenBlade')
rod('Leather grip',(0,-.15,0),(0,.12,0),.036,leather,g)
for y in range(8):ring('Grip winding',(0,-.13+y*.03,0),.036,.006,gold,g)
sphere('Pommel',(0,-.20,0),(.052,.07,.045),gold,g)
curve('Winged crossguard',[(-.21,.14,.015),(-.10,.10,0),(0,.13,0),(.10,.10,0),(.21,.14,.015)],.026,gold,g)
sheet('Diamond blade',[(-.065,.14,0),(0,.14,.025),(.065,.14,0),(-.047,.85,0),(0,.87,.025),(.047,.85,0),(0,1.08,0)],[(0,3,4,1),(1,4,5,2),(3,6,4),(4,6,5)],steel,g,.025)
rod('Blade fuller',(0,.23,.031),(0,.8,.031),.009,iron,g)
g=group('RaiderAxe');rod('Long haft',(0,-.22,0),(0,.68,0),.038,wood,g)
for y in range(10):ring('Bound grip',(0,-.19+y*.045,0),.04,.008,leather,g)
blade=[(-.03,.43,0),(-.05,.74,0),(.17,.85,0),(.40,.83,0),(.47,.66,0),(.41,.43,0),(.19,.34,0)]
sheet('Crescent axe blade',blade,[tuple(reversed(range(7)))],iron,g,.075)
curve('Axe cutting edge',[(.18,.85,.045),(.40,.81,.045),(.45,.64,.045),(.39,.44,.045),(.19,.35,.045)],.025,steel,g)
for y in [.48,.66]:rod('Haft band',(-.09,y,0),(.12,y,0),.07,gold,g)
g=group('BulwarkMace');rod('Mace shaft',(0,-.16,0),(0,.6,0),.047,wood,g)
for n in range(6):
    a=n*math.tau/6;x,z=math.sin(a),math.cos(a)
    sheet('Flanged head',[(x*.08,.45,z*.08),(x*.23,.54,z*.23),(x*.23,.72,z*.23),(x*.08,.83,z*.08)],[(0,1,2,3)],steel,g,.035)
sphere('Mace crown',(0,.8,0),(.09,.08,.09),gold,g)
g=group('HexStaff');rod('Staff core',(0,-.85,0),(0,.85,0),.043,wood,g)
for y in [-.73,-.30,.2,.62]:ring('Staff collar',(0,y,0),.06,.015,gold,g)
for sign in [-1,1]:curve('Conductor antler',[(0,.61,0),(sign*.19,.8,0),(sign*.25,1.10,0),(sign*.14,1.25,0)],.035,gold,g)
sphere('Hex focus',(0,1.03,0),(.12,.19,.1),teal,g)
ring('Runic circlet',(0,1.02,0),.28,.018,iron,g,'z')

for name,hostile in [('WardenCrest',False),('RaiderCrest',True),('HexCrown',True)]:
    g=group(name)
    ring('Helmet circlet',(0,.026,0),.145,.018,gold if not hostile else iron,g)
    if name=='RaiderCrest':
        for sign in [-1,1]:
            curve('Back swept horn',[(sign*.14,.07,0),(sign*.28,.19,-.09),(sign*.3,.25,-.24)],.033,steel,g)
            sheet('Cheek guard',[(sign*.06,.10,.18),(sign*.17,.03,.15),(sign*.15,-.16,.12),(sign*.06,-.12,.19)],[(0,1,2,3)],iron,g,.025)
    elif name=='HexCrown':
        ring('Occult halo',(0,.12,-.07),.29,.02,gold,g,'z')
        for n in range(7):
            a=-1.2+n*.4;rod('Halo spoke',(math.sin(a)*.27,.12+math.cos(a)*.27,-.07),(math.sin(a)*.38,.12+math.cos(a)*.38,-.07),.018,steel,g)
    else:
        sheet('Forged helmet crest',[(0,.025,.16),(0,.11,.16),(0,.23,.025),(0,.17,-.15),(0,.025,-.20)],[(0,1,2,3,4)],gold,g,.045)
        curve('Crest engraving',[(.025,.065,.12),(.025,.17,.015),(.025,.115,-.13)],.008,steel,g)

for name,mat in [('RaiderMantle',cloth),('HexMantle',violet),('WardenMantle',ivory)]:
    g=group(name);pts=[];faces=[]
    for row in range(15):
        t=row/14
        for col in range(19):
            u=col/18;pts.append(((u-.5)*(.65+t*.28),.08-t*.95,-.18-.12*t+.035*math.cos(u*math.tau*6)*t))
    for row in range(14):
        for col in range(18):
            a=row*19+col;faces.append((a,a+1,a+20,a+19))
    sheet('Pleated cloak',pts,faces,mat,g,.015,True)
    curve('Stitched hem',[pts[14*19+n] for n in range(19)],.012,gold,g)
    for sign in [-1,1]:sphere('Cloak clasp',(sign*.25,.09,-.10),(.042,.034,.025),gold,g)

g=group('MarksmanQuiver');rod('Leather quiver',(0,-.48,0),(0,.3,0),.105,leather,g)
for y in [-.38,.20]:ring('Quiver band',(0,y,0),.109,.019,gold,g)
for n in range(5):
    x=(n%3-1)*.05;z=(n//3-.5)*.08
    rod('Stored arrow',(x,-.2,z),(x,.48+n%2*.035,z),.01,wood,g)
    box('Arrow fletching',(x,.44,z),(.075,.16,.008),ivory,g,.004)
for name,mat in [('WardInsignia',ivory),('StormInsignia',teal)]:
    g=group(name);sphere('Insignia',(0,0,0),(.11,.14,.035),mat,g);ring('Medallion rim',(0,0,0),.12,.012,gold,g,'z')
    rod('Insignia crest',(0,-.06,.04),(0,.08,.04),.012,steel,g)
g=group('BlackStandard');rod('Banner pole',(0,-.75,0),(0,1.2,0),.025,steel,g)
rod('Banner crosspiece',(-.36,1.1,0),(.36,1.1,0),.02,gold,g)
pts=[(-.34,1.09,0),(.34,1.09,0),(.33,.31,-.025),(.18,.38,0),(.05,.18,-.01),(-.10,.35,0),(-.33,.25,-.02)]
sheet('Black company banner',pts,[tuple(reversed(range(7)))],violet,g,.016)
for sign in [-1,1]:rod('Standard wings',(0,.89,.03),(sign*.20,.65,.035),.023,steel,g)
rod('Standard spine',(0,.55,.03),(0,1,.03),.02,gold,g)
g=group('WorldpiercerModule')
for sign in [-1,1]:
    rod('Recoil anchor',(sign*.35,0,0),(sign*.85,-.75,-.5),.08,steel,g)
    box('Anchor foot',(sign*.85,-.76,-.5),(.38,.13,.42),gold,g)
rod('Piercing bolt',(0,.22,-.8),(0,.22,1.3),.04,steel,g)
for sign in [-1,1]:sheet('Piercer fin',[(sign*.02,.22,-.6),(sign*.18,.22,-.82),(sign*.02,.22,-.94)],[(0,1,2)],ivory,g,.015)
g=group('RoyalCrown');ring('Crown circlet',(0,.025,0),.145,.018,gold,g)
for n in range(8):
    a=n*math.tau/8;x,z=math.sin(a)*.145,math.cos(a)*.145;tx,tz=math.cos(a),-math.sin(a)
    h=.19 if n%2==0 else .145
    points=[(x-tx*.041,.026,z-tz*.041),(x-tx*.023,h*.64,z-tz*.023),(x,h,z),(x+tx*.023,h*.64,z+tz*.023),(x+tx*.041,.026,z+tz*.041)]
    sheet('Worked crown leaf',points,[(0,1,2,3,4)],gold,g,.018)
    sphere('Set crown jewel',(x*1.06,.065,z*1.06),(.013,.023,.013),teal,g)
g=group('RoyalMantle');pts=[];faces=[]
for row in range(18):
    t=row/17
    for col in range(21):
        u=col/20;pts.append(((u-.5)*(.74+t*.4),.14-t*1.12,-.22-.13*t+.05*math.cos(u*math.tau*7)*t))
for row in range(17):
    for col in range(20):
        a=row*21+col;faces.append((a,a+1,a+22,a+21))
sheet('Royal pleated mantle',pts,faces,violet,g,.018,True)
curve('Mantle hem',[pts[17*21+n] for n in range(21)],.018,gold,g)
for n in range(15):
    x=-.36+n*.052;sphere('Ermine collar',(x,.13,-.18),(.052,.047,.07),ivory,g)
for side in [-1,1]:curve('Royal embroidery',[(side*.22,.04,-.23),(side*.28,-.35,-.27),(side*.36,-.87,-.33)],.014,gold,g)
batch();bpy.ops.object.select_all(action='SELECT')
out=Path('public/assets/v3/company-kit.glb').resolve();bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False)
work=Path('art/work/company-kit.blend').resolve();bpy.ops.wm.save_as_mainfile(filepath=str(work))
print('EXPORTED',out)
