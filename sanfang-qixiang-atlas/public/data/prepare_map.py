"""Convert the included OSM snapshot to a small, attributed GeoJSON extract.

Coordinates stay in WGS84. Heights and roof forms are intentionally not inferred.
Run from the project root: python public/data/prepare_map.py
"""
import json
import math
import pathlib
import xml.etree.ElementTree as ET
from collections import Counter

HERE = pathlib.Path(__file__).parent
BBOX = [119.28755, 26.0810, 119.2958, 26.0891]
ORIGIN = [119.2916, 26.085]
root = ET.parse(HERE / 'osm-source.xml').getroot()
nodes = {n.attrib['id']: [float(n.attrib['lon']), float(n.attrib['lat'])] for n in root.findall('node')}
ways = {w.attrib['id']: w for w in root.findall('way')}

def tags(e):
    return {t.attrib['k']: t.attrib['v'] for t in e.findall('tag')}

def coords(w):
    return [nodes[n.attrib['ref']] for n in w.findall('nd') if n.attrib['ref'] in nodes]

def in_box(p):
    return BBOX[0] <= p[0] <= BBOX[2] and BBOX[1] <= p[1] <= BBOX[3]

def polygon_clip(ring):
    points = ring[:-1] if ring and ring[0] == ring[-1] else ring[:]
    for axis, bound, greater in [(0, BBOX[0], True), (0, BBOX[2], False), (1, BBOX[1], True), (1, BBOX[3], False)]:
        output = []
        for i, q in enumerate(points):
            p = points[i - 1]
            pi = p[axis] >= bound if greater else p[axis] <= bound
            qi = q[axis] >= bound if greater else q[axis] <= bound
            if pi != qi:
                fraction = (bound - p[axis]) / (q[axis] - p[axis])
                output.append([round(p[j] + fraction * (q[j] - p[j]), 7) for j in range(2)])
            if qi:
                output.append(q)
        points = output
        if not points:
            return []
    return points + [points[0]] if len(points) >= 3 else []

def line_clip(points):
    parts, current = [], []
    for a, b in zip(points, points[1:]):
        dx, dy = b[0] - a[0], b[1] - a[1]
        lo, hi, valid = 0.0, 1.0, True
        for p, q in [(-dx, a[0] - BBOX[0]), (dx, BBOX[2] - a[0]), (-dy, a[1] - BBOX[1]), (dy, BBOX[3] - a[1])]:
            if abs(p) < 1e-15:
                if q < 0:
                    valid = False
                    break
            elif p < 0:
                lo = max(lo, q / p)
            else:
                hi = min(hi, q / p)
        if not valid or lo > hi:
            if len(current) >= 2:
                parts.append(current)
            current = []
            continue
        start = [round(a[0] + lo * dx, 7), round(a[1] + lo * dy, 7)]
        end = [round(a[0] + hi * dx, 7), round(a[1] + hi * dy, 7)]
        if current and current[-1] == start:
            current.append(end)
        else:
            if len(current) >= 2:
                parts.append(current)
            current = [start, end]
    if len(current) >= 2:
        parts.append(current)
    return parts

def inside(p, ring):
    result = False
    for a, b in zip(ring, ring[1:]):
        if (a[1] > p[1]) != (b[1] > p[1]) and p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]:
            result = not result
    return result

core = coords(ways['665970875'])
features = []

def add(osm_id, kind, geometry, properties):
    data = dict(properties)
    data.update(kind=kind, osmId=osm_id, source='OpenStreetMap', sourceUrl='https://www.openstreetmap.org/' + osm_id)
    if kind == 'building':
        pts = geometry['coordinates'][0]
        center = [sum(p[i] for p in pts) / len(pts) for i in range(2)]
        data['inHistoricCore'] = inside(center, core)
    features.append({'type': 'Feature', 'id': osm_id, 'properties': data, 'geometry': geometry})

for wid, w in ways.items():
    t, pts = tags(w), coords(w)
    if wid == '665970875':
        add('way/' + wid, 'boundary', {'type': 'Polygon', 'coordinates': [core]}, dict(t, name='三坊七巷核心区'))
    elif t.get('highway'):
        # These two mapped carriageways are Yangqiao East Road, historically Yangqiao Alley.
        if wid in ['304477292', '304538184', '801847604']:
            t['name'] = '杨桥东路'
            t['historic_name'] = '杨桥巷'
            t['nameSource'] = 'UNESCO / Sanfang Qixiang street layout'
        for i, part in enumerate(line_clip(pts)):
            add('way/' + wid, 'road', {'type': 'LineString', 'coordinates': part}, t)
    elif t.get('building') or t.get('natural') == 'water' or t.get('waterway') or t.get('landuse') == 'grass' or t.get('leisure') in ['garden', 'park']:
        if len(pts) < 3 or pts[0] != pts[-1]:
            continue
        ring = polygon_clip(pts)
        if not ring:
            continue
        kind = 'building' if t.get('building') else 'water' if t.get('natural') == 'water' or t.get('waterway') else 'park'
        add('way/' + wid, kind, {'type': 'Polygon', 'coordinates': [ring]}, t)

def relation_rings(rel, role):
    segments = []
    for m in rel.findall('member'):
        if m.attrib.get('type') == 'way' and m.attrib.get('role', '') in ([role, ''] if role == 'outer' else [role]) and m.attrib['ref'] in ways:
            segments.append(coords(ways[m.attrib['ref']]))
    rings = []
    while segments:
        ring = segments.pop(0)
        changed = True
        while ring and ring[0] != ring[-1] and changed:
            changed = False
            for i, other in enumerate(segments):
                if ring[-1] == other[0]:
                    ring += other[1:]
                elif ring[-1] == other[-1]:
                    ring += list(reversed(other[:-1]))
                elif ring[0] == other[-1]:
                    ring = other[:-1] + ring
                elif ring[0] == other[0]:
                    ring = list(reversed(other[1:])) + ring
                else:
                    continue
                segments.pop(i)
                changed = True
                break
        if ring and ring[0] == ring[-1]:
            clipped = polygon_clip(ring)
            if clipped:
                rings.append(clipped)
    return rings

# Preserve the real courtyard openings in OSM multipolygon buildings.
for rel in root.findall('relation'):
    t = tags(rel)
    if not t.get('building') or t.get('type') != 'multipolygon':
        continue
    rings = relation_rings(rel, 'outer')
    inner = relation_rings(rel, 'inner')
    for i, ring in enumerate(rings):
        holes = [hole for hole in inner if inside(hole[0], ring)]
        add('relation/' + rel.attrib['id'], 'building', {'type': 'Polygon', 'coordinates': [ring] + holes}, dict(t, component=i, courtyardCount=len(holes)))

counts = dict(Counter(f['properties']['kind'] for f in features))
geojson = {
    'type': 'FeatureCollection', 'bbox': BBOX,
    'metadata': {
        'title': '三坊七巷 OpenStreetMap 实际街巷与建筑轮廓',
        'origin': ORIGIN, 'displayBounds': BBOX, 'bounds': BBOX,
        'coordinateSystem': 'WGS84 / EPSG:4326',
        'downloadedAt': '2026-09-20',
        'sourceUrl': 'https://api.openstreetmap.org/api/0.6/map?bbox=119.286,26.081,119.296,26.091',
        'attribution': '© OpenStreetMap contributors',
        'license': 'ODbL-1.0', 'licenseUrl': 'https://www.openstreetmap.org/copyright',
        'counts': counts,
        'note': '街道及建筑平面轮廓为公开地图数据；渲染中的高度、屋顶、材质及装饰为风格化示意。非测绘或实时导航产品。'
    },
    'features': features
}
(HERE / 'map.geojson').write_text(json.dumps(geojson, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(json.dumps(counts))
