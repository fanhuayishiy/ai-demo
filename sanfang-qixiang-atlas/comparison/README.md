# 三坊七巷建筑布局对比

## TopoExport 建筑布局核对（2026-09-23）

已登录 TopoExport 并导出免费的 Raw Formats → GeoJSON → Buildings。预览注明来源为 **Overture Buildings 2026**；导出附带 LICENSE.txt 指定 ODbL。原始文件为 EPSG:32650（UTM 50N），必须转换至 WGS84 后叠加，不能直接当经纬度。

共同覆盖面积约 0.672 km²，按共同范围裁切、拆分 Polygon 并排除 ≤1 m² 碎片后：OSM 899 个、TopoExport 1115 个；899 个原有轮廓得到匹配，另外 216 个与 OSM 的面积交集为零，其中 63 个代表点位于 OSM 核心区边界内。额外覆盖面积约 49,195 m²。缺口集中于西北侧、街区中部与南缘。该结果是两份地图的几何差异，不保证新增轮廓都是当前现存建筑，也不代表完整测绘结果。

项目保留原来的 901 个 OSM 建筑轮廓和庭院孔洞，补充 216 个轮廓，共 1117 个。之所以共同范围为 899，是另有 2 个 OSM 轮廓位于本次导出范围以外。没有用建筑数量替代栋数统计。

补充文件 `public/data/topoexport-supplement.geojson` 包含来源标识，由 `prepare_map.py` 一起装配到 `map.geojson`。原始导出、导出范围、许可、OSM 基线、比较脚本与对比图保存在 `comparison/`。只引入建筑平面，不导入导出文件中的高度。补充建筑沿用风格化高度与屋顶，街道及原有建筑几何不变。导出未保留 Overture 原始实体 ID，因此仅生成项目内追踪 ID，不冒充原始 ID。

来源：[TopoExport](https://app.topoexport.com/) · [Overture 署名说明](https://docs.overturemaps.org/attribution/) · [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/)。

重新计算：安装 shapely、pyproj、matplotlib，运行 `python comparison/compare.py`。
