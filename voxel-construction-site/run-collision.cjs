const fs = require('fs');
const { THREE, scene, ctx, context, shape, static_bounds } = require('./audit-collision.cjs');
const machines = context.machine_scene;
machines.build(ctx);
scene.updateMatrixWorld(true);
for (const [index, crane] of machines.cranes.entries()) {
    for (const child of crane.upper.parent.children) {
        if (child === crane.upper) continue;
        child.traverse(mesh => {
            if (!mesh.isMesh) return;
            const bounds = shape.bounds(mesh);
            bounds.owner = 'crane_' + index;
            static_bounds.push(bounds);
        });
    }
}
const roots = [];
for (const [index, vehicle] of machines.vehicles.entries()) roots.push({ name: 'vehicle_' + index, root: vehicle.group });
for (const [index, item] of machines.excavators.entries()) roots.push({ name: 'excavator_' + index, root: item.base });
for (const [index, item] of machines.cranes.entries()) roots.push({ name: 'crane_' + index, root: item.upper });
roots.push({ name: 'loader', root: machines.loader.group });
const mesh_list = [];
for (const item of roots) {
    item.root.traverse(mesh => {
        if (mesh.isMesh && !mesh.isInstancedMesh) mesh_list.push({ mesh, name: item.name });
    });
}
for (let i = 0; i < machines.worker_mesh.count; i++) {
    const mesh = new THREE.Mesh(machines.worker_mesh.geometry, machines.worker_mesh.material);
    mesh.userData.source = ['worker_part_' + i % machines.worker_parts.length];
    mesh_list.push({ mesh, name: 'worker_' + Math.floor(i / machines.worker_parts.length), instance: i });
}
const collisions = new Map();
const outside = new Map();
const dynamic_collisions = new Map();
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
for (let i = 0; i <= 1200; i++) {
    const time = i * 0.2;
    machines.update(0.2, time, { night: 0, rain: false });
    scene.updateMatrixWorld(true);
    const group_bounds = new Map();
    for (const item of mesh_list) {
        if (item.instance !== undefined) machines.worker_mesh.getMatrixAt(item.instance, item.mesh.matrixWorld);
        let parent = item.mesh;
        let visible = true;
        while (parent) { if (!parent.visible) visible = false; parent = parent.parent; }
        if (!visible) continue;
        const bounds = shape.bounds(item.mesh);
        if (!group_bounds.has(item.name)) group_bounds.set(item.name, { aabb: new THREE.Box3(), list: [] });
        group_bounds.get(item.name).aabb.union(bounds.aabb);
        group_bounds.get(item.name).list.push(bounds);
        if (bounds.aabb.min.x < -15 || bounds.aabb.max.x > 15 || bounds.aabb.min.z < -10.5 || bounds.aabb.max.z > 10.5) {
            if (!outside.has(item.name)) outside.set(item.name, { time, min: bounds.aabb.min.toArray(), max: bounds.aabb.max.toArray() });
        }
        const candidate_set = new Set();
        for (let j = Math.floor(bounds.aabb.min.x / 2); j <= Math.floor(bounds.aabb.max.x / 2); j++) {
            for (let k = Math.floor(bounds.aabb.min.z / 2); k <= Math.floor(bounds.aabb.max.z / 2); k++) {
                for (const candidate of spatial.get(j + '/' + k) || []) candidate_set.add(candidate);
            }
        }
        for (const candidate of candidate_set) {
            if (candidate.owner === item.name) continue;
            if (!shape.intersects(bounds, candidate)) continue;
            const source = candidate.mesh.userData.source?.join('/') || candidate.mesh.id;
            const key = item.name + '/' + source;
            if (!collisions.has(key)) collisions.set(key, { name: item.name, time, static_source: source, static_center: candidate.center.toArray(), moving_center: bounds.center.toArray(), moving_source: item.mesh.userData.source });
        }
    }
    const groups = [...group_bounds.entries()];
    for (let j = 0; j < groups.length; j++) {
        for (let k = j + 1; k < groups.length; k++) {
            const [first_name, first] = groups[j];
            const [second_name, second] = groups[k];
            const key = first_name + '/' + second_name;
            if (dynamic_collisions.has(key) || !first.aabb.intersectsBox(second.aabb)) continue;
            let found = false;
            for (const first_part of first.list) {
                for (const second_part of second.list) {
                    if (!shape.intersects(first_part, second_part)) continue;
                    dynamic_collisions.set(key, { first_name, second_name, time, first_center: first_part.center.toArray(), second_center: second_part.center.toArray() });
                    found = true;
                    break;
                }
                if (found) break;
            }
        }
    }
}
const report = { mesh_count: mesh_list.length, sample_count: 1201, sample_seconds: 240, collisions: [...collisions.values()], dynamic_collisions: [...dynamic_collisions.values()], outside: [...outside.entries()] };
fs.writeFileSync('collision-report.json', JSON.stringify(report, null, 4));
console.log(JSON.stringify(report, null, 4));
