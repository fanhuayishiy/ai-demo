import { StrictMode, useState, type Dispatch, type SetStateAction } from "react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { advance, applyCommand, createInitialState } from "../simulation";
import type { Command, SimulationState } from "../types";
import { Dashboard } from "./Dashboard";
import { SystemIntroduction } from "./SystemIntroduction";
import type { DashboardProps } from "./types";

const prototype = HTMLDialogElement.prototype;
const originalShowModal = Object.getOwnPropertyDescriptor(prototype, "showModal");
const originalClose = Object.getOwnPropertyDescriptor(prototype, "close");

// jsdom lacks the dialog lifecycle. Focus and keyboard handling remain real component behavior.
const showModal = vi.fn(function (this: HTMLDialogElement) { this.open = true; });
const close = vi.fn(function (this: HTMLDialogElement) {
  if (!this.open) return;
  this.open = false;
  this.dispatchEvent(new Event("close"));
});

beforeAll(() => {
  Object.defineProperty(prototype, "showModal", { configurable: true, value: showModal });
  Object.defineProperty(prototype, "close", { configurable: true, value: close });
});
beforeEach(() => { showModal.mockClear(); close.mockClear(); });
afterEach(cleanup);
afterAll(() => {
  if (originalShowModal) Object.defineProperty(prototype, "showModal", originalShowModal);
  else Reflect.deleteProperty(prototype, "showModal");
  if (originalClose) Object.defineProperty(prototype, "close", originalClose);
  else Reflect.deleteProperty(prototype, "close");
});

function mount(initialState = createInitialState(), strict = false) {
  let state = initialState;
  const p: Omit<DashboardProps, "state" | "command"> = {
    selectedId: "incident", select: vi.fn(), view: "overview", setView: vi.fn(),
    camera: vi.fn(), touring: false, setTouring: vi.fn(), contextLost: false,
  };
  const command = vi.fn((action: Command) => {
    state = applyCommand(state, action);
    view.rerender(element());
  });
  const element = () => {
    const dashboard = <Dashboard {...p} state={state} command={command} />;
    return strict ? <StrictMode>{dashboard}</StrictMode> : dashboard;
  };
  const view = render(element());
  return {
    ...view, command,
    get state() { return state; },
    replace(next: SimulationState) { state = next; view.rerender(element()); },
  };
}

function mountStateful(initialState = createInitialState()) {
  let state = initialState;
  let setState: Dispatch<SetStateAction<SimulationState>>;
  const command = vi.fn((action: Command) => setState(previous => applyCommand(previous, action)));
  function Host() {
    [state, setState] = useState(initialState);
    return <SystemIntroduction state={state} command={command} />;
  }
  render(<Host />);
  return {
    command,
    get state() { return state; },
    update(updater: SetStateAction<SimulationState>) { setState(updater); },
  };
}

function openIntroduction() {
  const trigger = screen.getByRole("button", { name: "系统介绍" });
  trigger.focus();
  fireEvent.click(trigger);
  return { trigger, dialog: screen.getByRole("dialog", { name: "系统介绍" }) as HTMLDialogElement };
}

describe("system introduction", () => {
  it("provides an explicitly named header command without opening by default", () => {
    mount();
    const button = screen.queryByRole("button", { name: "系统介绍" });
    expect(button).not.toBeNull();
    expect(button!.getAttribute("aria-haspopup")).toBe("dialog");
    expect(button!.getAttribute("aria-expanded")).toBe("false");
    expect(button!.closest("header")).not.toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the complete system brief using the native modal API", () => {
    mount();
    const { trigger, dialog } = openIntroduction();
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(showModal.mock.instances[0]).toBe(dialog);
    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(dialog.id);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const content = within(dialog);
    expect(content.getByText(/FIRELINK/)).toBeTruthy();
    for (const heading of [
      "分布式就近部署", "小型专用模块", "先侦察、再复核", "按需协同调度",
      "移动增压与滚动补水", "一条水带的空中协同", "屋顶物资与概念吊运",
      "机器人进入高风险区域", "能源与后勤保障", "人工授权与安全闭锁", "演示边界",
    ]) expect(content.getByRole("heading", { name: heading })).toBeTruthy();
    expect(dialog.textContent).toContain("热成像仅提供疑似线索，需人工复核");
    expect(dialog.textContent).toContain("规则与预案");
    expect(dialog.textContent).toContain("2 架承托无人机与 1 架末端喷射无人机");
    expect(dialog.textContent).toContain("共用一条供水软管");
    expect(dialog.textContent).toContain("4 组物资");
    expect(dialog.textContent).toContain("单独明确授权");
    expect(dialog.textContent).toContain("非实战指挥系统");
    expect(dialog.textContent).toContain("不代表已完成工程验证或真实救援验证");
  });

  it("starts at the title and contains forward and reverse keyboard focus", async () => {
    mount();
    const user = userEvent.setup();
    const { dialog } = openIntroduction();
    const title = within(dialog).getByRole("heading", { name: "系统介绍" });
    const closeButton = within(dialog).getByRole("button", { name: "关闭系统介绍" });
    const body = within(dialog).getByRole("region", { name: "系统介绍正文" });
    expect(document.activeElement).toBe(title);
    await user.tab();
    expect(document.activeElement).toBe(closeButton);
    await user.tab();
    expect(document.activeElement).toBe(body);
    await user.tab();
    expect(document.activeElement).toBe(closeButton);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(body);
    title.focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(body);
  });

  it("dismisses with Escape and restores focus to its header command", async () => {
    mount();
    const user = userEvent.setup();
    const { trigger } = openIntroduction();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("dismisses with its close button and restores focus", () => {
    mount();
    const { trigger, dialog } = openIntroduction();
    fireEvent.click(within(dialog).getByRole("button", { name: "关闭系统介绍" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("dismisses a backdrop click but not clicks within the dialog bounds", () => {
    mount();
    const { trigger, dialog } = openIntroduction();
    vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue(new DOMRect(100, 100, 600, 500));
    fireEvent.click(dialog, { clientX: 150, clientY: 150 });
    expect(screen.getByRole("dialog")).toBe(dialog);
    fireEvent.click(within(dialog).getByRole("heading", { name: "分布式就近部署" }));
    expect(screen.getByRole("dialog")).toBe(dialog);
    fireEvent.click(dialog, { clientX: 24, clientY: 24 });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("handles the native cancel event through the same dismissal path", () => {
    const mounted = mount();
    const { trigger, dialog } = openIntroduction();
    const cancel = new Event("cancel", { cancelable: true });
    fireEvent(dialog, cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(mounted.state.playing).toBe(true);
    expect(mounted.command).toHaveBeenCalledTimes(2);
  });

  it("releases the modal without restarting playback when the dashboard unmounts", () => {
    const mounted = mount();
    openIntroduction();
    mounted.unmount();
    expect(close).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mounted.command).toHaveBeenCalledTimes(1);
  });
});

describe("introduction playback ownership", () => {
  it("resumes after an already queued simulation tick commits with the pause", () => {
    const mounted = mountStateful();
    const trigger = screen.getByRole("button", { name: "系统介绍" });
    act(() => {
      mounted.update(state => advance(state, 0.1));
      fireEvent.click(trigger);
    });
    expect(mounted.state.time).toBeCloseTo(0.1);
    expect(mounted.state.playing).toBe(false);
    expect(mounted.command).toHaveBeenCalledExactlyOnceWith({ type: "toggle-play" });
    fireEvent.click(screen.getByRole("button", { name: "关闭系统介绍" }));
    expect(mounted.state.time).toBeCloseTo(0.1);
    expect(mounted.state.playing).toBe(true);
    expect(mounted.command).toHaveBeenCalledTimes(2);
  });

  it("does not resume a zero-time replacement after pausing a queued tick", () => {
    const mounted = mountStateful();
    const trigger = screen.getByRole("button", { name: "系统介绍" });
    act(() => {
      mounted.update(state => advance(state, 0.1));
      fireEvent.click(trigger);
    });
    act(() => mounted.update({ ...createInitialState(), playing: false }));
    fireEvent.click(screen.getByRole("button", { name: "关闭系统介绍" }));
    expect(mounted.state.time).toBe(0);
    expect(mounted.state.playing).toBe(false);
    expect(mounted.command).toHaveBeenCalledTimes(1);
  });

  it("does not take ownership of a reset queued before the pause", () => {
    const mounted = mountStateful({ ...createInitialState(), time: 12 });
    const trigger = screen.getByRole("button", { name: "系统介绍" });
    act(() => {
      mounted.update(() => createInitialState());
      fireEvent.click(trigger);
    });
    fireEvent.click(screen.getByRole("button", { name: "关闭系统介绍" }));
    expect(mounted.state.time).toBe(0);
    expect(mounted.state.playing).toBe(false);
    expect(mounted.command).toHaveBeenCalledTimes(1);
  });

  it("does not resume when a queued tick completes the simulation", () => {
    const mounted = mountStateful({ ...createInitialState(), time: 179.95 });
    const trigger = screen.getByRole("button", { name: "系统介绍" });
    act(() => {
      mounted.update(state => advance(state, 0.1));
      fireEvent.click(trigger);
    });
    expect(mounted.state.complete).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "关闭系统介绍" }));
    expect(mounted.state.playing).toBe(false);
    expect(mounted.command).toHaveBeenCalledTimes(1);
  });

  it("pauses an active simulation while the brief is open and resumes on close", () => {
    const mounted = mount();
    const { dialog } = openIntroduction();
    expect(mounted.state.playing).toBe(false);
    expect(mounted.command).toHaveBeenCalledExactlyOnceWith({ type: "toggle-play" });
    expect(advance(mounted.state, 5)).toBe(mounted.state);
    fireEvent.click(within(dialog).getByRole("button", { name: "关闭系统介绍" }));
    expect(mounted.state.playing).toBe(true);
    expect(mounted.command).toHaveBeenCalledTimes(2);
  });

  it.each([false, true])("does not start an already paused simulation (completed: %s)", complete => {
    const state = createInitialState();
    state.playing = false;
    state.complete = complete;
    const mounted = mount(state);
    const { dialog } = openIntroduction();
    fireEvent.click(within(dialog).getByRole("button", { name: "关闭系统介绍" }));
    expect(mounted.state.playing).toBe(false);
    expect(mounted.command).not.toHaveBeenCalled();
  });

  it("does not resume a simulation that completed while the brief was open", () => {
    const mounted = mount();
    const { dialog } = openIntroduction();
    mounted.replace({ ...mounted.state, time: 180, playing: false, complete: true });
    fireEvent.click(within(dialog).getByRole("button", { name: "关闭系统介绍" }));
    expect(mounted.state.playing).toBe(false);
    expect(mounted.command).toHaveBeenCalledTimes(1);
  });

  it("does not resume a reset simulation even when its paused clock is still zero", () => {
    const mounted = mount();
    const { dialog } = openIntroduction();
    mounted.replace({ ...createInitialState(), playing: false });
    fireEvent.click(within(dialog).getByRole("button", { name: "关闭系统介绍" }));
    expect(mounted.state.playing).toBe(false);
    expect(mounted.command).toHaveBeenCalledTimes(1);
  });

  it("does not override another state command issued during the brief", () => {
    const mounted = mount();
    const { dialog } = openIntroduction();
    mounted.replace(applyCommand(mounted.state, { type: "speed", value: 2 }));
    fireEvent.click(within(dialog).getByRole("button", { name: "关闭系统介绍" }));
    expect(mounted.state.playing).toBe(false);
    expect(mounted.state.speed).toBe(2);
    expect(mounted.command).toHaveBeenCalledTimes(1);
  });

  it("does not toggle off playback that was resumed elsewhere", () => {
    const mounted = mount();
    const { dialog } = openIntroduction();
    mounted.replace(applyCommand(mounted.state, { type: "toggle-play" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "关闭系统介绍" }));
    expect(mounted.state.playing).toBe(true);
    expect(mounted.command).toHaveBeenCalledTimes(1);
  });

  it("keeps pause and resume single-shot across repeated opens in Strict Mode", () => {
    const mounted = mount(createInitialState(), true);
    for (let cycle = 0; cycle < 2; cycle += 1) {
      const { dialog } = openIntroduction();
      expect(mounted.state.playing).toBe(false);
      fireEvent.click(within(dialog).getByRole("button", { name: "关闭系统介绍" }));
      expect(mounted.state.playing).toBe(true);
    }
    expect(mounted.command).toHaveBeenCalledTimes(4);
  });
});
