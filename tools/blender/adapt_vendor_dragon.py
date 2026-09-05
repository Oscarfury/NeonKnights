"""Retain Styloo's CC0 painted mesh/144-bone rig; author eight game-specific motion clips.
Source: https://styloo.itch.io/company . The original download stays untouched.
Run with --factory-startup --disable-autoexec. No vendor scripts are executed.
"""
import bpy, math
from pathlib import Path
from mathutils import Quaternion, Vector
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(Path('art/source/vendor/styloo/dragonexport.glb').resolve()))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
rig.name='EmberwingRig';rig.animation_data_create()
for a in list(bpy.data.actions):bpy.data.actions.remove(a)
root=bpy.data.objects.new('Emberwing',None);bpy.context.collection.objects.link(root)
for o in list(bpy.context.scene.objects):
    if o!=root and not o.parent:o.parent=root
root.scale=(.65,.65,.65);root.location=(0,-.975,.27)
for mesh in [o for o in bpy.context.scene.objects if o.type=='MESH']:
    for p in mesh.data.polygons:p.use_smooth=True
for mat in bpy.data.materials:
    if mat.use_nodes:
        shader=mat.node_tree.nodes.get('Principled BSDF')
        if shader:shader.inputs['Roughness'].default_value=.78
fps=30;bpy.context.scene.render.fps=fps
axes={'x':Vector((1,0,0)),'y':Vector((0,1,0)),'z':Vector((0,0,1))}
def turn(name,axis,angle):
    b=rig.pose.bones.get(name)
    if b:
        local=b.bone.matrix_local.to_quaternion().inverted()@axes[axis]
        b.rotation_quaternion=b.rotation_quaternion@Quaternion(local,angle)
def ease(x):x=max(0,min(1,x));return x*x*(3-2*x)
for name,duration in [('idle',3.2),('walk',1.3),('arrive',3),('breath',4),('rake',4),('tail',4),('stagger',2.2),('death',3.5)]:
    action=bpy.data.actions.new(name);action.use_fake_user=True;rig.animation_data.action=action
    frames=round(duration*fps)
    for f in range(frames+1):
        t=f/fps;u=f/frames;cycle=math.sin(u*math.tau)
        for b in rig.pose.bones:b.rotation_mode='QUATERNION';b.rotation_quaternion=(1,0,0,0);b.location=(0,0,0);b.scale=(1,1,1)
        turn('DEF-spine.003','x',.016*cycle);turn('DEF-neck.001','x',.025*cycle)
        for i in range(5):turn('DEF-tail'+('' if i==0 else f'.{i:03}'),'z',math.sin(u*math.tau-i*.7)*.045)
        for side,sign in [('L',1),('R',-1)]:
            turn('DEF-Wing.'+side,'y',sign*(.08+.025*cycle))
            turn('DEF-Wing.001.'+side,'z',sign*.09)
            if name=='walk':
                step=math.sin(u*math.tau+(0 if sign==1 else math.pi))
                turn('DEF-thigh.'+side,'x',step*.24);turn('DEF-shin.'+side,'x',max(0,-step)*.22)
                turn('DEF-upper_arm.'+side,'x',-step*.18);turn('DEF-forearm.'+side,'x',max(0,step)*.17)
                turn('DEF-Wing.'+side,'y',sign*math.sin(u*math.tau)*.10)
            if name=='arrive':
                wing=math.sin(t*math.tau*1.25)*(1-ease((u-.7)/.3))
                turn('DEF-Wing.'+side,'y',sign*wing*.48);turn('DEF-Wing.001.'+side,'z',sign*wing*.20)
                turn('DEF-thigh.'+side,'x',-.30*(1-ease(u)));turn('DEF-shin.'+side,'x',.4*(1-ease(u)))
        if name=='breath':
            wind=ease(t/1.5);fire=ease((t-1.5)/.7)*(1-ease((t-3.2)/.8))
            turn('DEF-neck.001','x',-.20*wind*(1-fire)+.14*fire)
            turn('DEF-neck.002','x',-.12*wind*(1-fire)+.20*fire)
            turn('DEF-head','x',.10*fire);turn('DEF-beak_001.B','x',.56*fire+.10*wind)
            for side,sign in [('L',1),('R',-1)]:turn('DEF-Wing.'+side,'y',-sign*.28*wind*(1-ease((t-3.1)/.9)))
        if name=='rake':
            wind=ease(t/1.35);strike=ease((t-1.35)/.25);recover=ease((t-2.2)/1.8)
            turn('DEF-spine.004','z',(.18*wind-.37*strike)*(1-recover))
            turn('DEF-upper_arm.L','x',(-.85*wind+1.2*strike)*(1-recover))
            turn('DEF-upper_arm.L','z',(-.24*wind+.48*strike)*(1-recover))
            turn('DEF-forearm.L','x',-.45*wind*(1-recover))
            turn('DEF-beak_001.B','x',.3*wind*(1-recover))
        if name=='tail':
            swing=(-.35*ease(t/1.4)+.95*ease((t-1.4)/.25))*(1-ease((t-2)/2))
            turn('DEF-spine','z',swing*.24)
            for i in range(5):turn('DEF-tail'+('' if i==0 else f'.{i:03}'),'z',swing*(.72-i*.06))
        if name=='stagger':
            recoil=math.sin(min(1,t/.45)*math.pi/2)*(1-ease((t-.45)/1.75))
            turn('DEF-spine.003','x',-.18*recoil);turn('DEF-neck.001','x',-.28*recoil);turn('DEF-head','z',math.sin(t*14)*.08*recoil)
        if name=='death':
            collapse=ease(t/1.8)
            rig.pose.bones['root'].location.z=-1.1*collapse
            turn('root','y',.65*collapse)
            turn('DEF-neck.001','x',.5*collapse);turn('DEF-head','x',.3*collapse)
            for side,sign in [('L',1),('R',-1)]:
                turn('DEF-thigh.'+side,'x',-.7*collapse);turn('DEF-shin.'+side,'x',1.0*collapse)
                turn('DEF-Wing.'+side,'y',sign*.38*collapse)
        for b in rig.pose.bones:
            b.keyframe_insert('rotation_quaternion',frame=f,group=b.name)
            if b.name=='root':b.keyframe_insert('location',frame=f,group=b.name)
    for curve in action.fcurves:
        for key in curve.keyframe_points:key.interpolation='LINEAR'
rig.animation_data.action=None
for b in rig.pose.bones:b.rotation_quaternion=(1,0,0,0);b.location=(0,0,0)
bpy.context.scene.frame_set(0);bpy.ops.object.select_all(action='SELECT')
out=Path('public/assets/v3/prism-dragon.glb').resolve()
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_frame_range=False,export_cameras=False,export_lights=False)
work=Path('art/work/emberwing');work.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str((work/'emberwing-animated.blend').resolve()))
print('EXPORTED Styloo Emberwing with eight authored skeletal animations')
