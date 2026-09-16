const fs = require('fs');
const vm = require('vm');
const THREE = require('./three-r160.min.js');

// —— 伪 DOM / 伪渲染器（供纹理画布代码在 Node 中运行） ——
const stub_ctx_2d = () => new Proxy({}, {
    get(target, key) {
        if (key === 'canvas') return { width: 300, height: 150 };
        return typeof key === 'string' ? (...args) => stub_value(key) : undefined;
    },
    set() { return true; },
});
const stub_value = key => (key === 'createLinearGradient' ? { addColorStop() {} } : undefined);
const fake_canvas = () => ({ width: 300, height: 150, getContext: () => stub_ctx_2d(), style: {} });
const document_stub = { createElement: tag => (tag === 'canvas' ? fake_canvas() : fake_canvas()) };

const scene = new THREE.Scene();
const material_cache = new Map();
const static_items = [];
let static_mode = true;
const box_geometry = new THREE.BoxGeometry(1, 1, 1);
const geo = {
    records: [],
    get_material(color) {
        if (color && color.isMaterial) return color;
        if (!material_cache.has(color)) material_cache.set(color, new THREE.MeshStandardMaterial({ color: color || 0x888888 }));
        return material_cache.get(color);
    },
    group(parent, x = 0, y = 0, z = 0) {
        const group = new THREE.Group();
        group.position.set(x, y, z);
        parent.add(group);
        return group;
    },
    box(parent, x, y, z, sx, sy, sz, color, opts = {}) {
        const mesh = this.mesh_box(parent, x, y, z, sx, sy, sz, color, opts);
        return mesh;
    },
    mesh_box(parent, x, y, z, sx, sy, sz, color, opts = {}) {
        const mesh = new THREE.Mesh(box_geometry, this.get_material(color));
        mesh.position.set(x, y, z);
        mesh.scale.set(sx, sy, sz);
        mesh.rotation.set(opts.rx || 0, opts.ry || 0, opts.rz || 0);
        if (opts && opts.no_collide) mesh.userData.no_collide = true;
        mesh.userData.source = (new Error().stack.match(/evalmachine\.<anonymous>:\d+/g) || []).slice(0, 2);
        parent.add(mesh);
        if (static_mode && !mesh.userData.no_collide) static_items.push(mesh);
        return mesh;
    },
    cylinder(parent, x, y, z, radius, height, color, segments = 8, opts = {}) {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, segments), this.get_material(color));
        mesh.position.set(x, y, z);
        mesh.scale.set(radius, height, radius);
        mesh.rotation.set(opts.rx || 0, opts.ry || 0, opts.rz || 0);
        if (opts && opts.no_collide) mesh.userData.no_collide = true;
        mesh.userData.source = (new Error().stack.match(/evalmachine\.<anonymous>:\d+/g) || []).slice(0, 2);
        parent.add(mesh);
        if (static_mode && !mesh.userData.no_collide) static_items.push(mesh);
        return mesh;
    },
    beam(parent, start, end, width, color) {
        const offset = new THREE.Vector3(...end).sub(new THREE.Vector3(...start));
        const mesh = this.mesh_box(parent, (start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2, width, offset.length(), width, color, {});
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), offset.normalize());
        return mesh;
    },
    label() { return new THREE.Mesh(new THREE.BoxGeometry(0.001, 0.001, 0.001), new THREE.MeshStandardMaterial()); },
    dynamic_batch() {},
    flush() {},
};
const add_lamp_stub = () => new THREE.Object3D();
const add_point_stub = () => { const l = new THREE.PointLight(); return l; };
const ctx = { THREE, scene, geo, add_lamp: add_lamp_stub, add_point: add_point_stub };
const context = vm.createContext({
    THREE, scene, geo, ctx, console,
    document: document_stub,
    renderer: { capabilities: { getMaxAnisotropy: () => 4 } },
    state: { time: 0, real_time: 0, speed: 1, rain: 0, night: 1, day: 0.935, steam: 2 },
    rng: { seed: 907231, next() { this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0; return this.seed / 4294967296; } },
    innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1, requestAnimationFrame: () => {},
    performance: { now: () => 0 },
});
vm.runInContext(fs.readFileSync(__dirname + '/street.js', 'utf8') + '\nstreet.build(ctx);', context);
static_mode = false;
vm.runInContext(fs.readFileSync(__dirname + '/room.js', 'utf8') + '\nroom.build();', context);
vm.runInContext(fs.readFileSync(__dirname + '/machines.js', 'utf8') + '\nenv_world.street = street;\nmachines.build(ctx);\nglobalThis.machines = machines;', context);
const machines = context.machines;

scene.updateMatrixWorld(true);
const shape = {
    bounds(mesh) {
        if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
        const bounds = mesh.geometry.boundingBox;
        const local_center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3()).multiplyScalar(0.5);
        const matrix = mesh.matrixWorld;
        const columns = [new THREE.Vector3().setFromMatrixColumn(matrix, 0), new THREE.Vector3().setFromMatrixColumn(matrix, 1), new THREE.Vector3().setFromMatrixColumn(matrix, 2)];
        const extent = [size.x * columns[0].length(), size.y * columns[1].length(), size.z * columns[2].length()];
        return { center: local_center.applyMatrix4(matrix), axes: columns.map(item => item.normalize()), extent, aabb: new THREE.Box3().copy(bounds).applyMatrix4(matrix), mesh };
    },
    intersects(first, second) {
        if (!first.aabb.intersectsBox(second.aabb)) return false;
        const offset = second.center.clone().sub(first.center);
        const axes = [...first.axes, ...second.axes];
        for (const left of first.axes) for (const right of second.axes) axes.push(left.clone().cross(right));
        for (const axis of axes) {
            const length = axis.length();
            if (length < 1e-8) continue;
            axis.divideScalar(length);
            const first_radius = first.extent.reduce((value, size, index) => value + size * Math.abs(first.axes[index].dot(axis)), 0);
            const second_radius = second.extent.reduce((value, size, index) => value + size * Math.abs(second.axes[index].dot(axis)), 0);
            if (Math.abs(offset.dot(axis)) >= first_radius + second_radius - 0.014) return false;
        }
        return true;
    },
};
const static_bounds = static_items.map(mesh => shape.bounds(mesh)).filter(item => item.aabb.max.y > 0.06);
const spatial = new Map();
for (const item of static_bounds) {
    for (let i = Math.floor(item.aabb.min.x / 2); i <= Math.floor(item.aabb.max.x / 2); i++) {
        for (let j = Math.floor(item.aabb.min.z / 2); j <= Math.floor(item.aabb.max.z / 2); j++) {
            const key = i + '/' + j;
            if (!spatial.has(key)) spatial.set(key, []);
            spatial.get(key).push(item);
        }
    }
}
console.log(JSON.stringify({ static_count: static_bounds.length, obstacle_count: static_bounds.length }));

// —— 动态实体清单 ——
const roots = [];
for (const [name, root] of [['moto', machines.moto], ['strainer', machines.strainer], ['crane', machines.boom], ['fan', machines.fan_group], ['lanterns', machines.lantern_rail_group]]) {
    roots.push({ name, root });
}
const mesh_list = [];
for (const item of roots) {
    item.root.traverse(mesh => {
        if (mesh.isMesh && !mesh.isInstancedMesh) mesh_list.push({ mesh, name: item.name });
    });
}
for (const def of machines.figure_defs) {
    for (let pi = 0; pi < def.parts.length; pi++) {
        const proxy = new THREE.Mesh(box_geometry, new THREE.MeshStandardMaterial());
        mesh_list.push({ mesh: proxy, name: def.name, instance: def.offset + pi, part: def.parts[pi].tag });
    }
}
const whitelist = new Set(['moto/rider', 'rider/moto']);
const bounds_limit = { x: 15.15, z: 10.55 };
const collisions = new Map();
const dynamic_collisions = new Map();
const outside = new Map();
const STEP = 0.25;
const STEPS = 1921;
for (let i = 0; i < STEPS; i++) {
    const t = i * STEP;
    machines.update(t, t, { night: 1, rain: 0, day: 0.935 });
    scene.updateMatrixWorld(true);
    const group_bounds = new Map();
    for (const item of mesh_list) {
        if (item.instance !== undefined) machines.figure_mesh.getMatrixAt(item.instance, item.mesh.matrixWorld);
        let parent = item.mesh;
        let visible = true;
        while (parent) { if (!parent.visible) visible = false; parent = parent.parent; }
        if (!visible) continue;
        const bounds = shape.bounds(item.mesh);
        if (!group_bounds.has(item.name)) group_bounds.set(item.name, { aabb: new THREE.Box3(), list: [] });
        group_bounds.get(item.name).aabb.union(bounds.aabb);
        group_bounds.get(item.name).list.push(bounds);
        if (bounds.aabb.min.x < -bounds_limit.x || bounds.aabb.max.x > bounds_limit.x || bounds.aabb.min.z < -bounds_limit.z || bounds.aabb.max.z > bounds_limit.z) {
            if (!outside.has(item.name)) outside.set(item.name, { time: t, part: item.part || '', min: bounds.aabb.min.toArray().map(v => +v.toFixed(2)), max: bounds.aabb.max.toArray().map(v => +v.toFixed(2)) });
        }
        const candidate_set = new Set();
        for (let j = Math.floor(bounds.aabb.min.x / 2); j <= Math.floor(bounds.aabb.max.x / 2); j++) {
            for (let k = Math.floor(bounds.aabb.min.z / 2); k <= Math.floor(bounds.aabb.max.z / 2); k++) {
                for (const candidate of spatial.get(j + '/' + k) || []) candidate_set.add(candidate);
            }
        }
        for (const candidate of candidate_set) {
            if (!shape.intersects(bounds, candidate)) continue;
            const source = candidate.mesh.userData.source ? candidate.mesh.userData.source.join('|') : candidate.mesh.id;
            const key = item.name + '/' + source;
            if (!collisions.has(key)) collisions.set(key, { name: item.name, part: item.part || '', time: +t.toFixed(2), static_source: source, static_center: candidate.center.toArray().map(v => +v.toFixed(2)), moving_center: bounds.center.toArray().map(v => +v.toFixed(2)) });
        }
    }
    const groups = [...group_bounds.entries()];
    for (let j = 0; j < groups.length; j++) {
        for (let k = j + 1; k < groups.length; k++) {
            const [first_name, first] = groups[j];
            const [second_name, second] = groups[k];
            const key = first_name + '/' + second_name;
            if (whitelist.has(key) || dynamic_collisions.has(key) || !first.aabb.intersectsBox(second.aabb)) continue;
            let found = null;
            for (const first_part of first.list) {
                for (const second_part of second.list) {
                    if (!shape.intersects(first_part, second_part)) continue;
                    found = { first: first_name, second: second_name, time: +t.toFixed(2), center: first_part.center.toArray().map(v => +v.toFixed(2)) };
                    break;
                }
                if (found) break;
            }
            if (found) dynamic_collisions.set(key, found);
        }
    }
}
const report = {
    mesh_count: mesh_list.length,
    sample_count: STEPS,
    sample_seconds: +(STEPS * STEP).toFixed(1),
    static_obstacles: static_bounds.length,
    collisions: [...collisions.values()],
    dynamic_collisions: [...dynamic_collisions.values()],
    outside: [...outside.entries()].map(([name, v]) => ({ name, ...v })),
};
fs.writeFileSync(__dirname + '/collision-report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ collisions: report.collisions.length, dynamic: report.dynamic_collisions.length, outside: report.outside.length }));
for (const c of report.collisions.slice(0, 12)) console.log('STATIC', JSON.stringify(c));
for (const c of report.dynamic_collisions.slice(0, 12)) console.log('DYNAMIC', JSON.stringify(c));
for (const c of report.outside.slice(0, 12)) console.log('OUTSIDE', JSON.stringify(c));
