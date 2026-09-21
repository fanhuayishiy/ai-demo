"""TERRA 728 tractor: panoramic cab, ergonomic interior and mechanical controls.

Coordinates are metres, the operator faces -X.  All motion is on explicit
pivots so the animated components remain mechanically connected.
"""
import bpy
import math
from math import pi, sin, cos
from mathutils import Vector
import common as C


def panel(name, points, material='glass', parent=None, thickness=.007):
    obj = C.mesh(name, points, [tuple(range(len(points)))], material, parent)
    solid = obj.modifiers.new('Laminated glazing thickness', 'SOLIDIFY')
    solid.thickness = thickness
    C.bevel(obj, .004, 2)
    return obj


def perimeter(name, points, radius, material, parent=None):
    for i, p in enumerate(points):
        C.beam(name + ' %02d' % i, p, points[(i+1) % len(points)], radius,
               material, parent, vertices=16)


def bolts(name, points, radius=.012, axis='Z', parent=None):
    for i, point in enumerate(points):
        C.cyl(name + ' bolt %02d' % i, point, radius, .008, 'steel', axis,
              vertices=6, parent=parent, bevel_width=.001)


def work_lamp(name, loc, front=True):
    x, y, z = loc
    # Lamps are black die-cast housings with individual reflector cells.
    C.cube(name + ' cast housing', loc, (.11, .27, .12), 'graphite', .025)
    face = x + (-.062 if front else .062)
    C.cube(name + ' lens gasket', (face, y, z), (.009, .235, .086), 'rubber', .012)
    for col in range(4):
        for row in range(2):
            C.cube(name + ' LED %d-%d' % (col, row),
                   (face + (-.008 if front else .008), y + (col-1.5)*.052,
                    z + (row-.5)*.036), (.006, .043, .027), 'light', .007)


def make_display(name, center, width, height, parent=None):
    """Screen is read from the operator's rear side (+X); local text plane YZ."""
    x, y, z = center
    body = C.cube(name + ' magnesium enclosure', center,
                  (.060, width, height), 'graphite', .021, parent)
    C.cube(name + ' rubber bezel', (x+.034,y,z), (.008,width-.027,height-.025),
           'rubber', .01, parent)
    C.cube(name + ' active LCD', (x+.041,y,z), (.005,width-.053,height-.059),
           'cab_lcd', .006, parent)
    # Local text X runs toward +Y and its normal points toward the operator +X.
    rot = (pi/2, 0, pi/2)
    tx = x+.046
    C.text_obj(name + ' title', 'TERRA 728 | FIELD ASSIST',
               (tx,y-width*.39,z+height*.31), height*.070, 'cab_text', rot, parent)
    C.text_obj(name + ' speed', '8.4', (tx,y-width*.38,z+height*.02),
               height*.31, 'light', rot, parent)
    C.text_obj(name + ' speed unit', 'km/h', (tx,y-width*.35,z-height*.12),
               height*.067, 'cab_text', rot, parent)
    C.text_obj(name + ' gear readout', 'D4  AUTO',
               (tx,y+width*.03,z+height*.11), height*.084, 'cab_green', rot, parent)
    C.text_obj(name + ' engine data', '1850 rpm',
               (tx,y+width*.03,z-height*.015), height*.074, 'cab_text', rot, parent)
    C.text_obj(name + ' area data', '24.8 ha',
               (tx,y+width*.03,z-height*.13), height*.074, 'cab_text', rot, parent)
    for n in range(5):
        C.cube(name+' task progress '+str(n),
               (tx,y-width*.32+n*width*.15,z-height*.30),
               (.001,width*.10,height*.025), 'cab_green' if n < 4 else 'steel',
               .001, parent)
    C.cyl(name+' power key',(x+.040,y+width*.39,z-height*.40),
          .008,.004,'cab_green','X',16,parent,.001)
    return body


def build():
    C.collection('04 • Panoramic cab and operator environment')
    C.material('cab_lcd', (.012,.027,.043), rough=.25, emission=.45)
    C.material('cab_text', (.57,.83,.89), rough=.35, emission=.75)
    C.material('cab_green', (.19,.85,.40), rough=.30, emission=.8)
    C.material('cab_stitch', (.28,.30,.29), rough=.85)
    C.material('cab_headliner', (.43,.40,.33), rough=.9)
    C.material('cab_trim', (.48,.445,.365), rough=.68)
    C.material('cab_seat_insert', (.105,.12,.115), rough=.88)

    # Rubber-isolated cab platform, actual floor and textured anti-slip mat.
    for x in (.03,1.56):
        for y in (-.59,.59):
            C.cyl('Cab vibration isolator', (x,y,1.49), .075,.14,'rubber')
            C.cyl('Cab isolator cap', (x,y,1.57), .082,.017,'steel')
    C.cube('Cab structural floor tray',(.79,0,1.60),(1.90,1.49,.12),'graphite',.055)
    C.cube('Cab floor insulation',(.79,0,1.671),(1.75,1.35,.029),'softblack',.05)
    C.cube('Operator all-weather floor mat',(.44,-.08,1.690),(1.07,1.12,.017),'rubber',.03)
    for i in range(16):
        C.cube('Floor mat drainage rib %02d'%i,(.01+i*.057,-.08,1.703),
               (.023,1.02,.009),'softblack',.002)
    for y in (-.73,.73):
        C.cube('Door sill brushed metal tread',(.75,y,1.682),(1.52,.09,.025),'steel',.008)
        for x in (.17,.51,.85,1.19,1.48):
            C.cube('Sill traction inset',(x,y,1.699),(.18,.065,.006),'rubber',.002)

    # Cab has real raked pillars; perimeter rails share the glass rake.
    A0=(-.12,-.70,1.69); A1=(.08,-.65,3.00)
    B0=(1.73,-.70,1.69); B1=(1.56,-.65,3.00)
    for side in (-1,1):
        C.beam('Cab A-pillar '+str(side),(-.12,side*.70,1.66),(.08,side*.65,3.02),
               .043,'graphite',vertices=20)
        C.beam('Cab rear rollover pillar '+str(side),(1.73,side*.70,1.66),
               (1.56,side*.65,3.02),.054,'graphite',vertices=20)
        C.beam('Upper door header '+str(side),(.08,side*.65,3.00),
               (1.56,side*.65,3.00),.045,'graphite')
        C.beam('Cab sill rail '+str(side),(-.1,side*.70,1.72),
               (1.71,side*.70,1.72),.034,'graphite')
        C.beam('Warm grey interior A-pillar cover '+str(side),(-.070,side*.643,1.77),
               (.108,side*.603,2.964),.025,'cab_trim',vertices=16)
        C.beam('Warm grey interior rollover cover '+str(side),(1.678,side*.651,1.80),
               (1.535,side*.602,2.96),.029,'cab_trim',vertices=16)
    for x,z in ((.08,3.0),(-.12,1.72),(1.56,3.0),(1.73,1.72)):
        C.beam('Front / rear glazing cross rail',(x,-.65 if z>2 else -.70,z),
               (x,.65 if z>2 else .70,z),.036,'graphite')
    windshield=[(-.114,-.657,1.765),(-.114,.657,1.765),
                (.074,.612,2.953),(.074,-.612,2.953)]
    panel('One-piece laminated panoramic windshield',windshield)
    perimeter('Windshield rubber bead',windshield,.013,'rubber')
    rear_window=[(1.719,-.644,1.87),(1.719,.644,1.87),
                 (1.567,.607,2.948),(1.567,-.607,2.948)]
    panel('Rear panoramic lift-out glazing',rear_window)
    perimeter('Rear glass gasket',rear_window,.012,'rubber')
    for y in (-.46,.46):
        C.cube('Rear window hinge',(1.58,y,2.955),(.037,.09,.035),'graphite',.007)
    C.tube('Rear glass release handle',[(1.735,-.10,1.97),(1.758,-.10,1.99),
           (1.758,.10,1.99),(1.735,.10,1.97)],.012,'graphite')

    # Left access door, hinged at rear. Door can open without a ghost pane.
    door=C.empty('CTRL • Left rear-hinged cab access door',(1.625,-.701,1.82))
    left_points=[(-.063,-.704,1.762),(1.673,-.704,1.762),
                 (1.507,-.655,2.953),(.117,-.655,2.953)]
    panel('Left door full-height curved glazing',left_points,parent=door)
    perimeter('Left door steel perimeter',left_points,.023,'graphite',door)
    C.beam('Left door lower safety bar',(.006,-.711,1.91),(1.659,-.711,1.91),
           .016,'graphite',door)
    C.tube('Left door external pull handle',[(.155,-.729,2.075),(.155,-.778,2.075),
           (.345,-.778,2.075),(.345,-.729,2.075)],.012,'graphite',door)
    C.cyl('Left door lock cylinder',(.135,-.739,2.076),.017,.012,'chrome','Y',24,door)
    C.tube('Left door interior pull',[(.52,-.674,1.93),(.52,-.62,2.0),
           (.83,-.62,2.0),(.83,-.676,1.94)],.013,'graphite',door)
    C.cube('Door red emergency release',(.265,-.674,2.075),(.07,.025,.025),'red',.006,door)
    for z in (1.98,2.72):
        # Hinge pin is static, leaf moves with door.
        hx=1.73-(z-1.69)/1.31*.17
        C.cyl('Cab door hinge stainless pin',(hx,-.705,z),.025,.093,'steel')
        C.cube('Door hinge cast leaf',(hx-.047,-.711,z),(.10,.032,.065),'graphite',.007,door)
    C.key_rot(door,2,[(1,0),(165,0),(190,math.radians(66)),
                       (260,math.radians(66)),(295,0),(360,0)])
    right_points=[(-.063,.704,1.762),(1.673,.704,1.762),
                  (1.507,.655,2.953),(.117,.655,2.953)]
    panel('Right full-height fixed glass',right_points)
    perimeter('Right window edge seal',right_points,.018,'graphite')
    C.beam('Right window waist safety rail',(-.035,.712,1.91),(1.68,.712,1.91),.016,'graphite')

    # Multi-part weather roof and visible acoustic headliner.
    C.cube('Roof acoustic headliner',(.81,0,2.988),(1.69,1.28,.041),
           'cab_headliner',.085)
    C.cube('Roof lower black weather seal',(.80,0,3.045),(1.98,1.61,.066),'rubber',.13)
    C.cube('Roof integrated HVAC housing',(.80,0,3.125),(2.03,1.66,.15),'paint',.14)
    C.cube('Roof floating sculpted cap',(.82,0,3.213),(1.82,1.49,.070),'paint',.14)
    for side in (-1,1):
        C.cube('Roof HVAC intake dark recess',(.98,side*.831,3.13),(.68,.012,.075),
               'graphite',.01)
        for i in range(13):
            C.cube('HVAC inlet louver',( .67+i*.049,side*.842,3.13),
                   (.013,.009,.060),'softblack',.002)
    for y in (-.54,.54):
        work_lamp('Front roof work lamp',(-.191,y,3.10))
        work_lamp('Rear roof work lamp',(1.826,y,3.10),False)
    # Top-mounted GNSS antenna and protected radio whip.
    C.cube('Precision GNSS receiver base',(.94,0,3.270),(.27,.30,.026),'graphite',.06)
    C.cube('GNSS ceramic radome',(.94,0,3.311),(.245,.274,.065),'label',.075)
    C.cyl('Radio antenna rubber boot',(1.46,.48,3.276),.031,.064,'rubber')
    C.beam('Flexible radio antenna',(1.46,.48,3.29),(1.55,.49,3.89),.0045,'graphite',vertices=10)

    beacons=[]
    for side in (-1,1):
        bx=.33; by=side*.69
        C.cyl('Beacon resilient pedestal',(bx,by,3.264),.077,.058,'rubber')
        C.cyl('Beacon polished base ring',(bx,by,3.299),.076,.025,'steel')
        C.cyl('Amber warning beacon Fresnel dome',(bx,by,3.383),.069,.145,'amber',vertices=48)
        C.sphere('Beacon rounded dome',(bx,by,3.455),(.069,.069,.027),'amber')
        for h in range(6):
            C.torus('Amber lens Fresnel ring',(bx,by,3.329+h*.022),.069,.003,'amber',major_segments=40)
        pivot=C.empty('CTRL • Rotating warning beacon '+str(side),(bx,by,3.37))
        C.cube('Beacon rotating reflector',(bx+.060,by,3.383),(.009,.023,.107),
               'light',.003,pivot)
        C.key_rot(pivot,2,[(1,0),(360,pi*28)])
        C.linear_animation(pivot)
        beacons.append(pivot)

    # Mirror brackets start at rollover pillars and include pivot hardware.
    for side in (-1,1):
        C.cube('Mirror mast mounting foot',(.04,side*.677,2.78),(.09,.060,.14),'graphite',.012)
        C.tube('Telescopic exterior mirror arm',[(.045,side*.69,2.83),
               (-.015,side*.90,2.89),(-.11,side*1.04,2.89),(-.17,side*1.07,2.65)],
               .018,'graphite')
        C.cyl('Mirror arm pivot',(.018,side*.761,2.846),.024,.050,'steel','Z')
        C.cube('Exterior main mirror shell',(-.159,side*1.092,2.60),
               (.083,.183,.283),'graphite',.039)
        C.cube('Exterior main mirror silver glass',(-.109,side*1.092,2.632),
               (.008,.148,.186),'chrome',.025)
        C.cube('Exterior lower convex mirror',(-.106,side*1.092,2.512),
               (.008,.144,.060),'chrome',.016)

    # Front windshield wiper sweeps around a normal-to-glass axis.
    wiper=C.empty('CTRL • Windshield wiper motor',(-.118,-.29,1.90))
    C.cyl('Wiper spindle',(-.128,-.29,1.90),.031,.036,'graphite','X')
    C.beam('Windshield wiper sprung arm',(-.132,-.29,1.90),
           (-.012,-.01,2.68),.009,'graphite',wiper)
    C.beam('Windshield wiper rubber blade',(-.049,-.082,2.38),
           (.030,.094,2.925),.011,'rubber',wiper)
    C.beam('Windshield wiper blade spine',(-.058,-.082,2.39),
           (.021,.094,2.913),.006,'graphite',wiper)
    C.key_rot(wiper,0,[(1,0),(282,0),(296,-.60),(308,.58),(320,-.60),
                        (332,.58),(344,0),(360,0)])

    # Sculpted dash pod and steerable steering column.
    C.cube('Dashboard structural binnacle',(.095,0,2.058),(.41,1.19,.22),
           'cab_trim',.077)
    C.cube('Dashboard lower warm-grey knee panel',(.11,0,1.858),(.26,.97,.20),
           'cab_trim',.06)
    C.cube('Dashboard padded upper hood',(.064,0,2.187),(.45,1.19,.058),
           'softblack',.05)
    for side in (-1,1):
        C.cube('Dashboard vent frame',(.308,side*.455,2.08),(.02,.20,.078),
               'rubber',.013)
        for k in range(5):
            C.cube('Adjustable dash air vent fin',(.322,side*.455+(k-2)*.032,2.08),
                   (.012,.008,.053),'graphite',.002)
    make_display('Primary instrument cluster',(.327,-.027,2.188),.39,.17)
    # Steering-column tilt points at operator chest; steering rotor is an
    # oriented empty, so actual rotation runs about the column's local Z.
    cbase=Vector((.29,-.04,1.89)); ctop=Vector((.58,-.04,2.315))
    C.beam('Tilt adjustable steering column',cbase,ctop,.038,'graphite')
    for n in range(7):
        zz=1.945+n*.025; xx=.327+n*.017
        bellows=C.cube('Tilt column flexible bellows',(xx,-.04,zz),(.126,.163,.025),
                       'rubber',.020)
        bellows.rotation_euler[1]=.60
    C.beam('Steering column polished telescopic shaft',(.495,-.04,2.195),ctop,.023,'steel')
    axis=(ctop-cbase).normalized()
    steering=C.empty('CTRL • Steering wheel rotor',ctop)
    steering.rotation_euler=axis.to_track_quat('Z','Y').to_euler()
    bpy.context.view_layer.update()
    def steer_world(p): return steering.matrix_world @ Vector(p)
    # Local construction avoids any assumption about parent transforms.
    wheel=C.torus('Soft-grip steering wheel',ctop,.181,.017,'rubber')
    C.parent_keep(wheel,steering)
    wheel.location=(0,0,0); wheel.rotation_euler=(0,0,0)
    hub=C.cyl('Steering wheel central hub',ctop,.061,.048,'graphite')
    C.parent_keep(hub,steering);hub.location=(0,0,0);hub.rotation_euler=(0,0,0)
    badge=C.cyl('Steering wheel satin badge',ctop,.031,.005,'steel')
    C.parent_keep(badge,steering);badge.location=(0,0,.026);badge.rotation_euler=(0,0,0)
    for a in (pi/2,pi*7/6,pi*11/6):
        spoke=C.beam('Steering wheel sculpted spoke',
                      steer_world((.043*cos(a),.043*sin(a),0)),
                      steer_world((.166*cos(a),.166*sin(a),0)),.013,'graphite')
        C.parent_keep(spoke,steering)
    steer_base=steering.rotation_euler.copy()
    # XYZ Euler Z is world-coupled on a tilted rotor, so quaternion rotation
    # multiplies the base orientation by a local axial turn.
    from mathutils import Quaternion
    steering.rotation_mode='QUATERNION'
    baseq=steer_base.to_quaternion()
    for frame, angle in [(1,0),(65,0),(85,-.65),(105,.55),(122,0),(360,0)]:
        steering.rotation_quaternion=baseq @ Quaternion((0,0,1),angle)
        steering.keyframe_insert(data_path='rotation_quaternion',frame=frame)
    C.tube('Steering indicator stalk',[(.36,-.04,2.00),(.38,-.18,2.08),
           (.43,-.22,2.13)],.009,'graphite')
    C.cube('Turn indicator stalk grip',(.43,-.22,2.13),(.07,.028,.032),'rubber',.01)

    # Seat suspension is visible below the seat cushion, including bellows.
    C.cube('Seat lower suspension plate',(1.03,-.07,1.744),(.50,.53,.049),'steel',.025)
    C.cube('Seat air-suspension accordion base',(1.03,-.07,1.849),(.40,.44,.17),'rubber',.04)
    for z in (1.781,1.816,1.851,1.886,1.921):
        C.cube('Seat air bellows convolution',(1.03,-.07,z),(.44,.48,.017),'softblack',.022)
    for y in (-.29,.15):
        C.beam('Seat scissor suspension link',( .81,y,1.77),(1.23,y,1.96),.017,'steel')
        C.beam('Seat scissor suspension crosslink',(1.23,y,1.77),(.81,y,1.96),.017,'steel')
        C.cyl('Seat scissor pivot',(1.02,y,1.865),.027,.022,'chrome','Y')
    seat=C.empty('CTRL • Pneumatic suspended operator seat',(1.03,-.07,1.965))
    C.cube('Seat sliding carriage',(1.03,-.07,1.959),(.48,.52,.047),'graphite',.018,seat)
    C.cube('Operator seat cushion',(1.00,-.07,2.035),(.56,.55,.13),'fabric',.079,seat)
    C.cube('Seat textured center cushion',(.953,-.07,2.105),(.38,.34,.016),
           'cab_seat_insert',.04,seat)
    back=C.cube('Operator seat contoured backrest',(1.299,-.07,2.307),
                (.135,.552,.530),'fabric',.088,seat)
    back.rotation_euler[1]=-.12
    C.cube('Seat back center insert',(1.221,-.07,2.308),(.018,.35,.389),
           'cab_seat_insert',.036,seat)
    for side in (-1,1):
        C.sphere('Seat lateral lumbar bolster',(1.21,-.07+side*.219,2.29),
                 (.078,.060,.224),'fabric',seat)
    C.beam('Left headrest stainless post',(1.329,-.22,2.53),(1.344,-.22,2.658),.013,'chrome',seat)
    C.beam('Right headrest stainless post',(1.329,.08,2.53),(1.344,.08,2.658),.013,'chrome',seat)
    C.cube('Adjustable head restraint',(1.346,-.07,2.659),(.139,.39,.158),'fabric',.062,seat)
    # True stitch paths and fluted upholstery are visible in the close shot.
    for yy in (-.244,.104):
        C.tube('Seat cushion double-stitched seam',[(.739,yy,2.08),(.86,yy,2.106),
               (1.05,yy,2.111),(1.183,yy,2.08)],.0023,'cab_stitch',seat)
        C.beam('Seat back sewn seam',(1.207,yy,2.125),(1.207,yy,2.488),.0022,'cab_stitch',seat)
    for zz in (2.19,2.255,2.32,2.385,2.45):
        C.beam('Seat center upholstery stitched flute',(1.207,-.222,zz),
               (1.207,.082,zz),.0028,'cab_stitch',seat)
    C.tube('Retractable seat belt webbing',[(1.14,.226,2.082),(.91,.19,2.125),
           (.85,-.03,2.13),(.85,-.27,2.105)],.012,'softblack',seat)
    C.cube('Seat belt latch red release',(.88,-.32,2.061),(.065,.048,.024),'red',.007,seat)
    C.cube('Seat height adjustment switch',(1.00,-.358,1.98),(.10,.029,.028),'graphite',.007,seat)
    C.key_loc(seat,2,[(1,1.965),(28,1.951),(45,1.970),(61,1.955),
                      (82,1.965),(102,1.954),(130,1.965),(360,1.965)])
    for side in (-1,1):
        yy=-.07+side*.333
        C.beam('Seat armrest vertical mount',(1.25,yy,2.07),(1.25,yy,2.26),.017,'graphite',seat)
        C.cube('Operator padded armrest',(1.05,yy,2.275),(.44,.12,.058),'softblack',.026,seat)

    # Right-hand command console carries joystick, tactile switches and screen.
    console=C.cube('Right-hand command console',(.83,.443,2.018),(.86,.34,.226),'graphite',.063)
    C.cube('Command console soft-touch upper surface',(.80,.448,2.14),
           (.84,.333,.030),'softblack',.025)
    C.beam('Display articulated lower arm',(.65,.54,2.11),(.51,.57,2.33),.020,'graphite')
    C.beam('Display articulated upper arm',(.51,.57,2.33),(.35,.52,2.425),.016,'steel')
    make_display('ISOBUS touchscreen',(.344,.480,2.473),.365,.260)
    joysticks=[]
    for i,(x,y,z) in enumerate(((.71,.43,2.164),(1.065,.44,2.164))):
        C.cube('Joystick flexible gaiter '+str(i),(x,y,z),(.12,.115,.055),'rubber',.024)
        for h in range(3):
            C.cube('Joystick bellows rib',(x,y,z+.012+h*.011),(.12-h*.01,.115-h*.01,.008),
                   'softblack',.014)
        joy=C.empty('CTRL • '+('Multifunction drive joystick' if i==0 else 'Hydraulic implement joystick'),(x,y,z+.027))
        C.beam('Joystick ergonomic stem',(x,y,z+.025),(x-.018,y,z+.157),.017,'graphite',joy)
        C.sphere('Joystick shaped palm grip',(x-.022,y,z+.170),(.037,.042,.061),'rubber',joy)
        C.cube('Joystick thumb switch',(x-.022,y-.032,z+.20),(.031,.014,.029),
               'amber' if i==0 else 'cab_green',.007,joy)
        C.cyl('Joystick top function key',(x-.022,y,z+.228),.012,.005,'steel','Z',20,joy,.002)
        if i==0:
            C.cube('Multifunction joystick angled thumb panel',(x-.010,y,z+.209),
                   (.049,.106,.104),'graphite',.014,joy)
            for j in range(6):
                yy=y+(j%2-.5)*.039;zz=z+.179+(j//2)*.031
                C.cube('Joystick illuminated function switch %02d'%j,
                       (x+.019,yy,zz),(.009,.025,.020),
                       'red' if j==0 else 'amber' if j==1 else 'screen',.004,joy)
                C.cube('Joystick function key white legend',(x+.025,yy,zz),
                       (.001,.010,.002),'label',.001,joy)
        C.key_rot(joy,1,[(1,0),(25,-.16),(48,.08),(64,0),(145,0),(159,-.17),(173,0),(360,0)])
        joysticks.append(joy)
    for i in range(6):
        x=.473+(i%3)*.075; y=.378+(i//3)*.099
        C.cube('Command panel tactile button %02d'%i,(x,y,2.165),(.052,.064,.020),
               ('red' if i==0 else 'amber' if i==1 else 'graphite'),.009)
        C.cube('Command panel button symbol',(x,y,2.178),(.021,.006,.002),'label',.001)
    C.cyl('Electronic hitch depth rotary control',(1.155,.466,2.18),.034,.044,'graphite')
    C.cube('Hitch knob marker',(1.147,.466,2.204),(.029,.004,.003),'label',.001)
    C.text_obj('Console hitch control marking','HITCH',(1.114,.398,2.16),.018,
               'label',rotation=(0,0,pi/2))
    C.cube('Implement function switch bank',(.845,.618,2.079),(.72,.023,.069),
           'softblack',.008)
    for n in range(12):
        xx=.532+n*.055
        C.cube('Numbered hydraulic function key %02d'%n,(xx,.635,2.081),
               (.041,.012,.044),'amber' if n<3 else 'screen' if n>8 else 'graphite',.006)
        C.cube('Hydraulic key raised indicator',(xx,.644,2.083),(.019,.002,.020),'label',.002)
    # Cup well includes a rim, dark recess, retaining tabs and thermos.
    C.cyl('Console cupholder molded socket',(1.41,.43,2.075),.084,.15,'graphite')
    C.cyl('Cupholder dark interior',(1.41,.43,2.153),.066,.003,'black')
    C.torus('Cupholder rubber edge',(1.41,.43,2.154),.074,.010,'rubber',major_segments=40)
    C.cyl('Operator insulated flask',(1.41,.43,2.23),.043,.18,'steel')
    C.cyl('Flask dark lid',(1.41,.43,2.326),.045,.025,'rubber')
    for y in (-.585,.585):
        C.tube('Cab entry safety grab rail',[(.016,y,2.02),(.071,y,2.10),
               (.114,y,2.57),(.082,y,2.67)],.016,'graphite')

    # A compact instructor seat folds up into the left rear side of the cab.
    # Its cushion rotates on the rear hinge; the back and mounting stay fixed.
    C.cube('Instructor seat side mounting panel',(1.40,-.519,1.882),
           (.18,.252,.336),'cab_trim',.031)
    C.cube('Instructor seat fixed backrest',(1.476,-.519,2.30),
           (.075,.247,.43),'fabric',.048)
    C.cube('Instructor seat back inset',(1.432,-.519,2.306),
           (.014,.184,.305),'cab_seat_insert',.022)
    for zz in (2.21,2.28,2.35,2.42):
        C.beam('Instructor seat stitched detail',(1.422,-.598,zz),
               (1.422,-.44,zz),.0022,'cab_stitch')
    C.beam('Instructor seat folding hinge axle',(1.402,-.657,2.047),
           (1.402,-.379,2.047),.018,'steel')
    jumpseat=C.empty('CTRL • Folding instructor seat cushion',(1.402,-.519,2.047))
    C.cube('Instructor seat folding steel pan',(1.246,-.519,2.05),
           (.313,.254,.032),'graphite',.025,jumpseat)
    C.cube('Instructor seat folding cushion',(1.247,-.519,2.086),
           (.308,.248,.062),'fabric',.039,jumpseat)
    C.tube('Instructor cushion sewn border',[(1.116,-.615,2.11),(1.106,-.519,2.12),
           (1.116,-.423,2.11),(1.365,-.423,2.11)],.002,'cab_stitch',jumpseat)
    C.key_rot(jumpseat,1,[(1,pi/2),(180,pi/2),(200,0),(245,0),(274,pi/2),(360,pi/2)])

    # Working clutch, independently linked brake pedals, and accelerator.
    pedals=[]
    for i,(y,width) in enumerate(((-.35,.105),(.00,.078),(.115,.078),(.295,.078))):
        pivot=C.empty('CTRL • '+('Clutch pedal','Left brake pedal','Right brake pedal','Accelerator pedal')[i],
                      (.135,y,1.941))
        C.beam('Pedal suspended steel lever',(.135,y,1.941),(.37,y,1.775),.013,'steel',pivot)
        pedal=C.cube('Pedal rubber pad',(.379,y,1.774),(.14,width,.026),'rubber',.012,pivot)
        pedal.rotation_euler[1]=-.36
        for t in range(4):
            C.cube('Pedal rubber anti-slip rib',(.331+t*.028,y,1.793+t*.010),
                   (.009,width*.85,.005),'softblack',.001,pivot)
        C.key_rot(pivot,1,[(1,0),(20,.18 if i==3 else 0),(57,.18 if i==3 else 0),
                           (72,0),(112,.20 if i in (1,2) else 0),(125,0),(360,0)])
        pedals.append(pivot)
    C.beam('Split brake pedal mechanical latch',(.379,.035,1.804),(.379,.084,1.804),.006,'steel')

    # Small functional pieces often missed in a cab model.
    C.cube('Cab rear storage box',(1.588,.09,1.91),(.19,.80,.28),'graphite',.035)
    C.cube('Rear storage lid',(1.588,.09,2.061),(.21,.83,.032),'softblack',.015)
    C.cube('Rear storage latch',(1.476,.09,2.015),(.013,.07,.035),'steel',.004)
    C.cyl('Fire extinguisher body',(1.46,.61,1.88),.053,.27,'red')
    C.cyl('Fire extinguisher neck',(1.46,.61,2.030),.021,.038,'steel')
    C.cube('Fire extinguisher handle',(1.46,.61,2.065),(.095,.030,.020),'graphite',.005)
    C.tube('Fire extinguisher hose',[(1.48,.61,2.044),(1.53,.61,2.0),
           (1.53,.61,1.80)],.008,'rubber')
    C.cube('Ceiling climate-control panel',(.34,0,2.958),(.34,.32,.03),'graphite',.02)
    for y in (-.083,.083):
        C.cyl('Overhead climate dial',(.34,y,2.933),.030,.019,'rubber')
        C.cube('Overhead dial index',(.33,y,2.922),(.018,.004,.004),'label',.001)
    for y in (-.43,.43):
        C.cube('Ceiling directional vent',(.61,y,2.957),(.15,.12,.027),'rubber',.023)
        for n in range(4):
            C.cube('Ceiling air vent slat',(.565+n*.029,y,2.939),(.010,.089,.008),'graphite',.002)
    C.cube('Ceiling courtesy lamp',(1.19,0,2.958),(.12,.23,.017),'light',.015)
    C.cube('Fold-down sun visor',(.17,0,2.911),(.027,.88,.114),'graphite',.019)
    bolts('Floor access',[(.01,-.57,1.703),(.01,.57,1.703),(1.54,-.57,1.703),
                         (1.54,.57,1.703)])
    return {'door':door,'wiper':wiper,'steering':steering,'seat':seat,
            'joysticks':joysticks,'pedals':pedals,'beacons':beacons,'jumpseat':jumpseat}
