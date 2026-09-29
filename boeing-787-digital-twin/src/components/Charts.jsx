import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { materials, strainData } from '../data';

const tooltipStyle = {
  background: '#182628',
  border: '1px solid #3a5555',
  borderRadius: 4,
  color: '#e6efed',
  fontSize: 11,
};

export function StrainChart({ range = '30' }) {
  const data = range === '15' ? strainData.slice(-15) : strainData;
  return (
    <div className="strain-chart" role="img" aria-label="左右机翼应变趋势，单位微应变，演示数据">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -28 }}>
          <defs>
            <linearGradient id="strainFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#73deca" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#73deca" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#2b3a3b" strokeDasharray="3 5" />
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            minTickGap={38}
            tick={{ fill: '#718685', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
          />
          <YAxis
            ticks={[0, 30, 60, 90]}
            domain={[0, 90]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#718685', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [`${value} με`, name === 'left' ? '左翼' : '右翼']}
          />
          <Area
            type="monotone"
            dataKey="left"
            stroke="#73deca"
            strokeWidth={1.8}
            fill="url(#strainFill)"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="right"
            stroke="#8daec6"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            fill="transparent"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MaterialChart() {
  const [selected, setSelected] = useState(materials[0].name);
  const [hovered, setHovered] = useState(null);
  const active = materials.find((material) => material.name === (hovered || selected));
  return (
    <div className="material-content">
      <div
        className="material-donut"
        role="img"
        aria-label="材料重量占比：复合材料50%，铝合金20%，钛合金15%，钢及其他15%"
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={materials}
              innerRadius="70%"
              outerRadius="95%"
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              paddingAngle={5}
              stroke="none"
              isAnimationActive={false}
              onMouseEnter={(_, index) => setHovered(materials[index]?.name || null)}
              onMouseLeave={() => setHovered(null)}
            >
              {materials.map((m) => (
                <Cell
                  key={m.name}
                  fill={m.color}
                  opacity={m.name === active.name ? 1 : 0.5}
                  onClick={() => setSelected(m.name)}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <strong>
            {active.value}
            <span>%</span>
          </strong>
          <small>{active.name}</small>
        </div>
      </div>
      <div className="material-legend">
        {materials.map((m) => (
          <button
            key={m.name}
            className="material-option"
            aria-label={`查看${m.name}占比`}
            aria-pressed={selected === m.name}
            onClick={() => setSelected(m.name)}
            onMouseEnter={() => setHovered(m.name)}
            onMouseLeave={() => setHovered(null)}
          >
            <i style={{ background: m.color }} />
            <span>{m.name}</span>
            <b>
              {m.value}
              <small>%</small>
            </b>
          </button>
        ))}
      </div>
    </div>
  );
}

export function EngineGauge({ value, index, temperature }) {
  return (
    <div className="engine-gauge">
      <div className="gauge-ring" style={{ '--gauge-progress': `${value * 2.7}deg` }}>
        <div>
          <small>N1</small>
          <strong>
            {value.toFixed(1)}
            <span>%</span>
          </strong>
        </div>
      </div>
      <span className="engine-label">
        <i />
        ENGINE 0{index}
      </span>
      <div className="egt">
        <span>EGT</span>
        <b>
          {temperature}
          <small>°C</small>
        </b>
      </div>
    </div>
  );
}

export function HealthBars({ selected, monitoring = false }) {
  const rows = selected
    ? [
        ['结构完整性', selected.health],
        ['传感器在线', 100],
        ['疲劳余量', Math.round(selected.health - 3.4)],
      ]
    : monitoring
      ? [
          ['飞控系统', 100],
          ['液压系统', 99.2],
          ['供电系统', 99.9],
          ['环境控制', 99.5],
        ]
      : [
          ['机身结构', 99.6],
          ['机翼总成', 99.4],
          ['动力系统', 98.9],
          ['航电系统', 100],
        ];
  return (
    <div className="health-bars">
      {rows.map(([label, value], i) => (
        <div className="health-row" key={label}>
          <div>
            <span>{label}</span>
            <b>
              {value.toFixed(1)}
              <small>%</small>
            </b>
          </div>
          <div className="bar-track">
            <i style={{ width: `${value}%`, background: i === 2 ? '#8daec6' : undefined }} />
          </div>
        </div>
      ))}
    </div>
  );
}
