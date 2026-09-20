// 天气切换的屏幕控件。
//
// 这是「成品画面零 UI」这条硬性约束的第二次、也是更大的一次让步 —— 第一次是装配期的加载状态，
// 那还在画面之外；这个是常驻可见的。用户明确要求「切换增加ui」，所以按钮是真的，
// 只在指针离开时压到很低的对比度，不玩「 hover 才出现」那种把功能藏起来的把戏。
//
// 按钮列表由天气预设表生成（NAME + LABEL），所以以后加一档天气只改预设文件，这里不用动。
// 预设表由调用方传进来而不是 import：index.js 要 import 本文件，反向 import 会成环。
// 状态回显走每帧一次字符串比较：键盘 1–5 与 ?weather= 也改天气，控件必须跟着动，
// 而给控制器加一套订阅机制换这点开销不值得。

export function attachWeatherUI(engine, weather, list) {
  const host = document.getElementById('wxbar');
  if (!host || !weather) return null;

  const buttons = list.map((w) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'wx';
    b.textContent = w.LABEL;
    b.title = w.LABEL;
    b.dataset.name = w.NAME;
    b.addEventListener('click', () => weather.set(w.NAME));
    host.appendChild(b);
    return b;
  });

  let shown = '';
  const sync = () => {
    if (weather.current === shown) return;
    shown = weather.current;
    for (const b of buttons) b.classList.toggle('is-on', b.dataset.name === shown);
    // 夜景上顶着一个白药丸会很刺眼，控件跟着天气换一套明暗配色
    host.classList.toggle('is-dark', !!weather.dark);
  };
  sync();
  engine.onUpdate(sync);
  return { sync };
}
