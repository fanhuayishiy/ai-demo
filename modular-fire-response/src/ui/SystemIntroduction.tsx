import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";
import type { Command, SimulationState } from "../types";
import "./SystemIntroduction.css";

const advantages = [
  {
    title: "分布式就近部署",
    description: "将装备分布在多个站点，就近启动首轮响应并按现场需求增援。目标是缩短集结链路、提高区域覆盖，不将演示时间视为实际到场承诺。",
  },
  {
    title: "小型专用模块",
    description: "供水、增压、举高喷射、云梯、侦察、运输、机器人和能源各司其职。模块可独立整备与替换，并按任务组合，减少单台大型装备承担全部功能的耦合。",
  },
  {
    title: "先侦察、再复核",
    description: "侦察无人机先行观察可见火情、人员与通行条件，为地面力量提供线索。热成像仅提供疑似线索，需人工复核；不具备穿墙透视能力，也不能替代现场搜救判断。",
  },
  {
    title: "按需协同调度",
    description: "依据规则与预案组织分批出动、作业衔接和增援，让装备围绕同一任务配合。当前为可解释的规则化模拟，不是经过实战验证的 AI 最优调度。",
  },
  {
    title: "移动增压与滚动补水",
    description: "移动增压车提供现场供水枢纽和缓冲水箱，多台供水运输车轮换补给，连接水源与喷射端。缓冲储量有助于平滑补给间隙，但持续供水仍取决于水源、流量和道路条件。",
  },
  {
    title: "一条水带的空中协同",
    description: "研究方案由 2 架承托无人机与 1 架末端喷射无人机共用一条供水软管，分担水带承托与末端指向任务。实际应用仍需验证载荷、反作用力、风场、管路稳定性和失效保护。",
  },
  {
    title: "屋顶物资与概念吊运",
    description: "载重无人机向屋顶交付 4 组物资，为受困人员提供先期支持。载人吊运为独立高风险研究概念，必须单独明确授权；示意登篮与地面交接不计入云梯安全转移人数。",
  },
  {
    title: "机器人进入高风险区域",
    description: "地面搜索机器人与破拆工具模块承担前探、环境观察和辅助作业，目标是减少人员在高温、浓烟或受限空间中的暴露。适用范围仍受感知、通信、通行能力与耐受条件限制。",
  },
  {
    title: "能源与后勤保障",
    description: "能源模块为设备提供补能与电池轮换，物资、工具和供水模块配合保障连续作业。独立补给便于按消耗组织轮换，续航能力仍需结合真实负载和任务环境核算。",
  },
  {
    title: "人工授权与安全闭锁",
    description: "出动、管路连接、生命信号复核与救援保留人工决策，设备状态、补给和事件集中呈现。故障与低电量触发模拟闭锁或回收；引导演示中的授权事件不代表无人值守救援。",
  },
];

interface PauseTicket {
  source: SimulationState;
  paused: SimulationState | null;
  mayResume: boolean;
}

export function SystemIntroduction({
  state,
  command,
}: {
  state: SimulationState;
  command: (command: Command) => void;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const dialogId = `system-introduction-${id}`;
  const titleId = `${dialogId}-title`;
  const summaryId = `${dialogId}-summary`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const pauseTicket = useRef<PauseTicket | null>(null);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current!;
    const trigger = triggerRef.current;
    dialog.showModal();
    titleRef.current?.focus();
    return () => {
      if (dialog.open) dialog.close();
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open]);

  useEffect(() => {
    const ticket = pauseTicket.current;
    if (!open || !ticket?.mayResume) return;
    if (!ticket.paused && state === ticket.source) return;
    // The first pause may include queued ticks; later snapshots invalidate its ownership.
    if (!ticket.paused && !state.playing && !state.complete
      && state.time >= ticket.source.time && state.mode === ticket.source.mode) {
      ticket.paused = state;
    } else if (state !== ticket.paused) {
      ticket.mayResume = false;
    }
  }, [open, state]);

  const show = () => {
    if (pauseTicket.current) return;
    const mayResume = state.playing && !state.complete;
    pauseTicket.current = { source: state, paused: null, mayResume };
    setOpen(true);
    if (mayResume) command({ type: "toggle-play" });
  };

  const dismiss = () => {
    const ticket = pauseTicket.current;
    if (!ticket) return;
    pauseTicket.current = null;
    setOpen(false);
    if (ticket.mayResume && state === ticket.paused && !state.playing && !state.complete) {
      command({ type: "toggle-play" });
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      dismiss();
      return;
    }
    if (event.key !== "Tab") return;
    const stops = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [tabindex="0"]',
    ));
    const first = stops[0];
    const last = stops.at(-1);
    const active = document.activeElement as HTMLElement | null;
    const outsideStops = !active || !stops.includes(active);
    if (event.shiftKey && (active === first || outsideStops)) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && (active === last || outsideStops)) {
      event.preventDefault();
      first?.focus();
    }
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom) dismiss();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="system-introduction-trigger"
        title="系统介绍"
        aria-haspopup="dialog"
        aria-controls={dialogId}
        aria-expanded={open}
        onClick={show}
      >
        <Info size={16} aria-hidden="true" />
        <span>系统介绍</span>
      </button>
      {open && createPortal(
        <dialog
          ref={dialogRef}
          id={dialogId}
          className="system-introduction"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={summaryId}
          onKeyDown={handleKeyDown}
          onClick={handleBackdropClick}
          onCancel={event => { event.preventDefault(); dismiss(); }}
          onClose={dismiss}
        >
          <header className="system-introduction-heading">
            <div>
              <p>FIRELINK / 联合响应指挥</p>
              <h2 id={titleId} ref={titleRef} tabIndex={-1}>系统介绍</h2>
            </div>
            <button
              type="button"
              className="system-introduction-close"
              aria-label="关闭系统介绍"
              title="关闭系统介绍"
              onClick={dismiss}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <div className="system-introduction-body" role="region" aria-label="系统介绍正文" tabIndex={0}>
            <p id={summaryId} className="system-introduction-summary">
              <strong>模块化分布式智能消防系统</strong>将分散部署的专用车组、无人机与地面机器人连接为协同响应网络，
              围绕侦察、供水、灭火、救援和保障按需组合。其设计目标是让先期响应更灵活、专业力量衔接更清晰，并降低人员风险暴露。
            </p>
            <ul className="system-introduction-advantages">
              {advantages.map(advantage => (
                <li key={advantage.title} className="system-introduction-advantage">
                  <h3>{advantage.title}</h3>
                  <p>{advantage.description}</p>
                </li>
              ))}
            </ul>
          </div>
          <section className="system-introduction-boundary" aria-labelledby={`${dialogId}-boundary`}>
            <h3 id={`${dialogId}-boundary`}>演示边界</h3>
            <p>
              本页面为前端概念模拟，非实战指挥系统。时间、流量、载荷和调度均为示意；
              所述优势是设计目标，不代表已完成工程验证或真实救援验证。空中水带协同与载人吊运需另行开展安全评估、试验与审批。
            </p>
          </section>
        </dialog>,
        document.body,
      )}
    </>
  );
}
