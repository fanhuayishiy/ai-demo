import * as THREE from 'three';
import {canvasTexture} from './geometry.js';

export function makeMaterials() {
  const weave = canvasTexture(128, 128, (ctx, size) => {
    const cell = size / 8;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const across = (x + y) % 2 === 0;
        const x0 = x * cell, y0 = y * cell;
        const shade = across
          ? ctx.createLinearGradient(x0, y0, x0, y0 + cell)
          : ctx.createLinearGradient(x0, y0, x0 + cell, y0);
        shade.addColorStop(0, '#858b8e');
        shade.addColorStop(.37, '#b3b6b6');
        shade.addColorStop(.63, '#a7adae');
        shade.addColorStop(1, '#7f8588');
        ctx.fillStyle = shade;
        ctx.fillRect(x0, y0, cell, cell);
        ctx.fillStyle = 'rgba(22,33,41,.12)';
        for (let strand = 2; strand < cell; strand += 3) {
          if (across) ctx.fillRect(x0, y0 + strand, cell, 1);
          else ctx.fillRect(x0 + strand, y0, 1, cell);
        }
      }
    }
  });
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping;
  const brushed = canvasTexture(128, 128, (ctx, w, h) => {
    for (let i = 0; i < h; i++) {
      const tone = 135 + Math.round(23 * Math.sin(i * 2.16) + 19 * Math.sin(i * 0.47));
      ctx.fillStyle = 'rgb(' + [tone, tone, tone].join(',') + ')';
      ctx.fillRect(0, i, w, 1);
    }
  }, false);
  const paint = (color, roughness, metalness = 0, options = {}) =>
    new THREE.MeshStandardMaterial({color, roughness, metalness, ...options});
  const sweep = canvasTexture(256, 256, (ctx, size) => {
    const mid = size * .5;
    const band = ctx.createRadialGradient(mid, mid, 0, mid, mid, mid);
    band.addColorStop(0, '#26343108');
    band.addColorStop(.23, '#26343104');
    band.addColorStop(.42, '#2634313e');
    band.addColorStop(.74, '#26343131');
    band.addColorStop(.88, '#2634311e');
    band.addColorStop(.96, '#ba6c311a');
    band.addColorStop(1, '#ba6c3100');
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, size, size);
    if (ctx.createConicGradient) {
      const glint = ctx.createConicGradient(0, mid, mid);
      for (const start of [0, .5]) {
        glint.addColorStop(start, '#36433f00');
        glint.addColorStop(start + .055, '#36433f4e');
        glint.addColorStop(start + .22, '#36433f00');
      }
      glint.addColorStop(1, '#36433f00');
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = glint;
      ctx.fillRect(0, 0, size, size);
    }
  });

  return {
    porcelain: new THREE.MeshPhysicalMaterial({color: '#cbcec6', roughness: .59, metalness: .04, clearcoat: .29, clearcoatRoughness: .53}),
    hdpeEdge: paint('#a8afa5', .58),
    nose: paint('#838c85', .51, .18),
    safety: paint('#e9b931', .51, .10),
    ceramicEdge: paint('#8b9fa9', .37, .51),
    anodized: paint('#b9cbd0', .42, .83, {roughnessMap: brushed}),
    steel: paint('#90a3ae', .42, .82, {roughnessMap: brushed}),
    titanium: paint('#40515a', .47, .68),
    shellLow: paint('#465760', .46, .37),
    black: paint('#131b21', .52, .20),
    rubber: paint('#20292b', .92),
    carbon: paint('#383e40', .5, .28, {map: weave}),
    blade: new THREE.MeshPhysicalMaterial({color: '#343a3c', map: weave, roughness: .43, metalness: .16, clearcoat: .28, clearcoatRoughness: .52}),
    bladeLower: paint('#515554', .51, .19, {map: weave}),
    tip: paint('#d45c32', .43, .12),
    rotorSweep: new THREE.MeshBasicMaterial({map: sweep, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide}),
    pale: paint('#dce2dc', .51, .17),
    copper: paint('#bd6941', .37, .72),
    brightCopper: paint('#df9a50', .35, .63),
    gold: paint('#dcaf63', .42, .66),
    board: paint('#1b5953', .52, .21),
    boardEdge: paint('#51887c', .58, .29),
    chip: paint('#242c3a', .61, .26),
    silk: paint('#a8c7ac', .64),
    indigo: paint('#344c69', .49, .48),
    led: paint('#65b6a2', .34, .22, {emissive: '#297d68', emissiveIntensity: .53}),
    lensDark: new THREE.MeshPhysicalMaterial({
      color: '#143c4b', roughness: .13, metalness: .46, clearcoat: 1, clearcoatRoughness: .15,
      iridescence: .68, iridescenceIOR: 1.34, iridescenceThicknessRange: [180, 320],
    }),
    lensCoat: new THREE.MeshPhysicalMaterial({
      color: '#1b696a', roughness: .18, metalness: .55, clearcoat: .95,
      clearcoatRoughness: .08, iridescence: .92, iridescenceIOR: 1.42,
      iridescenceThicknessRange: [245, 430],
    }),
    lensGlint: new THREE.MeshBasicMaterial({color: '#9cd4cd', transparent: true, opacity: .60, depthWrite: false}),
  };
}

export function stencil(lines, color = '#1d3845', size = [512, 160]) {
  return canvasTexture(...size, (ctx, w, h) => {
    let y = h * .1;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    for (const [text, weight, ratio, face = 'Inter'] of lines) {
      const fontSize = Math.round(ratio * h);
      ctx.font = weight + ' ' + fontSize + 'px "' + face + '", monospace';
      ctx.fillText(text, w * .045, y, w * .91);
      y += fontSize * 1.02;
    }
  });
}
