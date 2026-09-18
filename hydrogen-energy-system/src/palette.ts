export const palette = {
  background: '#080e18',
  surface: '#101b2a',
  text: '#e5effa',
  muted: '#8396ad',
  primary: '#43d9ef',
  electricity: '#f5cc65',
  heat: '#ff865b',
  cold: '#57c9ff',
  hydrogen: '#45d9a2',
  gas: '#ac91ed',
  metal: '#758c9d',
  metalLight: '#b6c6cd',
  metalDark: '#334958',
  deck: '#172633',
  glass: '#123e56',
  solar: '#123451',
  line: '#263c50',
};

export type Carrier = 'electricity' | 'heat' | 'cold' | 'hydrogen' | 'gas';
export const carrierNames: Record<Carrier, string> = {
  electricity: '电能', heat: '热能', cold: '冷能', hydrogen: '氢能', gas: '天然气',
};
