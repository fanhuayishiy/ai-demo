export const VIEWS = {
  overview: { label:'园区全景', position:[36,30,42], target:[0,1.3,0] },
  sports: { label:'活力操场', position:[25,20,27], target:[8,0.4,5] },
  play: { label:'童趣乐园', position:[-25,18,26], target:[-11,0.8,3.5] },
  classroom: { label:'创意教室', position:[-2,8.7,14], target:[-4,5.2,-7] },
  reading: { label:'阅读森林', position:[16,9.8,13], target:[8.5,5.2,-7] },
  rest: { label:'午睡时光', position:[16,5.5,12], target:[8.5,1.2,-7] },
};
export const TOUR = ['overview','sports','play','classroom','reading'];
export function ease(t) { t = Math.max(0,Math.min(1,t)); return t*t*(3-2*t); }
