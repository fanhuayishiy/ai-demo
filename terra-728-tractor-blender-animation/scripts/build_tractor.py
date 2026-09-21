"""Reproducible Blender 5.2 scene builder. blender -b --python scripts/build_tractor.py"""
import bpy, sys, os, math, json, time
from pathlib import Path
from mathutils import Vector

BASE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(BASE/'scripts'))
import common as C

def setup():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene=bpy.context.scene
    scene.unit_settings.system='METRIC';scene.unit_settings.length_unit='METERS'
    scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
    scene.cycles.max_bounces=8;scene.cycles.transparent_max_bounces=8
    scene.render.resolution_x=1600;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.fps=24
    scene.frame_start=1;scene.frame_end=360
    scene.render.film_transparent=False
    scene.world=bpy.data.worlds.new('Studio | neutral ambient');scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.30,.36,.42,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.30
    scene.view_settings.view_transform='AgX'
    mats=[
        ('paint',(.15,.29,.095),.46,.25),('graphite',(.039,.052,.060),.38,.34),
        ('black',(.010,.014,.017),.05,.45),('softblack',(.025,.032,.038),0,.7),
        ('rubber',(.024,.028,.031),0,.8),('tread',(.034,.037,.038),0,.83),
        ('steel',(.29,.34,.37),.80,.30),('chrome',(.62,.69,.72),.95,.19),
        ('rim',(.62,.055,.022),.48,.26),('label',(.78,.84,.80),.25,.3),
        ('cast',(.075,.085,.09),.65,.53),('fabric',(.10,.14,.16),0,.85),
        ('amber',(.98,.28,.028),.05,.24),('red',(.5,.009,.017),.20,.23),
        ('screen',(.07,.40,.64),.15,.27),('light',(.70,.87,1.0),.05,.2)]
    for name,col,metal,rough in mats:C.material(name,col,metal,rough,emission=3 if name=='light' else .15 if name in ['screen','amber','red'] else 0)
    C.material('glass',(.73,.85,.86),0,.07,transmission=1)
    C.M['glass'].node_tree.nodes.get('Principled BSDF').inputs['IOR'].default_value=1.45
    bs=C.M['paint'].node_tree.nodes.get('Principled BSDF');bs.inputs['Coat Weight'].default_value=.38;bs.inputs['Coat Roughness'].default_value=.19
    for name in ['rubber','tread','cast','fabric']:
        mat=C.M[name];nodes=mat.node_tree.nodes;links=mat.node_tree.links
        noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=115 if name!='fabric' else 210;noise.inputs['Detail'].default_value=2
        bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.19;bump.inputs['Distance'].default_value=.014 if name!='fabric' else .006
        links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],nodes.get('Principled BSDF').inputs['Normal'])
    C.collection('00 | Rig & scene controls')
    C.ROOT=C.empty('TERRA 728 | MASTER')
    C.ROOT['design_reference']='Fendt 700 Vario Gen7.1; original concept, not a manufacturer CAD replica'
    C.ROOT['units']='metres';C.ROOT['animation_notes']='1–120 driveline & steer;125–250 bonnet;165–295 door;245–345 hydraulic;285–340 wiper'
    return scene

def camera(name,location,target,lens):
    data=bpy.data.cameras.new(name);obj=bpy.data.objects.new(name,data)
    bpy.context.scene.collection.objects.link(obj);obj.location=location;obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler();data.lens=lens;data.clip_start=.03;data.clip_end=200
    return obj

def studio(scene):
    C.ROOT=None;C.collection('90 | Photography studio')
    C.material('stage',(.135,.18,.205),.18,.46)
    C.cube('Studio | seamless floor',(0,0,-.10),(200,200,.15),'stage',0)
    def area(name,loc,power,size,color,target=(0,0,1.3),size_y=None):
        d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color
        if size_y:d.shape='RECTANGLE';d.size_y=size_y
        o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    area('Softbox | warm key',(-3.5,-4.5,7),1900,5,(1,.91,.79),size_y=3)
    area('Softbox | cool rim',(3.0,3.0,6.2),2350,4,(.73,.86,1),size_y=2)
    area('Softbox | front detail',(-6,2,3.2),1100,3,(.84,.93,1),size_y=4)
    area('Softbox | cabin fill',(1,-4.0,4.5),650,2.5,(1,1,1))
    cams={
        'hero':camera('CAM | 01 Hero',(-7.4,-9.2,5.1),(-.15,0,1.50),51),
        'rear':camera('CAM | 02 Rear linkage',(7.1,-7.5,4.05),(.1,0,1.42),53),
        'service':camera('CAM | 03 Service bay',(-5.4,-6.8,3.6),(-.85,0,1.65),56),
        'interior':camera('CAM | 04 Operator station',(1.53,-2.60,2.78),(.45,.13,2.05),33),
        'side':camera('CAM | 05 Side elevation',(-.1,-10.5,3.0),(-.1,0,1.55),52),
    }
    scene.camera=cams['hero']
    for f,name in [(1,'DRIVELINE / 4WD'),(80,'ACKERMANN STEERING'),(125,'ENGINE SERVICE'),(165,'CAB ACCESS'),(245,'THREE-POINT LIFT'),(285,'OPERATOR CONTROLS')]:scene.timeline_markers.new(name,frame=f)
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type=='VIEW_3D':
                area.spaces.active.region_3d.view_perspective='CAMERA'
                area.spaces.active.clip_end=1000
                area.spaces.active.shading.type='MATERIAL'
    return cams

def main():
    start=time.time();scene=setup()
    import wheels,cabin,body
    wheelrig=wheels.build();cabrig=cabin.build();bodyrig=body.build()
    for sign,steer in zip([-1,1],wheelrig['steering']):
        for n in ['Front mudguard %s'%sign,'Mudguard | support %s'%sign]:
            if bpy.data.objects.get(n):C.parent_keep(bpy.data.objects[n],steer)
    cams=studio(scene);scene.frame_set(1)
    # Store usage in the project itself so the .blend remains self-contained.
    notes=bpy.data.texts.new('START HERE | TERRA 728')
    notes.write('TERRA 728 — modern 4WD tractor study\nUnits: metres. Timeline: 1–360 at 24 fps.\nSpace: play the mechanical demonstration. Numpad 0: camera. Home: frame all.\nAll model parts are separated into named subsystem collections.\nCameras: Hero / Rear linkage / Service bay / Operator station / Side elevation.\nAnimation chapters: 1 drivetrain, 80 steering, 125 engine hood, 165 left door, 245 rear lift, 285 wiper & operator.\nFendt 700 architecture reference; original design, not engineering CAD.\nSee README.md and references/tractor-research.md for sources and operating instructions.\n')
    out=BASE/'output';out.mkdir(exist_ok=True);(BASE/'renders').mkdir(exist_ok=True)
    scene.render.filepath=str(BASE/'renders'/'hero.png')
    bpy.ops.wm.save_as_mainfile(filepath=str(out/'TERRA_728.blend'))
    # A portable GLB keeps the same named parts and scene-baked animation for
    # browser review.  The .blend remains the authoring master.
    glb_path=str(out/'TERRA_728.glb')
    bpy.ops.object.select_all(action='DESELECT')
    root=bpy.data.objects['TERRA 728 | MASTER'];root.select_set(True)
    for obj in root.children_recursive:obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=glb_path, export_format='GLB', export_yup=True,
        export_materials='EXPORT', export_cameras=False, export_lights=False,
        export_animations=True, export_animation_mode='SCENE',
        export_force_sampling=True, export_sampling_interpolation_fallback='LINEAR',
        export_apply=True, use_selection=True)
    report={'blender':bpy.app.version_string,'objects':len(bpy.data.objects),'meshes':len(bpy.data.meshes),'vertices':sum(len(o.data.vertices) for o in bpy.data.objects if o.type=='MESH'),'animated_objects':[o.name for o in bpy.data.objects if o.animation_data], 'materials':len(bpy.data.materials),'frames':[1,360],'fps':24,'build_seconds':round(time.time()-start,2)}
    (out/'build-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
    report['glb_bytes']=Path(glb_path).stat().st_size if Path(glb_path).exists() else 0
    (out/'build-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
    print('BUILD_REPORT',json.dumps(report,ensure_ascii=True))
    if '--render' in sys.argv:
        scene.render.resolution_percentage=60;scene.cycles.samples=24
        bpy.ops.render.render(write_still=True)

if __name__=='__main__':main()
