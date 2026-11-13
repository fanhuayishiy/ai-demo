export const keys = [];
const add = (code, label, x, y, w = 1, h = 1, kind = 'base') => keys.push({code, label, x, y, w, h, kind});
add('Escape', 'Esc', 0, 0, 1, 1, 'accent');
for (let i = 1; i <= 12; i++) add(`F${i}`, `F${i}`, 1.5 + i - 1 + Math.floor((i - 1) / 4) * .5, 0, 1, 1, 'mod');
['PrintScreen','ScrollLock','Pause'].forEach((c,i)=>add(c,['PrtSc','ScrLk','Pause'][i],15.6+i,0,1,1,'mod'));
function row(y, specs) { let x=0; specs.forEach(([code,label,w=1,kind='base'])=>{add(code,label,x,y,w,1,kind); x+=w;}); }
row(1.5, [['Backquote','~'],...Array.from({length:10},(_,i)=>[`Digit${(i+1)%10}`,`${(i+1)%10}`]),['Minus','−'],['Equal','='],['Backspace','Backspace',2,'mod']]);
row(2.5,[['Tab','Tab',1.5,'mod'],...'QWERTYUIOP'.split('').map(c=>[`Key${c}`,c]),['BracketLeft','['],['BracketRight',']'],['Backslash','\\',1.5,'mod']]);
row(3.5,[['CapsLock','Caps Lock',1.75,'mod'],...'ASDFGHJKL'.split('').map(c=>[`Key${c}`,c]),['Semicolon',';'],['Quote',"'"],['Enter','Enter',2.25,'accent']]);
row(4.5,[['ShiftLeft','Shift',2.25,'mod'],...'ZXCVBNM'.split('').map(c=>[`Key${c}`,c]),['Comma',','],['Period','.'],['Slash','/'],['ShiftRight','Shift',2.75,'mod']]);
row(5.5,[['ControlLeft','Ctrl',1.25,'mod'],['MetaLeft','◇',1.25,'mod'],['AltLeft','Alt',1.25,'mod'],['Space','',6.25],['AltRight','Alt',1.25,'mod'],['MetaRight','◇',1.25,'mod'],['ContextMenu','▤',1.25,'mod'],['ControlRight','Ctrl',1.25,'mod']]);
[['Insert','Ins'],['Home','Home'],['PageUp','PgUp'],['Delete','Del'],['End','End'],['PageDown','PgDn']].forEach(([c,l],i)=>add(c,l,15.6+i%3,1.5+Math.floor(i/3),1,1,'mod'));
add('ArrowUp','↑',16.6,4.5,1,1,'accent');
[['ArrowLeft','←'],['ArrowDown','↓'],['ArrowRight','→']].forEach(([c,l],i)=>add(c,l,15.6+i,5.5,1,1,'accent'));
[['NumLock','Num'],['NumpadDivide','/'],['NumpadMultiply','*'],['NumpadSubtract','−']].forEach(([c,l],i)=>add(c,l,19+i,1.5,1,1,'mod'));
[[7,8,9],[4,5,6],[1,2,3]].forEach((r,j)=>r.forEach((v,i)=>add(`Numpad${v}`,`${v}`,19+i,2.5+j)));
add('NumpadAdd','+',22,2.5,1,2,'mod'); add('NumpadEnter','Enter',22,4.5,1,2,'accent');
add('Numpad0','0',19,5.5,2); add('NumpadDecimal','.',21,5.5);

export const presets = [
  { id:'mint', name:'雾松白', en:'MIST & MINT', shell:'#454f4c', base:'#e6e8df', mod:'#a9b9ad', accent:'#7ba996', ink:'#37433e' },
  { id:'sand', name:'沙丘日落', en:'DUNE SUNSET', shell:'#726358', base:'#ede0c9', mod:'#c7ae8e', accent:'#c97c5e', ink:'#4f4137' },
  { id:'night', name:'午夜航行', en:'MIDNIGHT', shell:'#272f40', base:'#566078', mod:'#384356', accent:'#91adca', ink:'#eff4ff' },
  { id:'retro', name:'复古信号', en:'RETRO SIGNAL', shell:'#66645e', base:'#e4ddca', mod:'#b5b5a5', accent:'#d7a64f', ink:'#42463c' },
];
export const defaultConfig = {...presets[0], material:'aluminum', switch:'linear', light:'off', volume:true};
const hex = /^#[\da-f]{6}$/i;
export function validateConfig(c) {
  if (!c || !['shell','base','mod','accent','ink'].every(k=>hex.test(c[k]))) return null;
  return {...defaultConfig,...Object.fromEntries(Object.keys(defaultConfig).filter(k=>k in c).map(k=>[k,c[k]])),material:['aluminum','plastic'].includes(c.material)?c.material:'aluminum',switch:['linear','tactile','clicky'].includes(c.switch)?c.switch:'linear',light:['off','static','breathe'].includes(c.light)?c.light:'off',volume:c.volume!==false};
}
export function readSaved(storage) { try { const v=JSON.parse(storage.getItem('atelier104-designs')||'[]'); return Array.isArray(v)?v.filter(d=>d&&typeof d.name==='string'&&validateConfig(d.config)).slice(0,20):[]; } catch { return []; } }
