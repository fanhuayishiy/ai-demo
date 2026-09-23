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

## 景点实景照片与爱心树

新增爱心树游览点，共 20 处景点。爱心树采用心形双叶树冠、分叉树干、板根与下垂气根；位置为南后街 OSM 中心线附近示意，不是实测坐标。

详情照片来自 Wikimedia Commons，作者、来源与独立许可记录于 `data/photos.json`，并在详情及大图中展示。照片经过缩放和 JPEG 压缩，预览按容器裁切，大图保持完整比例。照片不适用项目代码的 MIT 许可；按各自 CC BY-SA 许可使用。

| 景点 ID | 照片 / 原始来源 | 作者 | 许可 |
| --- | --- | --- | --- |
| anmin | [安民巷街景](https://commons.wikimedia.org/wiki/File:%E5%AE%89%E6%B0%91%E5%B7%B7%E5%8D%97%E5%90%8E%E8%A1%97%E4%B8%9C.jpg) | 董辰兴 | CC BY-SA 4.0 |
| bingxin | [林觉民·冰心故居](https://commons.wikimedia.org/wiki/File:Former_Residence_of_Lin_Juemin%2C_2019-09-29_05.jpg) | Siyuwj | CC BY-SA 4.0 |
| ermei | [二梅书屋](https://commons.wikimedia.org/wiki/File:Ermei_House%2C_2019-09-29_02.jpg) | Siyuwj | CC BY-SA 4.0 |
| gongxiang | [宫巷街景](https://commons.wikimedia.org/wiki/File:Gung-haeng.jpg) | LuHungnguong | CC BY-SA 3.0 |
| guanglu | [光禄坊刘家大院](https://commons.wikimedia.org/wiki/File:Residence_of_Liu_Family_at_Guanglu_Lane%2C_2019-09-29_01.jpg) | Siyuwj | CC BY-SA 4.0 |
| guanglu-garden | [光禄吟台所在的玉尺山园林](https://commons.wikimedia.org/wiki/File:%E7%A6%8F%E5%B7%9E%E5%8D%97%E5%90%8E%E8%A1%97%E7%8E%89%E5%B0%BA%E5%B1%B1%EF%BC%88%E7%9F%B3%E5%88%BB%E3%80%81%E5%8F%A4%E6%B1%A0%E3%80%81%E6%A1%A5%EF%BC%89_-_panoramio.jpg) | 中国郑开亮 | CC BY-SA 3.0 |
| heart-tree | [南后街爱心树 · 2023年8月](https://commons.wikimedia.org/wiki/File:Tree_of_Heart%2C_Sanfang_Qixiang_20230825.jpg) | JULIANISME | CC BY-SA 4.0 |
| huangxiang | [黄巷入口](https://commons.wikimedia.org/wiki/File:%E9%BB%84%E5%B7%B7%E5%85%A5%E5%8F%A3.jpg) | 徐然宽 | CC BY-SA 3.0 |
| intangible | [非遗博览苑所在的叶氏民居](https://commons.wikimedia.org/wiki/File:Residence_of_Ye_Family_at_Nanhou_Street%2C_2019-09-29_01.jpg) | Siyuwj | CC BY-SA 4.0 |
| jipi | [吉庇巷谢家祠](https://commons.wikimedia.org/wiki/File:Ancestral_Home_of_Xie_Family_at_Jibi_Alley%2C_2019-09-31.jpg) | Siyuwj | CC BY-SA 4.0 |
| langguan | [郎官巷街景](https://commons.wikimedia.org/wiki/File:Langguan_alley.JPG) | Fanghong | CC BY-SA 3.0 |
| linzexu | [林则徐纪念馆 · 林文忠公祠屏门](https://commons.wikimedia.org/wiki/File:%E6%9E%97%E6%96%87%E5%BF%A0%E5%85%AC%E7%A5%A0%E5%B1%8F%E9%97%A8.jpg) | 董辰兴 | CC BY-SA 4.0 |
| nanhou | [南后街街景](https://commons.wikimedia.org/wiki/File:20231020_Nanhou_Jie.jpg) | Yumeto | CC BY-SA 4.0 |
| shuixie | [衣锦坊水榭戏台](https://commons.wikimedia.org/wiki/File:Water-side_Performing_Stage_at_Yijin_Lane%2C_2019-09-29_20.jpg) | Siyuwj | CC BY-SA 4.0 |
| taxiang | [塔巷入口](https://commons.wikimedia.org/wiki/File:%E5%A1%94%E5%B7%B7%E5%85%A5%E5%8F%A3.jpg) | 徐然宽 | CC BY-SA 3.0 |
| wenru | [文儒坊街景](https://commons.wikimedia.org/wiki/File:Wenlufang_in_Fuzhou_in_March_21%2C2015.JPG) | 中國之新民（THE NEW CITIZEN OF CHINA） | CC BY-SA 3.0 |
| xiaohuang | [黄巷小黄楼](https://commons.wikimedia.org/wiki/File:House_of_Huang_Family_at_Huang_Alley%2C_2019-09-29_27.jpg) | Siyuwj | CC BY-SA 4.0 |
| yanfu | [严复故居](https://commons.wikimedia.org/wiki/File:Former_Residence_of_Yan_Fu_in_Langguan_Alley%2C_2019-09-29_03.jpg) | Siyuwj | CC BY-SA 4.0 |
| yangqiao | [杨桥路沿线 · 林觉民故居](https://commons.wikimedia.org/wiki/File:Former_Residence_of_Lin_Juemin%2C_2019-09-29_05.jpg) | Siyuwj | CC BY-SA 4.0 |
| yijin | [衣锦坊欧阳氏民居](https://commons.wikimedia.org/wiki/File:Residence_of_Ouyang_Family_at_Yijin_Lane%2C_2019-09-29.jpg) | Siyuwj | CC BY-SA 4.0 |

## TopoExport 建筑布局核对（2026-09-23）

已登录 TopoExport 并导出免费的 Raw Formats → GeoJSON → Buildings。预览注明来源为 **Overture Buildings 2026**；导出附带 LICENSE.txt 指定 ODbL。原始文件为 EPSG:32650（UTM 50N），必须转换至 WGS84 后叠加，不能直接当经纬度。

共同覆盖面积约 0.672 km²，按共同范围裁切、拆分 Polygon 并排除 ≤1 m² 碎片后：OSM 899 个、TopoExport 1115 个；899 个原有轮廓得到匹配，另外 216 个与 OSM 的面积交集为零，其中 63 个代表点位于 OSM 核心区边界内。额外覆盖面积约 49,195 m²。缺口集中于西北侧、街区中部与南缘。该结果是两份地图的几何差异，不保证新增轮廓都是当前现存建筑，也不代表完整测绘结果。

项目保留原来的 901 个 OSM 建筑轮廓和庭院孔洞，补充 216 个轮廓，共 1117 个。之所以共同范围为 899，是另有 2 个 OSM 轮廓位于本次导出范围以外。没有用建筑数量替代栋数统计。

补充文件 `public/data/topoexport-supplement.geojson` 包含来源标识，由 `prepare_map.py` 一起装配到 `map.geojson`。原始导出、导出范围、许可、OSM 基线、比较脚本与对比图保存在 `comparison/`。只引入建筑平面，不导入导出文件中的高度。补充建筑沿用风格化高度与屋顶，街道及原有建筑几何不变。导出未保留 Overture 原始实体 ID，因此仅生成项目内追踪 ID，不冒充原始 ID。

来源：[TopoExport](https://app.topoexport.com/) · [Overture 署名说明](https://docs.overturemaps.org/attribution/) · [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/)。
