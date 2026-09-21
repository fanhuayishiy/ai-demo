"""Sculpted bodywork, serviceable engine and mechanical hitch animation."""
import bpy, math
from math import pi, sin, cos
from mathutils import Vector
import common as C

def loft(name,sections,profile,mat,parent=None):
    vs=[]
    for x,w,z0,h in sections:
        vs.extend((x,w*y,z0+h*z) for y,z in profile)
    n=len(profile); faces=[]
    for i in range(len(sections)-1):
        for j in range(n):faces.append((i*n+j,i*n+(j+1)%n,(i+1)*n+(j+1)%n,(i+1)*n+j))
    faces += [tuple(range(n-1,-1,-1)),tuple((len(sections)-1)*n+j for j in range(n))]
    return C.mesh(name,vs,faces,mat,parent,.025,True)

def build():
    C.collection('03 | Sculpted bonnet & service panels')
    # The real service hinge sits high at the rear bonnet seam.  Keeping the
    # pivot at this seam makes the raised bonnet clear the front windshield.
    hood=C.empty('RIG | Bonnet rear hinge',(-.18,0,2.25))
    profile=[(-.90,0),(-1,.10),(-1,.55),(-.94,.79),(-.78,.94),(-.47,1),(0,1.025),(.47,1),(.78,.94),(.94,.79),(1,.55),(1,.10),(.90,0)]
    loft('Bonnet | compound curved enamel shell',[
        (-2.66,.445,1.30,.60),(-2.62,.46,1.30,.65),(-2.42,.53,1.30,.78),
        (-2.03,.57,1.32,.86),(-1.25,.60,1.34,.91),(-.42,.63,1.37,.91),(-.18,.62,1.40,.84)],profile,'paint',hood)
    loft('Bonnet | recessed graphite nose',[
        (-2.676,.41,1.34,.50),(-2.65,.435,1.33,.54)],profile,'graphite',hood)
    # Closely spaced cooling louvres, deliberately recessed within the nose.
    for i in range(23):
        y=-.389+i*.0354
        C.beam('Nose grille | vertical cooling blade %02d'%i,(-2.684,y,1.39),(-2.684,y,1.75),.008,'black',hood,8)
    for z in [1.39,1.50,1.62,1.745]:
        C.beam('Nose grille | cross brace',(-2.696,-.39,z),(-2.696,.39,z),.006,'steel',hood,8)
    for sign in [-1,1]:
        # Swept dark side inserts follow the rising bonnet profile.
        verts=[(-2.37,sign*.534,1.54),(-.43,sign*.646,1.67),(-.43,sign*.644,1.93),(-2.28,sign*.56,1.78)]
        C.mesh('Bonnet | side cooling recess',verts,[(0,1,2,3)],'graphite',hood,.014)
        for i in range(25):
            x=-2.28+i*.069
            y=sign*(.564+(x+2.28)*.045)
            z=1.59+(x+2.28)*.070
            C.beam('Side cooling slot %02d'%i,(x,y,z),(x+.035,y,z+.16),.008,'black',hood,8)
        C.tube('Enamel shoulder highlight',[(-2.48,sign*.48,1.925),(-2.06,sign*.538,2.105),(-1.2,sign*.559,2.17),(-.36,sign*.58,2.185)],.009,'steel',hood)
        C.beam('Bonnet | lower reveal',(-2.42,sign*.544,1.33),(-.27,sign*.64,1.414),.012,'black',hood)
        rot=(pi/2,0,0) if sign==-1 else (pi/2,0,pi)
        C.text_obj('Model badge | TERRA 728','TERRA  728',(-1.53,sign*.612,1.985),.115,'label',rot,hood)
        C.text_obj('Side badge | Vario drive','4WD  /  COMMON RAIL',(-1.55,sign*.614,1.923),.029,'steel',rot,hood)
        for x in [-2.34,-.36]:
            C.cyl('Bonnet | quarter turn fastener',(x,sign*(.55 if x<-2 else .65),1.415),.016,.012,'steel','Y',12,hood)
        # Wraparound matrix headlamp with housing, chrome reflector, lens, individual LEDs.
        light=C.cube('Headlamp | sculpted housing',(-2.625,sign*.321,1.83),(.095,.24,.125),'black',.04,hood)
        C.cube('Headlamp | reflector',(-2.68,sign*.321,1.84),(.015,.204,.075),'chrome',.022,hood)
        for j in [-1,0,1]:
            C.cube('Headlamp | projector diode',(-2.692,sign*.321+j*.060,1.84),(.017,.043,.044),'light',.014,hood)
        C.cube('Headlamp | clear protective lens',(-2.704,sign*.321,1.84),(.012,.221,.091),'glass',.023,hood)
        C.cube('Headlamp | amber marker',(-2.681,sign*.433,1.82),(.03,.026,.067),'amber',.008,hood)
    C.cube('Nose | crest carrier',(-2.703,0,1.83),(.03,.13,.13),'chrome',.03,hood)
    C.text_obj('Nose | T insignia','T',(-2.722,.039,1.79),.10,'graphite',(pi/2,0,-pi/2),hood)
    C.key_rot(hood,1,[(1,0),(125,0),(160,math.radians(43)),(215,math.radians(43)),(250,0),(360,0)])
    # Service struts use look-at constraints and telescoping rods.
    for sign in [-1,1]:
        a=C.empty('Bonnet strut | chassis mount',(-.32,sign*.43,1.45))
        b=C.empty('Bonnet strut | hood mount',(-1.06,sign*.43,1.44),hood)
        telescopic('Bonnet gas lift',a,b,.019,.010,'graphite')

    C.collection('04 | Powertrain & cooling')
    C.cube('Engine | cast six cylinder crankcase',(-1.20,0,1.18),(1.58,.62,.49),'graphite',.07)
    C.cube('Engine | machined sump',(-1.22,0,.91),(1.38,.55,.13),'steel',.03)
    C.cube('Engine | cylinder head',(-1.20,0,1.485),(1.55,.62,.16),'steel',.035)
    for i in range(6):
        x=-1.84+i*.248
        C.cube('Engine | cylinder %d valve cover'%(i+1),(x,0,1.62),(.228,.55,.15),'graphite',.035)
        for y in [-.20,.20]:C.cyl('Engine | valve-cover bolt',(x,y,1.708),.019,.015,'chrome',vertices=6)
        C.tube('Fuel rail | injection line %d'%i,[(x,-.29,1.56),(x,-.40,1.49),(x+.09,-.405,1.26)],.011,'chrome')
        C.tube('Intake | runner %d'%i,[(x,.20,1.56),(x,.38,1.67),(x,.44,1.47)],.036,'steel')
        C.tube('Exhaust | manifold runner %d'%i,[(x,-.22,1.57),(x,-.36,1.62),(x+.08,-.41,1.45)],.027,'cast')
    C.beam('Fuel rail | high pressure',(-1.99,-.407,1.28),(-.40,-.407,1.28),.022,'chrome')
    C.beam('Intake | plenum',(-1.94,.43,1.48),(-.49,.43,1.48),.090,'steel')
    C.cyl('Turbo | compressor housing',(-.59,-.45,1.42),.137,.17,'steel','Y')
    C.torus('Turbo | snail ring',(-.59,-.55,1.42),.090,.032,'cast','Y')
    C.tube('Turbo | charge air hose',[(-.58,-.46,1.48),(-.52,-.45,1.77),(-1.60,-.44,1.83),(-2.20,-.38,1.66)],.047,'rubber')
    for x in [-.7,-1.63]:C.torus('Charge hose | steel retaining band',(x,-.44,1.80),.049,.007,'chrome','X')
    C.cyl('Engine | oil filter',(-.62,-.40,1.09),.065,.24,'black')
    C.cyl('Engine | fuel water separator',(-1.06,.40,1.10),.071,.24,'label')
    C.cyl('Engine | alternator',(-1.94,-.39,1.15),.108,.23,'steel','X')
    for x in [-2.03,-1.99,-1.95,-1.91,-1.87]:C.torus('Alternator | cooling rib',(x,-.39,1.15),.106,.007,'graphite','X',major_segments=32)
    C.cube('Cooling | radiator frame',(-2.27,0,1.43),(.14,.83,.69),'graphite',.022)
    for i in range(34):
        z=1.12+i*.018
        C.cube('Cooling | aluminium radiator fin',(-2.35,0,z),(.022,.735,.006),'steel',.001)
    for y in [-.36,.36]:C.cube('Cooling | radiator tank',(-2.24,y,1.43),(.15,.075,.68),'black',.025)
    fan=C.empty('RIG | Engine cooling fan',(-2.155,0,1.43))
    C.cyl('Cooling fan | central hub',(-2.155,0,1.43),.07,.10,'steel','X',parent=fan)
    for i in range(9):
        a=i*2*pi/9
        vs=[]
        for r,t,xx in [(.073,-.12,-.025),(.302,-.07,0),(.305,.29,.025),(.10,.58,.035)]:
            vs.append((-2.155+xx,r*cos(a+t),1.43+r*sin(a+t)))
        obj=C.mesh('Cooling fan | swept blade %02d'%i,vs,[(0,1,2,3)],'black',fan)
        mod=obj.modifiers.new('Blade thickness','SOLIDIFY');mod.thickness=.011
    C.key_rot(fan,0,[(1,0),(360,54*pi)]);C.linear_animation(fan)
    C.torus('Cooling fan | protective shroud',(-2.16,0,1.43),.321,.019,'graphite','X')
    # Fendt-style concentric fan is hydraulically driven.  The compact motor,
    # manifold and paired high-pressure hoses make that distinction visible in
    # the open-service animation instead of implying a belt-driven fan.
    C.cyl('Cooling fan | independent hydraulic motor',(-2.13,.13,1.43),.085,.16,'steel','Y')
    C.cyl('Cooling fan | motor shaft',(-2.13,.225,1.43),.035,.14,'chrome','Y')
    for y in [.26,.30]:
        C.tube('Cooling fan | hydraulic pressure hose',[(y*.0-2.13,y,1.43),(-1.84,y+.02,1.26),(-1.56,y+.02,1.13)],.014,'rubber')
    C.cube('Cooling fan | hydraulic motor manifold',(-1.63,.28,1.16),(.28,.16,.14),'graphite',.018)
    for y in [.235,.325]:C.cyl('Cooling fan | manifold port',(-1.50,y,1.16),.021,.04,'chrome','X',12)
    for y,z in [(0,1.08),(-.36,1.15)]:
        C.cyl('Serpentine | pulley',(-2.04,y,z),.075,.035,'black','X')
        C.cyl('Serpentine | spindle',(-2.066,y,z),.026,.038,'chrome','X',vertices=12)
    C.tube('Serpentine | endless drive belt',[(-2.065,0,1.0),(-2.065,.074,1.08),(-2.065,.015,1.17),(-2.065,-.34,1.23),(-2.065,-.43,1.14),(-2.065,-.35,1.07)],.012,'rubber',cyclic=True)
    # DPF exhaust stack follows the right A-pillar leaving forward sight lines open.
    C.cyl('Exhaust | insulated DPF',(-.19,.72,1.86),.105,.82,'graphite')
    C.cyl('Exhaust | stainless shield',(-.19,.72,1.95),.111,.54,'steel')
    for z in [1.72,2.18]:C.torus('Exhaust | clamp',(-.19,.72,z),.112,.012,'chrome')
    for z in [1.77+i*.052 for i in range(8)]:
        for a in [-.8,-.4,0,.4,.8]:
            C.cube('Exhaust shield | ventilation slit',(-.19+.113*sin(a),.72-.113*cos(a),z),(.017,.004,.026),'black',.004)
    C.tube('Exhaust | chimney',[(-.19,.72,2.16),(-.15,.72,2.65),(-.15,.72,3.00),(-.05,.72,3.04)],.065,'graphite')
    C.cyl('Exhaust | open tip',(-.015,.72,3.043),.056,.017,'black','X')

    C.collection('05 | Fenders, steps & accessories')
    for sign in [-1,1]:
        # Rear fender swept circular cross section with distinct molded edge lip.
        for name,width,rr,mat in [('Rear fender | enamel',.69,1.108,'paint'),('Rear fender | edge beading',.708,1.088,'graphite')]:
            vs=[];steps=48
            for i in range(steps+1):
                a=math.radians(22+139*i/steps)
                for y in [sign*(1.065-width/2),sign*(1.065+width/2)]:
                    vs.append((1.38+rr*cos(a),y,1.02+rr*sin(a)))
            fs=[(2*i,2*i+1,2*i+3,2*i+2) for i in range(steps)]
            o=C.mesh(name,vs,fs,mat,smooth_shading=True)
            s=o.modifiers.new('Molded fender thickness','SOLIDIFY');s.thickness=.040 if mat=='paint' else .015
            C.bevel(o,.020,3)
        C.cube('Rear fender | lamp housing',(2.405,sign*1.07,1.54),(.15,.38,.16),'graphite',.04)
        C.cube('Rear lamp | ruby lens',(2.491,sign*1.045,1.565),(.023,.22,.082),'red',.022)
        C.cube('Rear lamp | indicator',(2.493,sign*1.215,1.565),(.023,.091,.082),'amber',.02)
        for j in range(6):C.cube('Rear lamp | molded lens optic',(2.508,sign*1.045+(j-2.5)*.032,1.565),(.003,.003,.067),'red',.001)
        C.cube('Rear fender | mud flap',(2.41,sign*1.07,1.28),(.025,.54,.35),'rubber',.012)
        # Front mudguards are parented to steering pivots during final assembly.
        vs=[];steps=32
        for i in range(steps+1):
            a=math.radians(36+109*i/steps)
            for y in [sign*.75,sign*1.29]:vs.append((-1.62+.823*cos(a),y,.745+.823*sin(a)))
        o=C.mesh('Front mudguard %s'%sign,vs,[(i*2,i*2+1,i*2+3,i*2+2) for i in range(steps)],'graphite',smooth_shading=True)
        mod=o.modifiers.new('Flexible molded plastic','SOLIDIFY');mod.thickness=.025;C.bevel(o,.012)
        C.tube('Mudguard | support %s'%sign,[(-1.62,sign*.73,.79),(-1.54,sign*.82,1.03),(-1.34,sign*.93,1.46)],.026,'steel')
        # Fuel tank, filler and access hardware.
        C.cube('Fuel | rotomolded tank',(.32,sign*.72,1.055),(1.0,.36,.55),'graphite',.10)
        for x in [-.06,.58]:C.cube('Fuel tank | retaining strap',(x,sign*.913,1.06),(.065,.018,.40),'steel',.006)
        C.cyl('Fuel | filler neck',(.44,sign*.81,1.355),.058,.085,'black')
        C.cyl('Fuel | diesel cap',(.44,sign*.81,1.408),.07,.035,'graphite',vertices=12)
        C.cyl('Fuel | DEF blue cap',(.64,sign*.80,1.371),.039,.037,'screen',vertices=12)
    # Left entry steps. Perforations represented by inset tread pockets.
    for i in range(3):
        x=-.12+i*.105;y=-1.02+i*.074;z=.48+i*.265
        C.cube('Entry | step %d'%(i+1),(x,y,z),(.46,.37,.052),'steel',.018)
        for a in range(7):
            for b in range(4):C.cube('Step | anti-slip punched pocket',(x-.18+a*.06,y-.135+b*.088,z+.027),(.035,.052,.004),'black',.006)
    for x in [-.35,.2]:C.beam('Entry | ladder upright',(x,-1.06,.39),(x+.2,-.78,1.53),.025,'graphite')
    C.tube('Entry | grab rail',[(-.35,-.91,.78),(-.37,-.91,1.68),(-.16,-.80,1.82)],.018,'steel')
    # Front weight carrier with stacked removable iron plates, pin and tow eye.
    C.cube('Ballast | chassis carrier',(-2.66,0,.66),(.64,.74,.19),'graphite',.045)
    for j in range(10):
        C.cube('Ballast | cast plate %02d'%j,(-2.945,-.45+j*.10,.825),(.48,.089,.49),'cast',.026)
        C.cube('Ballast | carry slot',(-2.945,-.45+j*.10,1.073),(.18,.058,.009),'black',.010)
    C.beam('Ballast | locking rod',(-2.97,-.57,.81),(-2.97,.57,.81),.025,'steel')
    C.torus('Ballast | front towing eye',(-3.237,0,.75),.064,.019,'steel','X')
    C.cube('Ballast | identification',(-3.195,0,.945),(.012,.29,.089),'graphite',.009)

    C.collection('06 | Hydraulic rear linkage & PTO')
    C.cube('Hydraulics | rear transmission block',(1.93,0,.97),(.36,.69,.54),'graphite',.055)
    C.cube('Hydraulics | remote valve manifold',(1.98,0,1.57),(.22,.67,.20),'steel',.025)
    for i in range(6):
        y=-.26+i*.104
        C.cyl('Hydraulic | remote quick coupler',(2.105,y,1.60),.031,.062,'chrome','X')
        C.cyl('Hydraulic | dust cap',(2.143,y,1.60),.027,.02,'red' if i%2 else 'screen','X')
        C.tube('Hydraulic | supply return hose',[(1.96,y,1.53),(2.02,y,1.29),(1.85,y,.86)],.012,'rubber')
    C.cyl('PTO | bearing carrier',(2.16,0,.835),.15,.16,'steel','X')
    pto=C.empty('RIG | Rear PTO output',(2.25,0,.835))
    C.cyl('PTO | six-spline output',(2.30,0,.835),.038,.22,'steel','X',parent=pto)
    for i in range(6):
        a=i*pi/3
        C.cube('PTO | splined drive tooth',(2.31,.039*cos(a),.835+.039*sin(a)),(.20,.011,.011),'chrome',.003,pto)
    C.cube('PTO | top safety shield',(2.26,0,1.006),(.34,.43,.037),'rim',.02)
    C.key_rot(pto,0,[(1,0),(260,0),(360,20*pi)]);C.linear_animation(pto)
    arms=[]
    for sign in [-1,1]:
        arm=C.empty('RIG | Lower lift arm %s'%sign,(1.86,sign*.45,.85));arms.append(arm)
        a=(1.86,sign*.45,.85);b=(2.72,sign*.63,.63)
        ob=C.beam('Hitch | forged lower link',a,b,.049,'steel',arm,12)
        C.sphere('Hitch | swivel ball',b,(.095,.064,.083),'steel',arm)
        C.cyl('Hitch | coupling bore',(2.72,sign*.63,.63),.037,.138,'black','Y',parent=arm)
        C.cyl('Hitch | mounting pin',a,.075,.16,'chrome','Y',parent=arm)
        C.key_rot(arm,1,[(1,0),(245,0),(275,-.37),(310,-.37),(345,0),(360,0)])
        fixed=C.empty('Lift ram | upper mounting eye',(1.92,sign*.44,1.43))
        moving=C.empty('Lift ram | link eye',(2.46,sign*.575,.695),arm)
        telescopic('Hitch lift ram %s'%sign,fixed,moving,.040,.023,'graphite')
        C.tube('Hitch | hydraulic flex hose',[(1.9,sign*.38,1.56),(2.04,sign*.55,1.35),(1.95,sign*.49,1.22)],.014,'rubber')
        C.beam('Hitch | stabilizer',(1.99,sign*.22,.76),(2.43,sign*.54,.685),.021,'graphite',arm)
    C.beam('Hitch | adjustable upper link',(2.04,0,1.40),(2.68,0,1.20),.035,'steel')
    C.beam('Hitch | top link screw',(2.48,0,1.261),(2.75,0,1.177),.022,'chrome')
    C.torus('Hitch | top coupling eye',(2.76,0,1.174),.046,.020,'steel','Y')
    C.cube('Tow | clevis bracket',(2.28,0,.51),(.34,.21,.065),'steel',.023)
    C.cyl('Tow | removable pin',(2.32,0,.55),.032,.19,'chrome')
    C.cube('Registration | rear plate',(1.92,0,1.99),(.025,.43,.115),'label',.009)
    C.text_obj('Registration | lettering','TERRA 728',(1.938,-.193,1.956),.071,'black',(pi/2,0,pi/2))
    return {'hood':hood,'fan':fan,'pto':pto,'lift_arms':arms}

def telescopic(name,a,b,outer,inner,mat):
    # At every frame the cylinder axis and rod share the same two attachment points.
    bpy.context.view_layer.update()
    v=b.matrix_world.translation-a.matrix_world.translation
    housing=C.cyl(name+' | cylinder',a.matrix_world.translation,outer,1,mat,bevel_width=.006)
    rod=C.cyl(name+' | polished piston',b.matrix_world.translation,inner,1,'chrome',bevel_width=.003)
    for f in range(1,361,3):
        bpy.context.scene.frame_set(f);bpy.context.view_layer.update()
        aa=a.matrix_world.translation;bb=b.matrix_world.translation;vec=bb-aa;length=vec.length;direction=vec.normalized()
        shell_len=.55*length; rod_len=.50*length
        for obj,loc,dep in [(housing,aa+direction*shell_len*.5,shell_len),(rod,bb-direction*rod_len*.5,rod_len)]:
            obj.location=loc;obj.rotation_euler=vec.to_track_quat('Z','Y').to_euler();obj.scale.z=dep
            obj.keyframe_insert(data_path='location',frame=f);obj.keyframe_insert(data_path='rotation_euler',frame=f);obj.keyframe_insert(data_path='scale',frame=f)
    bpy.context.scene.frame_set(1)
