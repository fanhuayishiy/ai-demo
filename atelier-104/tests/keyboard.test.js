import test from 'node:test';
import assert from 'node:assert/strict';
import {keys,defaultConfig,validateConfig,readSaved} from '../src/keyboard.js';
test('ANSI layout contains exactly 104 unique, non-overlapping physical keys',()=>{
  assert.equal(keys.length,104);assert.equal(new Set(keys.map(k=>k.code)).size,104);
  for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++){const a=keys[i],b=keys[j];assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,`${a.code} overlaps ${b.code}`);}
  for(const code of ['NumpadEnter','Enter','ShiftLeft','ShiftRight','ControlLeft','ControlRight','MetaLeft','MetaRight'])assert.ok(keys.some(k=>k.code===code));
});
test('import rejects missing or invalid colors and normalizes unsupported control values',()=>{
  assert.equal(validateConfig({}),null);assert.equal(validateConfig({...defaultConfig,shell:'red'}),null);
  const c=validateConfig({...defaultConfig,switch:'invalid',material:'steel',light:'rainbow'});assert.equal(c.switch,'linear');assert.equal(c.material,'aluminum');assert.equal(c.light,'off');
});
test('saved designs recover from corrupted storage and ignore invalid records',()=>{
  assert.deepEqual(readSaved({getItem:()=>'{broken'}),[]);
  assert.equal(readSaved({getItem:()=>JSON.stringify([{name:'valid',config:defaultConfig},{name:'invalid',config:{}}])}).length,1);
});
