"""Shared Blender geometry helpers. Coordinates are game X/right, Y/up, Z/forward."""
import math
import bpy
from mathutils import Vector

def xyz(p): return (p[0],-p[2],p[1])
def material(name,color,metal=0,rough=.65,emission=0):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
    return m
def group(name,p=(0,0,0),parent=None):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=xyz(p)
    bpy.context.view_layer.update()
    if parent:o.parent=parent;o.matrix_parent_inverse=parent.matrix_world.inverted()
    return o
def finish(o,name,mat,parent=None,smooth=False):
    o.name=name;o.data.materials.append(mat)
    if smooth:
        for p in o.data.polygons:p.use_smooth=True
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
    o=bpy.context.object;o.rotation_euler=delta.to_track_quat('Z','Y').to_euler();return finish(o,name,mat,parent,True)
def sphere(name,p,s,mat,parent=None,segments=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=12,location=xyz(p));o=bpy.context.object;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,mat,parent,True)
def ring(name,p,r,minor,mat,parent=None,axis='y'):
    bpy.ops.mesh.primitive_torus_add(major_segments=32,minor_segments=8,location=xyz(p),major_radius=r,minor_radius=minor);o=bpy.context.object
    if axis=='z':o.rotation_euler.x=math.pi/2
    if axis=='x':o.rotation_euler.y=math.pi/2
    return finish(o,name,mat,parent,True)
def curve(name,points,r,mat,parent=None):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=8;c.bevel_depth=r;c.bevel_resolution=2
    s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
    for b,p in zip(s.bezier_points,points):b.co=xyz(p);b.handle_left_type='AUTO';b.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(mat)
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
    o=bpy.context.object
    if parent:bpy.context.view_layer.update();o.parent=parent;o.matrix_parent_inverse=parent.matrix_world.inverted()
    return o
def sheet(name,points,faces,mat,parent=None,thickness=.02,smooth=False):
    mesh=bpy.data.meshes.new(name);mesh.from_pydata([xyz(p) for p in points],[],faces);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);finish(o,name,mat,parent,smooth)
    if thickness:
        bpy.context.view_layer.objects.active=o;m=o.modifiers.new('Material thickness','SOLIDIFY');m.thickness=thickness;bpy.ops.object.modifier_apply(modifier=m.name)
    return o
def batch():
    batches={}
    for o in list(bpy.context.scene.objects):
        if o.type=='MESH' and not o.vertex_groups:batches.setdefault((o.parent,o.data.materials[0]),[]).append(o)
    for (parent,mat),objects in batches.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects[0].name=f'{parent.name if parent else "Terrain"}_{mat.name}'
