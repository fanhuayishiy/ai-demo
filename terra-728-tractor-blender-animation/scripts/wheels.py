"""Detailed agricultural running gear; axes: front -X, left -Y, Z up.

Nominal wheel radii include the tread tips.  Connected strip meshes form each
chevron lug and penetrate the shaped carcass, so the tread has no floating bars.
"""
import bpy
import math
from math import sin, cos, pi
from mathutils import Vector, Matrix
import common as C


def _lathe(name, x, y, z, profile, mat, parent, segments=112):
    closed=profile[0]==profile[-1]
    if closed:profile=profile[:-1]
    verts=[]
    for axial, radius in profile:
        verts.extend((x+radius*cos(i*2*pi/segments), y+axial,
                      z+radius*sin(i*2*pi/segments)) for i in range(segments))
    faces=[]
    for j in range(len(profile) if closed else len(profile)-1):
        nxt=(j+1)%len(profile)
        for i in range(segments):
            ni=(i+1)%segments
            faces.append((j*segments+i,nxt*segments+i,
                          nxt*segments+ni,j*segments+ni))
    if closed:
        volume=sum(Vector(verts[f[0]]).dot(Vector(verts[f[k]]).cross(Vector(verts[f[k+1]])))
                   for f in faces for k in (1,2))
        if volume<0:faces=[tuple(reversed(f)) for f in faces]
    return C.mesh(name,verts,faces,mat,parent,smooth_shading=True)


def _barrel(radius, width, axial):
    """Tread crown smoothly falls into its shoulder, matching the carcass."""
    t=abs(axial)/(width*.5)
    return radius*(.947-.035*t*t-.024*t**6)


def _chevrons(name, center, radius, width, parent, count):
    x,y,z=center
    verts=[];faces=[]
    for n in range(count):
        for side in (-1,1):
            offset=len(verts)
            face_offset=len(faces)
            for k in range(11):
                t=k/10
                axial=side*width*(.007+.411*t)
                angle=2*pi*n/count-.225*t+.026*sin(pi*t)
                # Alternate the two shoulders by a small real mould offset.
                angle+=side*.006
                half_angle=(.025+.014*sin(pi*t))*(1-.14*t)
                root=_barrel(radius,width,axial)-.012*radius
                height=radius*(.0528-.012*t*t)
                top=_barrel(radius,width,axial)+height
                # Four vertices at every station form an attached solid ribbon.
                for rr,aa in ((root,angle-half_angle*1.12),
                              (root,angle+half_angle*1.12),
                              (top,angle+half_angle*.84),
                              (top,angle-half_angle*.84)):
                    verts.append((x+rr*cos(aa),y+axial,z+rr*sin(aa)))
            faces.append(tuple(offset+i for i in (3,2,1,0)))
            for k in range(10):
                a=offset+4*k; b=a+4
                for j in range(4):
                    jj=(j+1)%4
                    faces.append((a+j,a+jj,b+jj,b+j))
            faces.append(tuple(offset+40+i for i in range(4)))
            if side<0:
                faces[face_offset:]=[tuple(reversed(f)) for f in faces[face_offset:]]
    obj=C.mesh(name,verts,faces,'tread',parent,bevel_width=radius*.004)
    obj.modifiers[-1].segments=2
    return obj


def _raised_type(name, center, radius, width, side, parent, rear):
    """Baked embossed lettering, curved one glyph at a time around sidewalls."""
    x,y,z=center
    vertices=[];faces=[]
    labels=[('AGRIMAX',pi/2,.075*radius,.735*radius),
            ('620 / 70 R 42' if rear else '480 / 70 R 30',-pi/2,.039*radius,.737*radius),
            ('RADIAL   TUBELESS',0,.029*radius,.766*radius)]
    depsgraph=bpy.context.evaluated_depsgraph_get()
    for caption,mid,size,rr in labels:
        step=size*.70/rr
        for i,ch in enumerate(caption):
            if ch==' ':continue
            theta=mid-side*(i-(len(caption)-1)/2)*step
            normal=Vector((0,side,0))
            radial=Vector((cos(theta),0,sin(theta)))
            tangent=Vector((-side*sin(theta),0,side*cos(theta)))
            # Bottom labels have their baseline toward the outer circumference.
            if mid<0:
                radial=-radial; tangent=-tangent
                theta=mid+side*(i-(len(caption)-1)/2)*step
                radial=Vector((-cos(theta),0,-sin(theta)))
                tangent=Vector((side*sin(theta),0,-side*cos(theta)))
            position=Vector((x+rr*cos(theta),y+side*width*.496,z+rr*sin(theta)))
            data=bpy.data.curves.new('_moulded_glyph','FONT')
            data.body=ch;data.size=size;data.align_x='CENTER';data.extrude=radius*.0012
            data.bevel_depth=radius*.0005;data.bevel_resolution=1
            temp=bpy.data.objects.new('_moulded_glyph',data)
            bpy.context.scene.collection.objects.link(temp)
            temp.matrix_world=Matrix((tangent,radial,normal)).transposed().to_4x4()
            temp.location=position
            bpy.context.view_layer.update()
            evaluated=temp.evaluated_get(depsgraph)
            me=evaluated.to_mesh()
            start=len(vertices)
            vertices.extend(tuple(temp.matrix_world@v.co) for v in me.vertices)
            faces.extend(tuple(start+i for i in f.vertices) for f in me.polygons)
            evaluated.to_mesh_clear()
            bpy.data.objects.remove(temp,do_unlink=True)
            if data.users==0:bpy.data.curves.remove(data)
    return C.mesh(name,vertices,faces,'rubber',parent)


def _bolt_circle(prefix, center, radius, circle, y, side, parent, count=10):
    x,_,z=center
    for i in range(count):
        a=2*pi*i/count
        p=(x+circle*cos(a),y,z+circle*sin(a))
        C.cyl(prefix+' | washer %02d'%i,p,radius*1.45,.006,'steel','Y',24,parent,.001)
        C.cyl(prefix+' | hex nut %02d'%i,(p[0],y+side*.012,p[2]),
              radius,.023,'chrome','Y',6,parent,.002)
        C.cyl(prefix+' | stud %02d'%i,(p[0],y+side*.026,p[2]),
              radius*.43,.008,'graphite','Y',16,parent,.001)


def _wheel(prefix, center, radius, width, side, rear, steering=None):
    x,y,z=center
    spin=C.empty(prefix+' | rolling axis',center,parent=steering)
    # The closed cross-section includes the bead and sidewall return under rim.
    section=[(-.355,.488),(-.414,.510),(-.456,.560),(-.487,.640),
             (-.500,.730),(-.493,.790),(-.462,.850),(-.419,.913),
             (-.350,.935),(-.250,.943),(-.125,.946),(0,.947),
             (.125,.946),(.250,.943),(.350,.935),(.419,.913),
             (.462,.850),(.493,.790),(.500,.730),(.487,.640),
             (.456,.560),(.414,.510),(.355,.488),(-.355,.488)]
    profile=[(s*width,r*radius) for s,r in section]
    _lathe(prefix+' | continuous radial tyre carcass',x,y,z,profile,'rubber',spin)
    _chevrons(prefix+' | moulded herringbone tread',(x,y,z),radius,width,spin,26 if rear else 24)
    for outward in (-1,1):
        for rr,ax,minor in ((.512,.414,.006),(.555,.455,.0038),
                            (.825,.474,.003),(.861,.455,.0025)):
            C.torus(prefix+' | sidewall mould line',
                    (x,y+outward*width*ax,z),radius*rr,radius*minor,
                    'rubber','Y',spin,96)
        _raised_type(prefix+' | moulded sidewall lettering',center,radius,width,outward,spin,rear)

    # A complete recessed drop-centre rim, with rolled flange and bead seat.
    rim_profile=[(-width*.395,radius*.504),(-width*.397,radius*.528),
                 (-width*.365,radius*.541),(-width*.321,radius*.528),
                 (-width*.310,radius*.493),(-width*.243,radius*.478),
                 (-width*.173,radius*.417),(width*.173,radius*.417),
                 (width*.243,radius*.478),(width*.310,radius*.493),
                 (width*.321,radius*.528),(width*.365,radius*.541),
                 (width*.397,radius*.528),(width*.395,radius*.504),
                 (width*.310,radius*.482),(width*.23,radius*.459),
                 (width*.15,radius*.400),(-width*.15,radius*.400),
                 (-width*.23,radius*.459),(-width*.31,radius*.482),
                 (-width*.395,radius*.504)]
    _lathe(prefix+' | rolled drop centre rim',x,y,z,rim_profile,'rim',spin)
    # A shallow dished cast centre visibly sits deeper than the rim flange.
    dish=[(-side*width*.16,radius*.414),(side*width*.155,radius*.414),
          (side*width*.200,radius*.376),(side*width*.247,radius*.205),
          (side*width*.262,radius*.111),(side*width*.145,radius*.100),
          (-side*width*.16,radius*.414)]
    _lathe(prefix+' | dished wheel centre',x,y,z,dish,'rim',spin,96)
    hub_y=y+side*width*.278
    C.cyl(prefix+' | planetary hub casting',(x,hub_y,z),radius*.153,width*.14,
          'graphite','Y',64,spin,.014)
    C.cyl(prefix+' | hub machined flange',(x,hub_y+side*width*.074,z),
          radius*.123,.026,'steel','Y',64,spin,.006)
    C.cyl(prefix+' | final drive cap',(x,hub_y+side*width*.099,z),
          radius*.098,.033,'graphite','Y',64,spin,.007)
    C.cyl(prefix+' | hub centre badge',(x,hub_y+side*width*.128,z),
          radius*.046,.008,'rim','Y',48,spin,.002)
    _bolt_circle(prefix,(x,y,z),radius*.017,radius*.199,
                 y+side*width*.262,side,spin,12 if rear else 10)
    _bolt_circle(prefix+' cap',(x,y,z),radius*.0075,radius*.111,
                 hub_y+side*width*.092,side,spin,6)
    # Rim fixing slots and their red cast bosses, in a separate larger circle.
    for i in range(8):
        a=2*pi*i/8+pi/8
        pos=(x+radius*.341*cos(a),y+side*width*.222,z+radius*.341*sin(a))
        C.cyl(prefix+' | centre ventilation recess %02d'%i,pos,radius*.041,.008,
              'graphite','Y',32,spin,.006)
        C.cyl(prefix+' | rim clamp bolt %02d'%i,
              (x+radius*.424*cos(a),y+side*width*.226,z+radius*.424*sin(a)),
              radius*.011,.020,'steel','Y',6,spin,.002)
    a=pi*.18
    valve=(x+radius*.468*cos(a),y+side*width*.342,z+radius*.468*sin(a))
    C.beam(prefix+' | angled inflation valve',valve,
           (valve[0],valve[1]+side*.043,valve[2]+.018),.006,'rubber',spin,12)
    C.cyl(prefix+' | valve brass cap',
          (valve[0],valve[1]+side*.046,valve[2]+.020),.008,.014,'steel','Y',12,spin,.001)
    # Brake disc and axle splines remain visible behind each wheel.
    inward=y-side*width*.29
    C.cyl(prefix+' | inboard brake rotor',(x,inward,z),radius*.231,.025,'steel','Y',64,spin,.003)
    C.cyl(prefix+' | inboard axle flange',(x,inward-side*.028,z),radius*.138,.065,
          'graphite','Y',48,spin,.009)
    return spin


def _rod_with_targets(name,a,b,radius,mat,parent=None):
    """A pivoted rod whose far joint follows the steering mechanism."""
    av=a.matrix_world.translation.copy();bv=b.matrix_world.translation.copy()
    length=(bv-av).length
    obj=C.cyl(name,av,radius,length,mat,parent=parent,vertices=24,bevel_width=.004)
    # Shift mesh so origin is at the bottom end rather than its midpoint.
    for v in obj.data.vertices:v.co.z+=length*.5
    cp=obj.constraints.new('COPY_LOCATION');cp.target=a
    tr=obj.constraints.new('DAMPED_TRACK');tr.target=b;tr.track_axis='TRACK_Z'
    dr=obj.driver_add('scale',2).driver
    va=dr.variables.new();va.name='distance';va.type='LOC_DIFF'
    va.targets[0].id=a;va.targets[1].id=b
    dr.expression='distance / %.9f'%length
    return obj


def _axles(steering):
    C.collection('02 | Drivetrain and articulated steering')
    # Forged frame rails, closed crossmembers and mounting hardware.
    for side in (-1,1):
        C.cube('Chassis | longitudinal boxed rail',(-.03,side*.365,.687),
               (3.75,.13,.23),'graphite',.025)
        C.cube('Chassis | upper bolted flange',(-.02,side*.365,.816),
               (3.50,.18,.022),'steel',.005)
        for xx in (-1.62,-1.18,-.62,.15,.83,1.38):
            C.cyl('Chassis | outer frame fixing',(xx,side*.436,.691),.020,.018,
                  'steel','Y',6,bevel_width=.002)
    for xx in (-1.64,-.87,.13,.88,1.63):
        C.cube('Chassis | transverse crossmember',(xx,0,.687),(.14,.82,.18),'graphite',.02)
    C.cube('Transmission | central cast housing',(.53,0,.695),(1.1,.61,.45),'graphite',.095)
    C.cube('Transmission | bolted inspection lid',(.51,0,.937),(.62,.46,.028),'steel',.02)
    for xx in (.25,.48,.72):
        for yy in (-.19,.19):
            C.cyl('Transmission | lid bolt',(xx,yy,.96),.017,.017,'graphite',vertices=6,bevel_width=.002)
    for xx in (.22,.41,.60,.79):
        C.cube('Transmission | casting cooling rib',(xx,0,.671),(.032,.637,.24),'graphite',.009)
    # Rear bull axle and central differential.
    C.sphere('Rear axle | differential cast belly',(1.38,0,.93),(.40,.35,.31),'graphite')
    C.cyl('Rear axle | transverse housing',(1.38,0,1.02),.163,1.67,'graphite','Y',64,bevel_width=.016)
    for side in (-1,1):
        C.cyl('Rear axle | trumpet flange',(1.38,side*.45,1.02),.222,.095,'graphite','Y',64,bevel_width=.018)
        C.cyl('Rear axle | outboard planetary case',(1.38,side*.775,1.02),.212,.19,'graphite','Y',64,bevel_width=.019)
        _bolt_circle('Rear axle | flange hardware',(1.38,0,1.02),.014,.185,side*.514,side,None,10)
        C.cube('Rear brake | caliper',(1.57,side*.831,1.08),(.19,.15,.24),'graphite',.027)
        C.tube('Rear brake | hydraulic line',[(.87,side*.34,.98),(1.15,side*.50,1.13),
               (1.50,side*.68,1.16),(1.58,side*.81,1.11)],.007,'rubber')
    # Oscillating driven front axle: deep central casting, tapered ends.
    C.sphere('Front axle | differential housing',(-1.62,0,.65),(.285,.258,.235),'graphite')
    C.cyl('Front axle | oscillation trunnion',(-1.62,0,.67),.145,.58,'graphite','X',64,bevel_width=.015)
    C.cyl('Front axle | front service cover',(-1.934,0,.67),.124,.029,'steel','X',48,bevel_width=.006)
    for side in (-1,1):
        points=[(-1.74,side*.15,.57),(-1.52,side*.15,.57),(-1.50,side*.78,.65),(-1.74,side*.78,.65),
                (-1.74,side*.15,.77),(-1.52,side*.15,.77),(-1.50,side*.78,.82),(-1.74,side*.78,.82)]
        C.mesh('Front axle | tapered forged beam',points,[(0,1,2,3),(4,7,6,5),(0,4,5,1),
               (1,5,6,2),(2,6,7,3),(3,7,4,0)],'graphite',bevel_width=.022)
        steer=steering[side]
        C.cyl('Front steering | kingpin',(-1.62,side*.835,.745),.07,.33,
              'steel','Z',48,steer,.008)
        C.cube('Front steering | knuckle casting',(-1.62,side*.853,.733),
               (.17,.15,.27),'graphite',.026,steer)
        C.cyl('Front steering | driven hub axle',(-1.62,side*.936,.745),.11,.19,
              'graphite','Y',48,steer,.012)
        C.beam('Front steering | rear steering arm',(-1.61,side*.832,.672),
               (-1.34,side*.79,.658),.039,'graphite',steer)
        anchor=C.empty('Steering ram | fixed clevis %s'%side,(-1.295,side*.22,.655))
        tip=C.empty('Steering ram | moving ball joint %s'%side,(-1.34,side*.79,.658),steer)
        C.sphere('Steering ram | ball end %s'%side,tuple(tip.matrix_world.translation),(.042,.042,.042),'steel',steer)
        _rod_with_targets('Steering ram | polished piston %s'%side,anchor,tip,.020,'chrome')
        sleeve=C.cyl('Steering ram | cylinder body %s'%side,(-1.31,side*.36,.655),.044,.31,
                     'graphite','Y',32,bevel_width=.009)
        C.torus('Steering ram | dust seal %s'%side,(-1.31,side*.52,.655),.027,.006,'rubber','Y')
        C.tube('Steering ram | flexible pressure hose %s'%side,
               [(-.65,side*.30,.87),(-.98,side*.38,.91),(-1.18,side*.29,.83),
                (-1.30,side*.26,.68)],.009,'rubber')
        C.cyl('Steering ram | hydraulic union %s'%side,(-1.3,side*.26,.702),.019,.032,'steel',vertices=6,bevel_width=.002)

    # Four wheel drive prop shaft with universal joints, carrier and fasteners.
    driveshaft=C.empty('4WD | animated prop shaft axis',(-.39,0,.527))
    C.cyl('4WD | front prop shaft',(-.57,0,.527),.041,1.47,'steel','X',48,driveshaft,.004)
    C.cyl('4WD | sliding splined sleeve',(-.16,0,.527),.057,.34,'graphite','X',48,driveshaft,.009)
    for xx in (-.33,-.27,-.21,-.15,-.09):
        C.torus('4WD | sliding coupling boot pleat',(xx,0,.527),.061,.008,'rubber','X',driveshaft,40)
    for xx in (-1.295,.22):
        C.cyl('4WD | coupling flange',(xx,0,.527),.092,.047,'graphite','X',48,driveshaft,.006)
        C.cube('4WD | universal joint fork',(xx+.045,0,.527),(.12,.143,.05),'steel',.012,driveshaft)
        C.cyl('4WD | universal cross pin',(xx+.067,0,.527),.027,.148,'steel','Y',32,driveshaft,.003)
        C.cyl('4WD | universal cross pin Z',(xx+.067,0,.527),.027,.127,'graphite','Z',32,driveshaft,.003)
        for i in range(4):
            a=2*pi*i/4
            C.cyl('4WD | flange bolt',(xx-.029,.069*cos(a),.527+.069*sin(a)),
                  .012,.018,'chrome','X',6,driveshaft,.002)
    C.cube('4WD | guard mounting strap',(-.67,0,.465),(.065,.18,.025),'graphite',.006)
    C.key_rot(driveshaft,0,[(1,0),(80,12*pi),(120,14*pi),(360,14*pi)])
    C.linear_animation(driveshaft)


def build():
    C.collection('01 | Tyres, forged rims and wheel hubs')
    wheels=[];steer_objs=[];steering={}
    for side in (-1,1):
        label='LEFT' if side<0 else 'RIGHT'
        steering[side]=C.empty('Front %s | Ackermann steering kingpin'%label,(-1.62,side*.835,.745))
        steer_objs.append(steering[side])
        front=_wheel('Front '+label,(-1.62,side*1.02,.745),.745,.47,side,False,steering[side])
        rear=_wheel('Rear '+label,(1.38,side*1.07,1.02),1.02,.60,side,True)
        wheels.extend([front,rear])
        # Equal rolling distance, independent radii, followed by a static pose.
        for obj,radius in ((front,.745),(rear,1.02)):
            C.key_rot(obj,1,[(1,0),(80,-5.4/radius),(120,-6.3/radius),(360,-6.3/radius)])
            C.linear_animation(obj)
        steering_angle=math.radians(24 if side<0 else 19)
        C.key_rot(steering[side],2,[(1,0),(80,0),(98,steering_angle),(110,-steering_angle*.55),(120,0),(360,0)])
    _axles(steering)
    return {'wheels':wheels,'steering':steer_objs}
