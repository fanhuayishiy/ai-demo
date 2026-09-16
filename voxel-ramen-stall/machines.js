let state_night_hint = 1;
const machines = {
    MOTO_PERIOD: 48,
    DRIVE_START: 14,
    DRIVE_END: 42,
    CRANE_PERIOD: 40,
    build(ctx) {
        this.ctx = ctx;
        const { THREE, scene, geo, add_lamp } = ctx;
        this.geo = geo;

        // —— 排风扇 ——
        this.fan_group = geo.group(scene, -4.55, 3.81, 1.79);
        geo.cylinder(this.fan_group, 0, 0, 0.02, 0.09, 0.09, 0x3d4448, 8, { rx: Math.PI / 2 });
        for (let i = 0; i < 3; i++) {
            const blade = geo.group(this.fan_group, 0, 0, 0);
            blade.rotation.z = i * Math.PI * 2 / 3;
            geo.mesh_box(blade, 0.15, 0, 0, 0.34, 0.11, 0.03, 0x9aa4a8);
        }
        geo.cylinder(scene, -4.55, 3.81, 1.84, 0.36, 0.05, 0x3d4448, 20);
        geo.cylinder(scene, -4.55, 3.81, 1.87, 0.1, 0.05, 0x9aa4a8, 10);

        // —— 外卖摩托 ——（局部 +z 为车头）
        const moto = geo.group(scene, 5.25, 0, 4.35);
        moto.rotation.y = Math.PI;
        geo.mesh_box(moto, 0, 0.42, 0.05, 0.4, 0.12, 1.15, 0x2e2a26);
        geo.mesh_box(moto, 0, 0.72, 0.62, 0.2, 0.62, 0.22, 0xd8d0c0, { rx: -0.16 });
        geo.mesh_box(moto, 0, 1.12, 0.72, 0.6, 0.07, 0.09, 0x2e2a26);
        geo.mesh_box(moto, 0, 1.0, 0.88, 0.24, 0.18, 0.1, 0xd8d0c0);
        this.headlight_material = new THREE.MeshBasicMaterial({ color: 0x2a2622 });
        geo.mesh_box(moto, 0, 1.0, 0.94, 0.16, 0.12, 0.02, this.headlight_material, { shadow: false });
        geo.mesh_box(moto, 0, 1.24, 0.64, 0.05, 0.18, 0.05, 0x8d958f);
        geo.mesh_box(moto, 0, 0.92, -0.32, 0.36, 0.16, 0.66, 0x2a2622);
        geo.mesh_box(moto, 0, 0.76, -0.68, 0.38, 0.18, 0.3, 0xb03830);
        geo.mesh_box(moto, 0, 0.55, -0.9, 0.12, 0.1, 0.5, 0x5d6560, { rx: 0.12 });
        geo.mesh_box(moto, 0, 0.5, -1.08, 0.1, 0.1, 0.08, 0xb02818);
        geo.mesh_box(moto, 0, 1.12, -0.85, 0.56, 0.5, 0.66, 0xf2ede2);
        geo.mesh_box(moto, 0, 1.12, -0.85, 0.58, 0.1, 0.68, 0xd8cec0);
        for (const s of [-1, 1]) geo.mesh_box(moto, s * 0.3, 1.12, -0.85, 0.03, 0.44, 0.6, 0xb03830);
        this.box_lid = geo.group(moto, 0, 1.37, -0.85);
        geo.mesh_box(this.box_lid, 0, 0.03, 0, 0.58, 0.06, 0.68, 0xe8e0d2);
        this.box_bowl = geo.group(moto, 0, 1.44, -0.85);
        geo.mesh_box(this.box_bowl, 0, 0.05, 0, 0.24, 0.1, 0.24, 0xd8433a);
        this.box_bowl.scale.setScalar(0.001);
        this.wheels = [];
        for (const [wz, wr] of [[0.85, 0.34], [-0.78, 0.36]]) {
            const wrapper = geo.group(moto, 0, wr, wz);
            geo.cylinder(wrapper, 0, 0, 0, wr, 0.16, 0x24282c, 14, { rz: Math.PI / 2 });
            geo.cylinder(wrapper, 0, 0, 0, wr * 0.45, 0.18, 0x8d958f, 10, { rz: Math.PI / 2 });
            for (let i = 0; i < 5; i++) {
                const a = i / 5 * Math.PI * 2;
                geo.mesh_box(wrapper, Math.cos(a) * wr * 0.62, Math.sin(a) * wr * 0.62, 0, wr * 0.7, 0.05, 0.17, 0x3a3e42, { rz: a });
            }
            this.wheels.push(wrapper);
        }
        geo.mesh_box(moto, 0, 0.34, 0.62, 0.3, 0.1, 0.5, 0x3a3e42, { rx: 0.2 });
        geo.mesh_box(moto, 0, 0.4, -0.55, 0.32, 0.1, 0.6, 0x3a3e42, { rx: -0.15 });
        const head_target = new THREE.Object3D();
        head_target.position.set(0, 0.1, 6);
        moto.add(head_target);
        this.headlight = new THREE.SpotLight(0xffd9a0, 0, 15, 0.52, 0.5, 1.4);
        this.headlight.position.set(0, 1.0, 0.9);
        this.headlight.target = head_target;
        moto.add(this.headlight);
        this.headlight_glow = add_lamp(0, 1.0, 1.05, 0xffe2b0, 1.1, moto);
        add_lamp(0, 0.5, -1.14, 0xff5040, 0.4, moto);
        this.moto = moto;
        this.build_moto_path();

        // —— 煮面篓 ——（竹篓 + 竹竿吊杆）
        const strain = geo.group(scene, -4.55, 1.45, 1.0);
        for (let i = 0; i < 10; i++) {
            const a = i / 10 * Math.PI * 2;
            geo.mesh_box(strain, Math.cos(a) * 0.33, 0, Math.sin(a) * 0.33, 0.11, 0.3, 0.05, 0xb99a68, { ry: -a });
        }
        geo.cylinder(strain, 0, -0.14, 0, 0.32, 0.04, 0xa8895a, 12);
        geo.cylinder(strain, 0, 0.14, 0, 0.36, 0.04, 0xc9a878, 12);
        this.noodle_clump = geo.group(strain, 0, 0.02, 0);
        for (let i = 0; i < 5; i++) {
            geo.mesh_box(this.noodle_clump, Math.sin(i * 2.4) * 0.11, Math.sin(i * 1.7) * 0.04, Math.cos(i * 2.1) * 0.11, 0.15, 0.045, 0.15, 0xf2e8d0, { ry: i });
        }
        this.strain_handle = geo.mesh_box(strain, 0, 1, -0.32, 0.055, 1, 0.055, 0xb99a68);
        this.strainer = strain;

        // —— 长竹竿吊运 ——（吊臂绕桅顶回转，滑车沿臂移动）
        geo.cylinder(scene, -7.05, 3.3, 2.55, 0.11, 6.3, 0xb99a68, 8);
        geo.cylinder(scene, -7.05, 6.55, 2.55, 0.07, 0.6, 0xa8895a, 8);
        const boom = geo.group(scene, -7.05, 6.3, 2.55);
        geo.mesh_box(boom, 3.85, 0, 0, 7.7, 0.09, 0.09, 0xc9a878);
        geo.mesh_box(boom, 1.4, 0.1, 0, 2.8, 0.05, 0.05, 0xb99a68);
        geo.mesh_box(boom, 0, 0.06, 0, 0.5, 0.24, 0.24, 0x5d4632);
        this.trolley = geo.group(boom, 2.0, -0.1, 0);
        geo.mesh_box(this.trolley, 0, 0.04, 0, 0.26, 0.14, 0.2, 0x5d4632);
        this.crane_rope = geo.mesh_box(this.trolley, 0, -1, 0, 0.03, 2, 0.03, 0x3d3833, { shadow: false });
        this.hook = geo.group(this.trolley, 0, -2, 0);
        geo.mesh_box(this.hook, 0, 0.06, 0, 0.1, 0.12, 0.1, 0x5d4632);
        this.payload = geo.group(this.hook, 0, -0.34, 0);
        this.build_lantern(this.payload);
        this.payload.visible = false;
        this.boom = boom;
        this.lantern_rail_group = geo.group(scene, 0, 0, 0);
        this.rail_lanterns = [];
        for (let i = 0; i < 5; i++) {
            const pivot = geo.group(this.lantern_rail_group, -2.0 + i * 0.6, 3.94, 4.2);
            const lant = geo.group(pivot, 0, -0.3, 0);
            this.build_lantern(lant);
            this.rail_lanterns.push({ pivot, lant });
        }
        this.crane_tl = this.build_crane_timeline();
        this.cat_segs = [
            [0, 8, -13.4, -2.3, 1.08, 'nap'],
            [8, 9.2, -13.25, -1.45, 0.02, 'hop_down'],
            [9.2, 12.5, -13.25, -0.5, 0.02, 'walk'],
            [12.5, 16, -6.6, -0.45, 0.02, 'walk'],
            [16, 18.5, -6.6, 3.7, 0.02, 'walk'],
            [18.5, 20.5, -4.9, 5.45, 0.02, 'walk'],
            [20.5, 23, -3.7, 5.45, 0.02, 'sniff'],
            [23, 26, -6.3, 4.9, 0.02, 'walk'],
            [26, 28, -6.6, 3.7, 0.02, 'walk'],
            [28, 30.5, -6.6, 0.2, 0.02, 'walk'],
            [30.5, 34, -13.25, -0.5, 0.02, 'walk'],
            [34, 39.7, -13.25, -1.5, 0.02, 'walk'],
            [39.7, 40, -13.4, -2.3, 1.08, 'hop_up'],
        ];
        this.build_figures(scene);
        this.set_moto(0);
        this.update(0, 0, { night: 1, rain: 0, day: 0.935 });
    },

    build_lantern(parent) {
        const { geo } = this.ctx;
        this.lantern_material = this.lantern_material || new THREE.MeshBasicMaterial({ color: 0xd83a28 });
        this.lantern_cap_material = this.lantern_cap_material || new THREE.MeshBasicMaterial({ color: 0x7d2018 });
        geo.cylinder(parent, 0, 0.22, 0, 0.05, 0.08, this.lantern_cap_material, 8);
        geo.cylinder(parent, 0, 0, 0, 0.27, 0.36, this.lantern_material, 10);
        geo.cylinder(parent, 0, 0.055, 0, 0.285, 0.03, 0xa83020, 10);
        geo.cylinder(parent, 0, -0.055, 0, 0.285, 0.03, 0xa83020, 10);
        geo.cylinder(parent, 0, -0.24, 0, 0.05, 0.06, 0xd8b04a, 8);
        geo.box(parent, 0, -0.31, 0, 0.03, 0.1, 0.03, 0xd8b04a);
    },

    build_crane_timeline() {
        const steps = 4000;
        const table = [];
        for (let i = 0; i < 5; i++) table.push(new Uint8Array(steps));
        for (let op = 0; op < 10; op++) {
            const slot = op < 5 ? op : (op - 5) % 5;
            const t0 = op * 400;
            for (let i = 0; i < steps; i++) {
                const tt = i * 0.1;
                if (tt < t0) continue;
                if (op < 5) { if (tt >= t0 + 175) table[slot][i] = 1; }
                else if (tt >= t0 + 36) table[slot][i] = 0;
            }
        }
        return {
            get(slot, t) {
                const i = Math.min(steps - 1, Math.max(0, Math.round((t % 400) * 10)));
                return !!table[slot][i];
            },
        };
    },

    build_moto_path() {
        const segs = [];
        const straight = (x1, z1, x2, z2) => {
            segs.push({ kind: 's', len: Math.hypot(x2 - x1, z2 - z1), x1, z1, x2, z2, yaw: Math.atan2(x2 - x1, z2 - z1) });
        };
        const arc = (cx, cz, r, a0, a1) => segs.push({ kind: 'a', len: Math.abs(a1 - a0) * r, cx, cz, r, a0, a1 });
        straight(5.25, 4.35, 5.25, -0.6);
        arc(6.15, -0.6, 0.9, Math.PI, Math.PI * 1.5);
        straight(6.15, -1.5, 12.0, -1.5);
        arc(12.0, -2.3, 0.8, Math.PI / 2, -Math.PI / 2);
        straight(12.0, -3.1, -10.4, -3.1);
        arc(-10.4, -2.3, 0.8, -Math.PI / 2, -Math.PI * 1.5);
        straight(-10.4, -1.5, 5.25, -1.5);
        arc(5.25, -0.6, 0.9, -Math.PI / 2, 0);
        straight(6.15, -0.6, 6.15, 4.45);
        arc(5.7, 4.45, 0.45, 0, Math.PI);
        straight(5.25, 4.45, 5.25, 4.35);
        this.path_len = segs.reduce((v, s) => v + s.len, 0);
        this.path_segs = segs;
    },
    moto_pose(s) {
        s = ((s % this.path_len) + this.path_len) % this.path_len;
        for (const seg of this.path_segs) {
            if (s > seg.len) { s -= seg.len; continue; }
            if (seg.kind === 's') {
                const t = s / seg.len;
                return { x: seg.x1 + (seg.x2 - seg.x1) * t, z: seg.z1 + (seg.z2 - seg.z1) * t, yaw: seg.yaw };
            }
            const dir = seg.a1 > seg.a0 ? 1 : -1;
            const a = seg.a0 + dir * (s / seg.r);
            return {
                x: seg.cx + Math.cos(a) * seg.r,
                z: seg.cz + Math.sin(a) * seg.r,
                yaw: Math.atan2(-dir * Math.sin(a), dir * Math.cos(a)),
            };
        }
        return { x: 5.25, z: 4.35, yaw: Math.PI };
    },
    moto_distance(t) {
        const p = ((t % this.MOTO_PERIOD) + this.MOTO_PERIOD) % this.MOTO_PERIOD;
        if (p < this.DRIVE_START || p > this.DRIVE_END) return 0;
        const u = (p - this.DRIVE_START) / (this.DRIVE_END - this.DRIVE_START);
        return this.path_len * (u - 0.85 * Math.sin(u * Math.PI * 2) / (Math.PI * 2));
    },
    set_moto(t) {
        const s = this.moto_distance(t);
        const pose = this.moto_pose(this.path_len - s);
        this.moto.position.set(pose.x, 0, pose.z);
        this.moto.rotation.y = pose.yaw;
        for (const wheel of this.wheels) wheel.rotation.x = s / 0.35;
        const p = ((t % this.MOTO_PERIOD) + this.MOTO_PERIOD) % this.MOTO_PERIOD;
        const driving = p > this.DRIVE_START && p < this.DRIVE_END;
        const head_on = driving || (p > this.DRIVE_END - 1.2 && p <= this.DRIVE_END) || p < 2.2;
        this.headlight_material.color.setHex(head_on ? 0xffe2b0 : 0x2a2622);
        this.headlight.intensity = head_on ? (state_night_hint > 0.5 ? 130 : 55) : 0;
        this.headlight_glow.userData.intensity = head_on ? 1.1 : 0.03;
        const u = driving ? (p - this.DRIVE_START) / (this.DRIVE_END - this.DRIVE_START) : 0;
        this.moto_speed = driving ? this.path_len * 0.85 * (1 - Math.cos(u * Math.PI * 2)) / (this.DRIVE_END - this.DRIVE_START) : 0;
        this.moto.rotation.z = driving ? Math.sin(t * 7.3) * 0.012 * Math.min(1, this.moto_speed * 2) : 0;
    },

    build_figures(scene) {
        const { THREE } = this.ctx;
        const skin = 0xd8a878;
        this.figure_defs = [
            { name: 'chef', mode: 'chef', x: -2.3, z: 1.35, yaw: 0, hair: 0x2a2622, top: 0xf2ede2, apron: 0xc0562e, props: ['board', 'dough_ball', 'dough_work', 'bowl_a', 'mound_a', 'bowl_b', 'mound_b'] },
            { name: 'prep', mode: 'prep', x: 0.2, z: 0.42, yaw: 0, hair: 0x4a3226, top: 0x7d95a8, apron: 0xd8d0c0, props: ['knife', 'bit1', 'bit2'] },
            { name: 'wash', mode: 'wash', x: 2.25, z: 0.5, yaw: 0, hair: 0x1e1a18, top: 0x6a8a7a, apron: 0xc8c0b0, props: ['plate'] },
            { name: 'wipe', mode: 'wipe', x: 2.55, z: 4.15, yaw: -Math.PI / 2, hair: 0x5d4632, top: 0x9a8a6a, apron: 0x6a5540, props: ['cloth'] },
            { name: 'wait', mode: 'wait', x: -4.85, z: 3.2, yaw: -0.5, hair: 0x2a2622, top: 0x5d6a70, apron: 0x3d4448, props: [] },
            { name: 'photo', mode: 'photo', x: -2.9, z: 5.5, yaw: Math.PI, hair: 0x8a5a2e, top: 0x4a5a7d, apron: 0x3a4048, props: ['phone'] },
            { name: 'rider', mode: 'rider', hair: 0x1e1a18, top: 0xc0562e, apron: 0x3a4048, helmet: 0xe8e0d2, props: ['carry_bowl'] },
            { name: 'walkerA', mode: 'walker', t_offset: 0, seat: -1.3, wz: 6.12, mx: 4.35, az1: 5.55, az2: 5.3, hair: 0x6a4a2e, top: 0x8a5a6a, apron: 0x4a4048, props: ['w_bowl', 'sticks'] },
            { name: 'walkerB', mode: 'walker', t_offset: 24, seat: 1.4, wz: 6.58, mx: 5.4, az1: 5.5, az2: 5.3, hair: 0x1e1a18, top: 0x5d7d5a, apron: 0x3a4048, props: ['w_bowl', 'sticks'] },
            { name: 'eaterA', mode: 'eater', x: -2.6, z: 4.73, yaw: Math.PI, phase: 0.8, hair: 0x2a2622, top: 0x7d6a4a, apron: 0x4a4048, props: ['bowl', 'sticks', 'mound'] },
            { name: 'eaterB', mode: 'eater', x: 0.6, z: 4.73, yaw: Math.PI, phase: 3.7, hair: 0x8a5a2e, top: 0x5a6a8a, apron: 0x3a4048, props: ['bowl', 'sticks', 'mound'] },
            { name: 'eaterC', mode: 'eater', x: -2.6, z: 3.47, yaw: 0, phase: 5.4, hair: 0x4a3226, top: 0x9a5a4a, apron: 0x3a4048, props: ['bowl', 'sticks', 'mound'] },
            { name: 'eaterD', mode: 'eater', x: 0.0, z: 3.47, yaw: 0, phase: 2.1, hair: 0x1e1a18, top: 0x4a6a5d, apron: 0x3a4048, props: ['bowl', 'sticks', 'mound'] },
            { name: 'cat', mode: 'cat', hair: 0xd88a3a, top: 0xd88a3a, apron: 0xd88a3a, props: [] },
        ];
        const base_parts = [
            { tag: 'legL', pos: [-0.09, 0.17, 0], size: [0.14, 0.34, 0.15], color: 0x33302c },
            { tag: 'legR', pos: [0.09, 0.17, 0], size: [0.14, 0.34, 0.15], color: 0x33302c },
            { tag: 'hip', pos: [0, 0.38, 0.01], size: [0.34, 0.16, 0.22], color: 'apron' },
            { tag: 'torso', pos: [0, 0.56, 0], size: [0.32, 0.42, 0.2], color: 'top' },
            { tag: 'armL', pos: [-0.215, 0.6, 0], size: [0.09, 0.36, 0.11], color: 'top' },
            { tag: 'armR', pos: [0.215, 0.6, 0], size: [0.09, 0.36, 0.11], color: 'top' },
            { tag: 'head', pos: [0, 0.88, 0.01], size: [0.2, 0.2, 0.2], color: skin },
            { tag: 'hair', pos: [0, 0.99, -0.01], size: [0.22, 0.09, 0.22], color: 'hair' },
        ];
        const prop_shapes = {
            board: { size: [0.72, 0.05, 0.5], color: 0xd8cba8 },
            dough_ball: { size: [0.2, 0.14, 0.2], color: 0xf2e8d0 },
            dough_work: { size: [0.3, 0.06, 0.22], color: 0xf2e8d0 },
            bowl_a: { size: [0.3, 0.12, 0.3], color: 0xd8433a },
            bowl_b: { size: [0.3, 0.12, 0.3], color: 0xd8433a },
            mound_a: { size: [0.19, 0.08, 0.19], color: 0xf2e8d0 },
            mound_b: { size: [0.19, 0.08, 0.19], color: 0xf2e8d0 },
            w_bowl: { size: [0.3, 0.12, 0.3], color: 0xd8433a },
            bowl: { size: [0.3, 0.12, 0.3], color: 0xd8433a },
            mound: { size: [0.19, 0.08, 0.19], color: 0xf2e8d0 },
            carry_bowl: { size: [0.26, 0.11, 0.26], color: 0xd8433a },
            knife: { size: [0.05, 0.04, 0.34], color: 0xb8bec2 },
            plate: { size: [0.3, 0.04, 0.3], color: 0xf2ede2 },
            cloth: { size: [0.22, 0.04, 0.22], color: 0xd8d0c0 },
            phone: { size: [0.09, 0.18, 0.03], color: 0x1e2226 },
            sticks: { size: [0.03, 0.03, 0.3], color: 0xd8b98a },
            bit1: { size: [0.07, 0.04, 0.07], color: 0x6d9a52 },
            bit2: { size: [0.07, 0.04, 0.07], color: 0x6d9a52 },
        };
        const cat_parts = [
            { tag: 'c_body', pos: [0, 0.23, -0.04], size: [0.22, 0.2, 0.52], color: 0xd88a3a },
            { tag: 'c_head', pos: [0, 0.34, 0.26], size: [0.2, 0.18, 0.18], color: 0xd88a3a },
            { tag: 'c_earL', pos: [-0.06, 0.45, 0.26], size: [0.05, 0.07, 0.04], color: 0xb8742e },
            { tag: 'c_earR', pos: [0.06, 0.45, 0.26], size: [0.05, 0.07, 0.04], color: 0xb8742e },
            { tag: 'c_muz', pos: [0, 0.31, 0.36], size: [0.1, 0.08, 0.06], color: 0xf2ede2 },
            { tag: 'c_tail', pos: [0, 0.3, -0.34], size: [0.05, 0.05, 0.3], color: 0xb8742e },
            { tag: 'c_legFL', pos: [-0.08, 0.07, 0.16], size: [0.06, 0.14, 0.06], color: 0xd88a3a },
            { tag: 'c_legFR', pos: [0.08, 0.07, 0.16], size: [0.06, 0.14, 0.06], color: 0xd88a3a },
            { tag: 'c_legBL', pos: [-0.08, 0.07, -0.22], size: [0.06, 0.14, 0.06], color: 0xd88a3a },
            { tag: 'c_legBR', pos: [0.08, 0.07, -0.22], size: [0.06, 0.14, 0.06], color: 0xd88a3a },
        ];
        let total = 0;
        for (const def of this.figure_defs) {
            def.parts = (def.mode === 'cat' ? cat_parts : base_parts).map(p => ({ ...p }));
            for (const prop of def.props) {
                const shape = prop_shapes[prop];
                def.parts.push({ tag: prop, pos: [0, 0.5, 0.3], size: shape.size, color: shape.color, prop: true });
            }
            def.offset = total;
            total += def.parts.length;
        }
        this.figure_mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.88 }), total);
        this.figure_mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.figure_mesh.frustumCulled = false;
        this.figure_mesh.castShadow = true;
        scene.add(this.figure_mesh);
        this.figure_root = new THREE.Object3D();
        this.part_obj = new THREE.Object3D();
        this.part_matrix = new THREE.Matrix4();
        this.root_matrix = new THREE.Matrix4();
        const color = new THREE.Color();
        this.figure_defs.forEach((def, fi) => {
            def.parts.forEach((part, pi) => {
                let paint = part.color;
                if (part.color === 'top') paint = def.top;
                if (part.color === 'apron') paint = def.apron;
                if (part.color === 'hair') paint = def.hair;
                if (def.helmet && part.tag === 'hair') paint = def.helmet;
                this.figure_mesh.setColorAt(def.offset + pi, color.setHex(paint));
            });
        });
        this.figure_mesh.instanceColor.needsUpdate = true;
        this.update(0, 0, { night: 1, rain: 0, day: 0.935 });
    },

    set_part(def, pi, px, py, pz, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
        const part = def.parts[pi];
        this.part_obj.position.set(px, py, pz);
        this.part_obj.rotation.set(rx, ry, rz);
        this.part_obj.scale.set(part.size[0] * sx, part.size[1] * sy, part.size[2] * sz);
        this.part_obj.updateMatrix();
        this.part_matrix.multiplyMatrices(this.figure_root.matrix, this.part_obj.matrix);
        this.figure_mesh.setMatrixAt(def.offset + pi, this.part_matrix);
    },
    figure_transform(def, x, y, z, yaw, scale = 1) {
        this.figure_root.position.set(x, y, z);
        this.figure_root.rotation.set(0, yaw, 0);
        this.figure_root.scale.setScalar(scale);
        this.figure_root.updateMatrix();
    },
    body(def, opts = {}) {
        const bob = opts.bob || 0;
        const leg_y = opts.legY === undefined ? 0.17 : opts.legY;
        this.set_part(def, 0, -0.09, leg_y, 0.02, opts.legL || 0, 0, 0);
        this.set_part(def, 1, 0.09, leg_y, 0.02, opts.legR || 0, 0, 0);
        this.set_part(def, 2, 0, 0.38, 0.01, 0, 0, 0, 1, 1, 1);
        this.set_part(def, 3, 0, 0.56 + bob * 0.4, 0, opts.lean || 0, opts.turn || 0, opts.sway || 0);
        this.set_part(def, 4, -0.215, 0.6 + bob, 0, opts.armLrx || 0, opts.armLry || 0, opts.armLrz === undefined ? -0.06 : opts.armLrz);
        this.set_part(def, 5, 0.215, 0.6 + bob, 0, opts.armRrx || 0, opts.armRry || 0, opts.armRrz === undefined ? 0.06 : opts.armRrz);
        this.set_part(def, 6, 0, 0.88 + bob, 0.01, opts.head_rx || 0, opts.head_ry || 0);
        this.set_part(def, 7, 0, 0.99 + bob, -0.01);
    },
    prop_index(def, tag) {
        return def.parts.findIndex(p => p.tag === tag);
    },

    update(t, real_time, env) {
        state_night_hint = env.night;
        this.set_moto(t);
        this.update_strainer(t);
        this.update_crane(t);
        this.update_fan(t);
        this.update_traffic(env);
        this.update_figures(t, real_time, env);
    },

    // —— 煮面篓：抓面下锅、沉入沸水、提起沥水、抖散装碗 ——
    update_strainer(t) {
        const p = ((t % 8) + 8) % 8;
        const cycle = Math.floor(((t % 16) + 16) % 16 / 8);
        const pour_x = cycle ? -2.5 : -3.4;
        const pour_z = cycle ? 2.2 : 2.1;
        let x = -4.55, z = 1.0, y = 1.45, rz = 0, tilt = 0;
        if (p < 1.2) y = 1.45 + (p / 1.2) * 1.0;
        else if (p < 2.4) { y = 2.45; rz = Math.sin(p * 26) * 0.11 * (1 - (p - 1.2) / 1.2); }
        else if (p < 3.4) {
            const k = (p - 2.4);
            x = -4.55 + (pour_x + 4.55) * k; z = 1.0 + (pour_z - 1.0) * k; y = 2.45 - k * 0.05;
        } else if (p < 4.2) { x = pour_x; z = pour_z; y = 2.4; tilt = (p - 3.4) / 0.8; rz = tilt * 0.8; }
        else if (p < 5.2) {
            const k = p - 4.2;
            x = pour_x - (pour_x + 4.55) * k; z = pour_z - (pour_z - 1.0) * k; y = 2.4;
            rz = (1 - k) * 0.8;
        } else if (p < 5.9) y = 2.45 - ((p - 5.2) / 0.7) * 1.0;
        else y = 1.45 + Math.sin(t * 3.1) * 0.035;
        this.strainer.position.set(x, y, z);
        this.strainer.rotation.z = rz;
        const clump_visible = p >= 5.9 || p < 4.3;
        this.noodle_clump.visible = clump_visible;
        let cs = 1, cy = 0.02, cx = 0, cz = 0;
        if (p >= 5.9) cs = Math.min(1, 0.25 + (p - 5.9) / 0.9 * 0.75);
        if (p >= 3.4 && p < 4.3) { const k = (p - 3.4) / 0.9; cy = -k * 0.85; cs = 1 - k * 0.72; cx = Math.sin(tilt * 3) * 0.1; }
        this.noodle_clump.position.set(cx, cy, cz);
        this.noodle_clump.scale.setScalar(Math.max(0.001, cs));
        // 竹竿吊杆：从篓沿到排风罩下的卷扬架（局部坐标，随篓移动）
        const v1 = new this.ctx.THREE.Vector3(0, 0.17, -0.34);
        const v2 = new this.ctx.THREE.Vector3(-4.55 - x, 3.42 - y, 0.62 - z);
        const dir = v2.clone().sub(v1);
        const len = dir.length();
        this.strain_handle.position.copy(v1).addScaledVector(dir, 0.5);
        this.strain_handle.quaternion.setFromUnitVectors(new this.ctx.THREE.Vector3(0, 1, 0), dir.normalize());
        this.strain_handle.scale.set(0.055, len, 0.055);
    },

    // —— 长竹竿吊运灯笼 ——
    update_crane(t) {
        const tc = t + 200;
        const op = Math.floor(tc / this.CRANE_PERIOD);
        const p = tc - op * this.CRANE_PERIOD;
        const slot = op < 5 ? op : (op - 5) % 5;
        const removing = op >= 5;
        const slot_x = -2.0 + slot * 0.6;
        const az_slot = Math.atan2(-(4.2 - 2.55), slot_x + 7.05);
        const r_slot = Math.hypot(slot_x + 7.05, 1.65);
        const az_crate = -1.762, r_crate = 2.39;
        const rope_crate = 4.54, rope_high = 1.3, rope_rail = 2.22;
        const ease = k => k * k * (3 - 2 * k);
        let az = az_crate, r = r_crate, rope = rope_high, sway = 0;
        if (p < 4) {
            rope = removing ? rope_high + (rope_rail - rope_high) * ease(p / 4) : rope_high + (rope_crate - rope_high) * ease(p / 4);
        } else if (p < 6.5) {
            rope = removing ? rope_rail + (rope_high - rope_rail) * ease((p - 4) / 2.5) : rope_crate + (rope_high - rope_crate) * ease((p - 4) / 2.5);
        } else if (p < 15) {
            const k = ease((p - 6.5) / 8.5);
            az = az_crate + (az_slot - az_crate) * k;
            r = r_crate + (r_slot - r_crate) * k;
            if (removing) { az = az_slot + (az_crate - az_slot) * k; r = r_slot + (r_crate - r_slot) * k; }
        } else if (p < 17.5) {
            if (removing) { az = az_crate; r = r_crate; rope = rope_high + (rope_crate - rope_high) * ease((p - 15) / 2.5); }
            else { az = az_slot; r = r_slot; rope = rope_high + (rope_rail - rope_high) * ease((p - 15) / 2.5); }
        } else if (p < 19) {
            if (removing) { az = az_crate; r = r_crate; rope = rope_crate + (rope_high - rope_crate) * ease((p - 17.5) / 1.5); }
            else { az = az_slot; r = r_slot; rope = rope_rail + (rope_high - rope_rail) * ease((p - 17.5) / 1.5); }
        } else if (p < 28) {
            const k = ease((p - 19) / 9);
            if (removing) { az = az_crate; r = r_crate; }
            else { az = az_slot + (az_crate - az_slot) * k; r = r_slot + (r_crate - r_slot) * k; }
        } else {
            az = az_crate; r = r_crate; sway = Math.sin(t * 0.5) * 0.02;
        }
        this.boom.rotation.y = az + sway;
        this.trolley.position.x = r;
        this.crane_rope.position.y = -rope / 2;
        this.crane_rope.scale.y = rope;
        this.hook.position.y = -rope;
        this.payload.visible = (p >= 3.6 && p < 17.5);
        this.payload.rotation.z = Math.sin(t * 2.1) * 0.07;
        for (let i = 0; i < 5; i++) {
            const visible = this.crane_tl.get(i, tc);
            this.rail_lanterns[i].lant.visible = visible;
            this.rail_lanterns[i].pivot.rotation.z = Math.sin(t * 1.3 + i * 1.7) * 0.035;
        }
    },

    update_fan(t) {
        this.fan_group.rotation.z = t * 5.2;
    },

    update_traffic(env) {
        if (!env_world.street) return;
        const street = env_world.street;
        const night = env.night > 0.5;
        const phase = ((env.day || 0.935) * 3) % 1;
        const green = !night && phase < 0.55;
        street.traffic_red.color.setHex(night || !green ? 0xff3b2a : 0x3a0e0a);
        street.traffic_green.color.setHex(!night && green ? 0x46e08a : 0x143a28);
        street.traffic_yellow.color.setHex(!night && phase >= 0.55 && phase < 0.7 ? 0xffc23a : 0x3a3214);
    },

    // —— 人物 ——
    update_figures(t, real_time, env) {
        for (const def of this.figure_defs) {
            switch (def.mode) {
                case 'chef': this.anim_chef(def, t); break;
                case 'prep': this.anim_prep(def, t); break;
                case 'wash': this.anim_wash(def, t); break;
                case 'wipe': this.anim_wipe(def, t); break;
                case 'wait': this.anim_wait(def, t); break;
                case 'photo': this.anim_photo(def, t); break;
                case 'rider': this.anim_rider(def, t); break;
                case 'walker': this.anim_walker(def, t); break;
                case 'eater': this.anim_eater(def, t); break;
                case 'cat': this.anim_cat(def, t); break;
            }
        }
        this.figure_mesh.instanceMatrix.needsUpdate = true;
    },

    anim_chef(def, t) {
        const p = ((t % 8) + 8) % 8;
        this.figure_transform(def, def.x, 0.02, def.z, def.yaw);
        const BI = this.prop_index(def, 'board'), BA = this.prop_index(def, 'dough_ball'), BW = this.prop_index(def, 'dough_work');
        this.set_part(def, BI, 0, 1.31, 0.47);
        let armL = -1.1, armR = -1.1, armLrz = -0.2, armRrz = 0.2, lean = 0.12;
        let ball_s = 0, ball_y = 1.38;
        let work = null;
        if (p < 1.2) {
            armL = -1.15 + Math.sin(p * 14) * 0.12; armR = armL;
            ball_s = 1;
        } else if (p < 2.0) {
            const k = (p - 1.2) / 0.8;
            armL = -1.15 - k * 0.5; armR = armL;
            ball_s = 1; ball_y = 1.38 + k * 0.22;
        } else if (p < 4.0) {
            const k = Math.min(1, (p - 2.0) / 1.6);
            const fold = p > 3.0 ? Math.min(1, (p - 3.0) / 0.4) : 0;
            const spread = 0.16 + k * 0.4;
            armL = -1.55; armR = -1.55; armLrz = -0.15 - spread; armRrz = 0.15 + spread;
            const sx = fold > 0 ? 0.55 + (k - 0.55) * 1.3 : 0.35 + k * 1.5;
            work = { x: 0, y: 1.52, z: 0.47, sx: Math.max(0.3, sx), sy: 1 - k * 0.45, sz: fold > 0 ? 1.6 : 1, rz: 0 };
        } else if (p < 5.4) {
            const k = (p - 4.0) / 1.4;
            const spread = 0.56 + k * 0.3;
            armL = -1.6; armR = -1.6; armLrz = -0.15 - spread; armRrz = 0.15 + spread;
            work = { x: 0, y: 1.55 + Math.sin(t * 21) * 0.02, z: 0.47, sx: 1.1 + k * 0.9, sy: 0.55, sz: 1, rz: Math.sin(t * 19) * 0.05 };
        } else if (p < 6.0) {
            const k = (p - 5.4) / 0.6;
            armL = -1.6 + k * 0.5; armR = armL; armLrz = -0.45 + k * 0.25; armRrz = 0.45 - k * 0.25;
            work = { x: 0, y: 1.5, z: 0.47, sx: 1.0 - k * 0.65, sy: 0.7 + k * 0.3, sz: 1, rz: 0 };
        } else if (p < 6.6) {
            const k = (p - 6.0) / 0.6;
            armL = -2.0; armR = -2.0; armLrz = -0.2; armRrz = 0.2;
            work = {
                x: -0.15 - k * 2.1, y: 2.0 + Math.sin(k * Math.PI) * 0.62 - k * 0.12, z: 0.5 - k * 0.85,
                sx: 0.85 - k * 0.5, sy: 1, sz: 0.8, rz: k * 1.2,
            };
        } else if (p < 7.2) {
            armL = -1.7 + (p - 6.6) * 0.8; armR = armL; armLrz = -0.3; armRrz = 0.3;
        } else {
            const k = (p - 7.2) / 0.8;
            armL = -1.15; armR = -1.15;
            ball_s = Math.min(1, k * 1.6);
        }
        this.body(def, { armLrx: armL, armRrx: armR, armLrz, armRrz, lean });
        this.set_part(def, BA, 0, ball_y + 0.01, 0.47, 0, 0, 0, ball_s, ball_s, ball_s);
        if (work) this.set_part(def, BW, work.x, work.y, work.z, 0, 0, work.rz, work.sx, work.sy, work.sz);
        else this.set_part(def, BW, 0, -1, 0, 0, 0, 0, 0.001, 0.001, 0.001);
        // 两碗汤面：装碗、沿台面递出（与煮面篓浇注节奏同步，隔轮交替）
        const is_a_cycle = Math.floor(((t % 16) + 16) % 16 / 8) === 0;
        for (const [tag, mtag, is_a, rest_x, rest_z] of [['bowl_a', 'mound_a', true, -3.4, 2.1], ['bowl_b', 'mound_b', false, -2.5, 2.2]]) {
            const idx = this.prop_index(def, tag), midx = this.prop_index(def, mtag);
            const cp = ((t % 8) + 8) % 8;
            const active = is_a === is_a_cycle;
            let s = 1, mound = 0, slide = 0;
            if (!active) s = 0.001;
            else {
                if (cp >= 3.5 && cp < 4.3) mound = (cp - 3.5) / 0.8;
                else if (cp >= 4.3) mound = 1;
                if (cp >= 4.6 && cp < 6.4) slide = ease_step((cp - 4.6) / 1.8);
                if (cp >= 6.4 && cp < 7.0) { slide = 1; s = 1 - (cp - 6.4) / 0.6; }
                if (cp >= 7.0) s = 0.001;
            }
            const bx = rest_x + slide * (2.05 - rest_x), bz = rest_z + slide * (2.45 - rest_z);
            this.set_part(def, idx, bx - def.x, 1.36, bz - def.z, 0, 0, 0, s, s, s);
            this.set_part(def, midx, bx - def.x, 1.36 + 0.1 * mound * s, bz - def.z, 0, 0, 0, mound * s, mound * s, mound * s);
        }
    },

    anim_prep(def, t) {
        const p = (t % 2.4) / 2.4;
        const chop = Math.abs(Math.sin(p * Math.PI * 3));
        this.figure_transform(def, def.x, 0.02, def.z, def.yaw);
        this.body(def, {
            lean: 0.16, armRrx: -1.15 - chop * 0.55, armRrz: 0.15, armLrx: -1.05, armLrz: -0.3,
            head_rx: 0.22, bob: Math.abs(Math.sin(p * Math.PI * 3)) * 0.015,
        });
        const KI = this.prop_index(def, 'knife');
        this.set_part(def, KI, 0.24, 1.26 - chop * 0.06, 0.62, 0, 0, 0.1);
        for (const [tag, bx, bz, seed] of [['bit1', 0.34, 1.32, 1.3], ['bit2', 0.44, 1.0, 3.1]]) {
            const idx = this.prop_index(def, tag);
            const jump = Math.max(0, Math.sin(p * Math.PI * 3 + seed)) * 0.09;
            this.set_part(def, idx, bx - def.x + Math.sin(seed + t * 0.35) * 0.05, 1.19 + jump, bz - def.z, 0, seed + t, 0);
        }
    },

    anim_wash(def, t) {
        const p = (t % 6) / 6;
        const lift = Math.max(0, Math.sin(p * Math.PI * 2));
        this.figure_transform(def, def.x, 0.02, def.z, def.yaw);
        this.body(def, {
            lean: 0.14, armLrx: -1.2 - lift * 0.7, armRrx: -1.2 - lift * 0.7,
            armLrz: -0.25 + Math.sin(t * 5) * 0.1, armRrz: 0.25 - Math.sin(t * 5) * 0.1,
            head_rx: 0.24, bob: lift * 0.02,
        });
        // 洗碗盘：盆内刷洗、抬高越过南侧矮沿、悬空控水
        const PI_ = this.prop_index(def, 'plate');
        this.set_part(def, PI_, 0.02 + Math.sin(t * 5) * 0.06, 1.0 + lift * 0.5, 0.76 - lift * 0.31, lift * 0.5, Math.sin(t * 5) * 0.3, 0);
    },

    anim_wipe(def, t) {
        const sway_x = Math.sin(t * 0.55) * 0.3;
        const p = (t % 3) / 3;
        this.figure_transform(def, def.x + sway_x, 0.02, def.z, def.yaw);
        this.body(def, {
            lean: 0.28, armLrx: -1.35 + Math.sin(p * Math.PI * 2) * 0.25, armLrz: -0.2,
            armRrx: -1.5, armRrz: 0.3, head_rx: 0.2,
        });
        const CI = this.prop_index(def, 'cloth');
        this.set_part(def, CI, Math.sin(p * Math.PI * 2) * 0.28, 1.19, 0.34, 0, 0, 0);
    },

    anim_wait(def, t) {
        this.figure_transform(def, def.x, 0.02, def.z, def.yaw);
        this.body(def, {
            sway: Math.sin(t * 0.9) * 0.04, armLrx: 0.35, armRrx: 0.35, armLrz: -0.5, armRrz: 0.5,
            head_ry: Math.sin(t * 0.55) * 0.5, head_rx: 0.06, bob: Math.sin(t * 1.4) * 0.012,
        });
    },

    anim_photo(def, t) {
        const p = (t % 8) / 8;
        const raise = p < 0.25 ? p / 0.25 : p < 0.75 ? 1 : 1 - (p - 0.75) / 0.25;
        this.figure_transform(def, def.x, 0.02, def.z, def.yaw + Math.sin(t * 0.4) * 0.1 * (1 - raise));
        this.body(def, {
            armLrx: -0.1 - raise * 2.15, armRrx: -0.1 - raise * 2.2, armLrz: -0.15, armRrz: 0.2,
            armLry: raise * 0.3, head_rx: raise * 0.12, lean: raise * 0.05,
            bob: Math.sin(t * 1.7) * 0.01,
        });
        const PI_ = this.prop_index(def, 'phone');
        this.set_part(def, PI_, 0.1, 0.62 + raise * 0.5, 0.4 - raise * 0.05, -raise * 0.25, 0, 0, raise, raise, raise);
    },

    // —— 外卖骑手：停车取餐、装箱 ——
    anim_rider(def, t) {
        const p = ((t % 48) + 48) % 48;
        const driving = p > 14 && p < 42;
        const BI = this.prop_index(def, 'carry_bowl');
        if (driving || p >= 42 || p < 0.5 || (p >= 12.5 && p < 14)) {
            const moto = this.moto;
            const off = new this.ctx.THREE.Vector3(0, 0.72, -0.28).applyEuler(moto.rotation);
            this.figure_transform(def, moto.position.x + off.x, off.y, moto.position.z + off.z, moto.rotation.y);
            const lean = driving ? 0.1 : 0.04;
            this.body(def, {
                lean, legL: -1.5, legR: -1.5, legY: 0.44, armLrx: -0.85, armRrx: -0.9,
                armLrz: -0.12, armRrz: 0.14, bob: driving ? Math.sin(t * 9) * 0.02 : Math.sin(t * 1.8) * 0.008,
                head_rx: 0.05,
            });
            this.set_part(def, BI, 0, -1, 0, 0, 0, 0, 0.001, 0.001, 0.001);
            return;
        }
        // 停业取餐窗口（纯 f(t) 分段，绕开摊位立柱）
        const pts = [
            [0.5, 2.2, 4.42, 4.32, 'dismount'],
            [2.2, 4.2, 3.0, 2.75, 'walk'],
            [4.2, 5.8, 3.0, 2.75, 'grab'],
            [5.8, 7.6, 4.48, 5.08, 'carry'],
            [7.6, 9.6, 4.48, 5.08, 'place'],
            [9.6, 12.5, 4.42, 4.32, 'remount'],
        ];
        let x = 4.42, z = 4.32, seated = 0, bowl = 0, phase = 'idle', yaw = -Math.PI / 2;
        for (const [t0, t1, px, pz, kind] of pts) {
            if (p >= t0 && p < t1) {
                const k = (p - t0) / (t1 - t0);
                x = px; z = pz; phase = kind;
                // 上下车：位置与骑乘落座点无缝衔接，朝向始终朝行进方向平滑过渡
                if (kind === 'dismount') { x = 5.25 - 0.83 * k; z = 4.63 - 0.31 * k; seated = 1 - k; yaw = Math.PI + k * 0.735; }
                if (kind === 'remount') { x = 4.42 + 0.83 * k; z = 4.32 + 0.31 * k; seated = k; yaw = Math.PI / 2 + k * Math.PI / 2; }
                if (kind === 'grab') { bowl = Math.min(1, k * 2); yaw = -2.406 + k * 0.436; }
                if (kind === 'place') { bowl = 1 - Math.max(0, (k - 0.5) * 2); yaw = 0.567 + k * 1.004; }
                break;
            }
        }
        if (phase === 'walk') {
            const k = (p - 2.2) / 2;
            if (k < 0.5) { const k2 = k / 0.5; x = 4.42 + (4.0 - 4.42) * k2; z = 4.32 + (3.35 - 4.32) * k2; }
            else { const k2 = (k - 0.5) / 0.5; x = 4.0 + (3.0 - 4.0) * k2; z = 3.35 + (2.75 - 3.35) * k2; }
            yaw = -2.406;
        } else if (phase === 'carry') {
            const k = (p - 5.8) / 1.8;
            if (k < 0.5) { const k2 = k / 0.5; x = 3.0 + (4.0 - 3.0) * k2; z = 2.75 + (3.35 - 2.75) * k2; }
            else { const k2 = (k - 0.5) / 0.5; x = 4.0 + (4.48 - 4.0) * k2; z = 3.35 + (5.08 - 3.35) * k2; }
            yaw = Math.atan2(1.48, 2.33);
        }
        const walking = phase === 'walk' || phase === 'carry';
        this.figure_transform(def, x, 0.02 + seated * 0.7, z, yaw);
        const swing = walking ? Math.sin(p * 16) * 0.45 : 0;
        const reach = phase === 'grab' ? 1 : phase === 'place' ? 1 : 0;
        this.body(def, {
            lean: 0.1 + reach * 0.2, legL: seated > 0.5 ? -1.4 : swing, legR: seated > 0.5 ? -1.4 : -swing,
            armLrx: -0.5 - bowl * 0.8, armRrx: -0.5 - bowl * 0.8, armLrz: -0.2, armRrz: 0.2,
            bob: walking ? Math.abs(Math.sin(p * 16)) * 0.025 : 0,
        });
        const bowl_world = phase === 'place'
            ? [4.85 + Math.max(0, ((p - 7.6) / 2 - 0.5)) * 0.4, 1.3 + Math.max(0, ((p - 7.6) / 2 - 0.5)) * 0.18, 5.0]
            : [x + 0.05, 1.05, z + 0.12];
        this.set_part(def, BI, bowl_world[0] - x, bowl_world[1] - 0.02 - seated * 0.7, bowl_world[2] - z, 0, 0, 0, bowl, bowl, bowl);
        const lid_k = phase === 'place' ? Math.max(0, Math.sin((p - 7.6) / 2 * Math.PI)) : 0;
        this.box_lid.rotation.x = -lid_k * 1.5;
        this.box_bowl.scale.setScalar(phase === 'place' && p > 8.9 ? Math.min(1, (p - 8.9) * 2) : p > 9.6 && p < 12.5 ? 1 : 0.001);
    },

    // —— 食客：从街口走入、菜单牌驻足、落座、吸面、离场（双车道分离） ——
    walker_timeline(def, t) {
        const p = (((t + def.t_offset) % 40) + 40) % 40;
        const seat = def.seat, wz = def.wz, mx = def.mx, az1 = def.az1, az2 = def.az2;
        const lerp = (a, b, k) => a + (b - a) * k;
        let x, z, yaw = Math.PI, scale = 1, state = 'walk', swing = 0;
        const ease = ease_step;
        if (p < 1.2) { x = 12.6; z = 9.75; scale = p / 1.2; state = 'spawn'; }
        else if (p < 5.0) { const k = ease((p - 1.2) / 3.8); x = lerp(12.6, 12.3, k); z = lerp(9.75, wz, k); yaw = Math.PI; }
        else if (p < 7.5) { const k = ease((p - 5.0) / 2.5); x = lerp(12.3, mx, k); z = wz; yaw = -Math.PI / 2; }
        else if (p < 10.0) { x = mx; z = wz; yaw = Math.PI; state = 'menu'; }
        else if (p < 13.0) {
            const k = ease((p - 10.0) / 3.0);
            if (k < 0.4) { const k2 = k / 0.4; x = lerp(mx, 2.55, k2); z = lerp(wz, az1, k2); yaw = Math.PI * 0.75; }
            else { const k2 = (k - 0.4) / 0.6; x = lerp(2.55, seat, k2); z = lerp(az1, az2, k2); yaw = -Math.PI / 2; }
        }
        else if (p < 14.0) {
            const k = p - 13.0;
            state = 'sitting';
            if (k < 0.5) { x = seat; z = az2; swing = ease(k / 0.5); }
            else { x = seat; z = lerp(az2, 4.73, ease((k - 0.5) / 0.5)); swing = 1; }
            yaw = Math.PI;
        }
        else if (p < 30.0) { x = seat; z = 4.73; yaw = Math.PI; state = 'eat'; }
        else if (p < 31.0) {
            const k = p - 30.0;
            state = 'sitting';
            if (k < 0.5) { x = seat; z = lerp(4.73, az2, ease(k / 0.5)); swing = 1; }
            else { x = seat; z = az2; swing = 1 - ease((k - 0.5) / 0.5); }
            yaw = Math.PI;
        }
        else if (p < 34.5) {
            const k = ease((p - 31.0) / 3.5);
            if (k < 0.55) { const k2 = k / 0.55; x = lerp(seat, 2.55, k2); z = lerp(az2, az1, k2); yaw = Math.PI / 2; }
            else { const k2 = (k - 0.55) / 0.45; x = lerp(2.55, 11.9, k2); z = wz; yaw = Math.PI / 2; }
        }
        else if (p < 38.8) { const k = ease((p - 34.5) / 4.3); x = lerp(11.9, 12.6, k); z = lerp(wz, 9.75, k); yaw = 0; }
        else { x = 12.6; z = 9.75; scale = Math.max(0.001, 1 - (p - 38.8) / 1.2); state = 'despawn'; }
        return { x, z, yaw, scale, state, swing: state === 'walk' ? Math.sin(p * 11) * 0.5 : swing };
    },
    anim_walker(def, t) {
        const w = this.walker_timeline(def, t);
        const seated = w.state === 'eat' ? 1 : w.state === 'sitting' ? w.swing : 0;
        this.figure_transform(def, w.x, 0.02 + seated * 0.28, w.z, w.yaw, Math.max(0.001, w.scale));
        if (w.state === 'eat' || w.state === 'sitting') {
            this.eat_pose(def, t, seated, true);
        } else {
            this.body(def, {
                legL: w.swing, legR: -w.swing, armLrx: -w.swing * 0.7, armRrx: w.swing * 0.7,
                bob: Math.abs(Math.sin((w.state === 'walk' ? t * 5.5 : 0))) * 0.02,
                lean: w.state === 'menu' ? 0.08 : 0, head_rx: w.state === 'menu' ? 0.2 : 0,
            });
            const BI = this.prop_index(def, 'w_bowl'), SI = this.prop_index(def, 'sticks');
            const hide = 0.001;
            this.set_part(def, BI, 0, -1, 0, 0, 0, 0, hide, hide, hide);
            this.set_part(def, SI, 0, -1, 0, 0, 0, 0, hide, hide, hide);
        }
    },
    eat_pose(def, t, seated, walker) {
        const p = (((t + (def.phase || def.t_offset || 0)) % 8) + 8) % 8;
        const lift = p > 2.5 && p < 5.0 ? Math.min(1, (p - 2.5) / 0.7) * (p < 4.4 ? 1 : 1 - (p - 4.4) / 0.6) : 0;
        const stick = 1 - lift;
        this.body(def, {
            legL: -1.35 * seated, legR: -1.35 * seated, legY: 0.17 + 0.27 * seated,
            lean: 0.06 + lift * 0.12,
            armLrx: -0.35 - lift * 1.1, armRrx: -0.5 - stick * 0.75, armLrz: -0.15, armRrz: 0.18,
            head_rx: lift * 0.18, bob: Math.sin(t * 2.2) * 0.01, head_ry: Math.sin(t * 0.5) * 0.12,
        });
        const bowl_local_y = 0.88 + lift * 0.28;
        const BI = this.prop_index(def, walker ? 'w_bowl' : 'bowl');
        const MI = this.prop_index(def, 'mound');
        const SI = this.prop_index(def, 'sticks');
        this.set_part(def, BI, 0.02, bowl_local_y, 0.47, 0, 0, 0, seated, seated, seated);
        if (MI !== -1) this.set_part(def, MI, 0.02, bowl_local_y + 0.09, 0.47, 0, 0, 0, seated, seated, seated);
        this.set_part(def, SI, 0.2, 1.02, 0.36 + stick * 0.14, -0.4 - stick * 1.3, 0, 0.15, seated, seated, seated);
    },
    anim_eater(def, t) {
        this.figure_transform(def, def.x, 0.3, def.z, def.yaw);
        this.eat_pose(def, t, 1, false);
    },

    // —— 流浪猫：桌脚与后巷游走、嗅闻、跳上啤酒箱打盹 ——
    cat_timeline(t) {
        const p = ((t % 40) + 40) % 40;
        const segs = this.cat_segs;
        for (let i = 0; i < segs.length; i++) {
            const [t0, t1, x, z, y, kind] = segs[i];
            if (p >= t0 && p < t1) {
                const k = (p - t0) / (t1 - t0);
                if (kind === 'hop_down') {
                    // 两段式：先贴着台面平移离开箱沿，再落到地面
                    if (k < 0.5) {
                        const kz = ease_step(k / 0.5);
                        return { x: -13.4 + (x + 13.4) * kz, z: -2.3 + (z + 2.3) * kz, y: 1.08, kind: 'hop', yaw: 0 };
                    }
                    const kk = ease_step((k - 0.5) / 0.5);
                    return { x: -13.25, z: -1.45, y: 1.08 - 1.06 * kk, kind: 'hop', yaw: 0 };
                }
                if (kind === 'hop_up') {
                    // 两段式：先原地起跳到箱顶高度，再平移落上箱顶
                    if (k < 0.6) {
                        const kk = ease_step(k / 0.6);
                        return { x: -13.25, z: -1.5, y: 0.02 + 1.23 * kk + Math.sin(kk * Math.PI) * 0.1, kind: 'hop', yaw: Math.PI };
                    }
                    const kk = ease_step((k - 0.6) / 0.4);
                    return { x: -13.25 + (x + 13.25) * kk, z: -1.5 + (z + 1.5) * kk, y: 1.25 - 0.17 * kk, kind: 'hop', yaw: Math.PI };
                }
                return { x, z, y, kind, k, index: i };
            }
        }
        return { x: -13.4, z: -1.45, y: 0.02, kind: 'walk', k: 0, index: segs.length - 2 };
    },
    anim_cat(def, t) {
        const w = this.cat_timeline(t);
        const segs = this.cat_segs;
        let x = w.x, z = w.z;
        if ((w.kind === 'walk' || w.kind === 'sniff') && w.index > 0) {
            const prev = segs[w.index - 1];
            const k = ease_step(w.k);
            x = prev[2] + (w.x - prev[2]) * k;
            z = prev[3] + (w.z - prev[3]) * k;
        }
        const moving = w.kind === 'walk';
        let yaw = Math.PI / 2;
        if (w.kind === 'hop') yaw = w.yaw;
        else if (moving || w.kind === 'sniff') {
            const cur = segs[w.index];
            const prev = segs[Math.max(0, w.index - 1)];
            yaw = Math.atan2(cur[2] - prev[2], cur[3] - prev[3]);
        }
        this.figure_transform(def, x, w.y, z, yaw);
        if (w.kind === 'nap') {
            this.set_part(def, 0, 0, 0.1, -0.04, 0, 0, 0, 1, 0.7, 1);
            this.set_part(def, 1, 0, 0.16, 0.26, 0.35, 0, 0);
            this.set_part(def, 2, -0.06, 0.26, 0.26, 0.3, 0, 0);
            this.set_part(def, 3, 0.06, 0.26, 0.26, 0.3, 0, 0);
            this.set_part(def, 4, 0, 0.12, 0.36, 0.3, 0, 0);
            this.set_part(def, 5, 0, 0.14 + Math.sin(t * 1.8) * 0.05, -0.42, Math.sin(t * 1.8) * 0.5, 0, 0.3);
            for (let i = 6; i < 10; i++) this.set_part(def, i, def.parts[i].pos[0], 0.05, def.parts[i].pos[2], 0, 0, 0, 1, 0.45, 1);
        } else {
            const gait = moving ? Math.sin(t * 13) : 0;
            const sniff = w.kind === 'sniff' ? Math.min(1, Math.sin(w.k * Math.PI) * 2) : 0;
            this.set_part(def, 0, 0, 0.23, -0.04, 0, 0, 0);
            this.set_part(def, 1, 0, 0.34 - sniff * 0.13, 0.26 + sniff * 0.05, sniff * 0.55, 0, gait * 0.04);
            this.set_part(def, 2, -0.06, 0.45 - sniff * 0.13, 0.26, sniff * 0.5, 0, 0);
            this.set_part(def, 3, 0.06, 0.45 - sniff * 0.13, 0.26, sniff * 0.5, 0, 0);
            this.set_part(def, 4, 0, 0.31 - sniff * 0.16, 0.36 + sniff * 0.04, sniff * 0.6, 0, 0);
            this.set_part(def, 5, 0, 0.3 + Math.sin(t * 2.6) * 0.06, -0.34, Math.sin(t * 2.6) * 0.22, 0, gait * 0.1);
            this.set_part(def, 6, -0.08, 0.07 + Math.max(0, gait) * 0.05, 0.16, -gait * 0.5, 0, 0);
            this.set_part(def, 7, 0.08, 0.07 + Math.max(0, -gait) * 0.05, 0.16, gait * 0.5, 0, 0);
            this.set_part(def, 8, -0.08, 0.07 + Math.max(0, -gait) * 0.05, -0.22, gait * 0.5, 0, 0);
            this.set_part(def, 9, 0.08, 0.07 + Math.max(0, gait) * 0.05, -0.22, -gait * 0.5, 0, 0);
        }
    },

};
function ease_step(k) {
    return k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
}
const env_world = { street: null };
