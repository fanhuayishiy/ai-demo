// 复现并打印注入后的着色器，用于定位编译错误
import * as THREE from 'three';

const incRe = /^[ \t]*#include +<([\w\d./]+)>/gm;
function resolveIncludes(str) {
  return str.replace(incRe, (match, include) => {
    const s = THREE.ShaderChunk[include];
    if (s === undefined) throw new Error('Cannot find chunk ' + include);
    return resolveIncludes(s);
  });
}

const src = resolveIncludes(THREE.ShaderLib.toon.fragmentShader);
console.log('resolved length lines:', src.split('\n').length);
const idx = src.split('\n').map((l, i) => [i + 1, l]).filter(([i, l]) => l.includes('tonemapping') || l.includes('dithering') || l.includes('outgoingLight ='));
console.log(idx.map(([i, l]) => i + ': ' + JSON.stringify(l)).join('\n'));
