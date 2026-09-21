"""Shared Blender geometry helpers. Model axes: front -X, left -Y, up +Z; metres."""
import bpy, math
from mathutils import Vector
from math import pi, sin, cos

M = {}
COL = None
ROOT = None

def collection(name):
    global COL
    COL = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if COL.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(COL)
    return COL

def finish(obj, name, mat=None, parent=None):
    obj.name = name
    if COL:
        for c in list(obj.users_collection): c.objects.unlink(obj)
        COL.objects.link(obj)
    if mat: obj.data.materials.append(M[mat] if isinstance(mat,str) else mat)
    if parent is None: parent=ROOT
    if parent: parent_keep(obj,parent)
    return obj

def parent_keep(obj, parent):
    bpy.context.view_layer.update()
    world=obj.matrix_world.copy()
    obj.parent=parent
    obj.matrix_world=world
    return obj

def material(name, color, metal=0, rough=.4, transmission=0, emission=0):
    mat=bpy.data.materials.new(name)
    mat.diffuse_color=(*color[:3],1)
    mat.use_nodes=True
    bs=mat.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(*color[:3],1)
    bs.inputs['Metallic'].default_value=metal
    bs.inputs['Roughness'].default_value=rough
    bs.inputs['Transmission Weight'].default_value=transmission
    if emission:
        bs.inputs['Emission Color'].default_value=(*color[:3],1)
        bs.inputs['Emission Strength'].default_value=emission
    M[name]=mat
    return mat

def bevel(obj, amount=.025, segments=3):
    if amount:
        mod=obj.modifiers.new('Manufactured edge radii','BEVEL'); mod.width=amount; mod.segments=segments
    return obj

def smooth(obj):
    if hasattr(obj.data,'polygons'):
        for p in obj.data.polygons:p.use_smooth=True
    return obj

def cube(name, loc, size, mat, bevel_width=.025, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    obj=bpy.context.object; obj.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    bevel(obj,bevel_width)
    return finish(obj,name,mat,parent)

def cyl(name, loc, radius, depth, mat, axis='Z', vertices=48, parent=None, bevel_width=.008):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc)
    obj=bpy.context.object
    if axis=='X':obj.rotation_euler[1]=pi/2
    if axis=='Y':obj.rotation_euler[0]=pi/2
    bevel(obj,bevel_width,2); smooth(obj)
    return finish(obj,name,mat,parent)

def sphere(name, loc, scale, mat, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,radius=1,location=loc)
    obj=bpy.context.object; obj.scale=scale
    smooth(obj)
    return finish(obj,name,mat,parent)

def mesh(name, vertices, faces, mat, parent=None, bevel_width=0, smooth_shading=False):
    data=bpy.data.meshes.new(name); data.from_pydata(vertices,[],faces); data.update()
    obj=bpy.data.objects.new(name,data)
    bpy.context.scene.collection.objects.link(obj)
    if bevel_width:bevel(obj,bevel_width)
    if smooth_shading:smooth(obj)
    return finish(obj,name,mat,parent)

def beam(name, a, b, radius, mat, parent=None, vertices=20):
    a,b=Vector(a),Vector(b); delta=b-a
    obj=cyl(name,(a+b)/2,radius,delta.length,mat,vertices=vertices,parent=parent,bevel_width=radius*.2)
    obj.rotation_euler=delta.to_track_quat('Z','Y').to_euler()
    return obj

def tube(name, points, radius, mat, parent=None, cyclic=False):
    data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.resolution_u=12
    data.bevel_depth=radius;data.bevel_resolution=3
    sp=data.splines.new('BEZIER');sp.bezier_points.add(len(points)-1)
    for p,v in zip(sp.bezier_points,points):p.co=v;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    sp.use_cyclic_u=cyclic
    obj=bpy.data.objects.new(name,data);bpy.context.scene.collection.objects.link(obj)
    return finish(obj,name,mat,parent)

def torus(name, loc, major, minor, mat, axis='Z', parent=None, major_segments=80):
    bpy.ops.mesh.primitive_torus_add(major_segments=major_segments,minor_segments=12,location=loc,major_radius=major,minor_radius=minor)
    obj=bpy.context.object
    if axis=='X':obj.rotation_euler[1]=pi/2
    if axis=='Y':obj.rotation_euler[0]=pi/2
    smooth(obj)
    return finish(obj,name,mat,parent)

def empty(name, loc=(0,0,0),parent=None):
    obj=bpy.data.objects.new(name,None);bpy.context.scene.collection.objects.link(obj)
    obj.location=loc;obj.empty_display_type='PLAIN_AXES';obj.empty_display_size=.18
    return finish(obj,name,None,parent)

def text_obj(name, body, loc, size, mat, rotation=(0,0,0), parent=None, align='LEFT', extrude=.0005):
    data=bpy.data.curves.new(name,'FONT');data.body=body;data.size=size;data.extrude=extrude;data.align_x=align
    obj=bpy.data.objects.new(name,data);bpy.context.scene.collection.objects.link(obj)
    obj.location=loc;obj.rotation_euler=rotation
    return finish(obj,name,mat,parent)

def key_rot(obj,axis,keys):
    obj.rotation_mode='XYZ'
    for frame,angle in keys:
        obj.rotation_euler[axis]=angle;obj.keyframe_insert(data_path='rotation_euler',index=axis,frame=frame)

def key_loc(obj,axis,keys):
    for frame,value in keys:
        obj.location[axis]=value;obj.keyframe_insert(data_path='location',index=axis,frame=frame)

def linear_animation(obj):
    if not obj.animation_data or not obj.animation_data.action:return
    action=obj.animation_data.action
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    for k in fc.keyframe_points:k.interpolation='LINEAR'
