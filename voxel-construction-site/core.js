const canvas = document.getElementById('scene');
const state = {
    speed: 1,
    speed_index: 2,
    day_cycle: true,
    day: 0.39,
    dust: 1,
    rain: 0,
    rain_target: 0,
    night: 0,
    time: 0,
    real_time: 0,
    fps: 60,
    quality: 1,
};
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x242e35);
scene.fog = new THREE.FogExp2(0x242e35, 0.008);
const camera = new THREE.PerspectiveCamera(39, innerWidth / innerHeight, 0.1, 180);
const material_cache = new Map();
const materials = {
    yellow: 0xe8ac31,
    orange: 0xdf7139,
    steel: 0x657880,
    concrete: 0xb7b6aa,
    dark: 0x27383e,
};
const ground_material = new THREE.MeshStandardMaterial({ color: 0x777567, roughness: 0.96, metalness: 0.02 });
const road_material = new THREE.MeshStandardMaterial({ color: 0x7c827d, roughness: 0.94, metalness: 0.02 });
const window_material = new THREE.MeshStandardMaterial({ color: 0x96b8be, roughness: 0.24, metalness: 0.18, emissive: 0xffbe70, emissiveIntensity: 0.04 });
const geo = {
    cube: new THREE.BoxGeometry(1, 1, 1),
    cylinders: new Map(),
    records: [],
    material: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.83, metalness: 0.04 }),
    temp: new THREE.Object3D(),
    get_material(color) {
        if (color && color.isMaterial) return color;
        const key = color === undefined ? 0x999999 : color;
        if (!material_cache.has(key)) {
            const material = new THREE.MeshStandardMaterial({ color: key, roughness: 0.83, metalness: 0.04 });
            material.userData.flat_batch = true;
            material_cache.set(key, material);
        }
        return material_cache.get(key);
    },
    group(parent, x = 0, y = 0, z = 0) {
        const group = new THREE.Group();
        group.position.set(x, y, z);
        parent.add(group);
        return group;
    },
    box(parent, x, y, z, sx, sy, sz, color, opts = {}) {
        const object = new THREE.Object3D();
        object.position.set(x, y, z);
        object.scale.set(sx, sy, sz);
        object.rotation.set(opts.rx || 0, opts.ry || 0, opts.rz || 0);
        object.updateMatrix();
        this.records.push({ parent, matrix: object.matrix.clone(), color, shadow: opts.shadow !== false });
    },
    mesh_box(parent, x, y, z, sx, sy, sz, color, opts = {}) {
        const mesh = new THREE.Mesh(this.cube, this.get_material(color));
        mesh.position.set(x, y, z);
        mesh.scale.set(sx, sy, sz);
        mesh.rotation.set(opts.rx || 0, opts.ry || 0, opts.rz || 0);
        mesh.castShadow = opts.shadow !== false;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
    },
    cylinder(parent, x, y, z, radius, height, color, segments = 8, opts = {}) {
        if (!this.cylinders.has(segments)) this.cylinders.set(segments, new THREE.CylinderGeometry(1, 1, 1, segments));
        const mesh = new THREE.Mesh(this.cylinders.get(segments), this.get_material(color));
        mesh.position.set(x, y, z);
        mesh.scale.set(radius, height, radius);
        mesh.rotation.set(opts.rx || 0, opts.ry || 0, opts.rz || 0);
        mesh.castShadow = opts.shadow !== false;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
    },
    beam(parent, start, end, width, color) {
        const start_point = new THREE.Vector3(...start);
        const end_point = new THREE.Vector3(...end);
        const offset = end_point.clone().sub(start_point);
        const object = new THREE.Object3D();
        object.position.copy(start_point.add(end_point).multiplyScalar(0.5));
        object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), offset.clone().normalize());
        object.scale.set(width, offset.length(), width);
        object.updateMatrix();
        this.records.push({ parent, matrix: object.matrix.clone(), color, shadow: true });
    },
    label(parent, text, x, y, z, width, height, opts = {}) {
        const label_canvas = document.createElement('canvas');
        label_canvas.width = Math.max(256, Math.min(1024, Math.round(width / height * 180)));
        label_canvas.height = 180;
        const paint = label_canvas.getContext('2d');
        paint.fillStyle = opts.background || '#183944';
        paint.fillRect(0, 0, label_canvas.width, 180);
        paint.strokeStyle = opts.border || '#a6bac0';
        paint.lineWidth = 3;
        paint.strokeRect(7, 7, label_canvas.width - 14, 166);
        paint.fillStyle = opts.color || '#f0ead9';
        paint.font = opts.font || '500 68px "Microsoft YaHei", sans-serif';
        paint.textAlign = 'center';
        paint.textBaseline = 'middle';
        paint.fillText(text, label_canvas.width / 2, 91, label_canvas.width - 28);
        const texture = new THREE.CanvasTexture(label_canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9, side: THREE.DoubleSide }));
        mesh.position.set(x, y, z);
        mesh.rotation.set(opts.rx || 0, opts.ry || 0, opts.rz || 0);
        parent.add(mesh);
        return mesh;
    },
    flush() {
        scene.updateMatrixWorld(true);
        const batches = new Map();
        for (const record of this.records) {
            const material = record.color && record.color.isMaterial ? record.color : this.material;
            const key = material.uuid + '/' + record.shadow;
            if (!batches.has(key)) batches.set(key, { material, records: [], shadow: record.shadow });
            batches.get(key).records.push(record);
        }
        for (const batch of batches.values()) {
            const mesh = new THREE.InstancedMesh(this.cube, batch.material, batch.records.length);
            batch.records.forEach((record, index) => {
                mesh.setMatrixAt(index, new THREE.Matrix4().multiplyMatrices(record.parent.matrixWorld, record.matrix));
                if (batch.material === this.material) mesh.setColorAt(index, new THREE.Color(record.color));
            });
            mesh.castShadow = batch.shadow;
            mesh.receiveShadow = true;
            mesh.computeBoundingSphere();
            scene.add(mesh);
        }
        this.count = this.records.length;
        this.records.length = 0;
    },
    dynamic_batch(group) {
        const batches = new Map();
        for (const child of [...group.children]) {
            if (!child.isMesh || child.isInstancedMesh || Array.isArray(child.material) || child.userData.no_batch) continue;
            const material = child.material.userData.flat_batch ? this.material : child.material;
            const key = child.geometry.uuid + '/' + material.uuid;
            if (!batches.has(key)) batches.set(key, { material, geometry: child.geometry, list: [] });
            batches.get(key).list.push(child);
        }
        for (const batch of batches.values()) {
            if (batch.list.length < 2) continue;
            const mesh = new THREE.InstancedMesh(batch.geometry, batch.material, batch.list.length);
            batch.list.forEach((child, index) => {
                child.updateMatrix();
                mesh.setMatrixAt(index, child.matrix);
                if (batch.material === this.material) mesh.setColorAt(index, child.material.color);
                group.remove(child);
            });
            mesh.castShadow = batch.list.some(child => child.castShadow);
            mesh.receiveShadow = true;
            mesh.computeBoundingSphere();
            group.add(mesh);
        }
    },
};
const rng = {
    seed: 472913,
    next() {
        this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
        return this.seed / 4294967296;
    },
};
const lighting = {
    lamps: [],
    point_lights: [],
    build() {
        this.hemisphere = new THREE.HemisphereLight(0xc6dfeb, 0x76644e, 2.5);
        scene.add(this.hemisphere);
        this.sun = new THREE.DirectionalLight(0xffdfae, 3.5);
        this.sun.position.set(-15, 27, 16);
        this.sun.castShadow = true;
        this.sun.shadow.mapSize.set(2048, 2048);
        Object.assign(this.sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 75 });
        this.sun.shadow.bias = -0.0002;
        this.sun.shadow.normalBias = 0.035;
        this.sun.shadow.radius = 2;
        this.sun.target.position.set(0, 1, 0);
        scene.add(this.sun, this.sun.target);
        this.fill = new THREE.DirectionalLight(0x9cbbd0, 1.05);
        this.fill.position.set(15, 12, -18);
        scene.add(this.fill);
        this.room_light = new THREE.PointLight(0xffc48c, 40, 42, 2);
        this.room_light.position.set(-17, 11, 3);
        scene.add(this.room_light);
        this.glow_geometry = new THREE.PlaneGeometry(1, 1);
        this.glow_material = new THREE.ShaderMaterial({
            uniforms: { u_color: { value: new THREE.Color(0xffc477) }, u_alpha: { value: 0.3 } },
            vertexShader: `varying vec2 v_uv;
                void main(){
                    v_uv=uv;
                    vec4 center=modelViewMatrix*vec4(0.,0.,0.,1.);
                    vec2 size=vec2(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz));
                    center.xy+=position.xy*size;
                    gl_Position=projectionMatrix*center;
                }`,
            fragmentShader: `uniform vec3 u_color; uniform float u_alpha; varying vec2 v_uv;
                void main(){
                    float radius=length(v_uv-.5)*2.;
                    float halo=pow(max(0.,1.-radius),3.);
                    float core=exp(-radius*radius*90.);
                    gl_FragColor=vec4(u_color,(halo*.55+core)*u_alpha);
                }`,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
        });
    },
    add_lamp(x, y, z, color = 0xffc477, intensity = 1) {
        const material = this.glow_material.clone();
        material.uniforms.u_color.value.set(color);
        const glow = new THREE.Mesh(this.glow_geometry, material);
        glow.position.set(x, y, z);
        glow.scale.setScalar(1.1 + intensity * 0.6);
        glow.userData.intensity = intensity;
        glow.renderOrder = 3;
        scene.add(glow);
        this.lamps.push(glow);
        return glow;
    },
    update() {
        const sun_height = Math.sin((state.day - 0.25) * Math.PI * 2);
        state.night = 1 - THREE.MathUtils.smoothstep(sun_height, -0.12, 0.35);
        const dusk = 1 - THREE.MathUtils.smoothstep(Math.abs(sun_height), 0.06, 0.5);
        this.sun.color.set(0xffe3b7).lerp(new THREE.Color(0xff8b49), dusk * 0.65);
        this.sun.intensity = Math.max(0.1, sun_height * 3.7) * (1 - state.rain * 0.78);
        this.sun.position.set(-18 + state.day * 25, 24 + sun_height * 7, 16);
        this.hemisphere.intensity = THREE.MathUtils.lerp(2.25, 0.65, state.night) * (1 - state.rain * 0.25);
        this.hemisphere.color.set(0xc1deed).lerp(new THREE.Color(0x6289c1), state.night);
        this.fill.intensity = 0.85 - state.night * 0.45;
        this.room_light.intensity = 35 + state.night * 50;
        const sky = new THREE.Color(0x303e46).lerp(new THREE.Color(0x111d30), state.night).lerp(new THREE.Color(0x343c46), state.rain * 0.6);
        scene.background.copy(sky);
        scene.fog.color.copy(sky);
        room.window_material.color.set(0x718e9c).lerp(new THREE.Color(0xe6a376), dusk * 0.4).lerp(new THREE.Color(0x152d4e), state.night);
        room.window_material.emissive.copy(room.window_material.color);
        room.window_material.emissiveIntensity = 0.25;
        window_material.emissiveIntensity = 0.06 + state.night * 1.7 + state.rain * 0.6;
        ground_material.roughness = THREE.MathUtils.lerp(0.96, 0.18, state.rain);
        ground_material.metalness = THREE.MathUtils.lerp(0.02, 0.35, state.rain);
        ground_material.color.set(0x777567).lerp(new THREE.Color(0x343f40), state.rain * 0.8);
        road_material.roughness = THREE.MathUtils.lerp(0.94, 0.17, state.rain);
        road_material.metalness = THREE.MathUtils.lerp(0.02, 0.38, state.rain);
        road_material.color.set(0x7c827d).lerp(new THREE.Color(0x364447), state.rain * 0.85);
        for (const lamp of this.lamps) {
            lamp.material.uniforms.u_alpha.value = Math.min(1, (0.07 + state.night * 0.73 + state.rain * 0.45) * lamp.userData.intensity);
        }
        this.point_lights.forEach((light, index) => { light.intensity = (state.night * 16 + state.rain * 8 + 0.8) * (index === 2 ? 0.65 : 1); });
    },
};
lighting.build();
const ctx = { THREE, scene, geo, materials, ground_material, road_material, window_material, add_lamp: lighting.add_lamp.bind(lighting) };
