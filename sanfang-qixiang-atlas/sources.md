# 三坊七巷地图与内容来源

采集日期：2026-09-20。坐标全部使用 **WGS84 / EPSG:4326**。国内商业地图常用 GCJ-02 / BD-09，不应把其原始坐标直接叠加在本数据上。

## 地图数据

- [OpenStreetMap 地图 API 原始快照](https://api.openstreetmap.org/api/0.6/map?bbox=119.286,26.081,119.296,26.091)，保存在 `public/data/osm-source.xml`。
- `public/data/map.geojson` 由 `public/data/prepare_map.py` 转换，保留 901 个建筑 Polygon、107 条道路 LineString、4 个水体 Polygon、1 个绿地 Polygon、1 个核心区 Polygon。199 个建筑 Polygon 保留了共 294 个内院孔洞。一个 OSM relation 可拆成多个 Polygon，所以数量不是独立门牌数。
- 显示范围为 `[119.28755, 26.0810, 119.2958, 26.0891]`，包括街区南侧的林则徐纪念馆、核心区西北角、吉庇巷与八一七北路交点，全部 19 个游览点位位于此范围内。展示原点为 `[119.2916, 26.085]`，x 向东、z 向南。
- 核心区边界来自 [OSM way 665970875](https://www.openstreetmap.org/way/665970875)，是 OSM 社区标注范围，不是法定保护范围图。
- 主要道路几何使用 OSM 原始中心线；仅在显示范围边缘裁剪。杨桥东路部分原始 way 缺失道路名称，结合公开街区资料补充名称，几何未人工调整。
- 建筑平面轮廓来自 OSM；建筑高度、屋顶形式、屋瓦、墙色、树木、灯笼等展示效果为艺术化建模，不是实景扫描或测绘复原。
- 地图数据署名：**© OpenStreetMap contributors**。许可：[Open Database License（ODbL）](https://www.openstreetmap.org/copyright)。地图界面应保留可见署名与许可入口。

Overpass 主站及部分备用端点访问失败，本项目改用成功返回数据的 OSM 官方地图 API。未依赖商业地图密钥。

## 街区格局核实

1. [UNESCO World Heritage Centre：SanFangQiXiang，预备名单 5808](https://whc.unesco.org/en/tentativelists/5808/)。核实南后街为南北轴线，三坊在西、七巷在东，整体鱼骨状街巷格局，以及院落、私家园林等建筑特点。该网页所列经纬度明显指向厦门，与正文福州位置矛盾，因此**不采用该坐标**。
2. [Wikipedia：Sanfang Qixiang](https://en.wikipedia.org/wiki/Sanfang_Qixiang)。核实北界杨桥路、西界通湖路、东界八一七路、南界光禄坊。
3. [维基百科：三坊七巷](https://zh.wikipedia.org/wiki/三坊七巷)。核实古建筑地址及基本历史，文字已重新组织为简短游览介绍。原页面引用《三坊七巷志》等文献。页面文本许可为 CC BY-SA 4.0。

从北向南，西侧为衣锦坊、文儒坊、光禄坊；东侧为杨桥巷、郎官巷、塔巷、黄巷、安民巷、宫巷、吉庇巷。杨桥巷已拓宽为杨桥路；光禄坊和吉庇巷也有拓宽路段。

## 重点点位

| 点位 | 地址 / 坐标依据 | 精度说明 |
| --- | --- | --- |
| 南后街 | [OSM way 277984477](https://www.openstreetmap.org/way/277984477) | 道路中心线上的游览标记 |
| 严复故居 | 郎官巷20号；[OSM node 12448328562](https://www.openstreetmap.org/node/12448328562) | OSM 专名点位 |
| 林觉民·冰心故居 | 杨桥东路17号；[OSM relation 11015502](https://www.openstreetmap.org/relation/11015502) | OSM 建筑群内标记 |
| 水榭戏台 | 衣锦坊4号；[OSM node 13253369877](https://www.openstreetmap.org/node/13253369877) | OSM 专名点位 |
| 林则徐纪念馆 | 澳门路16号；[OSM way 705649920](https://www.openstreetmap.org/way/705649920)，地图名为林文忠公祠 | OSM 场地中心 |
| 福建非遗博览苑 | 南后街82号；[OSM node 13912082402](https://www.openstreetmap.org/node/13912082402) | OSM 专名点位 |
| 小黄楼 | 公开文献核实为黄巷36号 | **近似街段标记**，本次未取得有专名的精确地图点位；不表示入口或地籍位置 |
| 二梅书屋 | 公开文献核实为郎官巷25号 | **近似街段标记**，本次未取得有专名的精确地图点位 |
| 光禄吟台 | 公开文献核实与光禄坊名称及程师孟题咏有关 | **近似街段标记**，未核实独立园林边界；园林模型只能作为示意 |

每个 `places.json` 条目均保留 `source` 和 `coordinateAccuracy`。标注 `approximate` 的地点，应在地点详情中说明“位置示意”。三坊七巷并无完整、统一的实时开放信息，本项目不声称门票、营业时间或馆内展陈为实时信息；建议停留时长是产品编辑建议。
