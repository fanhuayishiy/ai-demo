const fs = require('fs');
const vm = require('vm');
const THREE = require('./three-r160.min.js');
const scene = new THREE.Scene();
const material_cache = new Map();
const static_items = [];
let static_mode = true;
const box_geometry = new THREE.BoxGeometry(1, 1, 1);
const geo = {
    records: [],
    get_material(color) {
        if (color && color.isMaterial) return color;
        if (!material_cache.has(color)) material_cache.set(color, new THREE.MeshStandardMaterial({ color }));
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
        mesh.userData.instanced = true;
    },
    mesh_box(parent, x, y, z, sx, sy, sz, color, opts = {}) {
        const mesh = new THREE.Mesh(box_geometry, this.get_material(color));
        mesh.position.set(x, y, z);
        mesh.scale.set(sx, sy, sz);
        mesh.rotation.set(opts.rx || 0, opts.ry || 0, opts.rz || 0);
        mesh.userData.kind = 'box';
        mesh.userData.source = (new Error().stack.match(/evalmachine\.<anonymous>:\d+/g) || []).slice(0, 2);
        parent.add(mesh);
        if (static_mode) static_items.push(mesh);
        return mesh;
    },
    cylinder(parent, x, y, z, radius, height, color, segments = 8, opts = {}) {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), this.get_material(color));
        mesh.position.set(x, y, z);
        mesh.rotation.set(opts.rx || 0, opts.ry || 0, opts.rz || 0);
        mesh.userData.kind = 'cylinder';
        parent.add(mesh);
        if (static_mode) static_items.push(mesh);
        return mesh;
    },
    beam(parent, start, end, width, color) {
        const offset = new THREE.Vector3(...end).sub(new THREE.Vector3(...start));
        const mesh = this.mesh_box(parent, (start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2, width, offset.length(), width, color);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), offset.normalize());
        return mesh;
    },
    label() { return new THREE.Mesh(); },
    dynamic_batch() {},
};
const ctx = { THREE, scene, geo, materials: {}, ground_material: new THREE.MeshStandardMaterial(), window_material: new THREE.MeshStandardMaterial(), add_lamp() { return new THREE.Object3D(); } };
const context = vm.createContext({ THREE, scene, geo, ctx, console, state: { time: 0, real_time: 0, speed: 1, rain: 0 }, rng: { next: () => 0.42 } });
vm.runInContext(fs.readFileSync('site.js', 'utf8') + '\nsite.build(ctx);', context);
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
const static_bounds = static_items.map(mesh => shape.bounds(mesh));
const grounded_items = static_bounds.filter(item => item.aabb.max.y > 0.06);
static_mode = false;
context.static_bounds = static_bounds;
context.grounded_items = grounded_items;
context.shape = shape;
console.log(JSON.stringify({ static_count: static_bounds.length, obstacle_count: grounded_items.length }));
if (fs.existsSync('machines.js')) vm.runInContext(fs.readFileSync('machines.js', 'utf8') + '\nglobalThis.machine_scene = machines;', context);
module.exports = { THREE, scene, geo, ctx, context, shape, static_items, static_bounds, grounded_items };
