const site = {
    build(ctx) {
        const { THREE, scene, geo, ground_material, window_material, add_lamp } = ctx;
        const group = geo.group(scene);
        const colors = {
            soil: 0x9d7552,
            dark_soil: 0x6f4c36,
            light_soil: 0xb68c5e,
            concrete: 0xc5c9c3,
            steel: 0x52616b,
            orange: 0xf29539,
            teal: 0x247c7d,
            blue: 0x397daf,
            cream: 0xe7e0cb,
            yellow: 0xf0bc42,
            dark: 0x23313a,
        };
        const area_list = [
            [-12.5, 0, 5, 21],
            [6.5, 0, 17, 21],
            [-6, -7.2, 8, 6.6],
            [-6, 7.2, 8, 6.6],
        ];
        geo.box(group, 0, -1.56, 0, 30, 0.28, 21, colors.dark_soil);
        for (const [pos_x, pos_z, size_x, size_z] of area_list) {
            geo.box(group, pos_x, -1.245, pos_z, size_x, 0.35, size_z, colors.soil);
            geo.box(group, pos_x, -0.82, pos_z, size_x, 0.5, size_z, colors.light_soil);
            geo.box(group, pos_x, -0.345, pos_z, size_x, 0.45, size_z, colors.soil);
            geo.box(group, pos_x, -0.06, pos_z, size_x, 0.12, size_z, ground_material);
        }
        geo.box(group, -6, -1.385, 0, 8, 0.07, 7.8, colors.light_soil);
        for (let i = 0; i < 14; i++) {
            for (let j = 0; j < 11; j++) {
                const pos_x = -9.7 + i * 0.55;
                const pos_z = -3.55 + j * 0.69;
                if ((i * 13 + j * 7) % 5 !== 0) {
                    geo.box(group, pos_x, -1.322, pos_z, 0.46, 0.055, 0.48, (i + j) % 3 === 0 ? 0x9c7149 : 0xb48958);
                }
            }
        }
        for (let i = 0; i < 14; i++) {
            const pos_x = -9.71 + i * 0.57;
            geo.box(group, pos_x, -0.315, -3.66, 0.55, 0.63, 0.48, colors.soil);
            geo.box(group, pos_x, -0.865, -3.33, 0.55, 0.97, 0.18, colors.light_soil);
            geo.box(group, pos_x, -0.43, 3.69, 0.55, 0.86, 0.42, colors.soil);
        }
        for (let i = 0; i < 11; i++) {
            const pos_z = -3.49 + i * 0.68;
            geo.box(group, -9.82, -0.56, pos_z, 0.36, 1.12, 0.64, i % 3 === 0 ? colors.light_soil : colors.soil);
            geo.box(group, -2.18, -0.52, pos_z, 0.36, 1.04, 0.64, colors.soil);
        }
        for (let i = 0; i < 60; i++) {
            const pos_x = -14.75 + i * 0.5;
            geo.box(group, pos_x, -0.78 + (i % 3) * 0.15, 10.487, 0.49, 0.14, 0.026, i % 4 === 0 ? 0x73503c : 0xc29a66);
        }
        for (let i = 0; i < 42; i++) {
            const pos_z = -10.25 + i * 0.5;
            geo.box(group, -14.987, -0.88 + (i % 4) * 0.16, pos_z, 0.026, 0.13, 0.48, i % 4 === 0 ? 0x765540 : 0xc39a68);
            geo.box(group, 14.987, -0.98 + (i % 4) * 0.15, pos_z, 0.026, 0.13, 0.48, i % 3 === 0 ? 0x79533a : 0xc09a69);
        }

        const road_color = ctx.road_material || 0x7c827d;
        geo.box(group, 0, 0.012, -8, 27.55, 0.024, 2.35, road_color);
        geo.box(group, 0, 0.012, 8, 27.55, 0.024, 2.35, road_color);
        geo.box(group, -12.6, 0.012, 0, 2.35, 0.024, 13.65, road_color);
        geo.box(group, 12.6, 0.012, 0, 2.35, 0.024, 13.65, road_color);
        for (let i = 0; i < 26; i++) {
            const pos_x = -12.3 + i * 0.97;
            geo.box(group, pos_x, 0.027, -8, 0.46, 0.006, 0.055, 0xe5d6a9);
            geo.box(group, pos_x, 0.027, 8, 0.46, 0.006, 0.055, 0xe5d6a9);
        }
        for (let i = 0; i < 14; i++) {
            const pos_z = -6.2 + i * 0.96;
            geo.box(group, -12.6, 0.027, pos_z, 0.055, 0.006, 0.45, 0xe5d6a9);
            geo.box(group, 12.6, 0.027, pos_z, 0.055, 0.006, 0.45, 0xe5d6a9);
        }
        geo.box(group, 5.75, 0.024, 6.4, 10.8, 0.048, 0.64, 0xb7b2a0);
        geo.box(group, 5.75, 0.051, 6.11, 10.8, 0.007, 0.05, colors.yellow);
        geo.box(group, 5.75, 0.051, 6.69, 10.8, 0.007, 0.05, colors.yellow);
        for (let i = 0; i < 7; i++) {
            geo.box(group, 9.02, 0.03, 7.12 + i * 0.285, 1.6, 0.014, 0.14, 0xe6dfc9);
        }

        geo.box(group, 4.05, 0.12, 0.1, 6.9, 0.24, 7.4, 0xadb8b3);
        const column_x = [1.02, 4.05, 7.08];
        const column_z = [-3.16, 0.1, 3.36];
        const slab_y = [2.2, 4.4, 6.6];
        for (const pos_x of column_x) {
            for (const pos_z of column_z) {
                geo.box(group, pos_x, 3.36, pos_z, 0.38, 6.24, 0.38, colors.concrete);
                geo.box(group, pos_x, 0.37, pos_z, 0.72, 0.26, 0.72, 0xb2bcb4);
                for (let i = 0; i < 4; i++) {
                    const offset_x = (i % 2 - 0.5) * 0.2;
                    const offset_z = (Math.floor(i / 2) - 0.5) * 0.2;
                    geo.box(group, pos_x + offset_x, 7.14, pos_z + offset_z, 0.04, 0.9, 0.04, 0x715549);
                }
                for (let i = 0; i < 3; i++) {
                    const ring_y = 6.93 + i * 0.23;
                    geo.box(group, pos_x, ring_y, pos_z - 0.12, 0.26, 0.026, 0.026, colors.steel);
                    geo.box(group, pos_x, ring_y, pos_z + 0.12, 0.26, 0.026, 0.026, colors.steel);
                    geo.box(group, pos_x - 0.12, ring_y, pos_z, 0.026, 0.026, 0.26, colors.steel);
                    geo.box(group, pos_x + 0.12, ring_y, pos_z, 0.026, 0.026, 0.26, colors.steel);
                }
            }
        }
        for (const floor_y of slab_y) {
            geo.box(group, 4.05, floor_y, 0.1, 6.9, 0.18, 7.4, colors.concrete);
            for (const pos_z of column_z) {
                geo.box(group, 4.05, floor_y - 0.19, pos_z, 6.9, 0.2, 0.31, 0xa2b0aa);
            }
            for (const pos_x of column_x) {
                geo.box(group, pos_x, floor_y - 0.19, 0.1, 0.31, 0.2, 7.4, 0xa2b0aa);
            }
            geo.box(group, 1.73, floor_y - 0.76, -3.49, 1.05, 1.16, 0.15, 0xca9f77);
            for (let i = 0; i < 5; i++) {
                geo.box(group, 1.23 + i * 0.22, floor_y - 0.75, -3.575, 0.014, 1.1, 0.018, 0xb78b68);
            }
        }
        const scaffold_color = 0x66918c;
        for (let i = 0; i < 7; i++) {
            const pos_x = 0.3 + i * 1.26;
            for (const pos_z of [-3.98, 4.17]) {
                geo.box(group, pos_x, 3.61, pos_z, 0.058, 7.22, 0.058, scaffold_color);
                geo.box(group, pos_x, 0.05, pos_z, 0.25, 0.1, 0.25, 0x50616a);
            }
        }
        for (let i = 0; i < 7; i++) {
            const pos_z = -3.98 + i * 1.358;
            for (const pos_x of [0.3, 7.86]) {
                geo.box(group, pos_x, 3.61, pos_z, 0.058, 7.22, 0.058, scaffold_color);
            }
        }
        for (const floor_y of [1.3, 2.2, 3.5, 4.4, 5.7, 6.6, 7.15]) {
            for (const pos_z of [-3.98, 4.17]) {
                geo.box(group, 4.08, floor_y, pos_z, 7.56, 0.055, 0.055, scaffold_color);
            }
            for (const pos_x of [0.3, 7.86]) {
                geo.box(group, pos_x, floor_y, 0.095, 0.055, 0.055, 8.15, scaffold_color);
            }
        }
        for (const floor_y of slab_y) {
            for (const pos_z of [-3.79, 3.99]) {
                geo.box(group, 4.05, floor_y - 0.025, pos_z, 7.42, 0.075, 0.32, 0xc2b295);
                geo.box(group, 4.05, floor_y + 0.16, pos_z, 7.42, 0.22, 0.045, 0xe7a43d);
            }
            for (const pos_x of [0.5, 7.68]) {
                geo.box(group, pos_x, floor_y - 0.025, 0.1, 0.34, 0.075, 7.24, 0xc2b295);
            }
        }
        for (let i = 0; i < 6; i++) {
            const left_x = 0.3 + i * 1.26;
            for (const floor_y of [0.15, 2.3, 4.5]) {
                geo.beam(group, [left_x, floor_y, 4.185], [left_x + 1.26, floor_y + 1.94, 4.185], 0.035, 0x718b8a);
                geo.beam(group, [7.88, floor_y, -3.98 + i * 1.358], [7.88, floor_y + 1.94, -2.622 + i * 1.358], 0.035, 0x718b8a);
            }
        }
        const net_material = new THREE.MeshStandardMaterial({ color: 0x43a4a1, roughness: 0.95, transparent: true, opacity: 0.29, depthWrite: false });
        geo.mesh_box(group, 4.05, 1.5, 4.195, 7.3, 1.12, 0.015, net_material);
        geo.mesh_box(group, 7.895, 3.78, 0.1, 0.015, 1.13, 7.6, net_material);
        geo.mesh_box(group, 4.05, 5.98, -4.005, 7.3, 1.05, 0.015, net_material);
        geo.label(group, '在建 · 03 号楼', 4.08, 3.15, 4.215, 2.5, 0.49, { background: '#e0a53b', color: '#263d43' });
        for (let i = 0; i < 16; i++) {
            geo.box(group, 5.25, 6.724, -2.85 + i * 0.35, 2.65, 0.026, 0.028, 0x786158);
        }
        for (let i = 0; i < 9; i++) {
            geo.box(group, 3.96 + i * 0.32, 6.752, -0.2, 0.028, 0.025, 5.7, 0x786158);
        }
        for (let i = 0; i < 8; i++) {
            const step_height = (8 - i) * 0.275;
            geo.box(group, 6.7, step_height * 0.5, 4.34 + i * 0.22, 0.83, step_height, 0.215, 0x87948d);
        }

        const office_x = 7.75;
        const office_z = -5.62;
        geo.box(group, office_x, 0.11, office_z, 5.65, 0.22, 2.4, 0x889c96);
        for (let i = 0; i < 2; i++) {
            const floor_y = 0.22 + i * 1.47;
            geo.box(group, office_x, floor_y + 0.735, office_z, 5.5, 1.47, 2.2, i === 0 ? 0xe0ded0 : 0xc5d8d6);
            geo.box(group, office_x, floor_y + 0.08, office_z + 1.115, 5.5, 0.16, 0.03, colors.blue);
            geo.box(group, office_x, floor_y + 1.39, office_z + 1.115, 5.5, 0.16, 0.03, colors.blue);
            for (let j = 0; j < 4; j++) {
                const pos_x = 5.66 + j * 1.38;
                geo.box(group, pos_x, floor_y + 0.79, office_z + 1.122, 0.99, 0.8, 0.044, 0x406573);
                geo.box(group, pos_x, floor_y + 0.79, office_z + 1.15, 0.86, 0.68, 0.017, window_material);
                geo.box(group, pos_x, floor_y + 0.79, office_z + 1.17, 0.036, 0.7, 0.022, 0xe0e5d6);
                geo.box(group, pos_x, floor_y + 0.79, office_z + 1.184, 0.87, 0.034, 0.022, 0xe0e5d6);
            }
            for (let j = 0; j < 5; j++) {
                geo.box(group, 5.06 + j * 1.345, floor_y + 0.735, office_z + 1.122, 0.047, 1.42, 0.036, colors.blue);
                geo.box(group, 5.06 + j * 1.345, floor_y + 0.735, office_z - 1.115, 0.047, 1.42, 0.03, colors.blue);
            }
        }
        geo.box(group, office_x, 3.225, office_z, 5.68, 0.13, 2.38, colors.blue);
        for (let i = 0; i < 18; i++) {
            geo.box(group, 5.1 + i * 0.312, 3.307, office_z, 0.032, 0.034, 2.38, 0x6795b0);
        }
        geo.box(group, 5.016, 0.89, -5.62, 0.035, 1.28, 0.72, colors.dark);
        geo.box(group, 4.981, 0.9, -5.62, 0.028, 1.16, 0.61, colors.blue);
        geo.box(group, 4.95, 0.87, -5.4, 0.05, 0.06, 0.04, colors.cream);
        geo.box(group, 4.6, 0.115, -5.62, 0.75, 0.23, 0.9, 0xa7b2aa);
        geo.label(group, '项目办公室', office_x, 2.95, -4.405, 2.38, 0.25, { background: '#367da3', color: '#fff9dd' });
        geo.box(group, 10.54, 2.3, -5.65, 0.2, 0.53, 0.66, 0xd1d3c3);
        for (let i = 0; i < 4; i++) {
            geo.box(group, 10.646, 2.16 + i * 0.08, -5.65, 0.02, 0.025, 0.49, 0x6f8c93);
        }
        add_lamp(6.25, 1.55, -4.37, 0xffcb83, 0.55);
        add_lamp(9.7, 3.0, -4.37, 0xffcb83, 0.6);

        const shed_x = -5.65;
        const shed_z = -5.69;
        geo.box(group, shed_x, 0.06, shed_z, 6.7, 0.12, 1.92, 0xaba995);
        for (const pos_x of [-8.82, -5.65, -2.48]) {
            for (const pos_z of [-6.51, -4.88]) {
                geo.box(group, pos_x, 1.14, pos_z, 0.13, 2.04, 0.13, colors.teal);
                geo.box(group, pos_x, 0.18, pos_z, 0.28, 0.12, 0.28, 0x6e8a83);
            }
        }
        geo.box(group, shed_x, 2.21, shed_z, 6.9, 0.12, 2.05, colors.teal);
        for (let i = 0; i < 22; i++) {
            geo.box(group, -8.94 + i * 0.312, 2.29, shed_z, 0.036, 0.04, 2.05, 0x80aeaa);
        }
        geo.box(group, shed_x, 2.17, -4.652, 6.85, 0.29, 0.035, 0xe4c278);
        geo.label(group, '钢 筋 加 工 区', shed_x, 2.17, -4.628, 2.6, 0.24, { background: '#e4c278', color: '#254c53' });
        for (const pos_x of [-7.78, -4.85]) {
            geo.box(group, pos_x, 0.63, -5.22, 2.12, 0.12, 0.62, 0x748b8b);
            for (const offset_x of [-0.85, 0.85]) {
                for (const pos_z of [-5.44, -5.0]) {
                    geo.box(group, pos_x + offset_x, 0.335, pos_z, 0.085, 0.47, 0.085, colors.teal);
                }
            }
            for (let i = 0; i < 7; i++) {
                geo.box(group, pos_x, 0.718 + (i % 2) * 0.035, -5.46 + i * 0.075, 1.83, 0.035, 0.035, 0x5f6262);
            }
        }
        for (let i = 0; i < 12; i++) {
            geo.box(group, -5.98, 0.3 + Math.floor(i / 6) * 0.09, -6.18 + (i % 6) * 0.075, 4.72, 0.063, 0.063, i % 2 ? 0x626b6b : 0x8b8174);
        }
        for (const pos_x of [-7.8, -6, -4.2]) {
            geo.box(group, pos_x, 0.17, -6.0, 0.19, 0.12, 0.84, 0x7d6045);
        }
        geo.box(group, -3.05, 0.55, -5.34, 0.7, 0.86, 0.59, colors.orange);
        geo.box(group, -3.05, 1.045, -5.34, 0.83, 0.13, 0.7, 0x536665);
        geo.cylinder(group, -2.89, 1.16, -5.34, 0.18, 0.1, 0x526164, 8);
        add_lamp(-7, 2.06, -5.62, 0xffd28d, 0.6);
        add_lamp(-3.7, 2.06, -5.62, 0xffd28d, 0.6);

        for (const pos_z of [-2.64, -1.47]) {
            geo.box(group, 9.78, 0.13, pos_z, 1.75, 0.26, 0.88, 0x84674c);
            for (let i = 0; i < 5; i++) {
                geo.box(group, 9.06 + i * 0.36, 0.281, pos_z, 0.25, 0.042, 0.88, 0xb99b71);
            }
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    geo.box(group, 9.14 + j * 0.43, 0.393 + i * 0.19, pos_z, 0.4, 0.17, 0.71, (i + j) % 2 ? 0xe1d4ad : 0xc9bf9d);
                    geo.box(group, 9.14 + j * 0.43, 0.485 + i * 0.19, pos_z, 0.16, 0.012, 0.44, 0x84917c);
                }
            }
        }
        for (const pos_z of [-0.45, 1.14]) {
            for (const pos_x of [9.05, 10.9]) {
                geo.box(group, pos_x, 0.87, pos_z, 0.11, 1.74, 0.11, colors.blue);
            }
        }
        for (const shelf_y of [0.27, 0.86, 1.45]) {
            geo.box(group, 9.975, shelf_y, 0.345, 1.98, 0.08, 1.7, 0x547888);
            for (let i = 0; i < 8; i++) {
                geo.box(group, 9.975, shelf_y + 0.12, -0.32 + i * 0.188, 1.66, 0.1, 0.105, i % 3 === 0 ? 0xa9815c : 0x69736e);
            }
        }
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 5; j++) {
                const distance = Math.abs(i - 2.5) * 0.22 + Math.abs(j - 2) * 0.25;
                const block_height = Math.max(0.12, 1.04 - distance * 0.66);
                geo.box(group, 9.05 + i * 0.32, block_height * 0.5, 2.1 + j * 0.3, 0.3, block_height, 0.28, (i * 5 + j) % 3 === 0 ? 0xc6b58b : 0xa9a087);
            }
        }
        geo.box(group, 9.92, 0.12, 3.48, 2.19, 0.24, 0.12, 0x8a795d);
        geo.label(group, '材料堆放', 10, 1.68, 1.217, 1.55, 0.28, { background: '#3a7278', color: '#f4e3b7' });

        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 4; j++) {
                const pos_x = -8.79 + i * 0.325;
                const pos_z = 5.21 + j * 0.315;
                const distance = Math.min(Math.abs(pos_x + 7.55), Math.abs(pos_x + 5.4));
                const block_height = Math.max(0.16, 1.02 - distance * 0.54 - Math.abs(pos_z - 5.68) * 0.74 + ((i * 11 + j * 7) % 5) * 0.033);
                geo.box(group, pos_x, block_height * 0.5, pos_z, 0.31, block_height, 0.3, [0x9b7044, 0xba8c50, 0xa87944, 0xc69c62][(i + j) % 4]);
            }
        }
        geo.box(group, -6.5, 0.25, 5.0, 5.2, 0.5, 0.13, 0x7a6249);
        geo.box(group, -9.1, 0.25, 5.68, 0.13, 0.5, 1.49, 0x7a6249);
        geo.box(group, -3.9, 0.25, 5.68, 0.13, 0.5, 1.49, 0x7a6249);
        geo.label(group, '土方暂存区', -4.65, 0.57, 6.47, 1.35, 0.31, { background: '#8a6548', color: '#ffe3ae' });

        for (const pos_z of [-4.22, 4.27]) {
            for (let i = 0; i < 7; i++) {
                const pos_x = -9.63 + i * 1.17;
                geo.box(group, pos_x, 0.5, pos_z, 0.065, 1, 0.065, colors.yellow);
                geo.box(group, pos_x, 0.085, pos_z, 0.25, 0.17, 0.25, 0x505b59);
            }
            geo.box(group, -6.12, 0.92, pos_z, 7.05, 0.067, 0.067, colors.yellow);
            geo.box(group, -6.12, 0.46, pos_z, 7.05, 0.055, 0.055, 0xa97636);
            for (let i = 0; i < 15; i++) {
                geo.box(group, -9.42 + i * 0.47, 0.921, pos_z + 0.002, 0.16, 0.069, 0.07, colors.dark);
            }
        }
        geo.label(group, '注意深基坑', -6.35, 0.67, 4.319, 1.54, 0.36, { background: '#e6b844', color: '#473c2e' });
        for (const pos_z of [-2.9, 0.9, 3.35]) {
            geo.box(group, -2.42, 0.39, pos_z, 0.12, 0.78, 0.12, 0xc6653e);
            geo.box(group, -2.42, 0.74, pos_z, 0.22, 0.07, 0.22, 0xffd091);
        }
        geo.box(group, -8.75, -0.57, -2.78, 0.06, 1.52, 0.06, colors.steel);
        geo.box(group, -8.17, -0.57, -2.78, 0.06, 1.52, 0.06, colors.steel);
        for (let i = 0; i < 7; i++) {
            geo.box(group, -8.46, -1.17 + i * 0.2, -2.78, 0.57, 0.055, 0.055, 0x969487);
        }

        const fence_height = 1.0;
        for (let i = 0; i < 15; i++) {
            const pos_x = -14.5 + i * 2.07;
            geo.box(group, pos_x, 0.6, -10, 0.095, 1.2, 0.095, 0xb3c5bc);
            if (i < 14) {
                geo.box(group, pos_x + 1.035, fence_height * 0.5, -10, 1.975, fence_height, 0.055, i % 3 === 0 ? 0x64a19a : colors.teal);
            }
        }
        for (const pos_x of [-14.5, 14.5]) {
            for (let i = 0; i < 11; i++) {
                const pos_z = -10 + i * 2;
                geo.box(group, pos_x, 0.6, pos_z, 0.095, 1.2, 0.095, 0xb3c5bc);
                if (i < 10) {
                    geo.box(group, pos_x, 0.5, pos_z + 1, 0.055, 1, 1.9, i % 3 === 0 ? 0x5a9a95 : colors.teal);
                }
            }
        }
        for (const [start_x, end_x] of [[-14.5, 7], [11, 14.5]]) {
            const count = Math.ceil((end_x - start_x) / 1.96);
            const panel_width = (end_x - start_x) / count;
            for (let i = 0; i <= count; i++) {
                const pos_x = start_x + i * panel_width;
                geo.box(group, pos_x, 0.6, 10, 0.095, 1.2, 0.095, 0xb3c5bc);
                if (i < count) {
                    geo.box(group, pos_x + panel_width * 0.5, 0.5, 10, panel_width - 0.08, 1, 0.055, i % 4 === 0 ? 0x578f86 : colors.teal);
                    geo.box(group, pos_x + panel_width * 0.5, 0.14, 10.033, panel_width - 0.08, 0.15, 0.009, colors.yellow);
                }
            }
        }
        geo.label(group, '精 工 筑 城', -8.76, 0.63, 10.037, 3.25, 0.43, { background: '#247c7d', color: '#f2e6c6' });
        geo.label(group, '安全第一  ·  文明施工', 0.6, 0.63, 10.037, 3.8, 0.39, { background: '#247c7d', color: '#f2e6c6' });
        for (const pos_x of [7, 11]) {
            geo.box(group, pos_x, 1.38, 10, 0.32, 2.76, 0.32, 0xe4d6b0);
            geo.box(group, pos_x, 2.86, 10, 0.49, 0.2, 0.49, colors.teal);
            geo.box(group, pos_x, 0.5, 10.169, 0.33, 0.77, 0.018, colors.yellow);
            for (let i = 0; i < 4; i++) {
                geo.box(group, pos_x, 0.24 + i * 0.17, 10.183, 0.335, 0.08, 0.018, colors.dark);
            }
            add_lamp(pos_x, 2.99, 10, 0xffca74, 0.8);
        }
        geo.box(group, 9, 2.58, 10, 3.7, 0.44, 0.25, colors.teal);
        geo.label(group, '筑境 · 建设工地', 9, 2.58, 10.136, 3.1, 0.3, { background: '#247c7d', color: '#ffebbb' });
        geo.box(group, 11.6, 0.1, 9.66, 0.54, 0.2, 0.54, 0x718179);
        geo.box(group, 11.6, 0.7, 9.66, 0.31, 1.0, 0.3, colors.orange);
        geo.beam(group, [11.6, 1.25, 9.66], [10.63, 3.98, 9.66], 0.1, colors.cream);
        geo.box(group, 6.26, 0.38, 9.62, 0.66, 0.76, 0.52, 0x506e68);
        geo.box(group, 6.26, 0.81, 9.62, 0.73, 0.1, 0.6, 0x869b88);
        geo.label(group, '入场请登记', 6.26, 0.54, 9.899, 0.58, 0.34, { background: '#506e68', color: '#f3e7c5' });

        for (const pos_x of [-14, 0, 14]) {
            geo.box(group, pos_x, 1.56, -9.62, 0.08, 3.12, 0.08, 0x687c75);
        }
        for (let i = 0; i < 36; i++) {
            const start_x = -14 + i * 28 / 36;
            const end_x = -14 + (i + 1) * 28 / 36;
            const start_y = 3.01 - Math.abs(Math.sin(start_x / 14 * Math.PI)) * 0.34;
            const end_y = 3.01 - Math.abs(Math.sin(end_x / 14 * Math.PI)) * 0.34;
            geo.beam(group, [start_x, start_y, -9.62], [end_x, end_y, -9.62], 0.018, 0x6c7263);
            geo.box(group, (start_x + end_x) * 0.5, (start_y + end_y) * 0.5 - 0.19, -9.62, 0.39, 0.34, 0.025, [0xe36d46, 0xe9bd51, 0x78aa98, 0x79a3c6][i % 4]);
        }
        for (const pos_z of [-6.45, 6.0]) {
            geo.box(group, 14.1, 2.23, pos_z, 0.15, 4.46, 0.15, 0x8b785f);
            geo.box(group, 14.1, 4.22, pos_z, 0.94, 0.1, 0.1, 0x657673);
            for (const pos_x of [13.75, 14.45]) {
                geo.box(group, pos_x, 4.37, pos_z, 0.105, 0.19, 0.105, 0xc6cebb);
            }
        }
        for (const pos_x of [13.75, 14.45]) {
            for (let i = 0; i < 14; i++) {
                const start_z = -6.45 + i * 12.45 / 14;
                const end_z = -6.45 + (i + 1) * 12.45 / 14;
                const start_y = 4.45 - Math.sin(i / 14 * Math.PI) * 0.52;
                const end_y = 4.45 - Math.sin((i + 1) / 14 * Math.PI) * 0.52;
                geo.beam(group, [pos_x, start_y, start_z], [pos_x, end_y, end_z], 0.022, 0x455453);
            }
        }
        geo.box(group, 13.98, 0.63, 5.63, 0.36, 1.12, 0.44, 0xa6bdb4);
        geo.label(group, '电', 13.977, 0.78, 5.866, 0.25, 0.29, { background: '#e4b950', color: '#343f39' });
        for (const [pos_x, pos_z, angle] of [[-14.04, -5.5, -0.3], [-14.04, 5.6, 0.3], [13.99, -2.3, -0.6], [2.5, 5.55, 0.2]]) {
            geo.box(group, pos_x, 0.12, pos_z, 0.41, 0.24, 0.41, 0x6e8178);
            geo.box(group, pos_x, 1.76, pos_z, 0.083, 3.28, 0.083, 0x87938b);
            geo.box(group, pos_x, 3.43, pos_z, 0.61, 0.23, 0.29, 0x4b6063, { ry: angle });
            geo.box(group, pos_x, 3.33, pos_z + 0.04, 0.48, 0.035, 0.2, window_material, { ry: angle });
            add_lamp(pos_x, 3.29, pos_z + 0.04, 0xffd6a0, 1.0);
        }
        for (const [pos_x, pos_z] of [[-1.15, -4.18], [8.65, -3.83], [11.04, 4.13]]) {
            geo.box(group, pos_x, 0.15, pos_z, 0.3, 0.3, 0.3, colors.orange);
            geo.box(group, pos_x, 0.39, pos_z, 0.21, 0.18, 0.21, colors.cream);
            geo.box(group, pos_x, 0.57, pos_z, 0.14, 0.18, 0.14, colors.orange);
            geo.box(group, pos_x, 0.035, pos_z, 0.4, 0.07, 0.4, colors.dark);
        }
        return group;
    },
};



