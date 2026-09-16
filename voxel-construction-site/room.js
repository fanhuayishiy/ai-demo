const room = {
    knobs: [],
    build() {
        const wood_canvas = document.createElement('canvas');
        wood_canvas.width = 1024;
        wood_canvas.height = 512;
        const paint = wood_canvas.getContext('2d');
        paint.fillStyle = '#47352c';
        paint.fillRect(0, 0, 1024, 512);
        for (let i = 0; i < 5100; i++) {
            const grain_y = rng.next() * 512;
            const grain_x = rng.next() * 1024;
            const length = 50 + rng.next() * 850;
            paint.strokeStyle = rng.next() > 0.45 ? `rgba(15,8,5,${rng.next() * 0.2})` : `rgba(171,119,70,${rng.next() * 0.14})`;
            paint.lineWidth = 0.25 + rng.next() * 1.7;
            paint.beginPath();
            paint.moveTo(grain_x, grain_y);
            paint.bezierCurveTo(grain_x + length * 0.3, grain_y + Math.sin(grain_y * 0.04) * 5, grain_x + length * 0.65, grain_y + rng.next() * 5, grain_x + length, grain_y + 2);
            paint.stroke();
        }
        for (let i = 1; i < 6; i++) {
            paint.fillStyle = '#120d0955';
            paint.fillRect(0, i * 512 / 6, 1024, 2);
            paint.fillStyle = '#ab79552a';
            paint.fillRect(0, i * 512 / 6 + 2, 1024, 1);
        }
        const wood_texture = new THREE.CanvasTexture(wood_canvas);
        wood_texture.colorSpace = THREE.SRGBColorSpace;
        wood_texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        const wood_material = new THREE.MeshStandardMaterial({ map: wood_texture, roughness: 0.4, metalness: 0.03, color: 0xb39d83 });
        geo.mesh_box(scene, 0, -2.43, 0.5, 40, 1.12, 30, wood_material);
        geo.box(scene, 0, -2.98, 0.5, 39.6, 0.1, 29.6, 0x201d1a);
        geo.box(scene, 0, -1.8, 0, 30.5, 0.18, 21.5, 0x293a3a);
        geo.box(scene, 0, -1.86, 10.72, 30.4, 0.16, 0.04, 0xb99b5d);
        geo.box(scene, -15.23, -1.86, 0, 0.04, 0.16, 21.4, 0xb99b5d);
        geo.box(scene, 15.23, -1.86, 0, 0.04, 0.16, 21.4, 0xb99b5d);
        for (const leg_x of [-16.5, 16.5]) {
            for (const leg_z of [-11, 12]) {
                geo.box(scene, leg_x, -6.7, leg_z, 1.2, 7.4, 1.2, 0x252d2e);
                geo.box(scene, leg_x, -10.37, leg_z, 1.26, 0.18, 1.26, 0x161d20);
            }
            geo.box(scene, leg_x, -8.9, 0.5, 0.7, 0.6, 23, 0x252d2e);
        }
        geo.mesh_box(scene, 0, -10.7, 0, 180, 0.4, 180, 0x202b30);
        geo.box(scene, 0, 8, -31, 105, 38, 0.7, 0x242d31);
        geo.box(scene, -38, 8, 0, 0.7, 38, 62, 0x253034);
        geo.box(scene, 0, -8.7, -30.55, 105, 0.45, 0.3, 0x131e22);
        this.window_material = new THREE.MeshStandardMaterial({ color: 0x7999a3, emissive: 0x526f7a, emissiveIntensity: 0.3, roughness: 1 });
        geo.mesh_box(scene, -9, 11.5, -30.5, 30, 20, 0.18, this.window_material, { shadow: false });
        for (let i = 0; i < 6; i++) geo.box(scene, -24 + i * 6, 11.5, -30.2, 0.3, 20.6, 0.5, 0x152328);
        for (const height of [1.3, 11.5, 21.7]) geo.box(scene, -9, height, -30.2, 30.6, 0.3, 0.6, 0x152328);
        geo.box(scene, -9, 1, -29.8, 31, 0.5, 1.7, 0x303e41);
        for (let i = 0; i < 11; i++) {
            const height = 1 + rng.next() * 4;
            geo.mesh_box(scene, -22 + i * 2.6, 1.5 + height / 2, -30.34, 1.8, height, 0.03, new THREE.MeshBasicMaterial({ color: 0x526975 }), { shadow: false });
        }
        for (const shelf_y of [-0.2, 7]) {
            geo.box(scene, 23, shelf_y, -29, 15, 0.5, 2.8, 0x45403a);
            for (let i = 0; i < 9; i++) {
                geo.box(scene, 17 + i * 1.4, shelf_y + 1.8, -29, 0.8, 3.1 + rng.next(), 1.7, [0x53666a, 0x7f745c, 0x3f515b][i % 3]);
            }
        }
        this.build_blueprints();
        this.build_tools();
        this.build_controls();
    },
    build_blueprints() {
        const paper = geo.group(scene, -13.8, -1.846, 12.6);
        paper.rotation.y = -0.11;
        geo.box(paper, -0.1, 0, -0.1, 6.4, 0.025, 3.4, 0xb9c1b6, { ry: 0.08 });
        const blueprint = document.createElement('canvas');
        blueprint.width = 1024;
        blueprint.height = 580;
        const paint = blueprint.getContext('2d');
        paint.fillStyle = '#355a71';
        paint.fillRect(0, 0, 1024, 580);
        paint.strokeStyle = '#c5d5d41a';
        paint.lineWidth = 1;
        for (let i = 0; i < 26; i++) { paint.beginPath(); paint.moveTo(i * 40, 0); paint.lineTo(i * 40, 580); paint.stroke(); }
        for (let i = 0; i < 15; i++) { paint.beginPath(); paint.moveTo(0, i * 40); paint.lineTo(1024, i * 40); paint.stroke(); }
        paint.strokeStyle = '#c5d5d4bb';
        paint.lineWidth = 2;
        paint.strokeRect(22, 22, 980, 536);
        paint.strokeRect(72, 89, 610, 365);
        paint.strokeRect(89, 107, 576, 330);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                paint.strokeRect(111 + i * 139, 130 + j * 100, 104, 70);
                paint.fillStyle = '#c5d5d4bb';
                paint.fillRect(108 + i * 139, 126 + j * 100, 9, 9);
            }
        }
        paint.beginPath();
        paint.moveTo(70, 60); paint.lineTo(684, 60);
        paint.moveTo(55, 89); paint.lineTo(55, 454);
        paint.stroke();
        paint.fillStyle = '#c5d5d4';
        paint.font = '22px "Microsoft YaHei",sans-serif';
        paint.fillText('结构平面 · 基础施工图', 725, 110);
        paint.font = '16px "Microsoft YaHei",sans-serif';
        paint.fillText('工程编号 001', 730, 405);
        paint.fillText('比例 1 : 200', 730, 438);
        paint.fillText('城市建造研究', 730, 472);
        paint.strokeRect(710, 367, 268, 152);
        paint.beginPath(); paint.moveTo(844, 210); paint.lineTo(844, 300); paint.moveTo(824, 240); paint.lineTo(844, 210); paint.lineTo(864, 240); paint.stroke();
        paint.fillText('北', 833, 190);
        const texture = new THREE.CanvasTexture(blueprint);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        const sheet = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 3.35), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.96, side: THREE.DoubleSide }));
        sheet.rotation.x = -Math.PI / 2;
        sheet.position.y = 0.035;
        paper.add(sheet);
        const pencil = geo.group(paper, -1.3, 0.11, 0.45);
        pencil.rotation.y = 0.17;
        geo.cylinder(pencil, 0, 0, 0, 0.055, 2.7, 0xc98239, 6, { rz: Math.PI / 2 });
        geo.cylinder(pencil, 1.4, 0, 0, 0.055, 0.16, 0xb5ac94, 6, { rz: Math.PI / 2 });
        geo.cylinder(pencil, -1.4, 0, 0, 0.032, 0.12, 0x292d30, 6, { rz: Math.PI / 2 });
    },
    build_tools() {
        const helmet = geo.group(scene, 15.9, -1.82, 12.4);
        helmet.rotation.y = 0.22;
        for (let i = -5; i <= 5; i++) {
            for (let j = -5; j <= 5; j++) {
                if (i * i + j * j > 31) continue;
                geo.box(helmet, i * 0.21, 0.08, j * 0.21, 0.21, 0.13, 0.21, 0xdba223);
            }
        }
        for (let layer = 0; layer < 6; layer++) {
            const radius = Math.sqrt(1 - (layer / 6) ** 2) * 4.6;
            for (let i = -4; i <= 4; i++) {
                for (let j = -4; j <= 4; j++) {
                    if (i * i + j * j <= radius * radius) geo.box(helmet, i * 0.2, 0.22 + layer * 0.16, j * 0.2, 0.202, 0.16, 0.202, (i + j + layer) % 4 === 0 ? 0xf5c33f : 0xefb630);
                }
            }
        }
        geo.box(helmet, 0, 1.15, 0, 0.12, 0.1, 0.55, 0xf7cb4f);
        const tape = geo.group(scene, 10.1, -1.78, 13.1);
        tape.rotation.y = -0.22;
        geo.box(tape, 0, 0.38, 0, 1.15, 0.76, 1, 0x27343a);
        geo.box(tape, 0, 0.4, 0.52, 0.85, 0.55, 0.05, 0xdcae3d);
        geo.box(tape, -1.88, 0.03, 0, 2.6, 0.045, 0.34, 0xbfbfac);
        geo.box(tape, -3.2, 0.06, 0, 0.05, 0.16, 0.37, 0xadb9b5);
        for (let i = 0; i < 27; i++) geo.box(tape, -0.6 - i * 0.095, 0.057, 0.08, 0.012, 0.005, i % 5 === 0 ? 0.22 : 0.11, 0x343b38);
        geo.label(tape, '5 m', 0, 0.4, 0.552, 0.55, 0.26, { background: '#cfaa42', color: '#273038' });
        const level = geo.group(scene, -17.6, -1.67, -3.2);
        level.rotation.y = 0.11;
        const aluminium = new THREE.MeshStandardMaterial({ color: 0xb4bbb5, roughness: 0.28, metalness: 0.85 });
        geo.mesh_box(level, 0, 0.05, 0, 0.65, 0.25, 5.5, aluminium);
        geo.box(level, 0, 0.18, 0, 0.42, 0.06, 5.25, 0xd6a639);
        for (const level_z of [-2.6, 2.6]) geo.box(level, 0, 0.07, level_z, 0.75, 0.37, 0.33, 0x222e33);
        for (const level_z of [-1.5, 0, 1.5]) {
            geo.box(level, 0, 0.225, level_z, 0.33, 0.03, 0.64, 0x24343b);
            geo.box(level, 0, 0.25, level_z, 0.2, 0.03, 0.5, 0xaccd74);
            geo.box(level, 0, 0.27, level_z, 0.11, 0.015, 0.16, 0xe5efb6);
        }
        const lamp = geo.group(scene, 17.1, -1.86, -10.8);
        geo.cylinder(lamp, 0, 0.14, 0, 1.05, 0.28, 0x293537, 24);
        geo.beam(lamp, [0, 0.25, 0], [0.7, 5.9, 0], 0.16, 0x435152);
        geo.beam(lamp, [0.7, 5.9, 0], [-1.3, 7.4, 0.1], 0.16, 0x435152);
        geo.cylinder(lamp, 0.7, 5.9, 0, 0.27, 0.22, 0xcdb889, 12, { rx: Math.PI / 2 });
        const shade = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.85, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x3e534f, side: THREE.DoubleSide, metalness: 0.25, roughness: 0.4 }));
        shade.position.set(-1.3, 7.1, 0.1);
        lamp.add(shade);
        geo.cylinder(lamp, -1.3, 6.74, 0.1, 0.78, 0.04, new THREE.MeshBasicMaterial({ color: 0xffdfad }), 20);
        lighting.add_lamp(15.8, 4.88, -10.7, 0xffd19c, 1.2);
        const desk_light = new THREE.PointLight(0xffcd91, 22, 18, 2);
        desk_light.position.set(15.8, 4.7, -10.7);
        scene.add(desk_light);
    },
    build_controls() {
        geo.box(scene, 0, -1.77, 12.9, 10.8, 0.15, 2.9, 0x263638);
        geo.box(scene, 0, -1.86, 14.36, 10.8, 0.04, 0.04, 0x958058);
        for (const panel_x of [-5.18, 5.18]) {
            for (const panel_z of [11.66, 14.14]) {
                geo.cylinder(scene, panel_x, -1.678, panel_z, 0.055, 0.022, 0x87928d, 8);
            }
        }
        const chrome_material = new THREE.MeshStandardMaterial({ color: 0x808e8c, roughness: 0.3, metalness: 0.8 });
        ['设备速度', '昼夜循环', '施工扬尘'].forEach((title, index) => {
            const knob_x = (index - 1) * 3.25;
            geo.cylinder(scene, knob_x, -1.66, 12.65, 0.65, 0.08, chrome_material, 32);
            const knob = geo.group(scene, knob_x, -1.59, 12.65);
            const body = geo.cylinder(knob, 0, 0.2, 0, 0.49, 0.4, 0x17262a, 24);
            body.userData.control = index;
            geo.mesh_box(knob, 0, 0.407, -0.24, 0.07, 0.025, 0.23, 0xecc488);
            for (let i = 0; i < 16; i++) {
                const angle = i / 16 * Math.PI * 2;
                geo.mesh_box(knob, Math.sin(angle) * 0.484, 0.2, Math.cos(angle) * 0.484, 0.035, 0.29, 0.036, 0x495451, { ry: angle });
            }
            for (let i = 0; i < 9; i++) {
                const angle = (-0.75 + i / 8 * 1.5) * Math.PI;
                geo.box(scene, knob_x + Math.sin(angle) * 0.79, -1.678, 12.65 - Math.cos(angle) * 0.79, 0.03, 0.012, 0.11, i === 4 ? 0xe9bd7e : 0x798883, { ry: -angle });
            }
            geo.label(scene, title, knob_x, -1.679, 13.82, 2.28, 0.42, { rx: -Math.PI / 2, background: '#263638', color: '#ddd3b7', border: '#263638' });
            this.knobs.push({ group: knob, hit: body, angle: 0 });
        });
        geo.label(scene, '方寸之间  /  微缩建造 001', -6.8, -0.99, 10.59, 5.7, 0.58, { background: '#273938', color: '#e2c69a', border: '#6d7565' });
    },
};
