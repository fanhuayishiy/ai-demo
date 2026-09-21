// 右上角帧率读数。
//
// 「成品画面零 UI」的第三次让步，也是用户直接点名要的。前两次（装配期加载层、底部天气条）
// 一个在首帧后就摘掉、一个是功能控件；这条是纯诊断信息，所以：
//   · pointer-events: none —— 它绝不能挡住拖拽，观景操作优先于读数；
//   · 4 Hz 刷新而不是逐帧写 DOM —— 逐帧改 textContent 会参与布局，把要测的东西测成噪声；
//   · 默认开，`?fps=0` 关掉：实拍与像素基线要的是没有覆盖层的画面
//     （tools/shoot.mjs 会自动带上这个参数，否则右上角这块会永久出现在 diff 里）。
//
// 数字来自 engine.stats（引擎自己的 0.5 s 滚动窗口），不在这里另起一套计时：
// 两处计时迟早会给出两个不同的"帧率"，然后有人拿错的那个做判断。
// 早先记录过 `stats.fps` 在静止态能读到 43–51 fps、真实拖拽只有个位数，
// 所以标签写清是「当前窗口」而非「交互帧率」，交互帧率仍以 tools/perf.mjs 的拖拽实测为准。

const Hz = 4;

export function attachFpsHud(engine) {
  const p = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('fps') : '';
  const host = document.getElementById('fps');
  if (!host) return null;
  if (p === '0') {
    host.remove();
    return null;
  }
  const el = document.createElement('span');
  el.className = 'fps-val';
  const ms = document.createElement('span');
  ms.className = 'fps-dim';
  const dc = document.createElement('span');
  dc.className = 'fps-dim';
  host.append(el, ms, dc);

  let last = 0;
  const step = 1 / Hz;
  const fmt = (v, d) => (Number.isFinite(v) ? v.toFixed(d) : '—');
  engine.onUpdate((dt, t) => {
    if (t - last < step) return;
    last = t;
    const s = engine.stats;
    const fps = s.fps;
    el.textContent = fmt(fps, fps >= 10 ? 0 : 1) + ' fps';
    ms.textContent = ' · ' + fmt(fps > 0 ? 1000 / fps : 0, 1) + ' ms';
    dc.textContent = ' · ' + (s.calls >= 1000 ? (s.calls / 1000).toFixed(1) + 'k' : s.calls) + ' draw';
    // 读数本身也参与画面明暗：夜景上顶一行深灰字会看不见，白昼上顶一行白字也看不见
    host.classList.toggle('is-dark', !!engine.weather?.dark);
    host.classList.toggle('is-low', fps < 25);
  });
  return { host };
}
