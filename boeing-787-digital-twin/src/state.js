export const initialState = {
  mode: 'exploded',
  explosion: 0.62,
  selected: null,
  autoRotate: false,
  labels: true,
  grid: true,
  playing: false,
  camera: 'perspective',
  resetId: 0,
};

export function viewerReducer(state, action) {
  switch (action.type) {
    case 'mode':
      if (!['assembled', 'exploded', 'cutaway'].includes(action.mode)) return state;
      return {
        ...state,
        mode: action.mode,
        explosion: action.mode === 'exploded' ? 0.72 : 0,
        playing: false,
      };
    case 'explosion':
      return {
        ...state,
        mode: 'exploded',
        explosion: Math.max(0, Math.min(1, Number(action.value) || 0)),
      };
    case 'select':
      return {
        ...state,
        selected: action.id,
        ...(action.id === 'cabin' && state.mode === 'assembled'
          ? { mode: 'cutaway', explosion: 0, playing: false }
          : {}),
      };
    case 'toggle':
      if (!['autoRotate', 'labels', 'grid', 'playing'].includes(action.key)) return state;
      return {
        ...state,
        [action.key]: !state[action.key],
        ...(action.key === 'playing' ? { mode: 'exploded' } : {}),
      };
    case 'camera':
      return { ...state, camera: action.camera, resetId: state.resetId + 1 };
    case 'reset':
      return { ...initialState, mode: 'assembled', explosion: 0, resetId: state.resetId + 1 };
    default:
      return state;
  }
}
