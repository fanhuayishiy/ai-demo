import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { Dashboard } from './ui/Dashboard';
import { advanceTime, sampleSimulation } from './simulation';
import { getEntity } from './data';
import type { CameraCommand } from './types';

const Scene = lazy(() => import('./scene/Scene').then((module) => ({ default: module.Scene })));

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="scene-message" role="alert"><span className="scene-message-icon" aria-hidden="true">◇</span><h2>3D 场景暂不可用</h2><p>当前浏览器可能不支持 WebGL，或图形渲染遇到问题。</p><p>设备搜索、对象详情和模拟控制仍可使用。可尝试刷新页面或启用浏览器硬件加速。</p></div> : this.props.children;
  }
}

export function App() {
  const [selectedId, setSelectedId] = useState('warehouse-01');
  const [selectionSequence, setSelectionSequence] = useState(0);
  const [touring, setTouring] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [running, setRunning] = useState(() => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const elapsedRef = useRef(0);
  const runningRef = useRef(running);
  const previousFrame = useRef<number | null>(null);
  const [sim, setSim] = useState(() => sampleSimulation(0));
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ sequence: 0, type: 'reset' });

  useEffect(() => {
    let frameId = 0;
    let lastSample = 0;
    const resetFrame = () => { previousFrame.current = null; };
    const frame = (now: number) => {
      if (document.hidden) previousFrame.current = null;
      else {
        const delta = previousFrame.current === null ? 0 : (now - previousFrame.current) / 1000;
        previousFrame.current = now;
        elapsedRef.current = advanceTime(elapsedRef.current, delta, runningRef.current);
        if (runningRef.current && now - lastSample >= 100) {
          setSim(sampleSimulation(elapsedRef.current));
          lastSample = now;
        }
      }
      frameId = requestAnimationFrame(frame);
    };
    document.addEventListener('visibilitychange', resetFrame);
    frameId = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(frameId); document.removeEventListener('visibilitychange', resetFrame); };
  }, []);

  const toggle = () => {
    runningRef.current = !runningRef.current;
    previousFrame.current = null;
    // Publish the exact scene sample on pause, including the final partial UI interval.
    setSim(sampleSimulation(elapsedRef.current));
    setRunning(runningRef.current);
  };
  const select = (id: string) => {
    setTouring(false);
    setSelectedId(getEntity(id).id);
    setSelectionSequence((sequence) => sequence + 1);
  };
  const command = (type: CameraCommand['type']) => {
    setTouring(false);
    setCameraCommand((current) => ({ sequence: current.sequence + 1, type, ...(type === 'focus' ? { entityId: selectedId } : {}) }));
  };

  return <main className="warehouse-app" aria-label="WareTrack 仓储运营中心">
    <div className="warehouse-scene" aria-label="交互式仓库三维场景">
      <SceneBoundary><Suspense fallback={<div className="scene-message" role="status"><span className="scene-message-icon" aria-hidden="true">◇</span><h2>正在加载 3D 仓库</h2><p>设备信息与模拟控制已就绪</p></div>}>
        <Scene selectedId={selectedId} onSelect={select} elapsedRef={elapsedRef} cameraCommand={cameraCommand} touring={touring} onCameraInteract={() => setTouring(false)} onContextStatus={setContextLost} />
      </Suspense></SceneBoundary>
    </div>
    {contextLost && <div className="scene-context-warning" role="alert">图形连接暂时中断，正在等待恢复。设备详情和模拟控制仍可使用。</div>}
    <Dashboard selectedId={selectedId} selectionSequence={selectionSequence} onSelect={select} sim={sim} running={running} onToggle={toggle} onResetView={() => command('reset')} onZoomIn={() => command('zoomIn')} onZoomOut={() => command('zoomOut')} onFocusSelected={() => command('focus')} onToggleTour={() => setTouring(value => !value)} touring={touring} />
  </main>;
}
