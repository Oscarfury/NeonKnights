"""Reproducible Neon Knights asset-pipeline proof for Blender 4.3.

Creates an original modular knight, an animated shoulder pivot, an editable
.blend scene, a selected-character GLB, and a lit orthographic preview.
Run with Blender --background --factory-startup --python-exit-code 1 --python.
This is a design blockout with an object pivot rig, not a production skin rig.
"""
import argparse
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector


def arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="docs/assets/knight-puppet")
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return parser.parse_args(args)


out = Path(arguments().output).resolve()
out.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)


def material(name, color, metallic=0, roughness=0.4, emission=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Emission Color"].default_value = (*color, 1)
    shader.inputs["Emission Strength"].default_value = emission
    return mat


armor = material("Obsidian blue enamel", (0.055, 0.11, 0.19), 0.65, 0.28)
edge = material("Brushed pale steel", (0.38, 0.52, 0.63), 0.8, 0.26)
gold = material("Old electrum", (0.62, 0.36, 0.105), 0.75, 0.3)
dark = material("Visor and joints", (0.009, 0.015, 0.026), 0.25)
cyan = material("Cyan rune inlay", (0.02, 0.8, 0.73), 0.25, 0.25, 2.8)
cloth = material("Royal plum cloak", (0.11, 0.026, 0.16), 0, 0.8)
stone = material("Basalt plinth", (0.022, 0.035, 0.053), 0.25, 0.6)

character = []


def attach(obj, parent):
    if parent:
        world = obj.matrix_world.copy()
        obj.parent = parent
        obj.matrix_world = world
        character.append(obj)
    return obj


def pivot(name, location, parent=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    bpy.context.view_layer.update()
    return attach(obj, parent)


root = pivot("KNIGHT_ROOT", (0, 0, 0))
character.append(root)


def box(name, location, scale, mat, bevel=0.04, parent=root):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        modifier = obj.modifiers.new("Readable bevels", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
        obj.modifiers.new("Weighted corner normals", "WEIGHTED_NORMAL")
    return attach(obj, parent)


def cylinder(name, location, radius, depth, mat, vertices=12, parent=root):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    modifier = obj.modifiers.new("Edge bevel", "BEVEL")
    modifier.width = 0.025
    modifier.segments = 2
    obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    return attach(obj, parent)


for x, label in [(-0.22, "L"), (0.22, "R")]:
    box(f"{label} sabaton", (x, -0.08, 0.18), (0.32, 0.49, 0.24), armor)
    box(f"{label} shin plate", (x, 0, 0.47), (0.25, 0.29, 0.39), armor)
    box(f"{label} knee", (x, -0.08, 0.72), (0.29, 0.3, 0.21), edge)
    box(f"{label} thigh", (x, 0, 0.94), (0.28, 0.28, 0.3), dark)
    box(f"{label} skirt plate", (x, -0.05, 1.13), (0.34, 0.33, 0.29), armor)

box("Waist", (0, 0, 1.21), (0.6, 0.37, 0.14), gold)
box("Breastplate", (0, 0, 1.53), (0.73, 0.42, 0.6), armor, 0.1)
box("Upper chest gorget", (0, -0.015, 1.81), (0.6, 0.44, 0.13), edge)
emblem = box("Luminous chest sigil", (0, -0.233, 1.59), (0.16, 0.025, 0.16), cyan, 0.012)
emblem.rotation_euler[1] = math.pi / 4
box("Helmet", (0, 0, 2.065), (0.57, 0.47, 0.48), armor, 0.085)
box("Visor recess", (0, -0.232, 2.09), (0.46, 0.04, 0.13), dark, 0.025)
box("Visor light", (0, -0.257, 2.103), (0.37, 0.015, 0.022), cyan, 0.007)
box("Nose ridge", (0, -0.266, 2.035), (0.04, 0.03, 0.19), edge, 0.008)
box("Helmet crest", (0, 0.015, 2.321), (0.065, 0.38, 0.085), gold, 0.02)

for x, label in [(-0.48, "L"), (0.48, "R")]:
    box(f"{label} shoulder trim", (x, 0, 1.78), (0.37, 0.45, 0.2), gold)
    box(f"{label} shoulder armor", (x, -0.01, 1.77), (0.32, 0.41, 0.24), armor)

arm = pivot("Sword shoulder puppet", (0.47, 0, 1.63), root)
box("Sword arm", (0.55, 0, 1.43), (0.22, 0.25, 0.35), edge, parent=arm)
box("Sword gauntlet", (0.61, -0.13, 1.22), (0.23, 0.29, 0.25), armor, parent=arm)
cylinder("Sword grip", (0.63, -0.23, 1.36), 0.046, 0.32, dark, parent=arm)
box("Sword crossguard", (0.63, -0.23, 1.52), (0.4, 0.085, 0.065), gold, 0.018, arm)
blade = box("Sword blade", (0.63, -0.23, 1.99), (0.12, 0.045, 0.87), edge, 0.016, arm)
box("Sword rune", (0.63, -0.256, 1.99), (0.025, 0.012, 0.76), cyan, 0.004, arm)
bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.085, radius2=0, depth=0.19, location=(0.63, -0.23, 2.51), rotation=(0, 0, math.pi/4))
tip = bpy.context.object
tip.name = "Sword point"
tip.data.materials.append(edge)
attach(tip, arm)

box("Shield arm", (-0.52, 0, 1.43), (0.22, 0.25, 0.36), edge)
shield = box("Tower shield rim", (-0.64, -0.27, 1.22), (0.64, 0.13, 0.91), gold, 0.13)
box("Tower shield face", (-0.64, -0.351, 1.23), (0.55, 0.065, 0.79), armor, 0.12)
box("Shield luminous spine", (-0.64, -0.391, 1.24), (0.037, 0.015, 0.58), cyan, 0.009)
box("Shield luminous crossbar", (-0.64, -0.391, 1.36), (0.29, 0.015, 0.037), cyan, 0.009)

vertices = [(-0.31,0.2,1.77),(0.31,0.2,1.77),(-0.41,0.42,1.1),(0.41,0.42,1.1),(-0.53,0.65,0.47),(0.53,0.65,0.47),(0,0.55,0.55)]
mesh = bpy.data.meshes.new("Cloak mesh")
mesh.from_pydata(vertices, [], [(0,1,3,2),(2,3,6),(2,6,4),(3,5,6)])
mesh.update()
cape = bpy.data.objects.new("Angular plum cloak", mesh)
bpy.context.collection.objects.link(cape)
cape.data.materials.append(cloth)
solid = cape.modifiers.new("Cloth thickness", "SOLIDIFY")
solid.thickness = 0.025
attach(cape, root)

# A clear anticipation / strike / recovery clip controlled entirely by Python.
for frame, angle in [(1,0),(9,-0.9),(12,0.75),(19,0.15),(24,0)]:
    arm.rotation_euler[0] = angle
    arm.keyframe_insert(data_path="rotation_euler", frame=frame)
arm.animation_data.action.name = "Sword_Strike_Blockout"

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end = 24
scene.render.fps = 24
scene.frame_set(1)

# Export the character independently of the presentation stage.
bpy.ops.object.select_all(action="DESELECT")
for obj in character:
    obj.select_set(True)
bpy.context.view_layer.objects.active = root
bpy.ops.export_scene.gltf(filepath=str(out / "aegis-knight.glb"), export_format="GLB", use_selection=True, export_animations=True, export_frame_range=True)

cylinder("Presentation plinth", (0,0,-0.075), 1.43, 0.22, stone, 64, None)
for i in range(32):
    angle = 2 * math.pi * i / 32
    rune = box(f"Plinth rune {i:02d}", (1.28*math.cos(angle),1.28*math.sin(angle),0.044), (0.07,0.025,0.006), cyan, 0.001, None)
    rune.rotation_euler[2] = angle
box("Stage floor", (0,0,-0.235), (200,200,0.1), stone, 0, None)


def area_light(name, location, energy, color, size):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.color = color
    data.shape = "DISK"
    data.size = size
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector((0,0,1.3)) - obj.location).to_track_quat("-Z", "Y").to_euler()


area_light("Soft warm key", (3,-4,6), 1000, (1,0.85,0.68), 5)
area_light("Cyan edge", (-3,1,3.5), 850, (0.12,0.8,1), 3)
area_light("Plum rim", (2,3,4), 1100, (0.5,0.16,1), 3)
area_light("Front fill", (-1,-4,2), 150, (0.4,0.55,1), 4)

camera_data = bpy.data.cameras.new("Orthographic asset camera")
camera = bpy.data.objects.new("Orthographic asset camera", camera_data)
bpy.context.collection.objects.link(camera)
camera.location = (4,-7,4.3)
camera.rotation_euler = (Vector((0,0,1.13))-camera.location).to_track_quat("-Z", "Y").to_euler()
camera_data.type = "ORTHO"
camera_data.ortho_scale = 4.0
scene.camera = camera
scene.render.engine = "CYCLES"
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.render.resolution_x = 960
scene.render.resolution_y = 960
scene.render.resolution_percentage = 100
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.022,0.032,0.05,1)
scene.world.node_tree.nodes["Background"].inputs[1].default_value = 0.28
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = str(out / "aegis-knight-preview.png")
scene.view_settings.view_transform = "AgX"
bpy.ops.wm.save_as_mainfile(filepath=str(out / "aegis-knight.blend"))
bpy.ops.render.render(write_still=True)
print(f"NEON_PUPPET_OK: {out}")
