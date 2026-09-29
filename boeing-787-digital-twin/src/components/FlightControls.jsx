import { useEffect } from 'react';
import { PlaneTakeoff, PlaneLanding, Play, Pause, RotateCcw, Undo2, Wind } from 'lucide-react';
import { FLIGHT_DURATION, sampleFlight } from '../scene/flight';

export function FlightControls({ flight, setFlight }) {
  useEffect(() => {
    if (!flight || flight.paused || flight.progress >= 1) return;
    let frame,
      previous = performance.now();
    function tick(now) {
      const delta = Math.max(0, Math.min((now - previous) / 1000, 0.1));
      previous = now;
      setFlight((value) =>
        value && !value.paused
          ? {
              ...value,
              progress: Math.min(1, value.progress + delta / FLIGHT_DURATION),
            }
          : value,
      );
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [Boolean(flight), flight?.paused, flight?.progress >= 1, setFlight]);
  const sample = flight && sampleFlight(flight.kind, flight.progress);
  const stages =
    flight?.kind === 'landing'
      ? [
          ['进近', 0],
          ['放轮', 0.15],
          ['拉平', 0.5],
          ['接地', 0.62],
          ['减速', 0.75],
        ]
      : [
          ['滑跑', 0],
          ['抬轮', 0.25],
          ['离地', 0.38],
          ['收轮', 0.52],
          ['爬升', 0.72],
        ];
  const stageIndex = stages.findLastIndex(([, start]) => (flight?.progress ?? 0) >= start);
  return (
    <div className={`flight-controls ${flight ? 'running' : ''}`}>
      <div className="flight-actions">
        <button
          className={flight?.kind === 'takeoff' ? 'active' : ''}
          onClick={() =>
            setFlight({
              kind: 'takeoff',
              progress: 0,
              paused: false,
              airflow: flight?.airflow ?? true,
            })
          }
        >
          <PlaneTakeoff size={16} />
          起飞
        </button>
        <button
          className={flight?.kind === 'landing' ? 'active' : ''}
          onClick={() =>
            setFlight({
              kind: 'landing',
              progress: 0,
              paused: false,
              airflow: flight?.airflow ?? true,
            })
          }
        >
          <PlaneLanding size={16} />
          降落
        </button>
        {flight && (
          <button
            className={`airflow-toggle ${flight.airflow !== false ? 'active' : ''}`}
            title="气流效果"
            aria-label="气流效果"
            aria-pressed={flight.airflow !== false}
            onClick={() => setFlight({ ...flight, airflow: flight.airflow === false })}
          >
            <Wind size={16} />
          </button>
        )}
        {flight && (
          <button title="返回结构视图" aria-label="返回结构视图" onClick={() => setFlight(null)}>
            <Undo2 size={16} />
          </button>
        )}
        <span>
          {flight
            ? flight.progress >= 1
              ? '序列完成'
              : flight.paused
                ? '已暂停'
                : '演示中'
            : 'FLIGHT SEQUENCE'}
        </span>
      </div>
      {flight && (
        <>
          <div className="flight-telemetry">
            <div>
              <small>速度 / KT</small>
              <strong>{Math.round(sample.speed).toString().padStart(3, '0')}</strong>
            </div>
            <div>
              <small>离地高度 / M</small>
              <strong>
                {Math.round(sample.altitude * 2)
                  .toString()
                  .padStart(3, '0')}
              </strong>
            </div>
            <div>
              <small>俯仰 / DEG</small>
              <strong>
                {((sample.pitch * 180) / Math.PI).toFixed(1)}
                <em>°</em>
              </strong>
            </div>
            <div className="flight-gear">
              <small>起落架</small>
              <strong>
                {sample.gear > 0.99 ? '已放下' : sample.gear < 0.01 ? '已收起' : '收放中'}
              </strong>
            </div>
          </div>
          <div className="flight-stages" aria-label="飞行阶段">
            {stages.map(([label, start], index) => (
              <button
                key={label}
                className={index === stageIndex ? 'current' : index < stageIndex ? 'complete' : ''}
                aria-current={index === stageIndex ? 'step' : undefined}
                onClick={() => setFlight({ ...flight, progress: start, paused: true })}
              >
                <i />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="flight-transport">
            <button
              aria-label={flight.paused || flight.progress >= 1 ? '播放飞行动画' : '暂停飞行动画'}
              title={flight.paused ? '播放' : '暂停'}
              onClick={() =>
                setFlight({
                  ...flight,
                  progress: flight.progress >= 1 ? 0 : flight.progress,
                  paused: flight.progress >= 1 ? false : !flight.paused,
                })
              }
            >
              {flight.paused || flight.progress >= 1 ? <Play size={16} /> : <Pause size={16} />}
            </button>
            <input
              aria-label="飞行进度"
              type="range"
              min="0"
              max="1000"
              value={Math.round(flight.progress * 1000)}
              onChange={(event) =>
                setFlight({ ...flight, progress: Number(event.target.value) / 1000, paused: true })
              }
            />
            <time>
              {Math.round(flight.progress * FLIGHT_DURATION)
                .toString()
                .padStart(2, '0')}{' '}
              / {FLIGHT_DURATION}s
            </time>
            <button
              aria-label="重播飞行动画"
              title="重播"
              onClick={() => setFlight({ ...flight, progress: 0, paused: false })}
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <div className="flight-footnote">
            <span>{sample.phase}</span>
            <span>气流与参数为概念示意 · 非 CFD</span>
          </div>
        </>
      )}
    </div>
  );
}
