"""Compare actual TopoExport export to OSM in their common UTM 50N extent."""
import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.path import Path as PlotPath
from matplotlib.patches import PathPatch
from shapely.geometry import shape, Polygon, box, mapping
from shapely.ops import transform, unary_union
from shapely import make_valid
from pyproj import Transformer

ROOT = Path(__file__).parent
read = lambda p: json.loads(p.read_text(encoding='utf8'))
osm = read(ROOT / 'osm-baseline.geojson')
export = read(ROOT / 'topoexport/buildings_3d_Buildings_Overture.geojson')
frame = Polygon(read(ROOT / 'topoexport/frame.geojson')['features'][0]['geometry']['coordinates'])
to_utm = Transformer.from_crs(4326, 32650, always_xy=True).transform
to_wgs = Transformer.from_crs(32650, 4326, always_xy=True).transform
extent = transform(to_utm, box(*osm['metadata']['displayBounds'])).intersection(frame)

def polygons(geom):
    if geom.geom_type == 'Polygon': return [geom]
    return [p for g in getattr(geom, 'geoms', []) for p in polygons(g)]

os = [p for f in osm['features'] if f['properties']['kind']=='building'
      for p in polygons(make_valid(transform(to_utm, shape(f['geometry']))).intersection(extent)) if p.area > 1]
ts = [p for f in export['features'] for p in polygons(make_valid(shape(f['geometry'])).intersection(extent)) if p.area > 1]
ou, tu = unary_union(os), unary_union(ts)
missing, partial, matched = [], [], []
for p in ts:
    ratio = p.intersection(ou).area / p.area
    (missing if ratio < .1 else partial if ratio < .8 else matched).append(p)
core = next(transform(to_utm,shape(f['geometry'])) for f in osm['features'] if f['properties']['kind']=='boundary')
stats = dict(export_features=len(export['features']), common_extent_m2=round(extent.area),
             osm_polygons=len(os), topo_polygons=len(ts),
             topo_less_than_10_percent_overlap=len(missing),
             topo_10_to_80_percent_overlap=len(partial), topo_at_least_80_percent_overlap=len(matched),
             osm_covered_area_m2=round(ou.area),topo_covered_area_m2=round(tu.area),
             topo_area_outside_osm_m2=round(tu.difference(ou).area),
             osm_area_outside_topo_m2=round(ou.difference(tu).area),
             missing_inside_core=sum(p.representative_point().within(core) for p in missing))
(ROOT/'statistics.json').write_text(json.dumps(stats,indent=2),encoding='utf8')
(ROOT/'candidate-missing.geojson').write_text(json.dumps(dict(type='FeatureCollection',features=[
    dict(type='Feature',properties=dict(id=i+1,area_m2=round(p.area),status='candidate-only',source='TopoExport / Overture Buildings 2026'),geometry=mapping(transform(to_wgs,p))) for i,p in enumerate(missing)
]),ensure_ascii=False),encoding='utf8')

def draw(ax, geoms, color, alpha=1):
    for poly in geoms:
        vertices, codes = [], []
        from shapely.geometry.polygon import orient
        poly=orient(poly)
        for ring in [poly.exterior,*poly.interiors]:
            coords=list(ring.coords);vertices.extend(coords)
            codes.extend([PlotPath.MOVETO]+[PlotPath.LINETO]*(len(coords)-2)+[PlotPath.CLOSEPOLY])
        ax.add_patch(PathPatch(PlotPath(vertices,codes),facecolor=color,edgecolor=color,lw=.2,alpha=alpha))
fig, axes = plt.subplots(1,3,figsize=(18,8),layout='constrained')
for ax,title in zip(axes,['Current OSM footprints','TopoExport / Overture 2026','Comparison: gray OSM / red candidates']):
    ax.set_title(title,fontsize=12,pad=15);ax.set_aspect('equal');ax.set_facecolor('#f5f4ef')
    a,b,c,d=extent.bounds;ax.set_xlim(a,c);ax.set_ylim(b,d);ax.ticklabel_format(useOffset=False,style='plain');ax.tick_params(labelsize=7,rotation=45)
    ax.set_xlabel('UTM 50N easting (m)');ax.plot(*core.exterior.xy,color='#159174',lw=1,ls='--')
draw(axes[0],os,'#6b8092');draw(axes[1],ts,'#8c795b');draw(axes[2],os,'#b7bbb7');draw(axes[2],missing,'#d64b40');draw(axes[2],partial,'#e3a447',.75)
fig.suptitle('Sanfang Qixiang | same extent, EPSG:32650 | dashed line: OSM core boundary',fontsize=16)
fig.savefig(ROOT/'building-comparison.png',dpi=180)
print(json.dumps(stats,indent=2))
