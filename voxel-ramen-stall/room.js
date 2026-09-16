const room = {
    knobs: [],
    build() {
        const wood_canvas = document.createElement('canvas');
        wood_canvas.width = 1024;
        wood_canvas.height = 512;
        const paint = wood_canvas.getContext('2d');
        paint.fillStyle = '#4a352b';
        paint.fillRect(0, 0, 1024, 512);
        for (let i = 0; i < 5400; i++) {
            const grain_y = rng.next() * 512;
            const grain_x = rng.next() * 1024;
            const length = 50 + rng.next() * 850;
            paint.strokeStyle = rng.next() > 0.45 ? `rgba(18,9,6,${rng.next() * 0.22})` : `rgba(186,132,82,${rng.next() * 0.15})`;
            paint.lineWidth = 0.25 + rng.next() * 1.7;
            paint.beginPath();
            paint.moveTo(grain_x, grain_y);
            paint.bezierCurveTo(grain_x + length * 0.3, grain_y + Math.sin(grain_y * 0.04) * 5, grain_x + length * 0.65, grain_y + rng.next() * 5, grain_x + length, grain_y + 2);
            paint.stroke();
        }
        for (let i = 1; i < 6; i++) {
            paint.fillStyle = '#140d0955';
            paint.fillRect(0, i * 512 / 6, 1024, 2);
            paint.fillStyle = '#b57f572a';
            paint.fillRect(0, i * 512 / 6 + 2, 1024, 1);
        }
        const wood_texture = new THREE.CanvasTexture(wood_canvas);
        wood_texture.colorSpace = THREE.SRGBColorSpace;
        wood_texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        const wood_material = new THREE.MeshStandardMaterial({ map: wood_texture, roughness: 0.42, metalness: 0.03, color: 0xc0a488 });
        // 推车台面
        geo.mesh_box(scene, 0, -2.43, 0.5, 40, 1.12, 30, wood_material);
        geo.box(scene, 0, -2.99, 0.5, 39.4, 0.12, 29.4, 0x241a15);
        geo.box(scene, 0, -2.75, 14.72, 39.2, 0.72, 0.24, 0x5d4433);
        geo.box(scene, 0, -2.75, -13.72, 39.2, 0.72, 0.24, 0x5d4433);
        geo.box(scene, -19.72, -2.75, 0.5, 0.24, 0.72, 27.7, 0x5d4433);
        geo.box(scene, 19.72, -2.75, 0.5, 0.24, 0.72, 27.7, 0x5d4433);
        for (const side of [-1, 1]) {
            geo.box(scene, 0, -3.1, side * 14.35, 38, 0.16, 0.5, 0x3d2c22);
        }
        // 车轮与车腿
        for (const side of [-1, 1]) {
            const wheel = geo.group(scene, -14.5, -7.5, side * 11.3);
            geo.cylinder(wheel, 0, 0, 0, 3.2, 0.42, 0x4a3628, 22, { rx: Math.PI / 2 });
            geo.cylinder(wheel, 0, 0, 0, 2.72, 0.46, 0x31241c, 22, { rx: Math.PI / 2 });
            geo.cylinder(wheel, 0, 0, side * 0.12, 0.52, 0.78, 0x6b5138, 10, { rx: Math.PI / 2 });
            for (let i = 0; i < 10; i++) {
                const angle = i / 10 * Math.PI * 2;
                geo.box(wheel, Math.cos(angle) * 1.42, Math.sin(angle) * 1.42, 0, 2.85, 0.14, 0.16, 0x6b5138, { rz: angle, rx: Math.PI / 2 });
            }
            geo.cylinder(wheel, 0, 0, 0, 0.14, 1.06, 0x575f60, 8, { rx: Math.PI / 2 });
        }
        geo.beam(scene, [-14.5, -7.5, -11.3], [-14.5, -7.5, 11.3], 0.24, 0x4f4438);
        geo.box(scene, -14.5, -3.6, 0, 0.7, 1.4, 1.1, 0x3d2f26);
        for (const side of [-1, 1]) {
            geo.box(scene, 16.5, -6.85, side * 11, 1.35, 7.75, 1.35, 0x463326);
            geo.box(scene, 16.5, -10.5, side * 11, 1.5, 0.2, 1.5, 0x2c211a);
            geo.beam(scene, [17.2, -2.75, side * 7.5], [24.6, -3.6, side * 7.5], 0.28, 0x5d4433);
            geo.cylinder(scene, 24.8, -3.66, side * 7.5, 0.19, 0.7, 0x6e5844, 8, { rx: Math.PI / 2 });
        }
        // 室内地面、墙面与吊灯
        geo.mesh_box(scene, 0, -10.7, 0, 180, 0.4, 180, 0x241a17);
        geo.box(scene, 0, -10.48, 0.5, 47, 0.06, 36, 0x3a2430);
        geo.box(scene, 0, -10.44, 0.5, 44.5, 0.04, 33.5, 0x452b37);
        geo.box(scene, 0, 8, -31, 105, 38, 0.7, 0x2d201a);
        geo.box(scene, 0, -8.7, -30.55, 105, 0.45, 0.3, 0x1c130f);
        geo.box(scene, 34, 8, 0, 0.7, 38, 62, 0x2b1f19);
        this.window_material = new THREE.MeshBasicMaterial({ color: 0x0e1826 });
        geo.mesh_box(scene, -9, 11.5, -30.5, 30, 20, 0.18, this.window_material, { shadow: false });
        for (let i = 0; i < 6; i++) geo.box(scene, -24 + i * 6, 11.5, -30.2, 0.3, 20.6, 0.5, 0x1a1210);
        for (const height of [1.3, 11.5, 21.7]) geo.box(scene, -9, height, -30.2, 30.6, 0.3, 0.6, 0x1a1210);
        geo.box(scene, -9, 1, -29.8, 31, 0.5, 1.7, 0x3b2c22);
        for (let i = 0; i < 11; i++) {
            const height = 1 + rng.next() * 4;
            geo.mesh_box(scene, -22 + i * 2.6, 1.5 + height / 2, -30.34, 1.8, height, 0.03, new THREE.MeshBasicMaterial({ color: [0x4a3826, 0x3a3040, 0x54402a, 0x2c3444][i % 4] }), { shadow: false });
        }
        this.shade_material = new THREE.MeshStandardMaterial({ color: 0x8a5a34, roughness: 0.6, emissive: 0xff9a40, emissiveIntensity: 0.25, side: THREE.DoubleSide });
        geo.beam(scene, [0, 13.4, 1], [0, 10.9, 1], 0.07, 0x241a14);
        geo.cylinder(scene, 0, 10.72, 1, 2.0, 0.8, this.shade_material, 20);
        geo.cylinder(scene, 0, 10.28, 1, 1.15, 0.22, 0xf7dfa8, 12);
        const bulb_material = new THREE.MeshBasicMaterial({ color: 0xffe2ae });
        geo.cylinder(scene, 0, 10.05, 1, 0.2, 0.34, bulb_material, 8);
        for (const shelf_y of [-0.2, 7]) {
            geo.box(scene, 24.5, shelf_y, -27, 14, 0.5, 2.8, 0x453228);
            for (let i = 0; i < 9; i++) {
                geo.box(scene, 18.5 + i * 1.4, shelf_y + 1.8, -27, 0.8, 3.1 + rng.next(), 1.7, [0x5d4a3a, 0x7d6a4c, 0x46403a, 0x6a4438][i % 4]);
            }
        }
        const scroll_canvas = document.createElement('canvas');
        scroll_canvas.width = 220;
        scroll_canvas.height = 560;
        const scroll_paint = scroll_canvas.getContext('2d');
        scroll_paint.fillStyle = '#e8dcc4';
        scroll_paint.fillRect(0, 0, 220, 560);
        scroll_paint.fillStyle = '#b03a2e';
        scroll_paint.font = '500 170px "Microsoft YaHei",sans-serif';
        scroll_paint.textAlign = 'center';
        scroll_paint.fillText('麺', 110, 260);
        scroll_paint.fillStyle = '#5d4a3a';
        scroll_paint.font = '34px "Microsoft YaHei",sans-serif';
        scroll_paint.fillText('深夜食堂', 110, 380);
        scroll_paint.fillText('一碗入魂', 110, 430);
        const scroll_texture = new THREE.CanvasTexture(scroll_canvas);
        scroll_texture.colorSpace = THREE.SRGBColorSpace;
        const scroll = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 8.6), new THREE.MeshStandardMaterial({ map: scroll_texture, roughness: 0.95 }));
        scroll.position.set(12, 8.5, -30.55);
        scene.add(scroll);
        geo.box(scene, 12, 13, -30.5, 4, 0.3, 0.2, 0x4a3628);
        geo.box(scene, 12, 4, -30.5, 4, 0.3, 0.2, 0x4a3628);
        this.build_tabletop_props();
        this.build_controls();
    },
    // 推车台面四角的小道具：竹筷筒、酱油瓶、搪瓷碗、白瓷汤勺
    build_tabletop_props() {
        const chop_holder = geo.group(scene, -18.1, -1.87, 12.7);
        chop_holder.rotation.y = 0.5;
        geo.cylinder(chop_holder, 0, 0.62, 0, 0.52, 1.24, 0xb99a68, 12);
        geo.cylinder(chop_holder, 0, 1.26, 0, 0.56, 0.08, 0x8a6f4a, 12);
        for (let i = 0; i < 7; i++) {
            const angle = -0.5 + i * 0.16;
            const lean = 0.16 + (i % 3) * 0.05;
            geo.box(chop_holder, Math.sin(angle) * 0.2, 1.55, Math.cos(angle) * 0.2 - 0.05, 0.055, 1.5, 0.055, i % 2 ? 0xd8b98a : 0xc9a878, { rx: lean, rz: Math.sin(angle) * 0.12 });
        }
        const sauce = geo.group(scene, 18.2, -1.87, 13.1);
        sauce.rotation.y = -0.4;
        geo.cylinder(sauce, 0, 0.5, 0, 0.34, 1.0, 0x3d2417, 10);
        geo.cylinder(sauce, 0, 1.14, 0, 0.15, 0.32, 0x3d2417, 8);
        geo.cylinder(sauce, 0, 1.36, 0, 0.17, 0.14, 0xb03830, 8);
        geo.cylinder(sauce, 0, 0.86, 0, 0.345, 0.24, 0xd8cbb2, 10);
        const enamel = geo.group(scene, -18.5, -1.87, -12.5);
        enamel.rotation.y = 0.9;
        geo.cylinder(enamel, 0, 0.21, 0, 0.68, 0.42, 0xe8e4da, 14);
        geo.cylinder(enamel, 0, 0.43, 0, 0.68, 0.05, 0x3d6a8a, 14);
        geo.cylinder(enamel, 0, 0.38, 0, 0.6, 0.05, 0xc8c2b4, 14);
        geo.box(enamel, 0.42, 0.22, 0.3, 0.16, 0.05, 0.1, 0x3d6a8a, { rz: 0.5 });
        const spoon = geo.group(scene, 18.4, -1.87, -12.3);
        spoon.rotation.y = -1.1;
        geo.box(spoon, -0.75, 0.045, 0, 1.15, 0.07, 0.13, 0xf2ede2);
        geo.box(spoon, 0.14, 0.07, 0, 0.5, 0.1, 0.34, 0xf2ede2);
        geo.box(spoon, 0.14, 0.12, 0, 0.42, 0.03, 0.26, 0xd8d2c4);
        geo.cylinder(scene, -16.9, -1.84, 13.6, 0.5, 0.06, 0xcbb89a, 14);
        geo.cylinder(scene, 16.7, -1.84, 11.9, 0.44, 0.06, 0xcbb89a, 14);
    },
    build_controls() {
        geo.box(scene, 0, -1.77, 12.9, 10.8, 0.15, 2.9, 0x2c2019);
        geo.box(scene, 0, -1.86, 14.36, 10.8, 0.04, 0.04, 0x958058);
        for (const panel_x of [-5.18, 5.18]) {
            for (const panel_z of [11.66, 14.14]) {
                geo.cylinder(scene, panel_x, -1.678, panel_z, 0.055, 0.022, 0x8d8178, 8);
            }
        }
        const chrome_material = new THREE.MeshStandardMaterial({ color: 0x8a8078, roughness: 0.32, metalness: 0.75 });
        ['运转速度', '昼夜循环', '蒸汽强度'].forEach((title, index) => {
            const knob_x = (index - 1) * 3.25;
            geo.cylinder(scene, knob_x, -1.66, 12.65, 0.65, 0.08, chrome_material, 32);
            const knob = geo.group(scene, knob_x, -1.59, 12.65);
            const body = geo.cylinder(knob, 0, 0.2, 0, 0.49, 0.4, 0x231a15, 24);
            body.userData.control = index;
            geo.mesh_box(knob, 0, 0.407, -0.24, 0.07, 0.025, 0.23, 0xf0c288);
            for (let i = 0; i < 16; i++) {
                const angle = i / 16 * Math.PI * 2;
                geo.mesh_box(knob, Math.sin(angle) * 0.484, 0.2, Math.cos(angle) * 0.484, 0.035, 0.29, 0.036, 0x4d423a, { ry: angle });
            }
            for (let i = 0; i < 9; i++) {
                const angle = (-0.75 + i / 8 * 1.5) * Math.PI;
                geo.box(scene, knob_x + Math.sin(angle) * 0.79, -1.678, 12.65 - Math.cos(angle) * 0.79, 0.03, 0.012, 0.11, i === 4 ? 0xf0b878 : 0x7d7268, { ry: -angle });
            }
            geo.label(scene, title, knob_x, -1.679, 13.82, 2.28, 0.42, { rx: -Math.PI / 2, background: '#2c2019', color: '#e5d4b8', border: '#2c2019' });
            this.knobs.push({ group: knob, hit: body, angle: 0 });
        });
        geo.label(scene, '深夜拉面摊  /  微缩食摊 002', -6.8, -0.99, 10.59, 5.7, 0.58, { background: '#33241c', color: '#e8c89a', border: '#6d5c4d' });
    },
};
