const street = {
    build(ctx) {
        const { THREE, scene, geo, add_lamp, add_point } = ctx;
        const group = geo.group(scene);
        const C = {
            asphalt: 0x43474c, curb: 0x8b8579, paving: 0x9a938a,
            concrete: 0x8f887e, wood: 0x8a6a4a, wood_dark: 0x5d4632,
            wood_red: 0x8a3a2e, post: 0x6b4f38, tin: 0x7a4a3a, tin_dark: 0x5d3a2e,
            brick: 0x5d4a42, steel: 0x5d6a70, dark: 0x2a2622,
            cream: 0xe8dcc4, white: 0xf2ede2, red: 0xb03830, brass: 0xb08d4a,
        };
        const nc = this.nc = { no_collide: true };
        this.road_material = new THREE.MeshStandardMaterial({ color: C.asphalt, roughness: 0.95, metalness: 0.03 });
        this.pave_material = new THREE.MeshStandardMaterial({ color: C.paving, roughness: 0.93, metalness: 0.02 });
        this.alley_material = new THREE.MeshStandardMaterial({ color: 0x777068, roughness: 0.96, metalness: 0.02 });
        this.bulb_material = new THREE.MeshBasicMaterial({ color: 0xffd9a0 });
        this.window_lit_material = new THREE.MeshBasicMaterial({ color: 0x4d3418 });
        this.window_dark_material = new THREE.MeshStandardMaterial({ color: 0x1c2430, roughness: 0.3, metalness: 0.4 });
        this.traffic_red = new THREE.MeshBasicMaterial({ color: 0xff3b2a });
        this.traffic_green = new THREE.MeshStandardMaterial({ color: 0x143a28, roughness: 0.4 });
        this.traffic_yellow = new THREE.MeshStandardMaterial({ color: 0x3a3214, roughness: 0.4 });

        // —— 基座与地面分区 ——
        geo.box(group, 0, -1.35, 0, 30.2, 0.7, 20.9, 0x3a332c);
        geo.box(group, 0, -0.75, 0, 30, 1.0, 20.7, 0x463c33);
        geo.box(group, 0, -0.13, 0, 29.8, 0.3, 20.5, 0x57493c);
        geo.box(group, 0, 0.015, 0, 29.6, 0.06, 20.3, 0x6a5c4d);
        geo.box(group, 0, 0.03, 7.95, 29.6, 0.05, 2.4, this.road_material);
        for (let i = 0; i < 24; i++) geo.box(group, -14.4 + i * 1.25, 0.058, 7.95, 0.55, 0.008, 0.07, 0xd8c690, { shadow: false, ...nc });
        geo.cylinder(group, 2.0, 0.055, 8.5, 0.5, 0.012, 0x565a5e, 18, nc);
        geo.cylinder(group, 2.0, 0.06, 8.5, 0.34, 0.012, 0x61656a, 18, nc);
        geo.box(group, 8.3, 0.056, 6.85, 0.85, 0.014, 0.42, 0x3a3e42, nc);
        for (let i = 0; i < 5; i++) geo.box(group, 8.3, 0.063, 6.71 + i * 0.07, 0.79, 0.008, 0.03, 0x2e3236, { shadow: false, ...nc });
        for (let i = 0; i < 7; i++) geo.box(group, 11.9, 0.058, 6.98 + i * 0.33, 1.7, 0.008, 0.2, 0xcfc9ba, { shadow: false, ...nc });
        geo.box(group, 0, 0.075, 6.77, 29.6, 0.13, 0.16, C.curb, nc);
        geo.box(group, 0, 0.028, 6.05, 29.6, 0.05, 1.36, this.pave_material);
        for (let i = 0; i < 34; i++) geo.box(group, -14.6 + i * 0.87, 0.055, 6.05, 0.03, 0.006, 1.3, 0x7b756c, { shadow: false, ...nc });
        geo.box(group, 0, 0.028, 9.8, 29.6, 0.05, 1.3, this.pave_material);
        geo.box(group, 0, 0.075, 9.17, 29.6, 0.13, 0.16, C.curb, nc);
        for (let i = 0; i < 34; i++) geo.box(group, -14.6 + i * 0.87, 0.055, 9.8, 0.03, 0.006, 1.24, 0x7b756c, { shadow: false, ...nc });
        geo.box(group, 0, 0.025, -2.25, 29.6, 0.05, 3.0, this.alley_material);
        for (let i = 0; i < 5; i++) {
            geo.cylinder(group, -11 + i * 5.4 + rng.next() * 1.6, 0.052, -1.4 + rng.next() * 1.9, 0.4 + rng.next() * 0.5, 0.008, 0x5d564e, 14, nc);
        }
        geo.box(group, 0.5, 0.05, -0.95, 0.95, 0.014, 0.5, 0x4a463f, nc);
        for (let i = 0; i < 4; i++) geo.box(group, 0.5, 0.058, -1.13 + i * 0.12, 0.88, 0.008, 0.05, 0x3a362f, { shadow: false, ...nc });
        geo.box(group, -1.65, 0.028, 2.3, 9.7, 0.05, 6.1, 0x837a6e);
        geo.box(group, -1.65, 0.052, 0.85, 8.3, 0.012, 1.5, 0x6d6157, nc);
        geo.box(group, 5.25, 0.028, 2.3, 4.2, 0.05, 6.1, 0x867d70);
        geo.box(group, -10.85, 0.028, 2.3, 8.6, 0.05, 6.1, 0x837a6e);

        // —— 拉面摊主体 ——
        for (const [px, pz] of [[-6.15, 3.25], [2.85, 3.25], [-6.15, -0.35], [2.85, -0.35]]) {
            geo.cylinder(group, px, 2.3, pz, 0.14, 4.6, C.post, 8);
            geo.cylinder(group, px, 0.06, pz, 0.24, 0.12, C.wood_dark, 8);
            geo.beam(group, [px, 4.35, pz], [px + (px < 0 ? 0.5 : -0.5), 4.72, pz + (pz > 1.5 ? 0.4 : -0.4)], 0.05, C.post);
        }
        const roof = geo.group(group, -1.65, 4.9, 1.45);
        roof.rotation.x = 0.184;
        geo.box(roof, 0, 0, 0, 10.1, 0.16, 4.62, C.tin);
        for (let i = 0; i < 12; i++) geo.box(roof, 0, 0.1, -2.1 + i * 0.382, 10.1, 0.05, 0.3, i % 2 ? C.tin_dark : 0x6e4234);
        geo.box(roof, 0, 0.1, 2.28, 10.1, 0.09, 0.22, 0x8a5240);
        // 招牌灯箱
        geo.box(group, -1.9, 4.7, 3.45, 5.4, 0.7, 0.34, C.wood_dark);
        this.sign_back_material = new THREE.MeshStandardMaterial({ color: 0x241a14, roughness: 0.6, emissive: 0xff9a40, emissiveIntensity: 0.02 });
        geo.box(group, -1.9, 4.7, 3.3, 5.16, 0.5, 0.08, this.sign_back_material);
        this.sign_material = geo.label(group, '深 夜 拉 面', -1.9, 4.7, 3.24, 5.1, 0.62, { background: '#2a1810', color: '#ffd9a0', border: '#5d3a22', glow: '#ff9a40', emissive: 0.85 });
        geo.box(group, -1.9, 4.32, 3.45, 5.6, 0.1, 0.4, C.wood_dark);
        // 灯笼横杆与吊架
        for (const bx of [-2.1, 0.5]) geo.box(group, bx, 4.2, 3.82, 0.09, 0.36, 0.09, C.post, nc);
        geo.box(group, -0.8, 4.02, 4.2, 3.4, 0.09, 0.09, C.post, nc);
        for (let i = 0; i < 5; i++) geo.box(group, -2.0 + i * 0.6, 3.95, 4.2, 0.05, 0.12, 0.05, 0x3d332c, nc);
        // 串灯
        geo.beam(group, [-6.3, 4.42, 3.52], [-1.7, 4.27, 3.56], 0.025, 0x2e2a26, nc);
        geo.beam(group, [-1.7, 4.27, 3.56], [2.9, 4.42, 3.52], 0.025, 0x2e2a26, nc);
        for (let i = 0; i < 12; i++) {
            const t = i / 11;
            const bx = -6.3 + t * 9.2;
            const by = 4.42 - Math.sin(t * Math.PI) * 0.15;
            geo.box(group, bx, by - 0.09, 3.56, 0.1, 0.14, 0.1, this.bulb_material, { shadow: false, ...nc });
        }
        // 柜台
        geo.box(group, -1.7, 0.6, 2.14, 8.2, 1.14, 1.12, C.wood);
        geo.box(group, -1.7, 1.225, 2.16, 8.44, 0.13, 1.26, 0x9a7a56);
        geo.box(group, -4.1, 0.62, 2.66, 3.4, 1.1, 0.16, C.wood_red);
        geo.box(group, 1.4, 0.62, 2.66, 2.0, 1.1, 0.16, C.wood_red);
        geo.box(group, -1.0, 0.2, 2.7, 2.8, 0.4, 0.12, C.wood_dark);
        geo.box(group, -1.7, 1.3, 2.72, 8.44, 0.06, 0.1, 0x5d4632);
        geo.box(group, -3.2, 0.42, 2.3, 0.72, 0.62, 0.5, 0x7d6242);
        geo.box(group, -2.3, 0.38, 2.42, 0.8, 0.54, 0.44, 0x8a6f4e);
        geo.box(group, 0.2, 0.35, 2.35, 0.9, 0.5, 0.6, 0x6a5540);
        const jar_colors = [0xc0562e, 0x8a5a2e, 0x4a3628, 0x8a3a2e, 0xb08d4a];
        for (let i = 0; i < 5; i++) {
            const jx = -5.35 + i * 0.32;
            geo.cylinder(group, jx, 1.42, 2.42, 0.11, 0.32, jar_colors[i], 10);
            geo.cylinder(group, jx, 1.6, 2.42, 0.065, 0.06, C.wood_dark, 8);
        }
        geo.cylinder(group, -3.55, 1.45, 2.45, 0.14, 0.4, 0xb99a68, 10);
        for (let i = 0; i < 4; i++) geo.box(group, -3.55 + Math.sin(i * 1.7) * 0.06, 1.72, 2.45, 0.04, 0.28, 0.04, 0xd8b98a, { rz: Math.sin(i) * 0.14 });
        for (let i = 0; i < 3; i++) geo.cylinder(group, -2.9, 1.32 + i * 0.11, 2.6, 0.24, 0.1, C.white, 12);
        geo.box(group, -2.75, 1.32, 2.5, 0.4, 0.14, 0.3, C.cream);
        // 厨房后墙与置物架
        geo.box(group, -1.7, 1.8, 0.07, 8.2, 3.5, 0.15, 0x6a5138);
        for (let i = 0; i < 9; i++) geo.box(group, -5.6 + i * 0.95, 1.8, 0.075, 0.85, 3.4, 0.02, i % 2 ? 0x6f563c : 0x63492f);
        geo.box(group, -1.2, 2.2, 0.32, 3.4, 0.08, 0.5, C.wood_dark);
        for (let i = 0; i < 6; i++) geo.cylinder(group, -2.6 + i * 0.55, 2.42, 0.32, 0.13, 0.36, [0xb08d4a, 0x8a6a4a, 0x7d6242, 0xa8865a, 0x93744e, 0xb59058][i], 8);
        geo.box(group, -1.2, 2.85, 0.32, 3.4, 0.08, 0.5, C.wood_dark);
        for (let i = 0; i < 4; i++) geo.cylinder(group, -2.3 + i * 0.75, 3.05, 0.32, 0.11, 0.3, 0x8a6a4a, 8);
        geo.box(group, 1.6, 2.6, 0.3, 0.5, 0.7, 0.06, C.wood_red);
        geo.label(group, '本 日 份', 1.6, 2.85, 0.28, 0.42, 0.2, { background: '#8a3a2e', color: '#f2e2c4', border: '#8a3a2e' });

        // —— 汤锅与灶台 ——
        geo.box(group, -4.55, 0.52, 1.0, 1.9, 1.05, 1.1, 0x6e5142);
        for (let i = 0; i < 6; i++) geo.box(group, -5.4 + (i % 3) * 0.42, 0.28 + Math.floor(i / 3) * 0.42, 1.0, 0.4, 0.4, 1.14, i % 2 ? 0x7d5c4a : 0x63483a);
        geo.box(group, -4.55, 1.09, 1.0, 1.98, 0.1, 1.18, 0x4a4038);
        for (let i = 0; i < 16; i++) {
            const a = i / 16 * Math.PI * 2;
            geo.box(group, -4.55 + Math.cos(a) * 0.72, 1.56, 1.0 + Math.sin(a) * 0.72, 0.3, 0.95, 0.09, 0x4d4a45, { ry: -a });
        }
        geo.cylinder(group, -4.55, 2.05, 1.0, 0.78, 0.08, 0x5d5a54, 20, nc);
        geo.cylinder(group, -4.55, 2.09, 1.0, 0.7, 0.05, 0x6a675f, 20, nc);
        this.broth_material = new THREE.MeshStandardMaterial({ color: 0x7a4318, roughness: 0.3, emissive: 0x3a1c08, emissiveIntensity: 0.5 });
        geo.cylinder(group, -4.55, 1.78, 1.0, 0.68, 0.04, this.broth_material, 20, nc);
        for (const hx of [-5.42, -3.68]) geo.box(group, hx, 1.92, 1.0, 0.1, 0.1, 0.3, 0x3d3833);
        // 排风罩、烟囱、排风扇
        geo.box(group, -4.55, 3.82, 1.0, 2.4, 0.66, 1.5, 0x5d6468);
        geo.box(group, -4.55, 4.22, 1.0, 2.5, 0.16, 1.6, 0x4d5458);
        geo.box(group, -4.55, 4.9, 0.8, 0.72, 1.5, 0.62, 0x5d6468);
        geo.box(group, -4.55, 5.7, 0.8, 0.9, 0.14, 0.8, 0x4d5458);
        geo.box(group, -4.55, 3.42, 0.62, 0.5, 0.07, 0.5, 0x3d4448, nc);
        // 吊灯
        geo.beam(group, [-4.55, 3.48, 1.08], [-4.55, 3.1, 1.08], 0.03, 0x2e2a26, nc);
        geo.cylinder(group, -4.55, 3.04, 1.08, 0.3, 0.16, 0x3d4448, 10, nc);
        this.pot_bulb_material = new THREE.MeshBasicMaterial({ color: 0xffdca8 });
        geo.cylinder(group, -4.55, 2.9, 1.08, 0.1, 0.14, this.pot_bulb_material, 8, nc);
        add_lamp(-4.55, 2.95, 1.08, 0xffc27a, 1.0);
        add_point(-4.55, 3.0, 1.2, 0xffb46a, 55);
        add_lamp(-1.7, 4.35, 2.2, 0xffd9a0, 0.85);
        add_point(-1.7, 3.95, 2.3, 0xffc890, 48);
        add_lamp(-1.9, 4.62, 3.95, 0xffb070, 0.9);
        add_point(-1.5, 4.35, 4.0, 0xffa050, 34);
        // 备料切配台
        geo.box(group, 0.2, 0.55, 1.2, 3.0, 1.06, 1.0, 0x7d6242);
        geo.box(group, 0.2, 1.11, 1.2, 3.12, 0.08, 1.12, 0x9a7a56);
        geo.box(group, 0.25, 1.16, 1.2, 0.95, 0.06, 0.62, 0xd8cba8);
        geo.cylinder(group, -0.55, 1.28, 1.12, 0.19, 0.52, 0x9a6a42, 10, { rx: Math.PI / 2 });
        geo.cylinder(group, -0.28, 1.28, 1.12, 0.19, 0.03, 0xd8b088, 10, { rx: Math.PI / 2 });
        geo.box(group, 0.72, 1.2, 1.05, 0.3, 0.14, 0.24, 0x5d8a4a);
        geo.box(group, 0.7, 1.15, 1.32, 0.26, 0.06, 0.2, 0x6d9a52);
        geo.box(group, 1.35, 1.22, 1.35, 0.1, 0.2, 0.34, 0x3d4448);
        geo.box(group, 1.35, 1.32, 1.16, 0.05, 0.03, 0.4, 0xb8bec2, { rz: 0.15 });
        geo.box(group, -0.9, 1.24, 1.42, 0.36, 0.2, 0.28, C.cream);
        // 洗碗池（空心池体，南侧矮沿供取放，其余三沿高）
        geo.box(group, 2.25, 0.85, 0.78, 0.82, 0.3, 0.07, 0x7d857f);
        for (const [wx, wz, sx, sz] of [[2.25, 1.52, 0.82, 0.07], [1.88, 1.15, 0.07, 0.67], [2.62, 1.15, 0.07, 0.67]]) {
            geo.box(group, wx, 0.95, wz, sx, 0.42, sz, 0x7d857f);
        }
        for (const [wx, wz, sx, sz] of [[2.25, 1.52, 0.9, 0.1], [1.88, 1.15, 0.1, 0.84], [2.62, 1.15, 0.1, 0.84]]) {
            geo.box(group, wx, 1.19, wz, sx, 0.06, sz, 0x8d958f);
        }
        geo.box(group, 2.25, 0.76, 1.15, 0.72, 0.04, 0.66, 0x5d6560, nc);
        geo.beam(group, [2.62, 1.12, 0.72], [2.62, 1.62, 0.72], 0.06, C.brass);
        geo.beam(group, [2.62, 1.62, 0.72], [2.62, 1.62, 1.05], 0.05, C.brass);
        geo.cylinder(group, 2.62, 1.55, 1.05, 0.035, 0.12, C.brass, 8);
        geo.box(group, 2.25, 1.16, 0.68, 0.9, 0.06, 0.14, 0x8d958f);
        for (let i = 0; i < 3; i++) geo.cylinder(group, 1.72, 1.14 + i * 0.05, 1.35 - i * 0.02, 0.16, 0.035, C.white, 12);
        // 潲水桶
        geo.cylinder(group, 2.95, 0.4, 1.35, 0.34, 0.72, 0x5d6560, 12);
        geo.cylinder(group, 2.95, 0.78, 1.35, 0.36, 0.06, 0x4a5250, 12);
        geo.cylinder(group, 2.95, 0.86, 1.35, 0.14, 0.08, 0x3d4448, 8);
        geo.box(group, 2.95, 0.82, 1.7, 0.3, 0.05, 0.05, 0x3d4448);
        // 煤气罐与软管
        geo.cylinder(group, -5.95, 0.58, 0.6, 0.3, 1.12, 0x9a4a30, 12);
        geo.cylinder(group, -5.95, 1.2, 0.6, 0.12, 0.12, 0x3d3833, 8);
        geo.cylinder(group, -5.95, 1.3, 0.6, 0.05, 0.14, C.brass, 8);
        geo.box(group, -5.95, 0.06, 0.6, 0.56, 0.12, 0.56, 0x3d3833);
        const hose_points = [[-5.85, 1.16, 0.74], [-5.68, 0.6, 0.98], [-5.52, 0.35, 1.1], [-5.45, 0.42, 1.15]];
        for (let i = 0; i < hose_points.length - 1; i++) {
            geo.beam(group, hose_points[i], hose_points[i + 1], 0.05, 0x2e2a26, nc);
        }
        // 暖帘
        geo.beam(group, [-2.6, 1.8, 2.95], [0.6, 1.8, 2.95], 0.07, 0xb99a68, nc);
        this.noren_material = new THREE.MeshStandardMaterial({ color: 0x3d5a80, roughness: 0.9, side: THREE.DoubleSide });
        this.noren_material.userData.noren = true;
        for (let i = 0; i < 5; i++) {
            const strip = geo.mesh_box(group, -2.32 + i * 0.66, 1.28, 2.95, 0.56, 1.0, 0.03, this.noren_material, { shadow: false });
            strip.userData.noren = true;
            if (i === 2) geo.mesh_box(group, -1.0, 1.42, 2.93, 0.34, 0.34, 0.012, C.cream, { shadow: false });
        }
        // 菜单牌
        const menu = geo.group(group, 3.45, 0, 4.92);
        for (const lean of [-1, 1]) {
            const leg = geo.group(menu, 0, 0, lean * 0.22);
            leg.rotation.x = lean * 0.14;
            geo.box(leg, 0, 0.72, 0, 1.1, 1.44, 0.05, 0x2e3a44);
            geo.cylinder(leg, 0, 0.05, lean * 0.24, 0.04, 0.4, 0x2e3a44, 6, { rx: lean * 0.3 });
        }
        geo.cylinder(menu, 0, 1.47, 0, 0.035, 0.5, 0x2e3a44, 6, { rz: Math.PI / 2 });
        geo.label(menu, '拉面 850', 0, 1.08, -0.16, 0.98, 0.34, { background: '#1e2a33', color: '#ffe2b0', border: '#1e2a33', glow: '#ff9a40', emissive: 0.5 });
        geo.label(menu, '叉烧面 950', 0, 0.68, -0.16, 0.98, 0.3, { background: '#1e2a33', color: '#e8d8b8', border: '#1e2a33' });
        geo.label(menu, '啤酒 500', 0, 0.34, -0.16, 0.98, 0.3, { background: '#1e2a33', color: '#e8d8b8', border: '#1e2a33' });

        // —— 食客长凳与条桌 ——
        geo.box(group, -1.3, 1.06, 4.1, 6.6, 0.09, 1.0, 0x9a7a56);
        for (const lx of [-3.0, 0.4]) {
            geo.box(group, lx, 0.5, 4.1, 0.14, 1.0, 0.82, C.wood_dark);
            geo.box(group, lx, 0.97, 4.1, 0.3, 0.08, 0.9, 0x8a6a4a);
        }
        geo.box(group, -1.3, 0.3, 4.1, 3.9, 0.07, 0.12, C.wood_dark);
        for (const bz of [3.44, 4.76]) {
            geo.box(group, -1.3, 0.56, bz, 6.4, 0.08, 0.32, 0x8a6a4a);
            for (const lx of [-4.35, 1.85]) {
                for (const lean of [-1, 1]) {
                    geo.box(group, lx, 0.28, bz + lean * 0.13, 0.06, 0.62, 0.06, C.wood_dark, { rx: lean * 0.42 });
                }
            }
        }
        // 桌面陈设
        for (const [px, pz] of [[-3.3, 4.14], [1.5, 4.0]]) geo.cylinder(group, px, 1.13, pz, 0.09, 0.04, 0x5d3a2a, 10);
        for (const [px, pz] of [[0.95, 4.28], [1.05, 3.98]]) {
            geo.cylinder(group, px, 1.24, pz, 0.09, 0.26, 0x4a5a3a, 8);
            geo.cylinder(group, px, 1.39, pz, 0.035, 0.08, 0x8a8d7a, 8);
        }
        for (const [px, pz] of [[-4.15, 4.2], [1.62, 3.95]]) {
            geo.box(group, px, 1.2, pz, 0.34, 0.18, 0.24, C.cream);
            geo.box(group, px, 1.31, pz, 0.3, 0.05, 0.2, 0xd8cdb4);
        }
        geo.cylinder(group, -0.5, 1.16, 4.16, 0.08, 0.1, 0xb99a68, 8);

        // —— 后巷杂物角 ——
        const crate = (px, py, pz, ry) => {
            const c = geo.group(group, px, py, pz);
            c.rotation.y = ry || 0;
            geo.box(c, 0, 0.24, 0, 0.88, 0.48, 0.6, 0x7d5c38);
            for (const sx of [-0.3, 0, 0.3]) geo.box(c, sx, 0.24, 0.31, 0.24, 0.4, 0.03, 0x8a6a44);
            geo.box(c, 0, 0.4, 0, 0.9, 0.1, 0.62, 0x6a4c30);
            return c;
        };
        crate(-14.55, 0.02, -1.35, 0.12);
        crate(-14.55, 0.56, -1.35, -0.08);
        crate(-14.35, 0.02, -1.5, -0.2);
        crate(-13.4, 0.02, -2.3, 0.06);
        crate(-13.4, 0.56, -2.3, -0.05);
        for (const [bx, bz, s] of [[-12.95, -3.05, 1.0], [-12.6, -3.3, 0.7]]) {
            geo.box(group, bx, 0.3 * s, bz, 0.95 * s, 0.6 * s, 0.8 * s, 0x3a4148, { ry: rng.next() * 0.6 });
            geo.box(group, bx + 0.1 * s, 0.62 * s, bz, 0.5 * s, 0.16 * s, 0.5 * s, 0x454c54, { ry: rng.next() * 0.6 });
        }
        geo.box(group, -12.45, 0.5, -3.55, 0.06, 1.0, 0.7, 0x9a8a6a, { rz: 0.18 });
        for (let i = 0; i < 3; i++) geo.cylinder(group, -14.5 + rng.next() * 0.6, 0.09, -0.95 - rng.next() * 0.4, 0.09, 0.55, [0x4a5a3a, 0x8a5a2e, 0x5d6a70][i], 8, { rx: Math.PI / 2, rz: rng.next() });
        for (let i = 0; i < 14; i++) {
            geo.cylinder(group, -12.3 + rng.next() * 3.4, 0.062, -3.85 - rng.next() * 0.3, 0.025, 0.09, 0xd8cdb4, 6, { rx: Math.PI / 2, rz: rng.next() * 3, ...nc });
        }

        // —— 后巷居民楼 ——
        geo.box(group, 0, 3.4, -7.5, 30.2, 6.8, 5.8, C.brick);
        geo.box(group, 0, 0.35, -4.42, 30.2, 0.7, 0.34, C.brick_dark);
        geo.box(group, 0, 7.6, -7.5, 30.2, 0.2, 5.8, 0x4a4038);
        for (let i = 0; i < 10; i++) geo.box(group, -14.5 + i * 3.1, 6.2, -4.4, 0.3, 0.9, 0.12, C.brick_dark);
        const win_x = [-12.6, -9.4, -6.2, -1.4, 1.8, 5.0, 8.2, 11.4];
        for (let i = 0; i < win_x.length; i++) {
            for (const wy of [2.6, 4.9]) {
                const lit = (i * 2 + (wy > 3.7 ? 1 : 0)) % 3 !== 0;
                geo.box(group, win_x[i], wy, -4.33, 1.7, 1.3, 0.06, lit ? this.window_lit_material : this.window_dark_material, { shadow: false });
                geo.box(group, win_x[i], wy, -4.3, 1.86, 1.46, 0.05, C.brick_dark, { shadow: false });
                geo.box(group, win_x[i], wy, -4.3, 1.74, 1.34, 0.02, lit ? this.window_lit_material : this.window_dark_material, { shadow: false });
                for (const bar of [-0.42, 0.42]) geo.box(group, win_x[i] + bar, wy, -4.29, 0.06, 1.36, 0.03, 0x3a322c, { shadow: false });
                if ((i + Math.round(wy)) % 3 === 0) {
                    geo.box(group, win_x[i] + 0.3, wy - 0.95, -4.22, 0.85, 0.5, 0.3, 0x8d958f);
                    geo.box(group, win_x[i] + 0.3, wy - 0.95, -4.06, 0.72, 0.4, 0.04, 0x5d6560);
                }
            }
        }
        geo.box(group, 4.5, 1.0, -4.35, 1.0, 2.0, 0.1, 0x3d3028);
        geo.box(group, 4.5, 2.1, -4.28, 1.2, 0.16, 0.3, 0x4a3c30);
        geo.box(group, 4.5, 1.2, -4.24, 0.7, 1.3, 0.04, 0x2a2018);
        geo.box(group, 4.28, 2.5, -4.24, 0.16, 0.24, 0.14, 0x3d4448);
        add_lamp(4.3, 2.42, -4.15, 0xffd9a0, 0.55);
        geo.beam(group, [-9.5, 0.1, -4.25], [-9.5, 5.6, -4.25], 0.14, 0x6d655c);
        for (const py of [1.6, 3.4]) geo.box(group, -9.5, py, -4.18, 0.3, 0.08, 0.2, 0x6d655c);
        // 楼顶
        geo.box(group, -8, 8.6, -7.5, 2.0, 1.5, 2.0, 0x6d655c);
        geo.cylinder(group, -8, 9.6, -7.5, 0.9, 0.6, 0x5d6560, 12);
        for (const ax of [-2.5, 5.5, 10.5]) {
            geo.box(group, ax, 7.85, -6.3, 1.4, 0.6, 0.9, 0x8d958f);
            geo.box(group, ax, 7.85, -5.82, 1.2, 0.5, 0.05, 0x5d6560);
        }
        geo.box(group, 3.0, 7.75, -8.8, 0.1, 0.7, 0.1, 0x3d4448);
        geo.beam(group, [3.0, 8.1, -8.8], [3.9, 8.1, -8.8], 0.03, 0x3d4448);
        geo.beam(group, [-11.5, 7.62, -7.5], [12.5, 7.62, -7.5], 0.08, 0x6d655c);

        // —— 东侧楼与转角小店 ——（进深收至人行道以北，南脸朝向近人行道）
        geo.box(group, 11.2, 2.35, 2.8, 7.8, 4.5, 5.0, 0x6a5648);
        geo.box(group, 11.2, 4.7, 2.8, 7.9, 0.2, 5.1, 0x4a4038);
        geo.box(group, 7.28, 2.2, 2.8, 0.16, 4.2, 4.6, 0x5d4a3e);
        for (const wz of [1.2, 2.6, 4.0]) {
            geo.box(group, 7.26, 2.6, wz, 0.06, 1.1, 0.9, (wz * 7) % 3 < 2 ? this.window_lit_material : this.window_dark_material, { shadow: false });
            geo.box(group, 7.22, 2.6, wz, 0.04, 1.2, 1.0, 0x4a3c30, { shadow: false });
        }
        geo.box(group, 8.8, 1.5, 5.33, 2.2, 1.6, 0.1, this.window_lit_material, { shadow: false });
        geo.box(group, 8.8, 1.5, 5.35, 2.4, 1.8, 0.06, 0x4a3c30, { shadow: false });
        geo.box(group, 8.8, 2.5, 5.36, 2.6, 0.14, 0.6, 0x8a3a2e);
        geo.box(group, 12.2, 0.95, 5.28, 1.0, 1.9, 0.08, 0x2a2018);
        geo.box(group, 12.2, 2.0, 5.22, 1.3, 0.18, 0.4, 0x4a3c30);
        geo.label(group, '夜 市 杂 货', 8.8, 2.72, 5.38, 2.3, 0.26, { background: '#8a3a2e', color: '#ffe2b0', border: '#5d2a20' });
        for (const ax of [9.5, 12.5]) geo.box(group, ax, 5.0, 1.6, 1.3, 0.55, 0.9, 0x8d958f);
        geo.cylinder(group, 10.8, 5.3, 3.5, 0.8, 1.0, 0x6d655c, 12);
        geo.box(group, 14.0, 5.3, 1.0, 0.1, 0.9, 0.1, 0x3d4448);
        geo.beam(group, [14.0, 5.75, 1.0], [14.0, 5.75, 2.2], 0.03, 0x3d4448);
        // 自动贩卖机（近人行道东段，靠楼南墙）
        const vend = geo.group(group, 14.0, 0, 5.72);
        vend.rotation.y = 0;
        geo.box(vend, 0, 1.05, 0, 1.1, 2.1, 0.75, 0x8d3226);
        geo.box(vend, 0, 1.3, 0.39, 0.9, 1.3, 0.05, 0x1c2a38);
        for (let i = 0; i < 8; i++) geo.box(vend, -0.3 + (i % 4) * 0.2, 0.95 + Math.floor(i / 4) * 0.4, 0.42, 0.14, 0.26, 0.02, [0xc0562e, 0x4a7a5d, 0xd8c690, 0x8a5a2e][i % 4], { shadow: false });
        geo.box(vend, 0, 0.4, 0.4, 0.9, 0.3, 0.06, 0x2a3440);
        this.vend_material = new THREE.MeshBasicMaterial({ color: 0x9adfe8 });
        geo.box(vend, 0.35, 1.95, 0.41, 0.3, 0.12, 0.03, this.vend_material, { shadow: false });
        add_lamp(14.0, 1.7, 5.5, 0x9adfe8, 0.5);

        // —— 街口：信号灯、消防栓、电线杆与架空线 ——
        geo.cylinder(group, 11.9, 2.2, 9.7, 0.09, 4.4, 0x4a5250, 8);
        geo.cylinder(group, 11.9, 0.14, 9.7, 0.26, 0.28, 0x3d4448, 10);
        geo.box(group, 11.9, 4.25, 9.1, 0.1, 0.1, 1.3, 0x4a5250);
        geo.box(group, 11.9, 3.75, 8.55, 0.34, 1.0, 0.3, 0x2e3438);
        for (let i = 0; i < 3; i++) {
            geo.cylinder(group, 11.9, 4.05 - i * 0.3, 8.39, 0.1, 0.06, i === 0 ? this.traffic_red : i === 1 ? this.traffic_yellow : this.traffic_green, 10);
        }
        geo.box(group, 11.9, 3.2, 8.55, 0.26, 0.36, 0.2, 0x3d4448);
        geo.cylinder(group, 11.9, 2.9, 8.55, 0.12, 0.5, 0x2e3438, 8);
        add_lamp(11.9, 4.05, 8.35, 0xff5040, 0.85);
        add_point(11.9, 4.0, 8.5, 0xff4a38, 7);
        geo.cylinder(group, 10.9, 0.4, 9.62, 0.22, 0.8, C.red, 10);
        geo.cylinder(group, 10.9, 0.86, 9.62, 0.26, 0.12, 0x8a2a24, 10);
        geo.cylinder(group, 10.9, 0.5, 9.62, 0.3, 0.1, 0x8a2a24, 10);
        for (const s of [-1, 1]) geo.cylinder(group, 10.9 + s * 0.24, 0.68, 9.62, 0.07, 0.1, C.brass, 8, { rz: s * 1.2 });
        geo.beam(group, [10.9, 0.6, 9.62], [10.9, 0.6, 9.32], 0.03, 0x8a6a4a);
        for (const [px, pz, ph] of [[14.1, -2.3, 6.9], [8.6, 9.55, 6.6]]) {
            geo.cylinder(group, px, ph / 2, pz, 0.13, ph, 0x5d5348, 8);
            geo.cylinder(group, px, 0.1, pz, 0.3, 0.2, 0x3d3833, 8);
            geo.cylinder(group, px, ph - 0.35, pz, 0.1, 0.3, 0x4a443c, 8);
        }
        geo.box(group, 14.1, 6.3, -2.3, 0.09, 0.09, 1.6, 0x4a443c);
        geo.box(group, 14.1, 5.95, -2.9, 0.3, 0.4, 0.4, 0x3d4448);
        geo.cylinder(group, 14.1, 6.15, -2.3, 0.22, 0.5, 0x6d7570, 10);
        geo.beam(group, [14.1, 6.15, -2.75], [12.9, 6.05, -2.75], 0.07, 0x4a443c);
        geo.box(group, 12.72, 5.98, -2.75, 0.5, 0.18, 0.3, 0x3d4448);
        geo.box(group, 12.72, 5.86, -2.75, 0.4, 0.06, 0.22, this.bulb_material, { shadow: false });
        add_lamp(12.7, 5.8, -2.75, 0xffd9a0, 0.9);
        add_point(12.7, 5.8, -2.75, 0xffd9a0, 22);
        geo.box(group, 8.6, 6.1, 9.55, 0.09, 0.09, 1.2, 0x4a443c);
        geo.box(group, 8.6, 5.85, 9.0, 0.36, 0.2, 0.5, 0x3d4448);
        geo.box(group, 8.6, 5.73, 9.0, 0.28, 0.06, 0.4, this.bulb_material, { shadow: false });
        add_lamp(8.6, 5.65, 9.0, 0xffd9a0, 0.9);
        add_point(8.6, 5.65, 9.0, 0xffd9a0, 20);
        const wire = (a, b, sag) => {
            const mid = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - sag, (a[2] + b[2]) / 2];
            geo.beam(group, a, mid, 0.028, 0x1e1c1a);
            geo.beam(group, mid, b, 0.028, 0x1e1c1a);
        };
        for (const off of [-0.08, 0.08]) wire([14.1, 6.28, -2.3 + off], [8.6, 6.18, 9.55 + off], 0.45);
        wire([14.1, 6.28, -2.3], [2.0, 5.95, -4.38], 0.5);
        wire([8.6, 6.18, 9.55], [11.2, 5.55, 5.4], 0.2);

        // —— 西侧空坪杂物 ——
        crate(-12.85, 0.02, 5.85, 0.3);
        crate(-12.0, 0.02, 5.55, -0.15);
        geo.box(group, -12.4, 0.3, 6.3, 0.9, 0.6, 0.75, 0x3a4148, { ry: 0.4 });
        geo.cylinder(group, -9.2, 0.32, 4.6, 0.32, 0.6, 0x5d6560, 10);
        geo.box(group, -9.2, 0.66, 4.6, 0.5, 0.08, 0.36, 0x4a5250);
        // 竹竿吊灯笼架的底座配重（吊臂本体由 machines 构建）
        geo.box(group, -7.05, 0.16, 2.55, 0.5, 0.32, 0.5, 0x3d3833);
        geo.box(group, -7.05, 0.36, 2.55, 0.36, 0.1, 0.36, 0x4a443c);
        // 灯笼待挂箱
        geo.box(group, -7.5, 0.28, 4.9, 1.1, 0.55, 0.85, 0x7d5c38);
        geo.box(group, -7.5, 0.58, 4.9, 1.14, 0.08, 0.89, 0x6a4c30);
        for (let i = 0; i < 4; i++) geo.box(group, -7.8 + (i % 2) * 0.6, 0.72 + Math.floor(i / 2) * 0.22, 4.8 + Math.floor(i / 2) * 0.2, 0.44, 0.2, 0.44, C.red);

        return group;
    },
};
