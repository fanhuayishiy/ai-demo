/**
 * 加载状态。装配期唯一的画面外元素，首帧画出来就整块摘掉，成品画面仍然零 UI。
 *
 * 进度读 engine.progress（由 world / placement / motion 逐段写入），不是假动画：
 * 10 个地图层 + 122 个资产 + 6 个动效系统各自收尾时各报一次，屏幕上推进多少就是真做了多少。
 * 更新走 markProgress 的调用点而不是 rAF 循环 —— 后台标签页里 rAF 是挂起的，
 * 靠 rAF 刷新的话进度条会冻在 0%，而装配本身用的是让出宏任务，照常推进。
 */
export function attachBootScreen(engine) {
  const root = document.getElementById('boot');
  if (!root) return { hide() {} };
  const fill = root.querySelector('[data-fill]');
  const cap = root.querySelector('[data-cap]');
  const pct = root.querySelector('[data-pct]');

  const paint = () => {
    const p = engine.progress;
    fill.style.transform = 'scaleX(' + p.v.toFixed(4) + ')';
    cap.textContent = p.label;
    pct.textContent = Math.round(p.v * 100) + '%';
  };

  const mark = engine.markProgress.bind(engine);
  engine.markProgress = (v, label) => {
    mark(v, label);
    paint();
  };
  paint();

  let gone = false;
  return {
    hide() {
      if (gone || !root.isConnected) return;
      gone = true;
      root.classList.add('is-done');
      // 淡出后彻底摘掉：留着会一直压着 canvas 占一个合成层，
      // 也会让「画面零 UI」在 DOM 里留下证据。
      setTimeout(() => root.remove(), 700);
    },
  };
}
