import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { advance, applyCommand, createInitialState } from "./simulation";
import { Dashboard } from "./ui/Dashboard";
import type { CameraCommand, Command, ViewMode } from "./types";
const FireScene = lazy(() => import("./scene/FireScene"));
class GraphicsBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? (
      <div className="loading">图形模块加载失败，请刷新重试。</div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  const [state, setState] = useState(() => {
    const initial = createInitialState();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      initial.playing = false;
    return initial;
  });
  const [selectedId, select] = useState("incident"),
    [view, setView] = useState<ViewMode>("overview");
  const [cameraCommand, setCamera] = useState<CameraCommand>({
    type: "reset",
    sequence: 0,
  });
  const [touring, setTouring] = useState(false),
    [contextLost, setContextLost] = useState(false);
  const last = useRef(0);
  useEffect(() => {
    let frame = 0,
      accumulated = 0;
    const tick = (now: number) => {
      const elapsed = last.current
        ? Math.min((now - last.current) / 1000, 0.25)
        : 0;
      last.current = now;
      if (!document.hidden) {
        accumulated += elapsed;
        if (accumulated >= 0.1) {
          const dt = accumulated;
          accumulated = 0;
          setState((s) => advance(s, dt));
        }
      } else accumulated = 0;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const visibility = () => {
      last.current = 0;
      accumulated = 0;
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  const command = useCallback((cmd: Command) => {
    setState((s) => {
      const next = applyCommand(s, cmd);
      if (cmd.type === "reset") next.mode = s.mode;
      if (cmd.type === "reset" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) next.playing = false;
      return next;
    });
    if (cmd.type === "reset") {
      select("incident");
      setView("overview");
      setTouring(false);
      setCamera((c) => ({ type: "reset", sequence: c.sequence + 1 }));
    }
  }, []);
  const camera = useCallback(
    (type: CameraCommand["type"]) => {
      if (type === "reset") {
        setView("overview");
        setTouring(false);
      }
      setCamera((c) => ({ type, sequence: c.sequence + 1 }));
    },
    [],
  );
  return (
    <main className="app">
      <GraphicsBoundary onError={() => setContextLost(true)}>
        <Suspense fallback={<div className="loading">正在载入消防街区…</div>}>
          <FireScene
            state={state}
            selectedId={selectedId}
            onSelect={select}
            view={view}
            cameraCommand={cameraCommand}
            touring={touring}
            onTourChange={setTouring}
            onContextStatus={setContextLost}
          />
        </Suspense>
      </GraphicsBoundary>
      <Dashboard
        state={state}
        command={command}
        selectedId={selectedId}
        select={select}
        view={view}
        setView={setView}
        camera={camera}
        touring={touring}
        setTouring={setTouring}
        contextLost={contextLost}
      />
    </main>
  );
}
