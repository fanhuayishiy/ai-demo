export const clampExplosion = value => Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Number(value))) : 0;
export const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const views = {
  assembled: { explosion: 0, shell: true, flow: false, title: '完整形态', description: '让复杂，归于简洁。' },
  exploded: { explosion: 62, shell: true, flow: false, title: '分层爆炸', description: '循着结构，读懂每一处细节。' },
  cutaway: { explosion: 18, shell: false, flow: false, title: '内部拆解', description: '移开外壳，走进精密的机械世界。' },
  thermal: { explosion: 25, shell: false, flow: true, title: '热泵循环', description: '两条独立回路，让热量循环利用。' },
};
export const viewState = id => ({ ...(views[id] || views.exploded) });
export const PART_INFO = {
  drum: { index: '03', name: '精密不锈钢内筒', en: 'STAINLESS STEEL DRUM', description: '细密穿孔让水与空气穿行。三组提升筋托起织物，在旋转间完成翻落、洗涤与均匀烘干。内外筒之间留有水流与转动空间。', specs: [['材质', '拉丝不锈钢'], ['结构', '穿孔筒壁 · 三翼提升筋']] },
  heatpump: { index: '07', name: '闭环热泵系统', en: 'CLOSED-LOOP HEAT PUMP', description: '压缩机驱动密闭冷媒循环。蒸发器先冷却湿空气、析出水分，冷凝器再将热量交还干燥空气；热风返回滚筒，持续带走织物水分。', specs: [['冷媒回路', '压缩 → 放热 → 节流 → 吸热'], ['空气回路', '除湿 → 回热 → 循环']] },
  motor: { index: '04', name: '直驱变频电机', en: 'DIRECT DRIVE MOTOR', description: '同轴布置在外筒后部，转子将扭矩直接传递给滚筒。铜线绕组、定子齿与转子磁环共同控制洗涤翻转及高速脱水。', specs: [['驱动方式', '同轴直驱'], ['可见结构', '铜绕组 · 定子 · 转子']] },
  door: { index: '01', name: '复合舱门组件', en: 'MULTI-LAYER PORTHOLE', description: '金属饰圈、深色承力框与弧面观察窗叠合成完整舱门。内侧弹性门封连接静止面板与悬挂外筒，吸收振动并保持密封。', specs: [['构成', '金属 / 玻璃 / 弹性密封'], ['连接', '侧铰链 · 安全门锁']] },
  control: { index: '08', name: '智能控制组件', en: 'CONTROL & DOSING', description: '面板背后的控制电路连接电机、温度传感与执行部件。独立的洗涤剂盒通过进水路径将洗涤剂带入外筒，与烘干空气回路分离。', specs: [['控制', '显示交互 · 传感调节'], ['投放', '独立洗涤剂通道']] },
  cabinet: { index: '10', name: '模块化金属机身', en: 'MODULAR ENCLOSURE', description: '折边侧板、背板与加强底盘构成外部框架。顶部弹簧、底部阻尼器与配重协同约束外筒运动，把机械振动留在机身内部。', specs: [['表面', '缎面金属涂层'], ['支撑', '弹簧悬挂 · 阻尼减振']] },
  tub: { index: '05', name: '悬挂式外筒', en: 'SUSPENDED OUTER TUB', description: '外筒容纳洗涤水，同时支撑内筒轴承。加强筋提升壳体刚度，前后壳体以紧固件连接，悬挂结构为脱水时的动态位移预留空间。', specs: [['构造', '分体壳体 · 周向加强筋'], ['功能', '储水 · 支撑 · 减振']] },
  gasket: { index: '02', name: '柔性密封门封', en: 'FLEXIBLE BELLOWS SEAL', description: '多道柔性折叠环连接外筒与前面板。它既阻隔洗涤水外溢，又允许悬挂筒体在工作时产生有限位移。', specs: [['材质', '弹性体'], ['结构', '多褶环形密封']] },
  suspension: { index: '06', name: '悬挂减振系统', en: 'SUSPENSION & DAMPING', description: '上部螺旋弹簧承担筒体重量，下部斜置阻尼器抑制振幅。配重块与加强底盘形成稳定的受力系统。', specs: [['上部', '双弹簧悬挂'], ['下部', '斜置阻尼支撑']] },
  pump: { index: '09', name: '排水与过滤组件', en: 'DRAIN & FILTRATION', description: '外筒底部的集水管连接排水泵，滤芯收集较大的异物。烘干除湿得到的冷凝水通过独立支路汇入排水系统。', specs: [['流向', '集水 → 过滤 → 排出'], ['维护', '前置滤芯检修口']] },
  inlet: { index: '11', name: '冷水进水口与进水阀', en: 'COLD WATER INLET & VALVE', description: '机背上部的蓝色螺纹接口连接外部冷水管。内置滤网拦截杂质，电磁进水阀控制供水，经蓝色进水管进入洗涤剂盒，再流入外筒；它与热泵冷媒回路相互独立。', specs: [['位置', '机背上部 · 蓝色接口'], ['水路', '进水阀 → 投放盒 → 外筒']] },
  outlet: { index: '12', name: '排水出口与排水软管', en: 'DRAIN OUTLET & HOSE', description: '排水泵通过机内软管连接机背下部出口，外侧波纹软管将洗涤废水排出机身。卡箍与橡胶护套保护连接处；外排软管的抬升与固定仅作布置示意，不代替具体机型的安装要求。', specs: [['位置', '机背下部 · 灰色波纹管'], ['水路', '排水泵 → 出口 → 外排软管']] },
  waterlines: { index: '13', name: '洗涤进排水管路', en: 'WASH-WATER CIRCUIT', description: '蓝色细管将进水阀与洗涤剂盒连接，较粗软管将洗涤剂盒连接至外筒；另一条软管连接排水泵和机背出口。展开时软管示意性伸展，保持端口连接关系可读，并非实际拆机操作。', specs: [['进水', '蓝色供水管'], ['排水', '灰色柔性软管']] },
};
