"""Refresh portable geometry and Cycles review images from the authored .blend."""
import bpy, sys, json
from pathlib import Path
from mathutils import Vector
BASE=Path(__file__).resolve().parents[1]
s=bpy.context.scene
s.frame_set(1)

if '--export' in sys.argv:
    bpy.ops.object.select_all(action='DESELECT')
    root=bpy.data.objects['TERRA 728 | MASTER']
    root.select_set(True)
    for o in root.children_recursive:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(BASE/'output'/'TERRA_728.glb'),export_format='GLB',
        use_selection=True,export_apply=True,export_animations=True,
        export_animation_mode='SCENE',export_force_sampling=True,
        export_materials='EXPORT',export_cameras=False,export_lights=False)
    p=BASE/'output'/'build-report.json';report=json.loads(p.read_text(encoding='utf8'))
    report['glb_bytes']=(BASE/'output'/'TERRA_728.glb').stat().st_size
    report['glb_modifiers_applied']=True;report['glb_studio_excluded']=True
    p.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')

if '--render' in sys.argv:
    s.render.engine='CYCLES';s.cycles.samples=64;s.cycles.use_denoising=True
    s.render.resolution_x=1600;s.render.resolution_y=1100;s.render.resolution_percentage=100
    shots=[('hero','CAM | 01 Hero',1),('rear','CAM | 02 Rear linkage',280),('service','CAM | 03 Service bay',200)]
    for name,cam,frame in shots:
        s.camera=bpy.data.objects[cam];s.frame_set(frame)
        s.render.filepath=str(BASE/'renders'/f'{name}.png')
        bpy.ops.render.render(write_still=True)
        print('RENDER_DONE',name,flush=True)
    # A cutaway product illustration exposes the modeled controls and seat.
    for o in bpy.data.objects:
        n=o.name.lower()
        if n.startswith(('roof ','front roof','rear roof','precision gnss','gnss ','radio antenna','beacon','amber warning','hvac inlet')):
            o.hide_render=True
    cam=bpy.data.objects['CAM | 04 Operator station'];cam.location=(2.6,-3.25,4.15)
    cam.rotation_euler=(Vector((.60,.10,2.09))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=55
    s.camera=cam;s.frame_set(220);s.render.filepath=str(BASE/'renders'/'interior-cutaway.png')
    bpy.ops.render.render(write_still=True);print('RENDER_DONE interior-cutaway',flush=True)
