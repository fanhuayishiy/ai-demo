import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createHeatPump} from '../src/heatpump.js';

test('heat pump is a finite, detailed, bounded top cassette',()=>{
  const group=createHeatPump(THREE);group.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(group);const dimensions=bounds.getSize(new THREE.Vector3());
  assert.ok(dimensions.x<=2.1 && dimensions.z<=2.1 && dimensions.y<=.55);
  assert.ok(dimensions.x>1.8 && dimensions.y>.35);
  let meshes=0,instances=0;
  group.traverse(o=>{if(!o.isMesh)return;meshes++;if(o.isInstancedMesh)instances+=o.count;
    assert.ok(o.geometry.attributes.position.array.every(Number.isFinite),`${o.name} contains nonfinite geometry`);
    if(o.isInstancedMesh)assert.ok(o.instanceMatrix.array.every(Number.isFinite));
  });
  assert.ok(meshes>10 && meshes<90);
  assert.ok(instances>450,'heat exchangers must keep repeated fin and pipe details');
});
