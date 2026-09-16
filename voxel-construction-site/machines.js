const machines = {
    build(ctx) {
        this.ctx = ctx;
        this.vehicles = [];
        this.excavators = [];
        this.cranes = [];
        this.workers = [];
        this.travel = 0;
        this.stop_left = 0;
        this.stop_age = 0;
        this.active_stop = null;
        this.road_length = 68.8 + Math.PI * 3.4;
        this.load_point = 4.3;
        this.dump_point = 12.6 + Math.PI * 0.85 + 3.9;
        this.stops = [];
        for (let i = 0; i < 3; i++) {
            this.build_vehicle(i === 2 ? 'mixer' : 'truck', i);
            if (i < 2) {
                for (const mode of ['load', 'dump']) {
                    const position = mode === 'load' ? this.load_point : this.dump_point;
                    this.stops.push({
                        distance: (position - i * this.road_length / 3 + this.road_length) % this.road_length,
                        vehicle: i,
                        mode,
                        duration: mode === 'load' ? 10.8 : 6.4,
                    });
                }
            }
        }
        this.stops.sort((first, second) => first.distance - second.distance);
        this.next_stop = 0;
        this.build_excavator(-10.8, -2, 0, 0xffb91e);
        this.build_excavator(-1.15, 1.2, Math.PI, 0xf58b25);
        this.build_crane(0, -5, 12.15, 7.4, false);
        this.build_crane(9, 4.8, 10.35, 4.2, true);
        this.build_loader();
        this.build_workers();
        const { THREE, scene } = ctx;
        this.soil_mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), new THREE.MeshStandardMaterial({ color: 0x8a5934, roughness: 1 }), 28);
        this.soil_mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.soil_mesh.frustumCulled = false;
        scene.add(this.soil_mesh);
        this.soil_dummy = new THREE.Object3D();
        this.update(0, 0, { night: 0, rain: false });
    },

    build_vehicle(kind, index) {
        const { scene, geo } = this.ctx;
        const group = geo.group(scene, 0, 0, 0);
        const paint = kind === 'mixer' ? 0xeae7d9 : index ? 0xe75b2a : 0x219b92;
        geo.mesh_box(group, 0, 0.43, 0, 1.02, 0.22, 2.22, 0x26333a);
        geo.mesh_box(group, 0, 0.82, 0.79, 1.02, 0.8, 0.79, paint);
        geo.mesh_box(group, 0, 1.2, 0.79, 1.07, 0.08, 0.84, paint);
        geo.mesh_box(group, 0, 0.98, 1.197, 0.87, 0.34, 0.025, 0x13333c);
        geo.mesh_box(group, -0.518, 1, 0.85, 0.025, 0.32, 0.47, 0x244751);
        geo.mesh_box(group, 0.518, 1, 0.85, 0.025, 0.32, 0.47, 0x244751);
        geo.mesh_box(group, 0, 0.65, 1.206, 0.4, 0.14, 0.025, 0x28363c);
        geo.mesh_box(group, 0, 0.43, 1.25, 1.1, 0.14, 0.1, 0xc2c3ad);
        geo.mesh_box(group, -0.37, 0.72, 1.23, 0.18, 0.12, 0.04, 0xfff2bf);
        geo.mesh_box(group, 0.37, 0.72, 1.23, 0.18, 0.12, 0.04, 0xfff2bf);
        geo.mesh_box(group, -0.39, 0.46, -1.13, 0.17, 0.1, 0.04, 0xf84327);
        geo.mesh_box(group, 0.39, 0.46, -1.13, 0.17, 0.1, 0.04, 0xf84327);
        geo.mesh_box(group, -0.57, 1.05, 0.64, 0.08, 0.16, 0.11, 0x182a31);
        geo.mesh_box(group, 0.57, 1.05, 0.64, 0.08, 0.16, 0.11, 0x182a31);
        geo.mesh_box(group, 0.4, 1.06, 0.28, 0.09, 0.91, 0.1, 0x3d4649);
        const wheels = [];
        for (const side of [-1, 1]) {
            for (const axle of [-0.76, -0.27, 0.8]) {
                const wheel = geo.cylinder(group, side * 0.535, 0.285, axle, 0.245, 0.19, 0x1b2528, 10, { rz: Math.PI / 2 });
                const hub = geo.cylinder(group, side * 0.64, 0.285, axle, 0.12, 0.016, 0x9faeaf, 8, { rz: Math.PI / 2 });
                wheels.push(wheel, hub);
            }
        }
        let bed = null;
        let load = null;
        let drum = null;
        let gate = null;
        if (kind === 'truck') {
            bed = geo.group(group, 0.47, 0.63, -0.36);
            geo.mesh_box(bed, -0.47, 0.06, 0, 1.1, 0.14, 1.43, paint);
            geo.mesh_box(bed, -0.99, 0.35, 0, 0.08, 0.52, 1.43, paint);
            geo.mesh_box(bed, -0.47, 0.35, -0.69, 1.1, 0.52, 0.08, paint);
            geo.mesh_box(bed, -0.47, 0.35, 0.69, 1.1, 0.52, 0.08, paint);
            for (const rib of [-0.43, 0, 0.43]) geo.mesh_box(bed, -1.045, 0.33, rib, 0.035, 0.48, 0.055, 0xdce1cb);
            gate = geo.group(bed, 0.05, 0.12, 0);
            geo.mesh_box(gate, 0, 0.23, 0, 0.08, 0.46, 1.43, paint);
            for (const rib of [-0.43, 0, 0.43]) geo.mesh_box(gate, 0.052, 0.23, rib, 0.035, 0.43, 0.055, 0xdce1cb);
            load = geo.group(bed, -0.47, 0.15, 0);
            for (let i = 0; i < 24; i++) {
                const column = i % 4;
                const row = Math.floor(i / 4);
                geo.mesh_box(load, (column - 1.5) * 0.235, 0.12 + ((i * 7) % 5) * 0.018, (row - 2.5) * 0.21, 0.225, 0.23 + ((i * 3) % 5) * 0.036, 0.2, [0x9d734a, 0x87613e, 0xaf8355][i % 3]);
            }
            load.visible = index === 1;
            geo.dynamic_batch(load);
            geo.dynamic_batch(gate);
            geo.dynamic_batch(bed);
        } else {
            geo.mesh_box(group, 0, 0.68, -0.33, 0.7, 0.28, 1.47, 0xcecec0);
            drum = geo.group(group, 0, 1.07, -0.31);
            geo.cylinder(drum, 0, 0, 0, 0.48, 1.34, 0xf1eee0, 12, { rx: Math.PI / 2 });
            for (const ring of [-0.43, 0, 0.43]) geo.cylinder(drum, 0, 0, ring, 0.488, 0.105, 0xd25a34, 12, { rx: Math.PI / 2 });
            for (let i = 0; i < 4; i++) {
                const angle = i * Math.PI / 2;
                geo.mesh_box(drum, Math.cos(angle) * 0.46, Math.sin(angle) * 0.46, 0.15, 0.085, 0.085, 0.36, 0xcb5230, { rz: angle });
            }
            geo.mesh_box(group, 0, 0.7, -1.06, 0.42, 0.11, 0.42, 0xa5aca6, { rx: -0.24 });
            geo.mesh_box(group, -0.46, 0.88, -0.84, 0.06, 0.76, 0.06, 0xa4adaa);
            geo.mesh_box(group, 0.46, 0.88, -0.84, 0.06, 0.76, 0.06, 0xa4adaa);
            geo.dynamic_batch(drum);
        }
        // 车轮独立转动，不参与车体合批。
        for (const wheel of wheels) group.remove(wheel);
        geo.dynamic_batch(group);
        for (const wheel of wheels) group.add(wheel);
        this.vehicles.push({ group, kind, wheels, bed, load, gate, drum, offset: index * this.road_length / 3, loaded: index === 1 });
    },

    build_excavator(world_x, world_z, heading, paint) {
        const { THREE, scene, geo } = this.ctx;
        const base = geo.group(scene, world_x, 0.035, world_z);
        for (const side of [-1, 1]) {
            geo.mesh_box(base, side * 0.41, 0.2, 0, 0.28, 0.35, 1.85, 0x29312f);
            for (let i = 0; i < 10; i++) {
                geo.mesh_box(base, side * 0.41, 0.035, (i - 4.5) * 0.178, 0.31, 0.05, 0.11, 0x606158);
                geo.mesh_box(base, side * 0.41, 0.387, (i - 4.5) * 0.178, 0.31, 0.045, 0.11, 0x4a4c43);
            }
            for (const wheel_z of [-0.62, -0.2, 0.22, 0.64]) geo.cylinder(base, side * 0.558, 0.21, wheel_z, 0.145, 0.018, 0x747266, 8, { rz: Math.PI / 2 });
        }
        geo.mesh_box(base, 0, 0.32, 0, 0.65, 0.2, 1.3, 0x393b32);
        geo.cylinder(base, 0, 0.49, 0, 0.45, 0.18, 0x565341, 12);
        const upper = geo.group(base, 0, 0.55, 0);
        upper.rotation.y = heading;
        geo.mesh_box(upper, -0.13, 0.16, 0, 1.23, 0.28, 0.96, paint);
        geo.mesh_box(upper, -0.49, 0.36, 0, 0.46, 0.3, 1.04, paint);
        geo.mesh_box(upper, -0.735, 0.34, 0, 0.025, 0.15, 0.64, 0x373e31);
        for (let i = 0; i < 5; i++) geo.mesh_box(upper, -0.75, 0.33, (i - 2) * 0.13, 0.02, 0.08, 0.055, 0x192e2d);
        geo.mesh_box(upper, 0.03, 0.7, -0.31, 0.68, 0.82, 0.52, 0x17343e);
        geo.mesh_box(upper, 0.03, 1.11, -0.31, 0.74, 0.07, 0.58, paint);
        geo.mesh_box(upper, 0.03, 0.34, -0.31, 0.74, 0.07, 0.58, paint);
        for (const post_x of [-0.3, 0.36]) {
            for (const post_z of [-0.56, -0.06]) geo.mesh_box(upper, post_x, 0.74, post_z, 0.045, 0.74, 0.045, paint);
        }
        geo.mesh_box(upper, 0.35, 0.69, -0.315, 0.028, 0.025, 0.46, 0xffd047);
        geo.mesh_box(upper, -0.43, 0.81, 0.37, 0.075, 0.57, 0.075, 0x313a37);
        const boom = geo.group(upper, 0.16, 0.66, 0.18);
        geo.mesh_box(boom, 0.69, 0, 0, 1.38, 0.2, 0.22, paint);
        geo.mesh_box(boom, 0.62, 0.135, 0, 0.96, 0.07, 0.2, 0xffd45e);
        geo.cylinder(boom, 0, 0, 0, 0.14, 0.3, 0x495044, 10, { rx: Math.PI / 2 });
        geo.cylinder(boom, 1.38, 0, 0, 0.12, 0.29, 0x495044, 10, { rx: Math.PI / 2 });
        const stick = geo.group(boom, 1.38, 0, 0);
        geo.mesh_box(stick, 0.59, 0, 0, 1.18, 0.15, 0.17, paint);
        geo.mesh_box(stick, 0.5, -0.105, 0, 0.67, 0.055, 0.11, 0xe4e3c4);
        geo.cylinder(stick, 1.18, 0, 0, 0.09, 0.28, 0x4d5143, 8, { rx: Math.PI / 2 });
        const bucket = geo.group(stick, 1.18, 0, 0);
        geo.mesh_box(bucket, 0.13, -0.095, 0, 0.4, 0.12, 0.49, 0x66583a);
        geo.mesh_box(bucket, -0.055, 0.04, 0, 0.1, 0.29, 0.49, 0x766344);
        geo.mesh_box(bucket, 0.13, 0.03, -0.23, 0.4, 0.25, 0.035, 0x96763b);
        geo.mesh_box(bucket, 0.13, 0.03, 0.23, 0.4, 0.25, 0.035, 0x96763b);
        for (const tooth of [-0.18, -0.06, 0.06, 0.18]) geo.mesh_box(bucket, 0.36, -0.1, tooth, 0.13, 0.085, 0.075, 0xb5ac8a);
        geo.mesh_box(bucket, 0.13, 0.045, 0, 0.26, 0.17, 0.36, 0x976e43);
        const rod_mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xc8c9b3, roughness: 0.33, metalness: 0.65 }));
        const piston_mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x484f42, roughness: 0.6 }));
        geo.dynamic_batch(bucket);
        geo.dynamic_batch(stick);
        geo.dynamic_batch(boom);
        geo.dynamic_batch(upper);
        upper.add(rod_mesh, piston_mesh);
        geo.dynamic_batch(base);
        this.excavators.push({ base, upper, boom, stick, bucket, heading, rod_mesh, piston_mesh, rod_start: new THREE.Vector3(), rod_end: new THREE.Vector3(), rod_middle: new THREE.Vector3(), rod_up: new THREE.Vector3(0, 1, 0), rod_direction: new THREE.Vector3() });
    },

    build_crane(world_x, world_z, height, length, hopper) {
        const { THREE, scene, geo, add_lamp } = this.ctx;
        const tower = geo.group(scene, world_x, 0, world_z);
        geo.box(tower, 0, 0.18, 0, 1.52, 0.36, 1.52, 0xa2a695);
        const yellow = 0xfac32c;
        for (const side_x of [-0.32, 0.32]) {
            for (const side_z of [-0.32, 0.32]) geo.box(tower, side_x, height / 2, side_z, 0.11, height, 0.11, yellow);
        }
        for (let i = 0; i < Math.floor(height); i++) {
            const level = 0.28 + i;
            for (const side of [-0.32, 0.32]) {
                geo.box(tower, 0, level, side, 0.72, 0.07, 0.08, yellow);
                geo.box(tower, side, level, 0, 0.08, 0.07, 0.72, yellow);
                geo.beam(tower, [-0.32, level, side], [0.32, level + 0.95, side], 0.055, yellow);
                geo.beam(tower, [side, level, -0.32], [side, level + 0.95, 0.32], 0.055, yellow);
            }
        }
        for (let i = 0; i < Math.floor(height * 3.5); i++) geo.box(tower, 0, 0.5 + i * 0.27, -0.395, 0.27, 0.04, 0.035, 0x655c35);
        geo.box(tower, -0.15, height / 2, -0.395, 0.035, height - 0.45, 0.035, 0x655c35);
        geo.box(tower, 0.15, height / 2, -0.395, 0.035, height - 0.45, 0.035, 0x655c35);
        const upper = geo.group(tower, 0, height, 0);
        geo.mesh_box(upper, 0, -0.19, 0, 1.05, 0.25, 1.05, 0xdba819);
        geo.mesh_box(upper, 0.32, -0.62, -0.53, 0.8, 0.71, 0.61, 0xedb830);
        geo.mesh_box(upper, 0.36, -0.61, -0.852, 0.65, 0.43, 0.025, 0x183845);
        geo.mesh_box(upper, 0.735, -0.61, -0.54, 0.024, 0.43, 0.46, 0x254957);
        for (const side of [-0.25, 0.25]) {
            geo.mesh_box(upper, (length - 1.9) / 2, 0, side, length + 1.9, 0.075, 0.08, yellow);
            geo.mesh_box(upper, (length - 1.9) / 2, 0.44, side, length + 1.9, 0.075, 0.08, yellow);
        }
        for (let i = 0; i < Math.ceil((length + 1.9) / 0.6); i++) {
            const start_x = -1.9 + i * 0.6;
            const end_x = Math.min(start_x + 0.6, length);
            if (start_x >= length) break;
            geo.mesh_box(upper, start_x, 0.22, 0, 0.055, 0.46, 0.55, yellow);
            for (const side of [-0.25, 0.25]) {
                const delta = end_x - start_x;
                geo.mesh_box(upper, (start_x + end_x) / 2, 0.22, side, Math.sqrt(delta * delta + 0.44 * 0.44), 0.055, 0.055, yellow, { rz: (i % 2 ? -1 : 1) * Math.atan2(0.44, delta) });
            }
        }
        geo.mesh_box(upper, -1.52, 0.47, 0, 0.63, 0.84, 1.03, 0x515e61);
        for (let i = 0; i < 4; i++) geo.mesh_box(upper, -1.53, 0.49, (i - 1.5) * 0.23, 0.66, 0.88, 0.026, 0xa4a99d);
        geo.mesh_box(upper, 0, 0.83, 0, 0.16, 1.2, 0.16, 0xeaebd2);
        geo.mesh_box(upper, 0, 1.07, 0, 0.175, 0.23, 0.175, 0xe04831);
        geo.mesh_box(upper, 0, 1.46, 0, 0.18, 0.16, 0.18, 0xff6740);
        const tether = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 1.4, 0), new THREE.Vector3(length - 0.3, 0.42, 0),
            new THREE.Vector3(0, 1.4, 0), new THREE.Vector3(-1.8, 0.42, 0),
        ]), new THREE.LineBasicMaterial({ color: 0x77785a }));
        upper.add(tether);
        const trolley = geo.group(upper, length * 0.55, -0.07, 0);
        geo.mesh_box(trolley, 0, 0, 0, 0.46, 0.21, 0.58, 0x36434a);
        const rope = new THREE.Mesh(new THREE.BoxGeometry(0.028, 1, 0.028), new THREE.MeshStandardMaterial({ color: 0x353a35, roughness: 0.7 }));
        const payload = geo.group(trolley, 0, -2.2, 0);
        geo.mesh_box(payload, 0, 0.3, 0, 0.2, 0.2, 0.2, 0xe9b524);
        if (hopper) {
            geo.mesh_box(payload, 0, -0.2, 0, 0.8, 0.62, 0.8, 0xca5d2f);
            geo.mesh_box(payload, 0, -0.58, 0, 0.49, 0.18, 0.49, 0x954b30);
            geo.mesh_box(payload, 0, 0.135, 0, 0.85, 0.055, 0.85, 0xe0a15b);
            geo.mesh_box(payload, 0, 0.17, 0, 0.66, 0.035, 0.66, 0x77786a);
            for (const side of [-0.27, 0.27]) geo.mesh_box(payload, side, 0.31, 0, 0.035, 0.3, 0.035, 0x555c4b);
        } else {
            for (let i = 0; i < 9; i++) geo.mesh_box(payload, 0, -0.27 + Math.floor(i / 3) * 0.055, (i % 3 - 1) * 0.078, 2.05, 0.05, 0.06, i % 2 ? 0x7d6d52 : 0x545951);
            for (const side of [-0.65, 0.65]) {
                geo.mesh_box(payload, side, -0.15, 0, 0.035, 0.3, 0.29, 0xe4a431);
                geo.mesh_box(payload, side / 2, 0.09, 0, 0.74, 0.023, 0.023, 0x404f47, { rz: side < 0 ? 0.62 : -0.62 });
            }
        }
        geo.dynamic_batch(payload);
        geo.dynamic_batch(trolley);
        trolley.add(rope);
        geo.dynamic_batch(upper);
        if (add_lamp) {
            const beacon = add_lamp(world_x, height + 1.5, world_z, 0xff5f30, 0.7);
            if (beacon && beacon.isObject3D) {
                upper.add(beacon);
                beacon.position.set(0, 1.5, 0);
            }
            const flood = add_lamp(world_x, height - 0.4, world_z, 0xffd884, 0.7);
            if (flood && flood.isObject3D) {
                upper.add(flood);
                flood.position.set(1.1, -0.4, 0.2);
            }
        }
        this.cranes.push({ upper, trolley, rope, payload, height, length, hopper });
    },

    build_loader() {
        const { scene, geo } = this.ctx;
        const group = geo.group(scene, -0.5, 0, 5.5);
        geo.mesh_box(group, -0.13, 0.35, 0, 1.24, 0.29, 0.85, 0xe5b931);
        geo.mesh_box(group, -0.46, 0.6, 0, 0.52, 0.26, 0.78, 0xe8bc32);
        geo.mesh_box(group, -0.23, 0.88, 0, 0.52, 0.59, 0.57, 0x263e43);
        geo.mesh_box(group, -0.23, 1.18, 0, 0.63, 0.06, 0.67, 0xf2c943);
        for (const post_x of [-0.48, 0.02]) {
            for (const side of [-0.28, 0.28]) geo.mesh_box(group, post_x, 0.91, side, 0.042, 0.56, 0.042, 0xe5b931);
        }
        for (const wheel_x of [-0.48, 0.38]) {
            for (const side of [-0.43, 0.43]) {
                geo.cylinder(group, wheel_x, 0.275, side, 0.245, 0.15, 0x26312e, 10, { rx: Math.PI / 2 });
                geo.cylinder(group, wheel_x, 0.275, side * 1.19, 0.12, 0.015, 0xdbb13b, 8, { rx: Math.PI / 2 });
            }
        }
        const arm = geo.group(group, 0.23, 0.5, 0);
        for (const side of [-0.29, 0.29]) geo.mesh_box(arm, 0.3, -0.1, side, 0.69, 0.09, 0.075, 0xe8b32b, { rz: -0.3 });
        geo.mesh_box(arm, 0.64, -0.27, 0, 0.44, 0.08, 0.94, 0x736139);
        geo.mesh_box(arm, 0.44, -0.16, 0, 0.08, 0.3, 0.94, 0xa27c2f);
        geo.mesh_box(arm, 0.64, -0.16, -0.45, 0.44, 0.27, 0.055, 0xb08832);
        geo.mesh_box(arm, 0.64, -0.16, 0.45, 0.44, 0.27, 0.055, 0xb08832);
        geo.dynamic_batch(arm);
        geo.dynamic_batch(group);
        this.loader = { group, arm };
    },

    build_workers() {
        const { THREE, scene } = this.ctx;
        const rows = [
            [-8.6, -4.43, Math.PI, 'tie'], [-7.75, -4.43, Math.PI, 'tie'], [-6.85, -4.4, Math.PI, 'carry'],
            [-5.9, -4.43, Math.PI, 'tie'], [-4.9, -4.43, Math.PI, 'tool'], [-3.65, -4.38, Math.PI, 'signal'],
            [-9.2, 4.4, Math.PI, 'tie'], [-8.3, 4.42, Math.PI, 'tie'], [-6.8, 4.42, Math.PI, 'carry'],
            [-5.7, 4.43, Math.PI, 'tool'], [-4.2, 4.42, Math.PI, 'signal'], [-3.1, 4.45, Math.PI, 'tie'],
            [8.35, -3.2, -Math.PI / 2, 'tie'], [8.35, -2.15, -Math.PI / 2, 'tool'],
            [8.35, -1.1, -Math.PI / 2, 'carry'], [8.35, 0.05, -Math.PI / 2, 'signal'],
            [8.35, 1.25, -Math.PI / 2, 'tie'], [8.35, 2.6, -Math.PI / 2, 'tool'],
            [3, 5.55, Math.PI, 'signal'], [4.1, 5.55, Math.PI, 'tie'], [5.5, 5.55, Math.PI, 'carry'],
            [1.15, 6.25, 0, 'carry'], [2.8, 6.25, 0, 'signal'], [4.2, 6.25, 0, 'tool'], [5.8, 6.25, 0, 'carry'],
            [7.2, 6.25, 0, 'signal'], [8.6, 6.25, 0, 'carry'], [10.2, 6.25, 0, 'tool'],
            [7.8, 9.55, Math.PI, 'guard'], [10.1, 9.55, Math.PI, 'guard'],
            [1.8, -4.45, 0, 'signal'], [3, -4.45, 0, 'carry'], [4.5, -4.45, 0, 'tie'], [6.5, -4.45, 0, 'tool'],
            [3.3, 1.6, 0, 'tie', 6.69], [2.4, -1.3, 0.4, 'tie', 6.69],
            [5.4, 1.5, -0.3, 'tool', 4.49], [2.4, -1.3, 0.3, 'tie', 4.49],
            [5.4, 1.5, 0, 'carry', 2.29], [2.4, -1.3, 0, 'tie', 2.29],
        ];
        this.worker_parts = [
            { position: [-0.085, 0.064, 0.025], size: [0.13, 0.1, 0.24], color: 0x273636 },
            { position: [0.085, 0.064, 0.025], size: [0.13, 0.1, 0.24], color: 0x273636 },
            { position: [-0.083, 0.26, 0], size: [0.105, 0.3, 0.13], color: 0x284b61 },
            { position: [0.083, 0.26, 0], size: [0.105, 0.3, 0.13], color: 0x284b61 },
            { position: [0, 0.575, 0], size: [0.29, 0.34, 0.19], color: 0xf58326 },
            { position: [0, 0.515, 0.101], size: [0.295, 0.052, 0.024], color: 0xf6df68 },
            { position: [-0.087, 0.627, 0.104], size: [0.035, 0.21, 0.023], color: 0xf5e89e },
            { position: [0.087, 0.627, 0.104], size: [0.035, 0.21, 0.023], color: 0xf5e89e },
            { position: [-0.208, 0.586, 0], size: [0.095, 0.3, 0.12], color: 0xf49638 },
            { position: [0.208, 0.586, 0], size: [0.095, 0.3, 0.12], color: 0xf49638 },
            { position: [0, 0.837, 0.014], size: [0.195, 0.19, 0.185], color: 0xcca17b },
            { position: [0, 0.957, 0], size: [0.238, 0.105, 0.23], color: 0xffce3b },
            { position: [0, 0.91, 0.045], size: [0.272, 0.036, 0.29], color: 0xffce3b },
            { position: [0, 0.855, 0.111], size: [0.13, 0.04, 0.02], color: 0x3b4541 },
            { position: [0, 0.47, 0.205], size: [0.01, 0.01, 0.01], color: 0x996c40 },
        ];
        this.worker_mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.92 }), rows.length * this.worker_parts.length);
        this.worker_mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.worker_mesh.frustumCulled = false;
        this.worker_mesh.castShadow = true;
        scene.add(this.worker_mesh);
        this.worker_root = new THREE.Object3D();
        this.worker_part = new THREE.Object3D();
        this.worker_matrix = new THREE.Matrix4();
        const color = new THREE.Color();
        rows.forEach((row, index) => {
            this.workers.push({ x: row[0], z: row[1], yaw: row[2], mode: row[3], y: row[4] || 0, phase: index * 1.91 });
            this.worker_parts.forEach((part, part_index) => {
                let paint = part.color;
                if (part_index === 11 || part_index === 12) paint = [0xffcf42, 0xe7e8d9, 0xf68626, 0x65b4c4][index % 4];
                if (row[3] === 'guard' && (part_index === 4 || part_index === 8 || part_index === 9)) paint = 0x2c6171;
                this.worker_mesh.setColorAt(index * this.worker_parts.length + part_index, color.setHex(paint));
            });
        });
    },

    road_position(distance) {
        const arc_length = Math.PI * 0.85;
        let position = ((distance % this.road_length) + this.road_length) % this.road_length;
        if (position < 12.6) return { x: -12.6, z: -6.3 + position, yaw: 0 };
        position -= 12.6;
        if (position < arc_length) {
            const angle = Math.PI - position / 1.7;
            return { x: -10.9 + 1.7 * Math.cos(angle), z: 6.3 + 1.7 * Math.sin(angle), yaw: Math.PI - angle };
        }
        position -= arc_length;
        if (position < 21.8) return { x: -10.9 + position, z: 8, yaw: Math.PI / 2 };
        position -= 21.8;
        if (position < arc_length) {
            const angle = Math.PI / 2 - position / 1.7;
            return { x: 10.9 + 1.7 * Math.cos(angle), z: 6.3 + 1.7 * Math.sin(angle), yaw: Math.PI - angle };
        }
        position -= arc_length;
        if (position < 12.6) return { x: 12.6, z: 6.3 - position, yaw: Math.PI };
        position -= 12.6;
        if (position < arc_length) {
            const angle = -position / 1.7;
            return { x: 10.9 + 1.7 * Math.cos(angle), z: -6.3 + 1.7 * Math.sin(angle), yaw: Math.PI - angle };
        }
        position -= arc_length;
        if (position < 21.8) return { x: 10.9 - position, z: -8, yaw: -Math.PI / 2 };
        position -= 21.8;
        const angle = -Math.PI / 2 - position / 1.7;
        return { x: -10.9 + 1.7 * Math.cos(angle), z: -6.3 + 1.7 * Math.sin(angle), yaw: Math.PI - angle };
    },

    update(dt, time, state) {
        let moving = false;
        if (this.stop_left > 0) {
            this.stop_left = Math.max(0, this.stop_left - dt);
            this.stop_age += dt;
            if (this.stop_left === 0) {
                this.vehicles[this.active_stop.vehicle].loaded = this.active_stop.mode === 'load';
                this.active_stop = null;
                this.next_stop = (this.next_stop + 1) % this.stops.length;
            }
        } else {
            const event = this.stops[this.next_stop];
            const local_distance = this.travel % this.road_length;
            let gap = event.distance - local_distance;
            if (gap < -0.0001) gap += this.road_length;
            const advance = dt * 1.38;
            if (advance >= gap && dt > 0) {
                this.travel += Math.max(0, gap);
                this.stop_left = event.duration;
                this.stop_age = 0;
                this.active_stop = event;
            } else {
                this.travel += advance;
                moving = dt > 0;
            }
        }
        this.vehicles.forEach((vehicle, index) => {
            const position = this.road_position(this.travel + vehicle.offset);
            vehicle.group.position.set(position.x, 0, position.z);
            vehicle.group.rotation.y = position.yaw;
            for (const wheel of vehicle.wheels) {
                if (moving) wheel.rotateY(dt * 5.63);
            }
            if (vehicle.drum) vehicle.drum.rotation.z = time * 0.65;
            if (vehicle.bed) {
                const active = this.active_stop && this.active_stop.vehicle === index;
                const dumping = active && this.active_stop.mode === 'dump';
                const tipping = dumping ? Math.sin(Math.min(1, this.stop_age / 6.4) * Math.PI) * 0.78 : 0;
                vehicle.bed.rotation.z = -tipping;
                vehicle.gate.rotation.z = -tipping * 1.08;
                vehicle.load.visible = vehicle.loaded && !(dumping && this.stop_age > 3.7);
                if (active && this.active_stop.mode === 'load' && this.stop_age > 6.8) vehicle.load.visible = true;
            }
        });
        this.excavators.forEach((excavator, index) => {
            const loading = index === 0 && this.active_stop && this.active_stop.mode === 'load';
            const age = loading ? this.stop_age : (time + index * 4.3) % 9;
            let boom_angle;
            let stick_angle;
            let bucket_angle;
            let yaw = excavator.heading;
            if (loading) {
                if (age < 2.1) {
                    const amount = age / 2.1;
                    boom_angle = 0.04 - amount * 0.19;
                    stick_angle = -1.42 + amount * 0.31;
                    bucket_angle = 0.22 + amount * 0.5;
                } else if (age < 3.9) {
                    const amount = (age - 2.1) / 1.8;
                    boom_angle = -0.15 + amount * 1.18;
                    stick_angle = -1.11 - amount * 0.33;
                    bucket_angle = 0.72 - amount * 0.35;
                } else if (age < 5.8) {
                    const amount = (age - 3.9) / 1.9;
                    yaw = (Math.PI - 0.2) * (amount * amount * (3 - 2 * amount));
                    boom_angle = 1.03;
                    stick_angle = -1.44;
                    bucket_angle = 0.37;
                } else if (age < 7.6) {
                    yaw = Math.PI - 0.2;
                    boom_angle = 1.03;
                    stick_angle = -1.44;
                    bucket_angle = 0.37 - Math.sin((age - 5.8) / 1.8 * Math.PI) * 0.95;
                } else if (age < 9.4) {
                    const amount = (age - 7.6) / 1.8;
                    yaw = (Math.PI - 0.2) * (1 - amount * amount * (3 - 2 * amount));
                    boom_angle = 1.03;
                    stick_angle = -1.44;
                    bucket_angle = 0.37;
                } else {
                    const amount = Math.min(1, (age - 9.4) / 1.4);
                    boom_angle = 1.03 - amount * 0.99;
                    stick_angle = -1.44 + amount * 0.02;
                    bucket_angle = 0.37 - amount * 0.15;
                }
            } else {
                const cycle = (Math.sin(age / 9 * Math.PI * 2) + 1) / 2;
                boom_angle = -0.18 + cycle * 1.08;
                stick_angle = -1.1 - cycle * 0.55;
                bucket_angle = 0.25 + Math.sin(age / 9 * Math.PI * 2 + 0.7) * 0.4;
                yaw += Math.sin(age / 9 * Math.PI * 2) * 0.12;
            }
            const blend = excavator.ready ? 1 - Math.exp(-dt * 8) : 1;
            excavator.upper.rotation.y += (yaw - excavator.upper.rotation.y) * blend;
            excavator.boom.rotation.z += (boom_angle - excavator.boom.rotation.z) * blend;
            excavator.stick.rotation.z += (stick_angle - excavator.stick.rotation.z) * blend;
            excavator.bucket.rotation.z += (bucket_angle - excavator.bucket.rotation.z) * blend;
            excavator.ready = true;
            boom_angle = excavator.boom.rotation.z;
            excavator.rod_start.set(0.08, 0.22, 0.33);
            excavator.rod_end.set(0.16 + Math.cos(boom_angle) * 0.95, 0.66 + Math.sin(boom_angle) * 0.95, 0.33);
            excavator.rod_middle.lerpVectors(excavator.rod_start, excavator.rod_end, 0.53);
            for (const [mesh, first, second, width] of [
                [excavator.piston_mesh, excavator.rod_start, excavator.rod_middle, 0.11],
                [excavator.rod_mesh, excavator.rod_middle, excavator.rod_end, 0.065],
            ]) {
                mesh.position.copy(first).add(second).multiplyScalar(0.5);
                mesh.scale.set(width, first.distanceTo(second), width);
                excavator.rod_direction.subVectors(second, first).normalize();
                mesh.quaternion.setFromUnitVectors(excavator.rod_up, excavator.rod_direction);
            }
        });
        this.cranes.forEach((crane, index) => {
            const phase = time * 0.125 + index * 2.2;
            crane.upper.rotation.y = crane.hopper ? 1.42 + Math.sin(phase) * 0.48 : -0.58 + Math.sin(phase) * 0.3;
            crane.trolley.position.x = crane.hopper ? 2.6 + Math.sin(phase * 0.8) * 0.55 : 4.35 + Math.sin(phase * 0.72) * 1.1;
            const bottom = crane.hopper ? 9.39 + Math.sin(phase * 1.4) * 0.1 : 9.2 + Math.sin(phase * 1.3) * 0.25;
            crane.payload.position.y = bottom - crane.height;
            const rope_length = -crane.payload.position.y - 0.34;
            crane.rope.position.y = -rope_length / 2;
            crane.rope.scale.y = rope_length;
            crane.payload.rotation.y = Math.sin(phase * 1.7) * 0.055;
        });
        this.loader.group.position.x = -0.58 + Math.sin(time * 0.22) * 0.36;
        this.loader.arm.rotation.z = 0.035 + Math.sin(time * 0.45) * 0.065;
        this.workers.forEach((worker, worker_index) => {
            const phase = time * 2 + worker.phase;
            let world_x = worker.x;
            if (worker.mode === 'guard') world_x += Math.sin(time * 0.17 + worker.phase) * 0.35;
            if (worker.mode === 'carry' && worker.x !== 8.35) world_x += Math.sin(time * 0.27 + worker.phase) * 0.12;
            this.worker_root.position.set(world_x, worker.y + 0.03, worker.z);
            this.worker_root.rotation.set(0, worker.yaw, 0);
            this.worker_root.updateMatrix();
            this.worker_parts.forEach((part, part_index) => {
                this.worker_part.position.fromArray(part.position);
                this.worker_part.scale.fromArray(part.size);
                this.worker_part.rotation.set(0, 0, 0);
                if (part_index === 8 || part_index === 9) {
                    const side = part_index === 8 ? -1 : 1;
                    let angle = Math.sin(phase) * 0.19;
                    if (worker.mode === 'signal') angle = side * (0.83 + Math.sin(phase * 0.5) * 0.45);
                    if (worker.mode === 'tie' || worker.mode === 'tool') {
                        this.worker_part.position.z = 0.13 + Math.sin(phase + side) * 0.025;
                        this.worker_part.rotation.x = -0.68 + Math.sin(phase + side) * 0.13;
                    }
                    if (worker.mode === 'carry') {
                        this.worker_part.position.z = 0.17;
                        this.worker_part.rotation.x = -0.83;
                    }
                    this.worker_part.rotation.z = angle;
                    this.worker_part.position.x = side * 0.18 + Math.sin(angle) * 0.12;
                    this.worker_part.position.y = 0.725 - Math.cos(angle) * 0.14;
                }
                if (part_index === 14) {
                    if (worker.mode === 'carry') {
                        this.worker_part.scale.set(0.57, 0.11, 0.22);
                        this.worker_part.position.set(0, 0.48, 0.29);
                    } else if (worker.mode === 'tool') {
                        this.worker_part.scale.set(0.09, 0.37, 0.09);
                        this.worker_part.position.set(0.15, 0.32 + Math.sin(phase) * 0.025, 0.26);
                    }
                }
                this.worker_part.updateMatrix();
                this.worker_matrix.multiplyMatrices(this.worker_root.matrix, this.worker_part.matrix);
                this.worker_mesh.setMatrixAt(worker_index * this.worker_parts.length + part_index, this.worker_matrix);
            });
        });
        this.worker_mesh.instanceMatrix.needsUpdate = true;
        const loading = this.active_stop && this.active_stop.mode === 'load' && this.stop_age > 6 && this.stop_age < 7.6;
        const dumping = this.active_stop && this.active_stop.mode === 'dump' && this.stop_age > 1.8 && this.stop_age < 4.8;
        for (let i = 0; i < 28; i++) {
            const progress = ((time * 1.4 + i * 0.177) % 1);
            if (loading && i < 14) {
                this.soil_dummy.position.set(-12.57 + Math.sin(i * 7) * 0.15, 1.85 - progress * 0.85, -2.33 + Math.cos(i * 5) * 0.18);
                this.soil_dummy.scale.setScalar(1);
            } else if (dumping) {
                this.soil_dummy.position.set(-7 + Math.sin(i * 4) * 0.46, 1.3 * (1 - progress * progress) + 0.08, 7.35 - progress * 0.77);
                this.soil_dummy.scale.setScalar(0.9);
            } else {
                this.soil_dummy.position.set(0, -3, 0);
                this.soil_dummy.scale.setScalar(0);
            }
            this.soil_dummy.rotation.set(time + i, i * 2.6, time * 0.7);
            this.soil_dummy.updateMatrix();
            this.soil_mesh.setMatrixAt(i, this.soil_dummy.matrix);
        }
        this.soil_mesh.instanceMatrix.needsUpdate = true;
    },
};
