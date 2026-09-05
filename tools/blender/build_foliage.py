"""Arrange Styloo's CC0 painted plants into small field clusters; preserve the authored UVs."""
import bpy, math, random, sys, json, struct
from pathlib import Path
from mathutils import Vector, Matrix
sys.path.insert(0,str(Path(__file__).parent))
from forge import batch
random.seed(342)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
folder=Path('art/source/vendor/styloo/plants').resolve();source={}
for i in [0,1,5,6,8,9,10,11,12,14,16,18,19,20]:
    before=set(bpy.data.objects);path=folder/('plant.glb' if i==0 else f'plant_{i:03}.glb')
    bpy.ops.import_scene.gltf(filepath=str(path));objects=set(bpy.data.objects)-before
    mesh=next(o for o in objects if o.type=='MESH');verts=[mesh.matrix_world@v.co for v in mesh.data.vertices]
    lo=Vector(tuple(min(v[a] for v in verts) for a in range(3)));hi=Vector(tuple(max(v[a] for v in verts) for a in range(3)));scale=1/max(.01,max(hi-lo))
    data=mesh.data.copy()
    for v,point in zip(data.vertices,verts):v.co=(point-Vector(((lo.x+hi.x)/2,(lo.y+hi.y)/2,lo.z)))*scale
    source[i]=data
    for o in objects:bpy.data.objects.remove(o,do_unlink=True)
material=bpy.data.materials.new('Styloo painted leaves and flowers');material.use_nodes=True
shader=material.node_tree.nodes.get('Principled BSDF');tex=material.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(folder/'texturesplants.png'));tex.image.pack()
material.node_tree.links.new(tex.outputs['Color'],shader.inputs['Base Color']);material.node_tree.links.new(tex.outputs['Alpha'],shader.inputs['Alpha']);shader.inputs['Roughness'].default_value=1
for n in range(150):
    a=random.random()*math.tau;r=random.uniform(12,24.5);x,z=math.sin(a)*r,math.cos(a)*r
    if abs(x)<1.8 and abs(z)>21:continue
    for i in range(3):
        idx=random.choice([5,6,18] if n%7==0 else [8,9,10,11,12,14,16,19,20])
        data=source[idx].copy();data.materials.clear();data.materials.append(material)
        o=bpy.data.objects.new('Painted meadow clump',data);bpy.context.collection.objects.link(o)
        o.location=(x+random.uniform(-.3,.3),-z+random.uniform(-.3,.3),-.02);o.rotation_euler.z=random.uniform(-1.2,1.2)
        h=random.uniform(.22,.60);o.scale=(h,)*3
batch();bpy.ops.object.select_all(action='SELECT')
path=Path('public/assets/v3/highland-foliage.glb').resolve()
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False)
# glTF alpha clipping gives foliage crisp silhouettes and correct depth/shadows.
raw=path.read_bytes();size=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+size]);binary=raw[20+size:]
for m in doc['materials']:m['alphaMode']='MASK';m['alphaCutoff']=.5;m['doubleSided']=True
encoded=json.dumps(doc,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
path.write_bytes(struct.pack('<4sII',b'glTF',2,20+len(encoded)+len(binary))+struct.pack('<I4s',len(encoded),b'JSON')+encoded+binary)
print('EXPORTED painted highland foliage')
