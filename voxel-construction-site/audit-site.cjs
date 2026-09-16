const fs = require('fs');
const vm = require('vm');
const boxes = [];
const labels = [];
const beams = [];
const lamps = [];
const group = {};
const geo = {
    group() { return group; },
    box(parent, x, y, z, sx, sy, sz, color, opts = {}) { boxes.push({x,y,z,sx,sy,sz,opts}); },
    mesh_box(parent, x, y, z, sx, sy, sz, color, opts = {}) { boxes.push({x,y,z,sx,sy,sz,opts}); },
    cylinder() {},
    beam(parent, start, end, width) { beams.push({start,end,width}); },
    label(parent, text, x,y,z,width,height) { labels.push({text,x,y,z,width,height}); },
};
const context = { ctx: { THREE: { MeshStandardMaterial: function (args) { Object.assign(this,args); } }, scene: {}, geo, ground_material: {}, window_material: {}, add_lamp(...args) {lamps.push(args);} } };
vm.runInNewContext(fs.readFileSync('work/site.js','utf8') + '\nsite.build(ctx);', context);
const invalid = boxes.filter(item => ![item.x,item.y,item.z,item.sx,item.sy,item.sz].every(Number.isFinite));
const out = boxes.filter(item => !item.opts.ry && !item.opts.rz && (Math.abs(item.x)+item.sx/2>15.001 || Math.abs(item.z)+item.sz/2>10.501));
console.log(JSON.stringify({box_count:boxes.length,beam_count:beams.length,label_count:labels.length,lamp_count:lamps.length,invalid,out},null,4));
