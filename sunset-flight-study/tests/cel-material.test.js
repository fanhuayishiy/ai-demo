import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

async function materials() {
  const module = await import('../src/cel-material.js').catch(() => null);
  assert.equal(typeof module?.createCelMaterial, 'function', 'cel-material factory exists');
  return module;
}

test('cel paint has three authored colors independent of scene lights', async () => {
  const { createCelMaterial } = await materials();
  const paint = createCelMaterial({ base: '#ce362f', lit: '#e64936', shadow: '#73333c' });
  assert.ok(paint instanceof THREE.ShaderMaterial);
  assert.equal(paint.lights, false);
  assert.equal(paint.toneMapped, false);
  assert.equal(paint.uniforms.uBaseColor.value.getHexString(), 'ce362f');
  assert.equal(paint.uniforms.uLitColor.value.getHexString(), 'e64936');
  assert.equal(paint.uniforms.uShadowColor.value.getHexString(), '73333c');
  assert.ok(paint.uniforms.uLightDirection.value.length() > 0.99);
  assert.match(paint.fragmentShader, /dot\(normal, lightDirection\)/);
  assert.match(paint.fragmentShader, /uShadowColor/);
  assert.match(paint.fragmentShader, /uLitColor/);
  assert.ok(paint.uniforms.uBrushStrength.value <= 0.025, 'paint variation remains understated');
});

test('paint and outline support scene fog and exactly one output conversion', async () => {
  const { createCelMaterial, createOutlineMaterial } = await materials();
  for (const material of [createCelMaterial(), createOutlineMaterial()]) {
    assert.equal(material.fog, true);
    assert.ok(material.uniforms.fogColor.value instanceof THREE.Color);
    assert.match(material.vertexShader, /#include <fog_vertex>/);
    assert.match(material.fragmentShader, /#include <fog_fragment>/);
    assert.equal((material.fragmentShader.match(/#include <colorspace_fragment>/g) || []).length, 1);
    assert.doesNotMatch(material.fragmentShader, /pow\(.*1\.0\s*\/\s*2\.2/);
  }
});

test('outline expands normalized view normals in world units after model transforms', async () => {
  const { createOutlineMaterial } = await materials();
  const outline = createOutlineMaterial({ color: '#572a34', thickness: 0.022 });
  assert.equal(outline.side, THREE.BackSide);
  assert.equal(outline.depthWrite, true, 'exposed border pixels occlude later transparent cloud cards');
  assert.equal(outline.depthTest, true, 'base aircraft still hides the interior backface shell');
  assert.equal(outline.transparent, false, 'outline remains in the opaque pass before transparent clouds');
  assert.equal(outline.uniforms.uThickness.value, 0.022);
  assert.match(outline.vertexShader, /normalize\(normalMatrix \* normal\)/);
  assert.match(outline.vertexShader, /mvPosition\.xyz \+= viewNormal \* uThickness/);
  assert.equal(outline.uniforms.uOutlineColor.value.getHexString(), '572a34');
});

test('outline instances own uniforms and require no texture disposal', async () => {
  const { createOutlineMaterial } = await materials();
  const first = createOutlineMaterial();
  const second = createOutlineMaterial();
  assert.notEqual(first.uniforms, second.uniforms);
  assert.notEqual(first.uniforms.fogColor.value, second.uniforms.fogColor.value);
  assert.notEqual(first.uniforms.uOutlineColor.value, second.uniforms.uOutlineColor.value);
  assert.ok(Object.values(first.uniforms).every(uniform => !uniform.value?.isTexture));
  let disposalCount = 0;
  first.addEventListener('dispose', () => { disposalCount++; });
  first.dispose();
  assert.equal(disposalCount, 1);
  assert.equal(second.uniforms.uThickness.value, 0.022);
});
