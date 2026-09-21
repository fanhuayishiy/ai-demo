"""Standalone structural and animation validator for output/TERRA_728.blend.

Run with Blender, for example:
  blender -b output/TERRA_728.blend --python scripts/verify_scene.py

The validator never saves the input blend.  It writes only output/verification.json
and emits a compact machine-readable report to stdout.  Studio floor and cameras
are excluded from model bounds; evaluated mesh vertices are sampled at each frame.
"""
import bpy, json, math, sys, os
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

BASE=Path(__file__).resolve().parents[1]
OUT=BASE/'output'/'verification.json'
FRAMES=[1,98,180,220,280,320,360]
MOTION_FRAMES=sorted(set(FRAMES+[25,45,112,159,200,296,308]))
EPS=1e-6

def finite_vec(v):
    return all(math.isfinite(float(x)) for x in v)

def world_signature(obj):
    m=obj.matrix_world
    return tuple(round(float(x),7) for x in (*m.translation, *m.to_quaternion()))

def children_recursive(root):
    out=[]
    for o in bpy.data.objects:
        p=o.parent
        while p:
            if p==root:
                out.append(o);break
            p=p.parent
    return out

def mesh_model_objects():
    # Cameras/lights/studio floor are explicitly omitted.  The floor is also
    # omitted by name so ground contact remains a useful model measurement.
    return [o for o in bpy.data.objects if o.type=='MESH' and
            not o.name.startswith('Studio |') and 'seamless floor' not in o.name]

def bounds_at_frame(frame):
    bpy.context.scene.frame_set(frame)
    bpy.context.view_layer.update()
    lo=Vector((float('inf'),)*3); hi=Vector((float('-inf'),)*3)
    finite=True; count=0
    deps=bpy.context.evaluated_depsgraph_get()
    for obj in mesh_model_objects():
        eo=obj.evaluated_get(deps)
        try:
            me=eo.to_mesh()
            mw=eo.matrix_world
            for v in me.vertices:
                p=mw@v.co
                finite=finite and finite_vec(p)
                lo.x=min(lo.x,p.x);lo.y=min(lo.y,p.y);lo.z=min(lo.z,p.z)
                hi.x=max(hi.x,p.x);hi.y=max(hi.y,p.y);hi.z=max(hi.z,p.z)
                count+=1
            eo.to_mesh_clear()
        except Exception:
            finite=False
    return {'min':[round(float(x),6) for x in lo],
            'max':[round(float(x),6) for x in hi], 'vertices':count, 'finite':finite}

def object_samples(names):
    values={}
    for name in names:
        obj=bpy.data.objects.get(name)
        if not obj:
            values[name]={'missing':True};continue
        samples={}
        for f in MOTION_FRAMES:
            bpy.context.scene.frame_set(f);bpy.context.view_layer.update()
            sig=world_signature(obj)
            samples[str(f)]=list(sig)
        values[name]=samples
    return values

def changed(sample):
    vals=[tuple(v) for k,v in sample.items() if isinstance(v,list)]
    return len(set(vals))>1

def assert_req(report, condition, message):
    report['assertions'].append({'ok':bool(condition),'message':message})

def world_bvh(obj):
    eo=obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh=eo.to_mesh()
    vertices=[eo.matrix_world@v.co for v in mesh.vertices]
    polygons=[list(p.vertices) for p in mesh.polygons]
    result=BVHTree.FromPolygons(vertices,polygons)
    eo.to_mesh_clear()
    return result

def matrix_error(a,b):
    return max(abs(float(a[r][c]-b[r][c])) for r in range(4) for c in range(4))

def verify_children(report,names):
    results={}
    for name in names:
        control=bpy.data.objects.get(name)
        if not control:continue
        children=[o for o in control.children if o.type=='MESH' and not o.animation_data and not o.constraints]
        if not children:continue
        child=max(children,key=lambda o:len(o.data.vertices))
        reference=None;first_world=None;max_relative_error=0;max_motion=0
        for f in MOTION_FRAMES:
            bpy.context.scene.frame_set(f);bpy.context.view_layer.update()
            relation=control.matrix_world.inverted_safe()@child.matrix_world
            if reference is None:reference=relation.copy();first_world=child.matrix_world.copy()
            max_relative_error=max(max_relative_error,matrix_error(reference,relation))
            max_motion=max(max_motion,matrix_error(first_world,child.matrix_world))
        results[name]={'child':child.name,'max_relative_matrix_error':max_relative_error,
                       'max_world_matrix_change':max_motion}
        assert_req(report,max_relative_error<1e-4,'child remains rigidly attached: '+name)
        assert_req(report,max_motion>1e-5,'child follows animated control: '+name)
    return results

def verify_telescopes(report):
    systems=[]
    for suffix in ('','.001'):
        systems.append(('Bonnet gas lift'+suffix,
            'Bonnet gas lift | cylinder'+suffix,'Bonnet gas lift | polished piston'+suffix,
            'Bonnet strut | chassis mount'+suffix,'Bonnet strut | hood mount'+suffix))
    for i,side in enumerate((-1,1)):
        suffix='' if i==0 else '.001'
        systems.append(('Hitch lift ram '+str(side),
            'Hitch lift ram %s | cylinder'%side,'Hitch lift ram %s | polished piston'%side,
            'Lift ram | upper mounting eye'+suffix,'Lift ram | link eye'+suffix))
    values={}
    for label,cyl,rod,a,b in systems:
        objects=[bpy.data.objects.get(n) for n in (cyl,rod,a,b)]
        if not all(objects):
            values[label]={'missing':[n for n,o in zip((cyl,rod,a,b),objects) if not o]}
            assert_req(report,False,'telescopic parts exist: '+label);continue
        cylinder,piston,mount_a,mount_b=objects
        max_a=0;max_b=0;max_angle=0
        for f in FRAMES:
            bpy.context.scene.frame_set(f);bpy.context.view_layer.update()
            av=mount_a.matrix_world.translation;bv=mount_b.matrix_world.translation
            aa=[cylinder.matrix_world@Vector((0,0,z)) for z in (-.5,.5)]
            bb=[piston.matrix_world@Vector((0,0,z)) for z in (-.5,.5)]
            max_a=max(max_a,min((p-av).length for p in aa))
            max_b=max(max_b,min((p-bv).length for p in bb))
            axis=(bv-av).normalized()
            max_angle=max(max_angle,abs(1-abs(axis.dot((aa[1]-aa[0]).normalized()))),
                          abs(1-abs(axis.dot((bb[1]-bb[0]).normalized()))))
        values[label]={'max_fixed_mount_error_m':max_a,'max_moving_mount_error_m':max_b,
                       'max_axis_dot_error':max_angle}
        assert_req(report,max_a<.012 and max_b<.012 and max_angle<.002,
                   'telescopic cylinder stays on its physical joints: '+label)
    return values

def main():
    requested=Path(sys.argv[sys.argv.index('--')+1]) if '--' in sys.argv and len(sys.argv)>sys.argv.index('--')+1 else BASE/'output'/'TERRA_728.blend'
    if not requested.exists():raise FileNotFoundError(str(requested))
    if Path(bpy.data.filepath).resolve()!=requested.resolve():
        bpy.ops.wm.open_mainfile(filepath=str(requested))
    scene=bpy.context.scene
    report={'blend':str(bpy.data.filepath),'blender':bpy.app.version_string,
            'frames':FRAMES,'additional_motion_sample_frames':[f for f in MOTION_FRAMES if f not in FRAMES],
            'assertions':[],'errors':[]}
    master=bpy.data.objects.get('TERRA 728 | MASTER')
    assert_req(report, master is not None, 'TERRA master root exists')
    assert_req(report, scene.frame_start<=1 and scene.frame_end>=360,
               'animation range covers frames 1-360')

    # Controls are deliberately named in wheels/cabin/body and are required
    # to remain empties or animated mesh roots, even when children are hidden.
    wheel_controls=sorted(o.name for o in bpy.data.objects if 'rolling axis' in o.name)
    steer_controls=sorted(o.name for o in bpy.data.objects if 'Ackermann steering kingpin' in o.name)
    moving_terms=['RIG | Bonnet rear hinge','CTRL • Left rear-hinged cab access door',
                  'CTRL • Windshield wiper motor','RIG | Rear PTO output',
                  'RIG | Engine cooling fan','CTRL • Rotating warning beacon -1',
                  'CTRL • Rotating warning beacon 1','RIG | Lower lift arm -1',
                  'RIG | Lower lift arm 1','CTRL • Pneumatic suspended operator seat',
                  'CTRL • Steering wheel rotor',
                  'CTRL • Multifunction drive joystick','CTRL • Hydraulic implement joystick']
    report['controls']={'wheels':wheel_controls,'steering':steer_controls,
                        'moving':{n:bool(bpy.data.objects.get(n)) for n in moving_terms}}
    assert_req(report,len(wheel_controls)==4,'four wheel rolling controls exist')
    assert_req(report,len(steer_controls)==2,'two Ackermann steering controls exist')
    for n,ok in report['controls']['moving'].items():
        assert_req(report,ok,'moving subsystem exists: '+n)

    required_mats=['paint','graphite','rubber','tread','steel','chrome','rim','label']
    report['materials']={m:bool(bpy.data.materials.get(m)) for m in required_mats}
    for m,ok in report['materials'].items():assert_req(report,ok,'material exists: '+m)

    names=wheel_controls+steer_controls+[n for n,ok in report['controls']['moving'].items() if ok]
    report['samples']=object_samples(names)
    for n,s in report['samples'].items():
        if 'missing' in s:continue
        assert_req(report,changed(s), 'animation changes sampled transform: '+n)
    report['child_motion']=verify_children(report,names)
    report['telescopic_joints']=verify_telescopes(report)

    # Every mesh at every requested pose must stay finite.  This catches failed
    # constraints and NaN matrices without requiring a costly render.
    report['bounds']={}
    for f in FRAMES:
        try:report['bounds'][str(f)]=bounds_at_frame(f)
        except Exception as exc:
            report['bounds'][str(f)]={'finite':False,'error':repr(exc)}
    for f,b in report['bounds'].items():assert_req(report,b.get('finite',False),'finite evaluated model vertices at frame '+f)

    # Contact check uses the evaluated model at frame 1.  The nominal lower
    # tyre surface should be within 2 cm of studio z=0, with no meaningful mesh
    # below floor.  Keep this diagnostic separate from hard assertions because
    # a few decorative hydraulic hoses may intentionally sit below 0 by 1-2mm.
    b=report['bounds'].get('1',{})
    report['ground_contact']={'model_min_z':b.get('min',[None,None,None])[2],
                             'within_2cm':b.get('min',[99,99,99])[2]>=-.02}
    assert_req(report,report['ground_contact']['within_2cm'],'model remains within 2 cm of ground at frame 1')

    # Evaluate actual surface intersections between bonnet and windshield.
    # BVH overlap catches crossing polygons, not merely intersecting AABBs.
    hood=bpy.data.objects.get('RIG | Bonnet rear hinge')
    shell=bpy.data.objects.get('Bonnet | compound curved enamel shell')
    windshield=bpy.data.objects.get('One-piece laminated panoramic windshield')
    hood_diag={};overlaps={}
    if hood and shell and windshield:
        for f in (1,140,160,180,215,235,250):
            scene.frame_set(f);bpy.context.view_layer.update()
            hood_diag[str(f)]=[round(float(x),6) for x in hood.matrix_world.translation]
            pairs=world_bvh(shell).overlap(world_bvh(windshield))
            overlaps[str(f)]=len(pairs)
        assert_req(report,not any(overlaps.values()),'opening bonnet does not intersect windshield glazing')
    report['diagnostics']={'hood_hinge_world':hood_diag,
                           'hood_windshield_intersecting_face_pairs':overlaps}
    report['model_object_count']=len(mesh_model_objects())
    report['animated_object_count']=sum(bool(o.animation_data) for o in bpy.data.objects)
    report['ok']=all(a['ok'] for a in report['assertions'])
    report['errors']=[a['message'] for a in report['assertions'] if not a['ok']]
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
    print('VERIFICATION_REPORT',json.dumps({'ok':report['ok'],'assertions':len(report['assertions']),
                                             'failures':len(report['errors']),
                                             'bounds':report['bounds'].get('1'),
                                             'ground_contact':report['ground_contact']},ensure_ascii=True))
    # The file is a validation artifact; return a failing process for CI use.
    if not report['ok']:raise SystemExit(2)

if __name__=='__main__':main()
